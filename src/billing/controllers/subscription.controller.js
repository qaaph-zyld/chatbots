/**
 * Subscription Controller
 * 
 * Handles API routes for subscription management
 */

const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscription.service');
const { createPaymentError } = require('../utils/payment-error-handler');
const { authenticateUser, authorizeAdmin } = require('../../middleware/auth.middleware');
const logger = require('../../utils/logger');

/**
 * Get all plans
 * @route GET /billing/plans
 * @access Public
 */
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await subscriptionService.getPlans();
    res.json({ success: true, plans });
  } catch (error) {
    logger.error(`Error getting plans: ${error.message}`);
    next(error);
  }
});

/**
 * Get active subscription for current tenant
 * @route GET /billing/subscriptions/active
 * @access Private
 */
router.get('/subscriptions/active', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const subscription = await subscriptionService.getActiveSubscription(tenantId);
    
    if (!subscription) {
      return res.json({ 
        success: true, 
        hasActiveSubscription: false,
        subscription: null
      });
    }
    
    res.json({ 
      success: true, 
      hasActiveSubscription: true,
      subscription 
    });
  } catch (error) {
    logger.error(`Error getting active subscription: ${error.message}`);
    next(error);
  }
});

/**
 * Get all subscriptions for current tenant
 * @route GET /billing/subscriptions
 * @access Private
 */
router.get('/subscriptions', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const subscriptions = await subscriptionService.getSubscriptions(tenantId);
    res.json({ success: true, subscriptions });
  } catch (error) {
    logger.error(`Error getting subscriptions: ${error.message}`);
    next(error);
  }
});

/**
 * Create a new subscription
 * @route POST /billing/subscriptions
 * @access Private
 */
router.post('/subscriptions', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { planId, paymentMethodId, couponCode, autoRenew } = req.body;
    
    if (!planId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Plan ID is required' 
      });
    }
    
    if (!paymentMethodId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment method ID is required' 
      });
    }
    
    const subscription = await subscriptionService.createSubscription({
      userId,
      tenantId,
      planId,
      paymentMethodId,
      couponCode,
      autoRenew
    });
    
    res.json({ success: true, subscription });
  } catch (error) {
    logger.error(`Error creating subscription: ${error.message}`);
    
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
    
    next(error);
  }
});

/**
 * Cancel a subscription
 * @route POST /billing/subscriptions/:id/cancel
 * @access Private
 */
router.post('/subscriptions/:id/cancel', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { immediate, reason } = req.body;
    
    // Verify subscription belongs to tenant
    const subscription = await subscriptionService.getSubscription(id);
    if (!subscription || subscription.tenantId !== tenantId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subscription not found' 
      });
    }
    
    const updatedSubscription = await subscriptionService.cancelSubscription(id, {
      immediate,
      reason
    });
    
    res.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    logger.error(`Error canceling subscription: ${error.message}`);
    
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
    
    next(error);
  }
});

/**
 * Change subscription plan
 * @route POST /billing/subscriptions/:id/change-plan
 * @access Private
 */
router.post('/subscriptions/:id/change-plan', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { newPlanId } = req.body;
    
    if (!newPlanId) {
      return res.status(400).json({ 
        success: false, 
        error: 'New plan ID is required' 
      });
    }
    
    // Verify subscription belongs to tenant
    const subscription = await subscriptionService.getSubscription(id);
    if (!subscription || subscription.tenantId !== tenantId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subscription not found' 
      });
    }
    
    const updatedSubscription = await subscriptionService.changeSubscriptionPlan(id, newPlanId);
    
    res.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    logger.error(`Error changing subscription plan: ${error.message}`);
    
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
    
    next(error);
  }
});

/**
 * Update payment method
 * @route POST /billing/subscriptions/:id/update-payment
 * @access Private
 */
router.post('/subscriptions/:id/update-payment', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment method ID is required' 
      });
    }
    
    // Verify subscription belongs to tenant
    const subscription = await subscriptionService.getSubscription(id);
    if (!subscription || subscription.tenantId !== tenantId) {
      return res.status(404).json({ 
        success: false, 
        error: 'Subscription not found' 
      });
    }
    
    const updatedSubscription = await subscriptionService.updatePaymentMethod(id, paymentMethodId);
    
    res.json({ success: true, subscription: updatedSubscription });
  } catch (error) {
    logger.error(`Error updating payment method: ${error.message}`);
    
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
    
    next(error);
  }
});

/**
 * Check feature access
 * @route GET /billing/feature-access/:featureKey
 * @access Private
 */
router.get('/feature-access/:featureKey', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { featureKey } = req.params;
    
    const hasAccess = await subscriptionService.hasFeatureAccess(tenantId, featureKey);
    
    res.json({ 
      success: true, 
      hasAccess 
    });
  } catch (error) {
    logger.error(`Error checking feature access: ${error.message}`);
    next(error);
  }
});

/**
 * Admin: Get all subscriptions (across tenants)
 * @route GET /billing/admin/subscriptions
 * @access Admin
 */
router.get('/admin/subscriptions', authenticateUser, authorizeAdmin, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    // In a real implementation, we would query the database with pagination
    // For now, we'll just return a mock response
    const subscriptions = [];
    const totalCount = 0;
    
    res.json({ 
      success: true, 
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    logger.error(`Error getting admin subscriptions: ${error.message}`);
    next(error);
  }
});

/**
 * Admin: Manually renew a subscription
 * @route POST /billing/admin/subscriptions/:id/renew
 * @access Admin
 */
router.post('/admin/subscriptions/:id/renew', authenticateUser, authorizeAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const subscription = await subscriptionService.renewSubscription(id);
    
    res.json({ success: true, subscription });
  } catch (error) {
    logger.error(`Error renewing subscription: ${error.message}`);
    
    if (error.code && error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
    
    next(error);
  }
});

module.exports = router;
