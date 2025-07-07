/**
 * Payment Controller
 * 
 * Handles payment-related endpoints
 */

const express = require('express');
const router = express.Router();
const paymentService = require('../services/payment.service');
const { authenticateJWT, authorizeRole } = require('../../middleware/auth');
const logger = require('../../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent
 * POST /api/billing/payment/intent
 */
router.post('/intent', authenticateJWT, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    
    const paymentIntent = await paymentService.createPaymentIntent(subscriptionId);
    
    res.json(paymentIntent);
  } catch (error) {
    logger.error(`Error creating payment intent: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create a setup intent for saving payment method
 * POST /api/billing/payment/setup
 */
router.post('/setup', authenticateJWT, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const setupIntent = await paymentService.createSetupIntent(tenantId);
    
    res.json(setupIntent);
  } catch (error) {
    logger.error(`Error creating setup intent: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Set default payment method
 * PUT /api/billing/payment/methods/:paymentMethodId/default
 */
router.put('/methods/:paymentMethodId/default', authenticateJWT, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const tenantId = req.user.tenantId;
    
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }
    
    const tenant = await paymentService.setDefaultPaymentMethod(tenantId, paymentMethodId);
    
    res.json({
      success: true,
      paymentMethods: tenant.paymentMethods
    });
  } catch (error) {
    logger.error(`Error setting default payment method: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove payment method
 * DELETE /api/billing/payment/methods/:paymentMethodId
 */
router.delete('/methods/:paymentMethodId', authenticateJWT, async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const tenantId = req.user.tenantId;
    
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }
    
    const tenant = await paymentService.removePaymentMethod(tenantId, paymentMethodId);
    
    res.json({
      success: true,
      paymentMethods: tenant.paymentMethods
    });
  } catch (error) {
    logger.error(`Error removing payment method: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get payment methods
 * GET /api/billing/payment/methods
 */
router.get('/methods', authenticateJWT, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    // Get tenant with payment methods
    const Tenant = require('../../tenancy/models/tenant.model');
    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json({
      paymentMethods: tenant.paymentMethods || []
    });
  } catch (error) {
    logger.error(`Error getting payment methods: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Handle Stripe webhook events
 * POST /api/billing/payment/webhook
 */
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }
  
  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.rawBody, // Note: requires raw body parser
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Process the event
    const result = await paymentService.processWebhookEvent(event);
    
    res.json({ received: true, processed: true, event: event.type });
  } catch (error) {
    logger.error(`Webhook error: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
