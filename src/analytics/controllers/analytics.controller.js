/**
 * Analytics Controller
 * 
 * Handles API routes for analytics data retrieval and management
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics.service');
const { authenticateUser, authorizeAdmin } = require('../../middleware/auth.middleware');
const logger = require('../../utils/logger');

/**
 * Get dashboard summary
 * @route GET /analytics/dashboard/summary
 * @access Private
 */
router.get('/dashboard/summary', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    
    const summary = await analyticsService.getDashboardSummary({ tenantId });
    
    res.json({ success: true, summary });
  } catch (error) {
    logger.error(`Error getting dashboard summary: ${error.message}`);
    next(error);
  }
});

/**
 * Get subscription analytics
 * @route GET /analytics/subscriptions
 * @access Private
 */
router.get('/subscriptions', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;
    
    const analytics = await analyticsService.getSubscriptionAnalytics({
      tenantId,
      startDate,
      endDate
    });
    
    res.json({ success: true, analytics });
  } catch (error) {
    logger.error(`Error getting subscription analytics: ${error.message}`);
    next(error);
  }
});

/**
 * Get revenue report
 * @route GET /analytics/revenue
 * @access Private
 */
router.get('/revenue', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate, currency } = req.query;
    
    const report = await analyticsService.getRevenueReport({
      tenantId,
      startDate,
      endDate,
      currency
    });
    
    res.json({ success: true, report });
  } catch (error) {
    logger.error(`Error getting revenue report: ${error.message}`);
    next(error);
  }
});

/**
 * Get revenue by currency
 * @route GET /analytics/revenue/by-currency
 * @access Private
 */
router.get('/revenue/by-currency', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;
    
    const revenueByCurrency = await analyticsService.getRevenueByCurrency({
      tenantId,
      startDate,
      endDate
    });
    
    res.json({ success: true, revenueByCurrency });
  } catch (error) {
    logger.error(`Error getting revenue by currency: ${error.message}`);
    next(error);
  }
});

/**
 * Get user engagement metrics
 * @route GET /analytics/engagement
 * @access Private
 */
router.get('/engagement', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { startDate, endDate } = req.query;
    
    const metrics = await analyticsService.getUserEngagementMetrics({
      tenantId,
      startDate,
      endDate
    });
    
    res.json({ success: true, metrics });
  } catch (error) {
    logger.error(`Error getting user engagement metrics: ${error.message}`);
    next(error);
  }
});

/**
 * Track analytics event
 * @route POST /analytics/events
 * @access Private
 */
router.post('/events', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId, userId } = req.user;
    const { eventType, eventData } = req.body;
    
    if (!eventType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Event type is required' 
      });
    }
    
    const event = await analyticsService.trackEvent({
      tenantId,
      userId,
      eventType,
      eventData
    });
    
    res.json({ success: true, event });
  } catch (error) {
    logger.error(`Error tracking event: ${error.message}`);
    next(error);
  }
});

/**
 * Get events by type
 * @route GET /analytics/events/:eventType
 * @access Private
 */
router.get('/events/:eventType', authenticateUser, async (req, res, next) => {
  try {
    const { tenantId } = req.user;
    const { eventType } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    const events = await analyticsService.getEventsByType({
      tenantId,
      eventType,
      startDate,
      endDate,
      limit: limit ? parseInt(limit) : undefined
    });
    
    res.json({ success: true, events });
  } catch (error) {
    logger.error(`Error getting events by type: ${error.message}`);
    next(error);
  }
});

/**
 * Get export formats
 * @route GET /analytics/export/formats
 * @access Private
 */
router.get('/export/formats', authenticateUser, async (req, res, next) => {
  try {
    // Return available export formats
    const formats = [
      { id: 'csv', name: 'CSV', description: 'Comma-separated values file' },
      { id: 'json', name: 'JSON', description: 'JavaScript Object Notation file' },
      { id: 'xlsx', name: 'Excel', description: 'Microsoft Excel spreadsheet' }
    ];
    
    res.json({ success: true, formats });
  } catch (error) {
    logger.error(`Error getting export formats: ${error.message}`);
    next(error);
  }
});

/**
 * Admin: Get analytics across all tenants
 * @route GET /analytics/admin/overview
 * @access Admin
 */
router.get('/admin/overview', authenticateUser, authorizeAdmin, async (req, res, next) => {
  try {
    // In a real implementation, we would aggregate data across all tenants
    // For now, we'll just return a mock response
    const overview = {
      totalTenants: 0,
      activeSubscriptions: 0,
      totalRevenue: 0,
      churnRate: 0
    };
    
    res.json({ success: true, overview });
  } catch (error) {
    logger.error(`Error getting admin analytics overview: ${error.message}`);
    next(error);
  }
});

module.exports = router;
