/**
 * Trial Service
 * 
 * Handles free trial management for subscriptions
 * Provides functionality for creating, validating, and converting trials
 */

const Subscription = require('../models/subscription.model');
const Plan = require('../models/plan.model');
const User = require('../../auth/models/user.model');
const Tenant = require('../../auth/models/tenant.model');
const logger = require('../../utils/logger');
const { handlePaymentError } = require('../utils/payment-error-handler');
const stripe = require('../config/stripe');

// Default trial period in days
const DEFAULT_TRIAL_DAYS = 14;

/**
 * Service for managing free trials
 */
class TrialService {
  /**
   * Create a new free trial subscription
   * @param {string} tenantId - The tenant ID
   * @param {string} planId - The plan ID for the trial
   * @param {Object} metadata - Additional metadata for the trial
   * @returns {Promise<Object>} The created trial subscription
   */
  async createTrial(tenantId, planId, metadata = {}) {
    try {
      // Validate tenant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }
      
      // Check if tenant already has an active subscription or trial
      const existingSubscription = await Subscription.findOne({
        tenantId,
        status: { $in: ['active', 'trialing'] }
      });
      
      if (existingSubscription) {
        throw new Error('Tenant already has an active subscription or trial');
      }
      
      // Get the plan
      const plan = await Plan.findById(planId);
      if (!plan) {
        throw new Error(`Plan not found: ${planId}`);
      }
      
      // Calculate trial end date
      const trialDays = plan.trialDays || DEFAULT_TRIAL_DAYS;
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      
      // Create subscription record
      const subscription = await Subscription.create({
        tenantId,
        planId,
        status: 'trialing',
        trialStart: new Date(),
        trialEnd: trialEndDate,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEndDate,
        metadata: {
          ...metadata,
          source: 'free_trial'
        }
      });
      
      // Log the trial creation
      logger.info(`Created free trial subscription for tenant ${tenantId}`, {
        tenantId,
        planId,
        trialDays,
        subscriptionId: subscription._id
      });
      
      return subscription;
    } catch (error) {
      return handlePaymentError(error, 'create_trial', { tenantId, planId });
    }
  }
  
  /**
   * Check if a tenant is eligible for a free trial
   * @param {string} tenantId - The tenant ID
   * @returns {Promise<boolean>} Whether the tenant is eligible for a trial
   */
  async isEligibleForTrial(tenantId) {
    try {
      // Check if tenant has had any previous subscriptions
      const previousSubscriptions = await Subscription.find({ tenantId });
      
      // If no previous subscriptions, tenant is eligible
      if (previousSubscriptions.length === 0) {
        return true;
      }
      
      // Check if any previous subscription was a trial
      const previousTrials = previousSubscriptions.filter(sub => 
        sub.status === 'trialing' || (sub.metadata && sub.metadata.source === 'free_trial')
      );
      
      // If no previous trials, tenant is eligible
      return previousTrials.length === 0;
    } catch (error) {
      logger.error(`Error checking trial eligibility: ${error.message}`, { error, tenantId });
      // Default to not eligible on error
      return false;
    }
  }
  
  /**
   * Get the remaining trial days for a tenant
   * @param {string} tenantId - The tenant ID
   * @returns {Promise<number>} The number of days remaining in the trial, or 0 if no active trial
   */
  async getRemainingTrialDays(tenantId) {
    try {
      // Find active trial subscription
      const trialSubscription = await Subscription.findOne({
        tenantId,
        status: 'trialing'
      });
      
      // If no trial subscription, return 0
      if (!trialSubscription) {
        return 0;
      }
      
      // Calculate remaining days
      const now = new Date();
      const trialEnd = new Date(trialSubscription.trialEnd);
      
      // If trial has ended, return 0
      if (now >= trialEnd) {
        return 0;
      }
      
      // Calculate days difference
      const diffTime = Math.abs(trialEnd - now);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      logger.error(`Error getting remaining trial days: ${error.message}`, { error, tenantId });
      // Default to 0 on error
      return 0;
    }
  }
  
