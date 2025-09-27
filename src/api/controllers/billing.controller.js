/**
 * Billing Controller
 * 
 * Handles billing and subscription management endpoints
 */

const subscriptionService = require('../../billing/subscription.service');
const performanceService = require('../../services/performance.service');

class BillingController {
  /**
   * Create a new subscription
   */
  async createSubscription(req, res) {
    try {
      performanceService.recordRequest();
      
      const { planId, paymentMethodId } = req.body;
      const userId = req.user._id;

      if (!planId || !paymentMethodId) {
        return res.status(400).json({
          success: false,
          error: 'Plan ID and payment method are required'
        });
      }

      const result = await subscriptionService.createSubscription(
        userId,
        planId,
        paymentMethodId
      );

      res.status(201).json({
        success: true,
        data: {
          subscription: result.subscription,
          clientSecret: result.clientSecret
        }
      });
    } catch (error) {
      performanceService.recordError();
      console.error('Create subscription error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get user subscription details
   */
  async getSubscription(req, res) {
    try {
      performanceService.recordRequest();
      
      const userId = req.user._id;
      const subscription = await subscriptionService.getUserSubscription(userId);

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      performanceService.recordError();
      console.error('Get subscription error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(req, res) {
    try {
      performanceService.recordRequest();
      
      const { planId } = req.body;
      const userId = req.user._id;

      if (!planId) {
        return res.status(400).json({
          success: false,
          error: 'Plan ID is required'
        });
      }

      const subscription = await subscriptionService.updateSubscription(userId, planId);

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      performanceService.recordError();
      console.error('Update subscription error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req, res) {
    try {
      performanceService.recordRequest();
      
      const { immediate = false } = req.body;
      const userId = req.user._id;

      const subscription = await subscriptionService.cancelSubscription(userId, immediate);

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      performanceService.recordError();
      console.error('Cancel subscription error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get available plans
   */
  async getPlans(req, res) {
    try {
      performanceService.recordRequest();
      
      const plans = subscriptionService.getPlans();

      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      performanceService.recordError();
      console.error('Get plans error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get usage statistics
   */
  async getUsage(req, res) {
    try {
      performanceService.recordRequest();
      
      const userId = req.user._id;
      const { period } = req.query;

      let usagePeriod;
      if (period) {
        usagePeriod = new Date(period);
      } else {
        const now = new Date();
        usagePeriod = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const Usage = require('../../models/usage.model');
      const usage = await Usage.getUserUsageSummary(userId, usagePeriod);
      const subscription = await subscriptionService.getUserSubscription(userId);

      // Calculate usage percentages
      const usageWithPercentages = {};
      Object.keys(usage).forEach(resource => {
        const limit = subscription.limits[resource];
        const current = usage[resource];
        
        usageWithPercentages[resource] = {
          current,
          limit,
          percentage: limit === -1 ? 0 : Math.round((current / limit) * 100),
          unlimited: limit === -1
        };
      });

      res.json({
        success: true,
        data: {
          period: usagePeriod,
          usage: usageWithPercentages,
          subscription: {
            planId: subscription.planId,
            status: subscription.status,
            limits: subscription.limits
          }
        }
      });
    } catch (error) {
      performanceService.recordError();
      console.error('Get usage error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get billing history
   */
  async getBillingHistory(req, res) {
    try {
      performanceService.recordRequest();
      
      const userId = req.user._id;
      const { limit = 10, offset = 0 } = req.query;

      const subscription = await subscriptionService.getUserSubscription(userId);
      
      if (!subscription.stripeCustomerId) {
        return res.json({
          success: true,
          data: {
            invoices: [],
            hasMore: false,
            total: 0
          }
        });
      }

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const invoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: parseInt(limit),
        starting_after: offset > 0 ? offset : undefined
      });

      const formattedInvoices = invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        description: invoice.description || `${subscription.planId} plan`,
        downloadUrl: invoice.hosted_invoice_url
      }));

      res.json({
        success: true,
        data: {
          invoices: formattedInvoices,
          hasMore: invoices.has_more,
          total: invoices.data.length
        }
      });
    } catch (error) {
      performanceService.recordError();
      console.error('Get billing history error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Calculate overage charges
   */
  async getOverages(req, res) {
    try {
      performanceService.recordRequest();
      
      const userId = req.user._id;
      const overages = await subscriptionService.calculateOverages(userId);

      res.json({
        success: true,
        data: overages
      });
    } catch (error) {
      performanceService.recordError();
      console.error('Get overages error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Process the webhook
      const processed = await subscriptionService.processWebhook(event);
      
      if (processed) {
        res.json({ received: true });
      } else {
        res.status(400).json({ error: 'Failed to process webhook' });
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Check usage limits
   */
  async checkLimits(req, res) {
    try {
      performanceService.recordRequest();
      
      const userId = req.user._id;
      const { resource, amount = 1 } = req.query;

      if (!resource) {
        return res.status(400).json({
          success: false,
          error: 'Resource parameter is required'
        });
      }

      const result = await subscriptionService.checkLimit(userId, resource, parseInt(amount));

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      performanceService.recordError();
      console.error('Check limits error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Record usage
   */
  async recordUsage(req, res) {
    try {
      performanceService.recordRequest();
      
      const userId = req.user._id;
      const { resource, amount = 1, metadata = {} } = req.body;

      if (!resource) {
        return res.status(400).json({
          success: false,
          error: 'Resource parameter is required'
        });
      }

      const success = await subscriptionService.recordUsage(userId, resource, amount);

      if (success) {
        res.json({
          success: true,
          message: 'Usage recorded successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to record usage'
        });
      }
    } catch (error) {
      performanceService.recordError();
      console.error('Record usage error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new BillingController();
