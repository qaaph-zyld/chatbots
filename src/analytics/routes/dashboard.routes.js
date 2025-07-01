/**
 * Analytics Dashboard Routes
 * 
 * API routes for analytics dashboard data
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../../auth/middleware/auth.middleware');

/**
 * @route GET /analytics/dashboard/summary
 * @desc Get summary analytics data for the dashboard
 * @access Private
 */
router.get('/summary', authMiddleware.authenticate, dashboardController.getDashboardSummary);

/**
 * @route GET /analytics/dashboard/usage
 * @desc Get usage analytics data for the dashboard
 * @access Private
 */
router.get('/usage', authMiddleware.authenticate, dashboardController.getUsageAnalytics);

/**
 * @route GET /analytics/dashboard/users
 * @desc Get user analytics data for the dashboard
 * @access Private
 */
router.get('/users', authMiddleware.authenticate, dashboardController.getUserAnalytics);

/**
 * @route GET /analytics/dashboard/conversations
 * @desc Get conversation analytics data for the dashboard
 * @access Private
 */
router.get('/conversations', authMiddleware.authenticate, dashboardController.getConversationAnalytics);

/**
 * @route GET /analytics/dashboard/templates
 * @desc Get template usage analytics data for the dashboard
 * @access Private
 */
router.get('/templates', authMiddleware.authenticate, dashboardController.getTemplateAnalytics);

module.exports = router;