  /**
   * Convert a trial to a paid subscription
   * @param {string} tenantId - The tenant ID
   * @param {string} paymentMethodId - The payment method ID
   * @returns {Promise<Object>} The updated subscription
   */
  async convertTrialToPaid(tenantId, paymentMethodId) {
    try {
      // Find active trial subscription
      const trialSubscription = await Subscription.findOne({
        tenantId,
        status: 'trialing'
      });
      
      if (!trialSubscription) {
        throw new Error('No active trial subscription found');
      }
      
      // Get the plan
      const plan = await Plan.findById(trialSubscription.planId);
      if (!plan) {
        throw new Error(`Plan not found: ${trialSubscription.planId}`);
      }
      
      // Get tenant for customer information
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }
      
      // Create or get Stripe customer
      let customer;
      if (tenant.stripeCustomerId) {
        customer = await stripe.customers.retrieve(tenant.stripeCustomerId);
      } else {
        // Get admin user for the tenant
        const adminUser = await User.findOne({
          tenantId,
          role: 'admin'
        });
        
        if (!adminUser) {
          throw new Error('No admin user found for tenant');
        }
        
        // Create Stripe customer
        customer = await stripe.customers.create({
          email: adminUser.email,
          name: tenant.name,
          metadata: {
            tenantId
          }
        });
        
        // Update tenant with Stripe customer ID
        await Tenant.findByIdAndUpdate(tenantId, {
          stripeCustomerId: customer.id
        });
      }
      
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      });
      
      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
      
      // Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price: plan.stripePriceId
          }
        ],
        trial_end: 'now', // End trial immediately
        metadata: {
          tenantId,
          planId: plan._id.toString()
        }
      });
      
      // Update subscription record
      const updatedSubscription = await Subscription.findByIdAndUpdate(
        trialSubscription._id,
        {
          status: 'active',
          stripeSubscriptionId: stripeSubscription.id,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: false
        },
        { new: true }
      );
      
      // Log the conversion
      logger.info(`Converted trial to paid subscription for tenant ${tenantId}`, {
        tenantId,
        subscriptionId: updatedSubscription._id,
        stripeSubscriptionId: stripeSubscription.id
      });
      
      return updatedSubscription;
    } catch (error) {
      return handlePaymentError(error, 'convert_trial', { tenantId });
    }
  }
  
  /**
   * Send trial expiration reminder
   * @param {string} tenantId - The tenant ID
   * @param {number} daysRemaining - Days remaining in the trial
   * @returns {Promise<boolean>} Whether the reminder was sent successfully
   */
  async sendTrialExpirationReminder(tenantId, daysRemaining) {
    try {
      // Find active trial subscription
      const trialSubscription = await Subscription.findOne({
        tenantId,
        status: 'trialing'
      });
      
      if (!trialSubscription) {
        throw new Error('No active trial subscription found');
      }
      
      // Get tenant information
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }
      
      // Get admin users for the tenant
      const adminUsers = await User.find({
        tenantId,
        role: 'admin'
      });
      
      if (adminUsers.length === 0) {
        throw new Error('No admin users found for tenant');
      }
      
      // Get plan information
      const plan = await Plan.findById(trialSubscription.planId);
      
      // Send email notification to each admin user
      const notificationService = require('../../notifications/services/notification.service');
      
      for (const user of adminUsers) {
        await notificationService.sendEmail({
          template: 'trial-expiration',
          recipient: user.email,
          subject: `Your trial expires in ${daysRemaining} days`,
          data: {
            userName: user.name,
            tenantName: tenant.name,
            daysRemaining,
            trialEndDate: trialSubscription.trialEnd,
            planName: plan ? plan.name : 'Premium Plan',
            planPrice: plan ? plan.price : 0,
            upgradeUrl: `${process.env.APP_URL}/billing/convert-trial`
          }
        });
      }
      
      // Log the reminder
      logger.info(`Sent trial expiration reminder for tenant ${tenantId}`, {
        tenantId,
        daysRemaining,
        trialEnd: trialSubscription.trialEnd
      });
      
      return true;
    } catch (error) {
      logger.error(`Error sending trial expiration reminder: ${error.message}`, { error, tenantId, daysRemaining });
      return false;
    }
  }
  
  /**
   * Process expired trials
   * @returns {Promise<number>} The number of processed trials
   */
  async processExpiredTrials() {
    try {
      const now = new Date();
      
      // Find expired trials
      const expiredTrials = await Subscription.find({
        status: 'trialing',
        trialEnd: { $lt: now }
      });
      
      let processedCount = 0;
      
      // Process each expired trial
      for (const trial of expiredTrials) {
        try {
          // Update subscription status
          await Subscription.findByIdAndUpdate(trial._id, {
            status: 'expired',
            endedAt: now
          });
          
          // Send expiration notification
          const tenant = await Tenant.findById(trial.tenantId);
          const adminUsers = await User.find({
            tenantId: trial.tenantId,
            role: 'admin'
          });
          
          if (tenant && adminUsers.length > 0) {
            const notificationService = require('../../notifications/services/notification.service');
            
            for (const user of adminUsers) {
              await notificationService.sendEmail({
                template: 'trial-expired',
                recipient: user.email,
                subject: 'Your trial has expired',
                data: {
                  userName: user.name,
                  tenantName: tenant.name,
                  upgradeUrl: `${process.env.APP_URL}/billing/plans`
                }
              });
            }
          }
          
          processedCount++;
        } catch (error) {
          logger.error(`Error processing expired trial: ${error.message}`, { error, trialId: trial._id });
        }
      }
      
      // Log the processing
      if (processedCount > 0) {
        logger.info(`Processed ${processedCount} expired trials`);
      }
      
      return processedCount;
    } catch (error) {
      logger.error(`Error processing expired trials: ${error.message}`, { error });
      return 0;
    }
  }
}

module.exports = new TrialService();
