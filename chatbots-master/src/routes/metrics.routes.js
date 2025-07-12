/**
 * Metrics Routes
 * 
 * API routes for system metrics including cache monitoring and warming
 */

const express = require('express');
const router = express.Router();
const metricsController = require('@src/controllers/metrics.controller');
const { isAuthenticated, isAdmin } = require('@src/middleware/auth.middleware');

/**
 * @route   GET /api/metrics/cache
 * @desc    Get current cache metrics
 * @access  Admin
 */
router.get('/cache', isAuthenticated, isAdmin, metricsController.getCacheMetrics);

/**
 * @route   GET /api/metrics/cache/history
 * @desc    Get historical cache metrics
 * @access  Admin
 */
router.get('/cache/history', isAuthenticated, isAdmin, metricsController.getCacheMetricsHistory);

/**
 * @route   POST /api/metrics/cache/reset
 * @desc    Reset cache metrics
 * @access  Admin
 */
router.post('/cache/reset', isAuthenticated, isAdmin, metricsController.resetCacheMetrics);

/**
 * @route   POST /api/metrics/cache/warm
 * @desc    Trigger cache warming
 * @access  Admin
 */
router.post('/cache/warm', isAuthenticated, isAdmin, metricsController.triggerCacheWarming);

/**
 * @route   GET /api/metrics/cache/adaptive-ttl
 * @desc    Get adaptive TTL configuration
 * @access  Admin
 */
router.get('/cache/adaptive-ttl', isAuthenticated, isAdmin, metricsController.getAdaptiveTTLConfig);

/**
 * @route   PUT /api/metrics/cache/adaptive-ttl
 * @desc    Update adaptive TTL configuration
 * @access  Admin
 */
router.put('/cache/adaptive-ttl', isAuthenticated, isAdmin, metricsController.updateAdaptiveTTLConfig);

/**
 * @route   GET /api/metrics/cache/access-tracking
 * @desc    Get resource access tracking data
 * @access  Admin
 */
router.get('/cache/access-tracking', isAuthenticated, isAdmin, metricsController.getResourceAccessTracking);

/**
 * @route   POST /api/metrics/cache/decay-access
 * @desc    Manually decay resource access counts
 * @access  Admin
 */
router.post('/cache/decay-access', isAuthenticated, isAdmin, metricsController.decayResourceAccessCounts);

module.exports = router;
