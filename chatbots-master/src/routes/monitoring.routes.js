/**
 * Monitoring Routes
 * 
 * API routes for system monitoring
 */

const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoring.controller');

/**
 * @route GET /monitoring/metrics
 * @description Get recent system metrics
 * @access Private
 */
router.get('/metrics', monitoringController.getRecentMetrics.bind(monitoringController));

/**
 * @route GET /monitoring/metrics/aggregated
 * @description Get aggregated system metrics
 * @access Private
 */
router.get('/metrics/aggregated', monitoringController.getAggregatedMetrics.bind(monitoringController));

/**
 * @route GET /monitoring/overview
 * @description Get system health overview
 * @access Private
 */
router.get('/overview', monitoringController.getHealthOverview.bind(monitoringController));

/**
 * @route POST /monitoring/collect
 * @description Trigger an immediate metrics collection
 * @access Private
 */
router.post('/collect', monitoringController.collectMetricsNow.bind(monitoringController));

module.exports = router;
