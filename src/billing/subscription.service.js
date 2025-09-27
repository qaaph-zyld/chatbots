/**
 * Subscription Service
 * 
 * Handles subscription management, billing, and plan enforcement
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const Usage = require('../models/usage.model');
const { cacheService } = require('../database/connection');

class SubscriptionService {
  constructor() {
    this.plans = {
      starter: {
        id: 'starter',
        name: 'Starter',
        price: 2900, // $29.00 in cents
        currency: 'usd',
        interval: 'month',
        limits: {
          chatbots: 3,
          conversations: 1000,
          knowledgeEntries: 100,
          teamMembers: 1,
          apiCalls: 0
        },
        features: {
          apiAccess: false,
          customIntegrations: false,
          advancedAnalytics: false,
          abtesting: false,
          whiteLabel: false,
          prioritySupport: false
        }
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        price: 9900, // $99.00 in cents
        currency: 'usd',
        interval: 'month',
        limits: {
          chatbots: 10,
          conversations: 10000,
          knowledgeEntries: 1000,
          teamMembers: 5,
          apiCalls: 100000
        },
        features: {
          apiAccess: true,
          customIntegrations: true,
          advancedAnalytics: true,
          abtesting: true,
          whiteLabel: false,
          prioritySupport: true
        }
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: null, // Custom pricing
        currency: 'usd',
        interval: 'month',
        limits: {
          chatbots: -1, // Unlimited
          conversations: -1,
          knowledgeEntries: -1,
          teamMembers: -1,
          apiCalls: -1
        },
        features: {
          apiAccess: true,
          customIntegrations: true,
          advancedAnalytics: true,
          abtesting: true,
          whiteLabel: true,
          prioritySupport: true,
          dedicatedSupport: true,
          customSLA: true
        }
      }
    };

    this.overageRates = {
      conversations: 0.10, // $0.10 per conversation
      apiCalls: 0.01, // $0.01 per 100 API calls
      storage: 0.50 // $0.50 per GB per month
    };
  }

  /**
   * Create a new subscription
   * @param {string} userId - User ID
   * @param {string} planId - Plan ID
   * @param {string} paymentMethodId - Stripe payment method ID
   * @returns {object} Subscription details
   */
  async createSubscription(userId, planId, paymentMethodId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const plan = this.plans[planId];
      if (!plan) {
        throw new Error('Invalid plan');
      }

      // Create or retrieve Stripe customer
      let stripeCustomer;
      if (user.stripeCustomerId) {
        stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        stripeCustomer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: userId
          }
        });
        
        user.stripeCustomerId = stripeCustomer.id;
        await user.save();
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomer.id
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create Stripe subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomer.id,
        items: [{
          price_data: {
            currency: plan.currency,
            product_data: {
              name: plan.name
            },
            unit_amount: plan.price,
            recurring: {
              interval: plan.interval
            }
          }
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      // Create subscription record
      const subscription = new Subscription({
        userId,
        planId,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeCustomer.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        limits: plan.limits,
        features: plan.features
      });

      await subscription.save();

      // Clear user cache
      await this.clearUserCache(userId);

      return {
        subscription,
        clientSecret: stripeSubscription.latest_invoice.payment_intent.client_secret
      };
    } catch (error) {
      console.error('Create subscription error:', error);
      throw error;
    }
  }

  /**
   * Update subscription plan
   * @param {string} userId - User ID
   * @param {string} newPlanId - New plan ID
   * @returns {object} Updated subscription
   */
  async updateSubscription(userId, newPlanId) {
    try {
      const subscription = await Subscription.findOne({ userId, status: 'active' });
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      const newPlan = this.plans[newPlanId];
      if (!newPlan) {
        throw new Error('Invalid plan');
      }

      // Update Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
      
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price_data: {
            currency: newPlan.currency,
            product_data: {
              name: newPlan.name
            },
            unit_amount: newPlan.price,
            recurring: {
              interval: newPlan.interval
            }
          }
        }],
        proration_behavior: 'create_prorations'
      });

      // Update local subscription
      subscription.planId = newPlanId;
      subscription.limits = newPlan.limits;
      subscription.features = newPlan.features;
      subscription.updatedAt = new Date();
      
      await subscription.save();

      // Clear user cache
      await this.clearUserCache(userId);

      return subscription;
    } catch (error) {
      console.error('Update subscription error:', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   * @param {string} userId - User ID
   * @param {boolean} immediate - Cancel immediately or at period end
   * @returns {object} Cancelled subscription
   */
  async cancelSubscription(userId, immediate = false) {
    try {
      const subscription = await Subscription.findOne({ userId, status: 'active' });
      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Cancel Stripe subscription
      if (immediate) {
        await stripe.subscriptions.del(subscription.stripeSubscriptionId);
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
      } else {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
        subscription.cancelAtPeriodEnd = true;
      }

      await subscription.save();

      // Clear user cache
      await this.clearUserCache(userId);

      return subscription;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  /**
   * Get user subscription details
   * @param {string} userId - User ID
   * @returns {object} Subscription details
   */
  async getUserSubscription(userId) {
    try {
      // Try cache first
      const cacheKey = `subscription:${userId}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const subscription = await Subscription.findOne({ 
        userId, 
        status: { $in: ['active', 'trialing', 'past_due'] }
      });

      if (!subscription) {
        // Return free trial limits
        return {
          planId: 'trial',
          status: 'trial',
          limits: {
            chatbots: -1, // Unlimited during trial
            conversations: -1,
            knowledgeEntries: -1,
            teamMembers: 1,
            apiCalls: -1
          },
          features: {
            apiAccess: true,
            customIntegrations: true,
            advancedAnalytics: true,
            abtesting: true,
            whiteLabel: false,
            prioritySupport: false
          },
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        };
      }

      // Cache for 5 minutes
      await cacheService.set(cacheKey, subscription, 300);

      return subscription;
    } catch (error) {
      console.error('Get subscription error:', error);
      throw error;
    }
  }

  /**
   * Check if user can perform action based on limits
   * @param {string} userId - User ID
   * @param {string} resource - Resource type (chatbots, conversations, etc.)
   * @param {number} requested - Requested amount (default: 1)
   * @returns {object} Permission result
   */
  async checkLimit(userId, resource, requested = 1) {
    try {
      const subscription = await this.getUserSubscription(userId);
      const limit = subscription.limits[resource];

      // Unlimited (-1)
      if (limit === -1) {
        return { allowed: true, remaining: -1 };
      }

      // Get current usage
      const usage = await this.getCurrentUsage(userId, resource);
      const remaining = limit - usage;

      return {
        allowed: remaining >= requested,
        remaining: Math.max(0, remaining),
        limit,
        current: usage
      };
    } catch (error) {
      console.error('Check limit error:', error);
      return { allowed: false, error: error.message };
    }
  }

  /**
   * Record usage for billing
   * @param {string} userId - User ID
   * @param {string} resource - Resource type
   * @param {number} amount - Amount used
   * @returns {boolean} Success
   */
  async recordUsage(userId, resource, amount = 1) {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      await Usage.findOneAndUpdate(
        {
          userId,
          resource,
          period: monthStart
        },
        {
          $inc: { amount },
          $set: { updatedAt: now }
        },
        {
          upsert: true,
          new: true
        }
      );

      // Clear usage cache
      const cacheKey = `usage:${userId}:${resource}:${monthStart.getTime()}`;
      await cacheService.del(cacheKey);

      return true;
    } catch (error) {
      console.error('Record usage error:', error);
      return false;
    }
  }

  /**
   * Get current usage for a resource
   * @param {string} userId - User ID
   * @param {string} resource - Resource type
   * @returns {number} Current usage
   */
  async getCurrentUsage(userId, resource) {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Try cache first
      const cacheKey = `usage:${userId}:${resource}:${monthStart.getTime()}`;
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const usage = await Usage.findOne({
        userId,
        resource,
        period: monthStart
      });

      const amount = usage ? usage.amount : 0;

      // Cache for 1 minute
      await cacheService.set(cacheKey, amount, 60);

      return amount;
    } catch (error) {
      console.error('Get usage error:', error);
      return 0;
    }
  }

  /**
   * Calculate overage charges
   * @param {string} userId - User ID
   * @returns {object} Overage details
   */
  async calculateOverages(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      const overages = {};
      let totalOverage = 0;

      for (const [resource, limit] of Object.entries(subscription.limits)) {
        if (limit === -1) continue; // Unlimited

        const usage = await this.getCurrentUsage(userId, resource);
        const overage = Math.max(0, usage - limit);

        if (overage > 0 && this.overageRates[resource]) {
          const cost = overage * this.overageRates[resource];
          overages[resource] = {
            limit,
            usage,
            overage,
            rate: this.overageRates[resource],
            cost
          };
          totalOverage += cost;
        }
      }

      return {
        overages,
        totalCost: totalOverage,
        currency: 'usd'
      };
    } catch (error) {
      console.error('Calculate overages error:', error);
      return { overages: {}, totalCost: 0 };
    }
  }

  /**
   * Process webhook from Stripe
   * @param {object} event - Stripe webhook event
   * @returns {boolean} Success
   */
  async processWebhook(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return true;
    } catch (error) {
      console.error('Webhook processing error:', error);
      return false;
    }
  }

  /**
   * Handle successful payment
   * @param {object} invoice - Stripe invoice object
   */
  async handlePaymentSucceeded(invoice) {
    try {
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: invoice.subscription
      });

      if (subscription) {
        subscription.status = 'active';
        subscription.lastPaymentAt = new Date();
        await subscription.save();

        // Clear user cache
        await this.clearUserCache(subscription.userId);
      }
    } catch (error) {
      console.error('Handle payment succeeded error:', error);
    }
  }

  /**
   * Handle failed payment
   * @param {object} invoice - Stripe invoice object
   */
  async handlePaymentFailed(invoice) {
    try {
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: invoice.subscription
      });

      if (subscription) {
        subscription.status = 'past_due';
        await subscription.save();

        // Clear user cache
        await this.clearUserCache(subscription.userId);

        // TODO: Send notification to user
      }
    } catch (error) {
      console.error('Handle payment failed error:', error);
    }
  }

  /**
   * Handle subscription update
   * @param {object} stripeSubscription - Stripe subscription object
   */
  async handleSubscriptionUpdated(stripeSubscription) {
    try {
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: stripeSubscription.id
      });

      if (subscription) {
        subscription.status = stripeSubscription.status;
        subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
        subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
        await subscription.save();

        // Clear user cache
        await this.clearUserCache(subscription.userId);
      }
    } catch (error) {
      console.error('Handle subscription updated error:', error);
    }
  }

  /**
   * Handle subscription deletion
   * @param {object} stripeSubscription - Stripe subscription object
   */
  async handleSubscriptionDeleted(stripeSubscription) {
    try {
      const subscription = await Subscription.findOne({
        stripeSubscriptionId: stripeSubscription.id
      });

      if (subscription) {
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        await subscription.save();

        // Clear user cache
        await this.clearUserCache(subscription.userId);
      }
    } catch (error) {
      console.error('Handle subscription deleted error:', error);
    }
  }

  /**
   * Clear user-related cache
   * @param {string} userId - User ID
   */
  async clearUserCache(userId) {
    const patterns = [
      `subscription:${userId}`,
      `usage:${userId}:*`
    ];

    for (const pattern of patterns) {
      await cacheService.del(pattern);
    }
  }

  /**
   * Get available plans
   * @returns {object} Available plans
   */
  getPlans() {
    return this.plans;
  }

  /**
   * Get plan details
   * @param {string} planId - Plan ID
   * @returns {object} Plan details
   */
  getPlan(planId) {
    return this.plans[planId];
  }
}

// Create singleton instance
const subscriptionService = new SubscriptionService();

module.exports = subscriptionService;
