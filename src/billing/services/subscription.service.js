/**
 * Subscription Service
 * 
 * Handles all subscription-related operations including creation, updates,
 * cancellation, and status management.
 */

const mongoose = require('mongoose');
const Subscription = require('../models/subscription.model');
const PaymentService = require('./payment.service');
const TrialService = require('./trial.service');
const CouponService = require('./coupon.service');
const { createPaymentError } = require('../utils/payment-error-handler');
const logger = require('../../utils/logger');

class SubscriptionService {
  constructor() {
    this.paymentService = new PaymentService();
    this.trialService = new TrialService();
    this.couponService = new CouponService();
  }

  /**
   * Create a new subscription
   * @param {Object} params - Subscription parameters
   * @param {string} params.userId - User ID
   * @param {string} params.tenantId - Tenant ID
   * @param {string} params.planId - Plan ID
   * @param {string} params.paymentMethodId - Payment method ID
   * @param {string} [params.couponCode] - Optional coupon code
   * @param {boolean} [params.autoRenew=true] - Whether to auto-renew the subscription
   * @returns {Promise<Object>} - Created subscription
   */
  async createSubscription(params) {
    const { userId, tenantId, planId, paymentMethodId, couponCode, autoRenew = true } = params;

    try {
      logger.info(`Creating subscription for tenant ${tenantId} with plan ${planId}`);

      // Get plan details from database or config
      const plan = await this.getPlan(planId);
      if (!plan) {
        throw createPaymentError({
          message: `Plan ${planId} not found`,
          code: 'plan_not_found',
          statusCode: 404
        });
      }

      // Check if user already has an active subscription
      const existingSubscription = await this.getActiveSubscription(tenantId);
      if (existingSubscription) {
        // If upgrading/downgrading, handle accordingly
        return await this.changeSubscriptionPlan(existingSubscription._id, planId);
      }

      // Check for active trial
      const activeTrial = await this.trialService.getActiveTrial(tenantId);
      if (activeTrial) {
        // Convert trial to paid subscription
        return await this.trialService.convertTrialToSubscription({
          trialId: activeTrial._id,
          paymentMethodId
        });
      }

      // Apply coupon if provided
      let discountedAmount = plan.price;
      let appliedCoupon = null;
      if (couponCode) {
        const couponResult = await this.couponService.validateCoupon(couponCode);
        if (couponResult.valid) {
          appliedCoupon = couponResult.coupon;
          discountedAmount = this.couponService.calculateDiscountedPrice(plan.price, appliedCoupon);
        }
      }

      // Create payment intent
      const paymentIntent = await this.paymentService.createPaymentIntent({
        amount: discountedAmount,
        currency: plan.currency || 'usd',
        customerId: userId,
        paymentMethodId,
        description: `Subscription to ${plan.name}`
      });

      // Create subscription record
      const subscription = new Subscription({
        userId,
        tenantId,
        planId,
        planName: plan.name,
        status: 'active',
        startDate: new Date(),
        endDate: this.calculateEndDate(plan.interval),
        autoRenew,
        price: plan.price,
        discountedPrice: discountedAmount,
        currency: plan.currency || 'usd',
        paymentMethodId,
        paymentIntentId: paymentIntent.id,
        couponCode: appliedCoupon ? couponCode : null,
        couponDiscount: appliedCoupon ? plan.price - discountedAmount : 0,
        features: plan.features || []
      });

      await subscription.save();
      logger.info(`Subscription created successfully for tenant ${tenantId}`);

      return subscription;
    } catch (error) {
      logger.error(`Error creating subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription by ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} - Subscription object
   */
  async getSubscription(subscriptionId) {
    try {
      return await Subscription.findById(subscriptionId);
    } catch (error) {
      logger.error(`Error getting subscription ${subscriptionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get active subscription for a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object>} - Active subscription or null
   */
  async getActiveSubscription(tenantId) {
    try {
      return await Subscription.findOne({
        tenantId,
        status: 'active'
      });
    } catch (error) {
      logger.error(`Error getting active subscription for tenant ${tenantId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all subscriptions for a tenant
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Array>} - Array of subscriptions
   */
  async getSubscriptions(tenantId) {
    try {
      return await Subscription.find({ tenantId }).sort({ startDate: -1 });
    } catch (error) {
      logger.error(`Error getting subscriptions for tenant ${tenantId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} [options] - Cancellation options
   * @param {boolean} [options.immediate=false] - Whether to cancel immediately or at period end
   * @param {string} [options.reason] - Cancellation reason
   * @returns {Promise<Object>} - Updated subscription
   */
  async cancelSubscription(subscriptionId, options = {}) {
    const { immediate = false, reason } = options;

    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw createPaymentError({
          message: `Subscription ${subscriptionId} not found`,
          code: 'subscription_not_found',
          statusCode: 404
        });
      }

      if (subscription.status !== 'active') {
        throw createPaymentError({
          message: `Cannot cancel subscription with status ${subscription.status}`,
          code: 'invalid_subscription_status',
          statusCode: 400
        });
      }

      if (immediate) {
        subscription.status = 'canceled';
        subscription.canceledAt = new Date();
        subscription.cancelReason = reason || 'User requested cancellation';
      } else {
        subscription.status = 'active';
        subscription.autoRenew = false;
        subscription.canceledAt = new Date();
        subscription.cancelReason = reason || 'User requested cancellation at period end';
      }

      await subscription.save();
      logger.info(`Subscription ${subscriptionId} canceled (immediate: ${immediate})`);

      return subscription;
    } catch (error) {
      logger.error(`Error canceling subscription ${subscriptionId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Change subscription plan
   * @param {string} subscriptionId - Subscription ID
   * @param {string} newPlanId - New plan ID
   * @returns {Promise<Object>} - Updated subscription
   */
  async changeSubscriptionPlan(subscriptionId, newPlanId) {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw createPaymentError({
          message: `Subscription ${subscriptionId} not found`,
          code: 'subscription_not_found',
          statusCode: 404
        });
      }

      const newPlan = await this.getPlan(newPlanId);
      if (!newPlan) {
        throw createPaymentError({
          message: `Plan ${newPlanId} not found`,
          code: 'plan_not_found',
          statusCode: 404
        });
      }

      // Calculate prorated amount if needed
      const currentPlan = await this.getPlan(subscription.planId);
      const daysRemaining = this.calculateDaysRemaining(subscription.endDate);
      const totalDays = this.calculateTotalDays(currentPlan.interval);
      const prorationFactor = daysRemaining / totalDays;
      const unusedAmount = Math.round(subscription.price * prorationFactor);

      // Calculate new price
      let newPrice = newPlan.price;
      if (unusedAmount > 0) {
        newPrice = Math.max(0, newPlan.price - unusedAmount);
      }

      // Create payment intent for the difference if upgrading
      if (newPrice > 0) {
        await this.paymentService.createPaymentIntent({
          amount: newPrice,
          currency: newPlan.currency || 'usd',
          customerId: subscription.userId,
          paymentMethodId: subscription.paymentMethodId,
          description: `Upgrade to ${newPlan.name}`
        });
      }

      // Update subscription
      subscription.planId = newPlanId;
      subscription.planName = newPlan.name;
      subscription.price = newPlan.price;
      subscription.features = newPlan.features || [];
      subscription.updatedAt = new Date();

      await subscription.save();
      logger.info(`Subscription ${subscriptionId} changed to plan ${newPlanId}`);

      return subscription;
    } catch (error) {
      logger.error(`Error changing subscription plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update payment method for a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} paymentMethodId - New payment method ID
   * @returns {Promise<Object>} - Updated subscription
   */
  async updatePaymentMethod(subscriptionId, paymentMethodId) {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw createPaymentError({
          message: `Subscription ${subscriptionId} not found`,
          code: 'subscription_not_found',
          statusCode: 404
        });
      }

      subscription.paymentMethodId = paymentMethodId;
      subscription.updatedAt = new Date();

      await subscription.save();
      logger.info(`Payment method updated for subscription ${subscriptionId}`);

      return subscription;
    } catch (error) {
      logger.error(`Error updating payment method: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a subscription has access to a feature
   * @param {string} tenantId - Tenant ID
   * @param {string} featureKey - Feature key to check
   * @returns {Promise<boolean>} - Whether the subscription has access to the feature
   */
  async hasFeatureAccess(tenantId, featureKey) {
    try {
      const subscription = await this.getActiveSubscription(tenantId);
      if (!subscription) {
        // Check if there's an active trial with this feature
        const trial = await this.trialService.getActiveTrial(tenantId);
        if (trial) {
          const trialPlan = await this.getPlan(trial.planId);
          return trialPlan.features.includes(featureKey);
        }
        return false;
      }

      return subscription.features.includes(featureKey);
    } catch (error) {
      logger.error(`Error checking feature access: ${error.message}`);
      return false;
    }
  }

  /**
   * Process subscription renewal
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} - Renewed subscription
   */
  async renewSubscription(subscriptionId) {
    try {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) {
        throw createPaymentError({
          message: `Subscription ${subscriptionId} not found`,
          code: 'subscription_not_found',
          statusCode: 404
        });
      }

      if (!subscription.autoRenew) {
        subscription.status = 'expired';
        await subscription.save();
        logger.info(`Subscription ${subscriptionId} expired (auto-renew disabled)`);
        return subscription;
      }

      const plan = await this.getPlan(subscription.planId);
      
      // Create payment intent for renewal
      const paymentIntent = await this.paymentService.createPaymentIntent({
        amount: subscription.discountedPrice || subscription.price,
        currency: subscription.currency,
        customerId: subscription.userId,
        paymentMethodId: subscription.paymentMethodId,
        description: `Renewal of ${subscription.planName} subscription`
      });

      // Update subscription
      const oldEndDate = new Date(subscription.endDate);
      subscription.startDate = oldEndDate;
      subscription.endDate = this.calculateEndDate(plan.interval, oldEndDate);
      subscription.paymentIntentId = paymentIntent.id;
      subscription.renewedAt = new Date();

      await subscription.save();
      logger.info(`Subscription ${subscriptionId} renewed successfully`);

      return subscription;
    } catch (error) {
      logger.error(`Error renewing subscription: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get plan details
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} - Plan details
   */
  async getPlan(planId) {
    // In a real implementation, this would fetch from database
    // For now, we'll use a static map of plans
    const plans = {
      'basic_monthly': {
        id: 'basic_monthly',
        name: 'Basic Plan (Monthly)',
        price: 999, // $9.99
        currency: 'usd',
        interval: 'month',
        features: ['basic_chat', 'standard_templates', 'email_support']
      },
      'pro_monthly': {
        id: 'pro_monthly',
        name: 'Pro Plan (Monthly)',
        price: 2999, // $29.99
        currency: 'usd',
        interval: 'month',
        features: ['basic_chat', 'advanced_chat', 'standard_templates', 'custom_templates', 'priority_support']
      },
      'enterprise_monthly': {
        id: 'enterprise_monthly',
        name: 'Enterprise Plan (Monthly)',
        price: 9999, // $99.99
        currency: 'usd',
        interval: 'month',
        features: ['basic_chat', 'advanced_chat', 'standard_templates', 'custom_templates', 'priority_support', 'dedicated_support', 'white_label']
      },
      'basic_yearly': {
        id: 'basic_yearly',
        name: 'Basic Plan (Yearly)',
        price: 9990, // $99.90 (2 months free)
        currency: 'usd',
        interval: 'year',
        features: ['basic_chat', 'standard_templates', 'email_support']
      },
      'pro_yearly': {
        id: 'pro_yearly',
        name: 'Pro Plan (Yearly)',
        price: 29990, // $299.90 (2 months free)
        currency: 'usd',
        interval: 'year',
        features: ['basic_chat', 'advanced_chat', 'standard_templates', 'custom_templates', 'priority_support']
      },
      'enterprise_yearly': {
        id: 'enterprise_yearly',
        name: 'Enterprise Plan (Yearly)',
        price: 99990, // $999.90 (2 months free)
        currency: 'usd',
        interval: 'year',
        features: ['basic_chat', 'advanced_chat', 'standard_templates', 'custom_templates', 'priority_support', 'dedicated_support', 'white_label']
      }
    };

    return plans[planId];
  }

  /**
   * Get all available plans
   * @returns {Promise<Array>} - Array of plans
   */
  async getPlans() {
    // In a real implementation, this would fetch from database
    const plans = await Promise.resolve(Object.values({
      'basic_monthly': {
        id: 'basic_monthly',
        name: 'Basic Plan (Monthly)',
        price: 999, // $9.99
        currency: 'usd',
        interval: 'month',
        features: ['basic_chat', 'standard_templates', 'email_support']
      },
      'pro_monthly': {
        id: 'pro_monthly',
        name: 'Pro Plan (Monthly)',
        price: 2999, // $29.99
        currency: 'usd',
        interval: 'month',
        features: ['basic_chat', 'advanced_chat', 'standard_templates', 'custom_templates', 'priority_support']
      },
      'enterprise_monthly': {
        id: 'enterprise_monthly',
        name: 'Enterprise Plan (Monthly)',
        price: 9999, // $99.99
        currency: 'usd',
        interval: 'month',
        features: ['basic_chat', 'advanced_chat', 'standard_templates', 'custom_templates', 'priority_support', 'dedicated_support', 'white_label']
      },
      'basic_yearly': {
        id: 'basic_yearly',
        name: 'Basic Plan (Yearly)',
        price: 9990, // $99.90 (2 months free)
        currency: 'usd',
        interval: 'year',
        features: ['basic_chat', 'standard_templates', 'email_support']
      },
      'pro_yearly': {
        id: 'pro_yearly',
        name: 'Pro Plan (Yearly)',
        price: 29990, // $299.90 (2 months free)
        currency: 'usd',
        interval: 'year',
        features: ['basic_chat', 'advanced_chat', 'standard_templates', 'custom_templates', 'priority_support']
      },
      'enterprise_yearly': {
        id: 'enterprise_yearly',
        name: 'Enterprise Plan (Yearly)',
        price: 99990, // $999.90 (2 months free)
        currency: 'usd',
        interval: 'year',
        features: ['basic_chat', 'advanced_chat', 'standard_templates', 'custom_templates', 'priority_support', 'dedicated_support', 'white_label']
      }
    }));

    return plans;
  }

  /**
   * Calculate end date based on interval
   * @param {string} interval - Interval (month, year)
   * @param {Date} [startDate=new Date()] - Start date
   * @returns {Date} - End date
   */
  calculateEndDate(interval, startDate = new Date()) {
    const date = new Date(startDate);
    
    switch (interval) {
      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default to monthly
    }
    
    return date;
  }

  /**
   * Calculate days remaining in subscription period
   * @param {Date} endDate - Subscription end date
   * @returns {number} - Days remaining
   */
  calculateDaysRemaining(endDate) {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Calculate total days in subscription period
   * @param {string} interval - Interval (month, year)
   * @returns {number} - Total days
   */
  calculateTotalDays(interval) {
    switch (interval) {
      case 'month':
        return 30; // Simplified
      case 'year':
        return 365; // Simplified
      default:
        return 30; // Default to monthly
    }
  }
}

module.exports = new SubscriptionService();
