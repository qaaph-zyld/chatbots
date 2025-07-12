/**
 * Subscription Controller
 * 
 * Handles HTTP requests related to subscription management.
 */

const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscription-service');
const { SUBSCRIPTION_TIERS } = require('../models/subscription');
const { authenticate, authorize } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');

/**
 * @swagger
 * /api/billing/subscriptions:
 *   get:
 *     summary: Get tenant subscription
 *     description: Retrieves the subscription information for the current tenant
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription details
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const subscription = await subscriptionService.getSubscriptionByTenantId(tenantId);
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error(`Error getting subscription: ${error.message}`);
    
    if (error.message.includes('No subscription found')) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscription'
    });
  }
});

/**
 * @swagger
 * /api/billing/subscriptions:
 *   post:
 *     summary: Create subscription
 *     description: Creates a new subscription for the tenant
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tier:
 *                 type: string
 *                 enum: [free, starter, professional, enterprise]
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, annual]
 *     responses:
 *       201:
 *         description: Subscription created
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { tier, billingCycle, paymentMethod } = req.body;
    
    // Validate tier
    if (tier && !Object.values(SUBSCRIPTION_TIERS).includes(tier)) {
      return res.status(400).json({
        success: false,
        error: `Invalid subscription tier: ${tier}`
      });
    }
    
    // Validate billing cycle
    if (billingCycle && !['monthly', 'annual'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        error: `Invalid billing cycle: ${billingCycle}`
      });
    }
    
    const subscription = await subscriptionService.createSubscription(tenantId, {
      tier,
      billingCycle,
      paymentMethod
    });
    
    res.status(201).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error(`Error creating subscription: ${error.message}`);
    
    if (error.message.includes('already has a subscription')) {
      return res.status(400).json({
        success: false,
        error: 'Tenant already has an active subscription'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription'
    });
  }
});

/**
 * @swagger
 * /api/billing/subscriptions/upgrade:
 *   post:
 *     summary: Upgrade subscription
 *     description: Upgrades the tenant's subscription to a new tier
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tier:
 *                 type: string
 *                 enum: [starter, professional, enterprise]
 *     responses:
 *       200:
 *         description: Subscription upgraded
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/upgrade', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { tier } = req.body;
    
    if (!tier) {
      return res.status(400).json({
        success: false,
        error: 'Tier is required'
      });
    }
    
    // Validate tier
    if (!Object.values(SUBSCRIPTION_TIERS).includes(tier)) {
      return res.status(400).json({
        success: false,
        error: `Invalid subscription tier: ${tier}`
      });
    }
    
    const subscription = await subscriptionService.updateSubscriptionTier(tenantId, tier);
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error(`Error upgrading subscription: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to upgrade subscription'
    });
  }
});

/**
 * @swagger
 * /api/billing/subscriptions/cancel:
 *   post:
 *     summary: Cancel subscription
 *     description: Cancels the tenant's subscription
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription canceled
 *       500:
 *         description: Server error
 */
router.post('/cancel', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const subscription = await subscriptionService.cancelSubscription(tenantId);
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error(`Error canceling subscription: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

/**
 * @swagger
 * /api/billing/subscriptions/usage:
 *   get:
 *     summary: Get usage report
 *     description: Retrieves the usage report for the current tenant
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage report
 *       500:
 *         description: Server error
 */
router.get('/usage', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const usageReport = await subscriptionService.getUsageReport(tenantId);
    
    res.json({
      success: true,
      data: usageReport
    });
  } catch (error) {
    logger.error(`Error getting usage report: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve usage report'
    });
  }
});

/**
 * @swagger
 * /api/billing/subscriptions/bill:
 *   get:
 *     summary: Get current bill
 *     description: Calculates the current bill for the tenant
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current bill
 *       500:
 *         description: Server error
 */
router.get('/bill', authenticate, async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    
    const bill = await subscriptionService.calculateCurrentBill(tenantId);
    
    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    logger.error(`Error calculating bill: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to calculate bill'
    });
  }
});

/**
 * @swagger
 * /api/billing/subscriptions/tiers:
 *   get:
 *     summary: Get subscription tiers
 *     description: Retrieves all available subscription tiers and their limits
 *     tags: [Billing]
 *     responses:
 *       200:
 *         description: Subscription tiers
 */
router.get('/tiers', async (req, res) => {
  try {
    const { Subscription } = require('../models/subscription');
    const tiers = Subscription.getAllTiers();
    
    res.json({
      success: true,
      data: tiers
    });
  } catch (error) {
    logger.error(`Error getting subscription tiers: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscription tiers'
    });
  }
});

// Admin-only routes

/**
 * @swagger
 * /api/billing/subscriptions/admin/process-billing:
 *   post:
 *     summary: Process billing
 *     description: Processes billing for all subscriptions (admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing processed
 *       500:
 *         description: Server error
 */
router.post('/admin/process-billing', authenticate, authorize(['super_admin']), async (req, res) => {
  try {
    const results = await subscriptionService.processBilling();
    
    res.json({
      success: true,
      data: {
        processed: results.length,
        results
      }
    });
  } catch (error) {
    logger.error(`Error processing billing: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process billing'
    });
  }
});

module.exports = router;
