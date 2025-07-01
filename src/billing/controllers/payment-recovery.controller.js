/**
 * Payment Recovery Controller
 * 
 * Exposes payment recovery operations via API endpoints
 * Handles payment retry scheduling, processing, and statistics
 */

const paymentRecoveryService = require('../services/payment-recovery.service');
const Subscription = require('../models/subscription.model');
const logger = require('../../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Schedule a payment retry
 * @route POST /api/billing/payment-recovery/retry
 */
exports.scheduleRetry = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscriptionId, invoiceId, paymentError } = req.body;
    
    // Check if subscription exists
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Check authorization (admin only or subscription owner)
    if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to subscription' });
    }
    
    const result = await paymentRecoveryService.scheduleRetry(subscriptionId, invoiceId, paymentError);
    
    return res.status(200).json({
      message: 'Payment retry scheduled successfully',
      retry: result
    });
  } catch (error) {
    logger.error(`Error scheduling payment retry: ${error.message}`);
    return res.status(500).json({ error: 'Failed to schedule payment retry' });
  }
};

/**
 * Process scheduled retries (admin only)
 * @route POST /api/billing/admin/payment-recovery/process-retries
 */
exports.processScheduledRetries = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const results = await paymentRecoveryService.processScheduledRetries();
    
    return res.status(200).json({
      message: `Processed ${results.length} payment retry attempts`,
      results
    });
  } catch (error) {
    logger.error(`Error processing scheduled retries: ${error.message}`);
    return res.status(500).json({ error: 'Failed to process scheduled retries' });
  }
};

/**
 * Handle a recovered payment
 * @route POST /api/billing/payment-recovery/recovered
 */
exports.handleRecoveredPayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subscriptionId, invoiceId } = req.body;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const subscription = await paymentRecoveryService.handleRecoveredPayment(subscriptionId, invoiceId);
    
    return res.status(200).json({
      message: 'Payment recovery processed successfully',
      subscription
    });
  } catch (error) {
    logger.error(`Error handling recovered payment: ${error.message}`);
    return res.status(500).json({ error: 'Failed to handle recovered payment' });
  }
};

/**
 * Get recovery statistics for a subscription
 * @route GET /api/billing/payment-recovery/stats/:subscriptionId
 */
exports.getRecoveryStats = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Check if subscription exists
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Check authorization (admin only or subscription owner)
    if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to subscription' });
    }
    
    const stats = await paymentRecoveryService.getRecoveryStats(subscriptionId);
    
    return res.status(200).json({ stats });
  } catch (error) {
    logger.error(`Error getting recovery stats: ${error.message}`);
    return res.status(500).json({ error: 'Failed to get recovery statistics' });
  }
};
