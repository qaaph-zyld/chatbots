/**
 * Dunning Controller
 * 
 * Handles API endpoints for dunning management
 */

const express = require('express');
const router = express.Router();
const dunningService = require('../services/dunning.service');
const authMiddleware = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/admin');
const logger = require('../../utils/logger');
const Subscription = require('../models/subscription.model');

/**
 * @route GET /api/billing/dunning/stats
 * @desc Get dunning statistics
 * @access Admin
 */
router.get('/stats', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const stats = await dunningService.getDunningStats();
    res.json(stats);
  } catch (error) {
    logger.error(`Error getting dunning stats: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/dunning/subscriptions/:status
 * @desc Get subscriptions by dunning status
 * @access Admin
 */
router.get('/subscriptions/:status', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Validate status
    const validStatuses = ['active', 'scheduled', 'grace_period', 'recovered', 'failed', 'canceled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid dunning status' });
    }
    
    // Find subscriptions with the given dunning status
    const subscriptions = await Subscription.find({ 'dunning.status': status })
      .populate('tenantId', 'name organizationDetails.companyName contactDetails.email')
      .sort({ 'dunning.lastAttemptAt': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    // Get total count
    const totalCount = await Subscription.countDocuments({ 'dunning.status': status });
    
    res.json({
      subscriptions,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error getting dunning subscriptions: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/billing/dunning/retry/:subscriptionId
 * @desc Manually retry payment for a subscription
 * @access Admin
 */
router.post('/retry/:subscriptionId', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Retry payment
    const result = await dunningService.retryPayment(subscriptionId);
    
    res.json(result);
  } catch (error) {
    logger.error(`Error retrying payment: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/billing/dunning/process-queue
 * @desc Process dunning queue (scheduled retries and cancellations)
 * @access Admin
 */
router.post('/process-queue', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    // Process dunning queue
    const results = await dunningService.processDunningQueue();
    
    res.json(results);
  } catch (error) {
    logger.error(`Error processing dunning queue: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/dunning/subscription/:subscriptionId
 * @desc Get dunning details for a subscription
 * @access Private
 */
router.get('/subscription/:subscriptionId', authMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Get subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Check if user has access to this subscription
    if (subscription.tenantId.toString() !== req.user.tenantId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to access this subscription' });
    }
    
    // Return dunning details
    res.json({
      subscriptionId: subscription._id,
      planName: subscription.plan.name,
      status: subscription.status,
      dunning: subscription.dunning || null
    });
  } catch (error) {
    logger.error(`Error getting dunning details: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/billing/dunning/update-payment/:subscriptionId
 * @desc Update payment method for a subscription in dunning
 * @access Private
 */
router.post('/update-payment/:subscriptionId', authMiddleware, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID is required' });
    }
    
    // Get subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Check if user has access to this subscription
    if (subscription.tenantId.toString() !== req.user.tenantId) {
      return res.status(403).json({ error: 'Not authorized to update this subscription' });
    }
    
    // Check if subscription is in dunning
    if (!subscription.dunning || !['active', 'scheduled', 'grace_period'].includes(subscription.dunning.status)) {
      return res.status(400).json({ error: 'Subscription is not in active dunning process' });
    }
    
    // Update payment method and retry payment
    const result = await dunningService.retryPayment(subscriptionId);
    
    res.json(result);
  } catch (error) {
    logger.error(`Error updating payment method: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
