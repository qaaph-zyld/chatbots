/**
 * Analytics Dashboard API Routes
 * 
 * Provides endpoints for retrieving analytics data for the dashboard
 */

const express = require('express');
const router = express.Router();
const analyticsDashboardController = require('../controllers/analytics-dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/analytics-dashboard/overview
 * @desc    Get overview metrics and trends
 * @access  Private
 */
router.get('/overview', analyticsDashboardController.getOverview);

/**
 * @route   GET /api/analytics-dashboard/conversations
 * @desc    Get conversation metrics and distributions
 * @access  Private
 */
router.get('/conversations', analyticsDashboardController.getConversations);

/**
 * @route   GET /api/analytics-dashboard/templates
 * @desc    Get template usage statistics
 * @access  Private
 */
router.get('/templates', analyticsDashboardController.getTemplates);

/**
 * @route   GET /api/analytics-dashboard/user-engagement
 * @desc    Get user engagement metrics
 * @access  Private
 */
router.get('/user-engagement', analyticsDashboardController.getUserEngagement);

/**
 * @route   GET /api/analytics-dashboard/response-quality
 * @desc    Get response quality metrics
 * @access  Private
 */
router.get('/response-quality', analyticsDashboardController.getResponseQuality);

module.exports = router;