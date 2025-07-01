/**
 * Revenue Analytics Controller
 * 
 * Handles HTTP requests related to revenue analytics and reporting
 */

const express = require('express');
const router = express.Router();
const revenueAnalyticsService = require('../services/revenue-analytics.service');
const { authenticate, authorize } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');

/**
 * @swagger
 * /api/analytics/revenue/dashboard:
 *   get:
 *     summary: Get revenue dashboard data
 *     description: Retrieves key revenue metrics for the dashboard
 *     tags: [Analytics, Revenue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue dashboard data
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/dashboard', authenticate, authorize(['admin', 'finance']), async (req, res) => {
  try {
    const dashboardData = await revenueAnalyticsService.getRevenueDashboardData();
    
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error(`Error getting revenue dashboard data: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve revenue dashboard data'
    });
  }
});

/**
 * @swagger
 * /api/analytics/revenue/mrr:
 *   get:
 *     summary: Get monthly recurring revenue
 *     description: Retrieves MRR data with trends
 *     tags: [Analytics, Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *         description: Number of months to include
 *     responses:
 *       200:
 *         description: MRR data
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/mrr', authenticate, authorize(['admin', 'finance']), async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const mrrData = await revenueAnalyticsService.getMonthlyRecurringRevenue({ months });
    
    res.json({
      success: true,
      data: mrrData
    });
  } catch (error) {
    logger.error(`Error getting MRR data: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve MRR data'
    });
  }
});

/**
 * @swagger
 * /api/analytics/revenue/churn:
 *   get:
 *     summary: Get churn rate
 *     description: Retrieves churn rate data with trends
 *     tags: [Analytics, Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *         description: Number of months to include
 *     responses:
 *       200:
 *         description: Churn rate data
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/churn', authenticate, authorize(['admin', 'finance']), async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const churnData = await revenueAnalyticsService.getChurnRate({ months });
    
    res.json({
      success: true,
      data: churnData
    });
  } catch (error) {
    logger.error(`Error getting churn data: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve churn data'
    });
  }
});

/**
 * @swagger
 * /api/analytics/revenue/ltv:
 *   get:
 *     summary: Get customer lifetime value
 *     description: Retrieves LTV data and LTV:CAC ratio
 *     tags: [Analytics, Revenue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: LTV data
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/ltv', authenticate, authorize(['admin', 'finance']), async (req, res) => {
  try {
    const ltvData = await revenueAnalyticsService.getCustomerLifetimeValue();
    
    res.json({
      success: true,
      data: ltvData
    });
  } catch (error) {
    logger.error(`Error getting LTV data: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve LTV data'
    });
  }
});

/**
 * @swagger
 * /api/analytics/revenue/forecast:
 *   get:
 *     summary: Get revenue forecast
 *     description: Retrieves revenue forecast for future months
 *     tags: [Analytics, Revenue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *         description: Number of months to forecast
 *       - in: query
 *         name: growthRate
 *         schema:
 *           type: number
 *         description: Monthly growth rate (decimal)
 *     responses:
 *       200:
 *         description: Forecast data
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/forecast', authenticate, authorize(['admin', 'finance']), async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const growthRate = parseFloat(req.query.growthRate) || 0.1;
    
    const forecastData = await revenueAnalyticsService.getRevenueForecast({
      months,
      growthRate
    });
    
    res.json({
      success: true,
      data: forecastData
    });
  } catch (error) {
    logger.error(`Error getting forecast data: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve forecast data'
    });
  }
});

/**
 * @swagger
 * /api/analytics/revenue/subscriptions:
 *   get:
 *     summary: Get subscription metrics
 *     description: Retrieves subscription distribution and metrics
 *     tags: [Analytics, Revenue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription metrics
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/subscriptions', authenticate, authorize(['admin', 'finance']), async (req, res) => {
  try {
    const subscriptionMetrics = await revenueAnalyticsService.getSubscriptionMetrics();
    
    res.json({
      success: true,
      data: subscriptionMetrics
    });
  } catch (error) {
    logger.error(`Error getting subscription metrics: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscription metrics'
    });
  }
});

/**
 * @swagger
 * /api/analytics/revenue/cac:
 *   get:
 *     summary: Get customer acquisition cost
 *     description: Retrieves CAC data with trends
 *     tags: [Analytics, Revenue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CAC data
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/cac', authenticate, authorize(['admin', 'finance']), async (req, res) => {
  try {
    const cacData = await revenueAnalyticsService.getCustomerAcquisitionCost();
    
    res.json({
      success: true,
      data: cacData
    });
  } catch (error) {
    logger.error(`Error getting CAC data: ${error.message}`);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve CAC data'
    });
  }
});

module.exports = router;
