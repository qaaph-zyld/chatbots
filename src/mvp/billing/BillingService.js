/**
 * Billing Service for ShopBot MVP
 * Handles subscription management, usage tracking, and payment processing
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const UsageTracker = require('../database/UsageTracker');

class BillingService {
  constructor() {
    this.usageTracker = new UsageTracker();
    this.subscriptionPlans = {
      starter: {
        id: 'starter',
        name: 'Starter',
        price: 2900, // $29.00 in cents
        currency: 'usd',
        interval: 'month',
        conversationLimit: 500,
        features: ['Basic chat', 'Product integration', 'Email support']
      },
      professional: {
        id: 'professional',
        name: 'Professional',
        price: 9900, // $99.00 in cents
        currency: 'usd',
        interval: 'month',
        conversationLimit: 2500,
        features: ['Advanced analytics', 'Custom branding', 'Priority support', 'API access']
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 29900, // $299.00 in cents
        currency: 'usd',
        interval: 'month',
        conversationLimit: -1, // Unlimited
        features: ['White-label', 'Custom integrations', 'Dedicated support', 'SLA guarantee']
      }
    };
  }

  /**
   * Create a new customer in Stripe
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(customerData) {
    try {
      const customer = await stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: {
          shopbotUserId: customerData.userId,
          signupDate: new Date().toISOString()
        }
      });

      return {
        success: true,
        customer: customer,
        customerId: customer.id
      };
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a subscription for a customer
   * @param {string} customerId - Stripe customer ID
   * @param {string} planId - Subscription plan ID
   * @returns {Promise<Object>} Subscription result
   */
  async createSubscription(customerId, planId) {
    try {
      const plan = this.subscriptionPlans[planId];
      if (!plan) {
        throw new Error(`Invalid plan ID: ${planId}`);
      }

      // Create or retrieve the price object
      const price = await this.getOrCreatePrice(plan);

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          planId: planId,
          conversationLimit: plan.conversationLimit.toString()
        }
      });

      return {
        success: true,
        subscription: subscription,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get or create a Stripe price for a plan
   * @param {Object} plan - Subscription plan
   * @returns {Promise<Object>} Stripe price object
   */
  async getOrCreatePrice(plan) {
    try {
      // Try to find existing price
      const prices = await stripe.prices.list({
        lookup_keys: [plan.id],
        limit: 1
      });

      if (prices.data.length > 0) {
        return prices.data[0];
      }

      // Create new price
      const price = await stripe.prices.create({
        unit_amount: plan.price,
        currency: plan.currency,
        recurring: { interval: plan.interval },
        product_data: {
          name: `ShopBot ${plan.name} Plan`,
          description: `${plan.name} plan with ${plan.conversationLimit === -1 ? 'unlimited' : plan.conversationLimit} conversations per month`
        },
        lookup_key: plan.id
      });

      return price;
    } catch (error) {
      console.error('Error getting/creating price:', error);
      throw error;
    }
  }

  /**
   * Track conversation usage for billing
   * @param {string} customerId - Customer ID
   * @param {number} conversationCount - Number of conversations to add
   * @returns {Promise<Object>} Usage tracking result
   */
  async trackUsage(customerId, conversationCount = 1) {
    try {
      // Get customer's active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        return {
          success: false,
          error: 'No active subscription found'
        };
      }

      const subscription = subscriptions.data[0];
      const planId = subscription.metadata.planId;
      const plan = this.subscriptionPlans[planId];

      // Check if customer has exceeded their limit
      const currentUsage = await this.getCurrentUsage(customerId);
      const newUsage = currentUsage + conversationCount;

      if (plan.conversationLimit !== -1 && newUsage > plan.conversationLimit) {
        return {
          success: false,
          error: 'Conversation limit exceeded',
          currentUsage: currentUsage,
          limit: plan.conversationLimit
        };
      }

      // Record usage in database
      await this.recordUsage(customerId, conversationCount, {
        timestamp: new Date().toISOString(),
        planId: planId
      });

      return {
        success: true,
        newUsage: newUsage,
        limit: plan.conversationLimit,
        remaining: plan.conversationLimit === -1 ? -1 : plan.conversationLimit - newUsage
      };
    } catch (error) {
      console.error('Error tracking usage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current usage for a customer
   * @param {string} customerId - Customer ID
   * @returns {Promise<number>} Current usage count
   */
  async getCurrentUsage(customerId) {
    try {
      return this.usageTracker.getCurrentMonthUsage(customerId);
    } catch (error) {
      console.error('Error getting current usage:', error);
      return 0;
    }
  }

  /**
   * Record usage in database
   * @param {string} customerId - Customer ID
   * @param {number} conversationCount - Number of conversations
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<void>}
   */
  async recordUsage(customerId, conversationCount, metadata = {}) {
    try {
      this.usageTracker.trackUsage(customerId, conversationCount, metadata);
      console.log(`Recorded ${conversationCount} conversations for customer ${customerId}`);
    } catch (error) {
      console.error('Error recording usage:', error);
      throw error;
    }
  }

  /**
   * Get subscription plans
   * @returns {Object} Available subscription plans
   */
  getSubscriptionPlans() {
    return this.subscriptionPlans;
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      return {
        success: true,
        subscription: subscription,
        message: 'Subscription will be canceled at the end of the current billing period'
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get customer's subscription status
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Subscription status
   */
  async getSubscriptionStatus(customerId) {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 1
      });

      if (subscriptions.data.length === 0) {
        return {
          success: true,
          hasSubscription: false,
          status: 'none'
        };
      }

      const subscription = subscriptions.data[0];
      const planId = subscription.metadata.planId;
      const plan = this.subscriptionPlans[planId];

      return {
        success: true,
        hasSubscription: true,
        status: subscription.status,
        plan: plan,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = BillingService;
