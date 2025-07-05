/**
 * Health Check Routes
 * 
 * These routes provide health check endpoints for monitoring the application
 * and its dependencies. They are used by monitoring tools, load balancers,
 * and deployment verification tests.
 */

const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

/**
 * @route GET /health
 * @description Basic health check endpoint
 * @access Public
 */
router.get('/', healthController.getHealth);

/**
 * @route GET /health/ready
 * @description Readiness check endpoint
 * @access Public
 */
router.get('/ready', healthController.getReadiness);

/**
 * @route GET /health/live
 * @description Liveness check endpoint
 * @access Public
 */
router.get('/live', healthController.getLiveness);

/**
 * @route GET /health/database
 * @description Database connectivity check
 * @access Public
 */
router.get('/database', healthController.getDatabaseHealth);

/**
 * @route GET /health/integrations
 * @description External integrations health check
 * @access Public
 */
router.get('/integrations', healthController.getIntegrationsHealth);

/**
 * @route GET /health/detailed
 * @description Detailed health check with all components
 * @access Public
 */
router.get('/detailed', healthController.getDetailedHealth);

module.exports = router;
