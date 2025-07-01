/**
 * Subscription Analytics Controller
 * 
 * Handles API endpoints for subscription analytics and reporting
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics.service');
const authMiddleware = require('../../middleware/auth');
const adminMiddleware = require('../../middleware/admin');
const logger = require('../../utils/logger');

/**
 * @route GET /api/billing/analytics/dashboard
 * @desc Get subscription dashboard summary
 * @access Admin
 */
router.get('/dashboard', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const summary = await analyticsService.getDashboardSummary();
    res.json(summary);
  } catch (error) {
    logger.error(`Error getting dashboard summary: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/analytics/mrr
 * @desc Get monthly recurring revenue data
 * @access Admin
 */
router.get('/mrr', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { startDate, endDate, interval } = req.query;
    
    // Parse dates if provided
    const options = {
      interval: interval || 'month'
    };
    
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate);
    }
    
    const mrrData = await analyticsService.getMonthlyRecurringRevenue(options);
    res.json(mrrData);
  } catch (error) {
    logger.error(`Error getting MRR data: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/analytics/churn
 * @desc Get churn rate data
 * @access Admin
 */
router.get('/churn', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { startDate, endDate, interval } = req.query;
    
    // Parse dates if provided
    const options = {
      interval: interval || 'month'
    };
    
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate);
    }
    
    const churnData = await analyticsService.getChurnRate(options);
    res.json(churnData);
  } catch (error) {
    logger.error(`Error getting churn data: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/analytics/ltv
 * @desc Get customer lifetime value metrics
 * @access Admin
 */
router.get('/ltv', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const ltvData = await analyticsService.getCustomerLifetimeValue();
    res.json(ltvData);
  } catch (error) {
    logger.error(`Error getting LTV data: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/analytics/revenue-by-plan
 * @desc Get revenue breakdown by plan
 * @access Admin
 */
router.get('/revenue-by-plan', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const revenueData = await analyticsService.getRevenueByPlan();
    res.json(revenueData);
  } catch (error) {
    logger.error(`Error getting revenue by plan: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/analytics/payment-success
 * @desc Get payment success rate
 * @access Admin
 */
router.get('/payment-success', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse dates if provided
    const options = {};
    
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate);
    }
    
    const successData = await analyticsService.getPaymentSuccessRate(options);
    res.json(successData);
  } catch (error) {
    logger.error(`Error getting payment success rate: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/analytics/growth
 * @desc Get subscription growth data
 * @access Admin
 */
router.get('/growth', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { startDate, endDate, interval } = req.query;
    
    // Parse dates if provided
    const options = {
      interval: interval || 'month'
    };
    
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate);
    }
    
    const growthData = await analyticsService.getSubscriptionGrowth(options);
    res.json(growthData);
  } catch (error) {
    logger.error(`Error getting subscription growth data: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/analytics/payment-recovery
 * @desc Get payment recovery analytics data
 * @access Admin
 */
router.get('/payment-recovery', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Parse dates if provided
    const options = {};
    
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    
    if (endDate) {
      options.endDate = new Date(endDate);
    }
    
    const recoveryData = await analyticsService.getPaymentRecoveryAnalytics(options);
    res.json(recoveryData);
  } catch (error) {
    logger.error(`Error getting payment recovery analytics: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/billing/analytics/tenant/:tenantId
 * @desc Get analytics for a specific tenant
 * @access Admin
 */
router.get('/tenant/:tenantId', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Get tenant subscriptions
    const subscriptions = await Subscription.find({ tenantId })
      .sort({ createdAt: -1 });
    
    // Get payment history
    const paymentAttempts = await PaymentAttempt.find({ tenantId })
      .sort({ attemptedAt: -1 })
      .limit(20);
    
    // Calculate tenant metrics
    let totalSpent = 0;
    let activeSubscriptionCount = 0;
    
    for (const subscription of subscriptions) {
      if (subscription.status === 'active') {
        activeSubscriptionCount++;
      }
      
      // Calculate total spent based on subscription duration
      const createdAt = new Date(subscription.createdAt);
      const endDate = subscription.canceledAt ? 
        new Date(subscription.canceledAt) : new Date();
      
      const monthsDuration = (endDate - createdAt) / (1000 * 60 * 60 * 24 * 30.44);
      const monthlyRate = analyticsService._getMonthlyRate(subscription);
      
      totalSpent += monthlyRate * monthsDuration;
    }
    
    res.json({
      tenantId,
      subscriptions,
      paymentHistory: paymentAttempts,
      metrics: {
        totalSpent: Math.round(totalSpent * 100) / 100,
        activeSubscriptions: activeSubscriptionCount,
        totalSubscriptions: subscriptions.length,
        customerSince: subscriptions.length > 0 ? subscriptions[subscriptions.length - 1].createdAt : null
      }
    });
  } catch (error) {
    logger.error(`Error getting tenant analytics: ${error.message}`, { error });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
