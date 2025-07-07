/**
 * Subscription Lifecycle Controller
 * 
 * Exposes subscription lifecycle operations via API endpoints
 * Handles renewal, cancellation, plan changes, and subscription management
 */

const subscriptionLifecycleService = require('../services/subscription-lifecycle.service');
const Subscription = require('../models/subscription.model');
const logger = require('../../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Process subscription renewal
 * @route POST /api/billing/subscriptions/:id/renew
 */
exports.renewSubscription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    
    // Check if subscription belongs to the authenticated user or admin
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Check authorization (user can only manage their own subscriptions)
    if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to subscription' });
    }
    
    const updatedSubscription = await subscriptionLifecycleService.processRenewal(id);
    
    return res.status(200).json({
      message: 'Subscription renewed successfully',
      subscription: updatedSubscription
    });
  } catch (error) {
    logger.error(`Error renewing subscription: ${error.message}`);
    return res.status(500).json({ error: 'Failed to renew subscription' });
  }
};

/**
 * Cancel subscription
 * @route POST /api/billing/subscriptions/:id/cancel
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { immediate = false } = req.body;
    
    // Check if subscription belongs to the authenticated user or admin
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Check authorization (user can only manage their own subscriptions)
    if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to subscription' });
    }
    
    const updatedSubscription = await subscriptionLifecycleService.cancelSubscription(id, immediate);
    
    return res.status(200).json({
      message: immediate 
        ? 'Subscription canceled immediately' 
        : 'Subscription will be canceled at the end of the billing period',
      subscription: updatedSubscription
    });
  } catch (error) {
    logger.error(`Error canceling subscription: ${error.message}`);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

/**
 * Change subscription plan
 * @route POST /api/billing/subscriptions/:id/change-plan
 */
exports.changePlan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { planId, prorate = true } = req.body;
    
    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }
    
    // Check if subscription belongs to the authenticated user or admin
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Check authorization (user can only manage their own subscriptions)
    if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to subscription' });
    }
    
    const updatedSubscription = await subscriptionLifecycleService.changePlan(id, planId, prorate);
    
    return res.status(200).json({
      message: 'Subscription plan changed successfully',
      subscription: updatedSubscription
    });
  } catch (error) {
    logger.error(`Error changing subscription plan: ${error.message}`);
    return res.status(500).json({ error: 'Failed to change subscription plan' });
  }
};

/**
 * Pause subscription
 * @route POST /api/billing/subscriptions/:id/pause
 */
exports.pauseSubscription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { resumeDate } = req.body;
    
    // Parse resume date if provided
    let parsedResumeDate = null;
    if (resumeDate) {
      parsedResumeDate = new Date(resumeDate);
      if (isNaN(parsedResumeDate.getTime())) {
        return res.status(400).json({ error: 'Invalid resume date format' });
      }
    }
    
    // Check if subscription belongs to the authenticated user or admin
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Check authorization (user can only manage their own subscriptions)
    if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to subscription' });
    }
    
    const updatedSubscription = await subscriptionLifecycleService.pauseSubscription(id, parsedResumeDate);
    
    return res.status(200).json({
      message: 'Subscription paused successfully',
      subscription: updatedSubscription
    });
  } catch (error) {
    logger.error(`Error pausing subscription: ${error.message}`);
    return res.status(500).json({ error: 'Failed to pause subscription' });
  }
};

/**
 * Resume subscription
 * @route POST /api/billing/subscriptions/:id/resume
 */
exports.resumeSubscription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    
    // Check if subscription belongs to the authenticated user or admin
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Check authorization (user can only manage their own subscriptions)
    if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to subscription' });
    }
    
    const updatedSubscription = await subscriptionLifecycleService.resumeSubscription(id);
    
    return res.status(200).json({
      message: 'Subscription resumed successfully',
      subscription: updatedSubscription
    });
  } catch (error) {
    logger.error(`Error resuming subscription: ${error.message}`);
    return res.status(500).json({ error: 'Failed to resume subscription' });
  }
};

/**
 * Process grace periods (admin only)
 * @route POST /api/billing/admin/subscriptions/process-grace-periods
 */
exports.processGracePeriods = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const results = await subscriptionLifecycleService.processGracePeriods();
    
    return res.status(200).json({
      message: `Processed ${results.length} subscriptions with expired grace periods`,
      results
    });
  } catch (error) {
    logger.error(`Error processing grace periods: ${error.message}`);
    return res.status(500).json({ error: 'Failed to process grace periods' });
  }
};

/**
 * Get subscription details
 * @route GET /api/billing/subscriptions/:id
 */
exports.getSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if subscription belongs to the authenticated user or admin
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Check authorization (user can only view their own subscriptions)
    if (subscription.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access to subscription' });
    }
    
    return res.status(200).json({ subscription });
  } catch (error) {
    logger.error(`Error retrieving subscription: ${error.message}`);
    return res.status(500).json({ error: 'Failed to retrieve subscription' });
  }
};
