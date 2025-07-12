/**
 * Cache Middleware Index
 * 
 * Exports the cache middleware functionality with monitoring and warming
 */

// Import dependencies
const express = require('express');
const { createCacheMiddleware, clearCache } = require('./cache.middleware');
const { initMonitoring, getMetrics, getHistory, resetMetrics } = require('./cache-monitor');
const { initWarming, warmCache } = require('./cache-warmer');
const { getRedisClient } = require('@core/redis-client');
const { getConfig } = require('@config/cache.config');
const logger = require('@core/logger');

// Initialize monitoring and warming
let monitor = null;
let warmer = null;

/**
 * Apply cache middleware to Express app routes
 * 
 * @param {Object} app - Express app
 * @param {Object} options - Cache options
 */
const applyCacheMiddleware = (app, options = {}) => {
  try {
    // Get Redis client
    const redisClient = getRedisClient();
    
    // Default options
    const defaultOptions = {
      enabled: process.env.CACHE_ENABLED !== 'false',
      ttl: 3600, // 1 hour
      prefix: 'api',
      routes: [],
      monitoring: process.env.CACHE_MONITORING_ENABLED !== 'false',
      warming: process.env.CACHE_WARMING_ENABLED !== 'false',
      metricsEndpoint: '/api/metrics/cache'
    };
    
    // Merge options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Skip if disabled
    if (!mergedOptions.enabled) {
      logger.info('Cache middleware disabled');
      return;
    }
    
    // Initialize monitoring if enabled
    if (mergedOptions.monitoring) {
      monitor = initMonitoring();
      logger.info('Cache monitoring initialized');
    }
    
    // Initialize warming if enabled
    if (mergedOptions.warming) {
      warmer = initWarming(redisClient);
      logger.info('Cache warming initialized');
    }
    
    // Create middleware
    const cacheMiddleware = createCacheMiddleware(redisClient, {
      ttl: mergedOptions.ttl,
      prefix: mergedOptions.prefix,
      enabled: mergedOptions.enabled,
      monitoring: mergedOptions.monitoring,
      warming: mergedOptions.warming
    });
    
    // Apply to routes
    if (mergedOptions.routes && mergedOptions.routes.length > 0) {
      mergedOptions.routes.forEach(route => {
        app.use(route, cacheMiddleware);
        logger.info(`Applied cache middleware to route: ${route}`);
      });
    }
    
    // Add metrics endpoint if monitoring is enabled
    if (mergedOptions.monitoring && mergedOptions.metricsEndpoint) {
      setupMetricsEndpoint(app, mergedOptions.metricsEndpoint);
    }
    
    // Schedule initial cache warming if enabled
    if (mergedOptions.warming && warmer) {
      setTimeout(() => {
        warmer.warmCache();
      }, 5000); // Wait 5 seconds after startup
    }
    
    return {
      middleware: cacheMiddleware,
      clearCache: (pattern) => clearCache(redisClient, pattern),
      getMetrics: () => monitor ? getMetrics() : null,
      warmCache: () => warmer ? warmer.warmCache() : null
    };
  } catch (error) {
    logger.error(`Error applying cache middleware: ${error.message}`);
    throw error;
  }
};

/**
 * Setup metrics endpoint for cache monitoring
 * 
 * @param {Object} app - Express app
 * @param {string} endpoint - Metrics endpoint path
 */
const setupMetricsEndpoint = (app, endpoint) => {
  const router = express.Router();
  
  // Get cache metrics
  router.get('/', (req, res) => {
    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: 'Cache monitoring is not enabled'
      });
    }
    
    res.json({
      success: true,
      metrics: getMetrics()
    });
  });
  
  // Get historical metrics
  router.get('/history', (req, res) => {
    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: 'Cache monitoring is not enabled'
      });
    }
    
    const limit = parseInt(req.query.limit) || 100;
    
    res.json({
      success: true,
      history: getHistory(limit)
    });
  });
  
  // Reset metrics
  router.post('/reset', (req, res) => {
    if (!monitor) {
      return res.status(404).json({
        success: false,
        message: 'Cache monitoring is not enabled'
      });
    }
    
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }
    
    resetMetrics();
    
    res.json({
      success: true,
      message: 'Cache metrics reset successfully'
    });
  });
  
  // Trigger cache warming
  router.post('/warm', (req, res) => {
    if (!warmer) {
      return res.status(404).json({
        success: false,
        message: 'Cache warming is not enabled'
      });
    }
    
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Admin access required'
      });
    }
    
    // Trigger cache warming
    warmer.warmCache()
      .then(result => {
        res.json({
          success: true,
          message: `Cache warming completed: ${result.warmed}/${result.total} resources warmed in ${result.duration}ms`,
          result
        });
      })
      .catch(error => {
        res.status(500).json({
          success: false,
          message: `Error warming cache: ${error.message}`
        });
      });
  });
  
  // Mount router
  app.use(endpoint, router);
  logger.info(`Cache metrics endpoint available at ${endpoint}`);
};

/**
 * Create cache middleware for a specific resource type
 * 
 * @param {string} resourceType - Type of resource (sentiment, conversation, etc.)
 * @param {Object} overrides - Configuration overrides
 * @returns {Function} Express middleware
 */
const createResourceCache = (resourceType, overrides = {}) => {
  const redisClient = getRedisClient();
  const config = getConfig(resourceType, overrides);
  
  return createCacheMiddleware(redisClient, config);
};

module.exports = {
  createCacheMiddleware,
  clearCache,
  applyCacheMiddleware,
  createResourceCache,
  getMetrics: () => monitor ? getMetrics() : null,
  getHistory: (limit) => monitor ? getHistory(limit) : [],
  resetMetrics: () => monitor ? resetMetrics() : null,
  warmCache: () => warmer ? warmCache() : null
};
