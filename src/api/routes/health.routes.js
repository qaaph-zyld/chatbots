/**
 * Health Check Routes
 * 
 * These routes provide health check endpoints for monitoring the application
 * and its dependencies. They are used by monitoring tools, load balancers,
 * and deployment verification tests.
 */

const express = require('express');
const router = express.Router();
const { getPerformanceMetrics } = require('../../database/connection');
const performanceService = require('../../services/performance.service');
const mongoose = require('mongoose');
const { cacheService } = require('../../database/connection');

/**
 * @route GET /health
 * @description Basic health check endpoint
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    res.json(health);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * @route GET /health/ready
 * @description Readiness check endpoint
 * @access Public
 */
router.get('/ready', async (req, res) => {
  try {
    const checks = {
      database: mongoose.connection.readyState === 1,
      cache: cacheService.isConnected
    };
    
    const allReady = Object.values(checks).every(check => check);
    
    res.status(allReady ? 200 : 503).json({
      status: allReady ? 'ready' : 'not ready',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

/**
 * @route GET /health/live
 * @description Liveness check endpoint
 * @access Public
 */
router.get('/live', async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const isHealthy = memoryUsage.heapUsed < 1024 * 1024 * 1024; // < 1GB
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'alive' : 'unhealthy',
      memory: memoryUsage,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * @route GET /health/database
 * @description Database connectivity check
 * @access Public
 */
router.get('/database', async (req, res) => {
  try {
    const dbMetrics = await getPerformanceMetrics();
    const isHealthy = mongoose.connection.readyState === 1;
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      metrics: dbMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * @route GET /health/integrations
 * @description External integrations health check
 * @access Public
 */
router.get('/integrations', async (req, res) => {
  try {
    const integrations = {
      openai: !!process.env.OPENAI_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      smtp: !!process.env.SMTP_HOST
    };
    
    const allHealthy = Object.values(integrations).every(check => check);
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      integrations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * @route GET /health/detailed
 * @description Detailed health check with all components
 * @access Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const healthStatus = await performanceService.getHealthStatus();
    
    res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
