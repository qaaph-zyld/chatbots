/**
 * Health Check Routes
 * 
 * Routes for checking system health
 */

const express = require('express');
const healthCheckController = require('../controllers/health-check.controller');

const router = express.Router();

// Public health check endpoints
router.get('/', healthCheckController.getHealth);
router.get('/liveness', healthCheckController.getLiveness);
router.get('/readiness', healthCheckController.getReadiness);
router.get('/components/:component', healthCheckController.getComponentHealth);

module.exports = router;
