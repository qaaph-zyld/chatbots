/**
 * Health Check Routes
 * 
 * API routes for health check endpoints
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

/**
 * @route GET /health
 * @description Get overall system health status
 * @access Public
 */
router.get('/', healthController.getSystemHealth.bind(healthController));

/**
 * @route GET /health/liveness
 * @description Simple liveness probe for kubernetes
 * @access Public
 */
router.get('/liveness', healthController.getLiveness.bind(healthController));

/**
 * @route GET /health/readiness
 * @description Readiness probe for kubernetes
 * @access Public
 */
router.get('/readiness', healthController.getReadiness.bind(healthController));

/**
 * @route GET /health/components/:component
 * @description Get health status for a specific component
 * @param {string} component - Component name (database, cache, external-services, system-resources)
 * @access Public
 */
router.get('/components/:component', healthController.getComponentHealth.bind(healthController));

module.exports = router;
