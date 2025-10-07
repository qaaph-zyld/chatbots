/**
 * Billing API Routes for ShopBot MVP
 * Handles subscription management and billing operations
 */

const BillingService = require('../billing/BillingService');

class BillingAPI {
  constructor() {
    this.billingService = new BillingService();
  }

  /**
   * Get available subscription plans
   * GET /api/billing/plans
   */
  async getPlans(req, res) {
    try {
      const plans = this.billingService.getSubscriptionPlans();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: plans
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get subscription plans'
      }));
    }
  }

  /**
   * Create a new subscription
   * POST /api/billing/subscribe
   */
  async createSubscription(req, res) {
    try {
      const { planId, customerData } = await this.parseRequestBody(req);

      if (!planId || !customerData) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Plan ID and customer data are required'
        }));
        return;
      }

      // Create customer in Stripe
      const customerResult = await this.billingService.createCustomer(customerData);
      if (!customerResult.success) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(customerResult));
        return;
      }

      // Create subscription
      const subscriptionResult = await this.billingService.createSubscription(
        customerResult.customerId,
        planId
      );

      if (!subscriptionResult.success) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(subscriptionResult));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          customerId: customerResult.customerId,
          subscriptionId: subscriptionResult.subscription.id,
          clientSecret: subscriptionResult.clientSecret
        }
      }));
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to create subscription'
      }));
    }
  }

  /**
   * Get customer's subscription status
   * GET /api/billing/status/:customerId
   */
  async getSubscriptionStatus(req, res, customerId) {
    try {
      if (!customerId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Customer ID is required'
        }));
        return;
      }

      const statusResult = await this.billingService.getSubscriptionStatus(customerId);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(statusResult));
    } catch (error) {
      console.error('Error getting subscription status:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get subscription status'
      }));
    }
  }

  /**
   * Track conversation usage
   * POST /api/billing/usage
   */
  async trackUsage(req, res) {
    try {
      const { customerId, conversationCount = 1 } = await this.parseRequestBody(req);

      if (!customerId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Customer ID is required'
        }));
        return;
      }

      const usageResult = await this.billingService.trackUsage(customerId, conversationCount);

      const statusCode = usageResult.success ? 200 : 400;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(usageResult));
    } catch (error) {
      console.error('Error tracking usage:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to track usage'
      }));
    }
  }

  /**
   * Cancel subscription
   * POST /api/billing/cancel
   */
  async cancelSubscription(req, res) {
    try {
      const { subscriptionId } = await this.parseRequestBody(req);

      if (!subscriptionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Subscription ID is required'
        }));
        return;
      }

      const cancelResult = await this.billingService.cancelSubscription(subscriptionId);

      const statusCode = cancelResult.success ? 200 : 400;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cancelResult));
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to cancel subscription'
      }));
    }
  }

  /**
   * Stripe webhook handler
   * POST /api/billing/webhook
   */
  async handleWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event;
      try {
        const body = await this.getRawBody(req);
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Webhook signature verification failed' }));
        return;
      }

      // Handle the event
      switch (event.type) {
        case 'customer.subscription.created':
          console.log('Subscription created:', event.data.object.id);
          break;
        case 'customer.subscription.updated':
          console.log('Subscription updated:', event.data.object.id);
          break;
        case 'customer.subscription.deleted':
          console.log('Subscription canceled:', event.data.object.id);
          break;
        case 'invoice.payment_succeeded':
          console.log('Payment succeeded:', event.data.object.id);
          break;
        case 'invoice.payment_failed':
          console.log('Payment failed:', event.data.object.id);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to handle webhook'
      }));
    }
  }

  /**
   * Helper method to parse request body
   */
  parseRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Helper method to get raw request body for webhook verification
   */
  getRawBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        resolve(body);
      });
      req.on('error', reject);
    });
  }
}

module.exports = BillingAPI;
