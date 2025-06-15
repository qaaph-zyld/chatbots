/**
 * Metrics Controller
 * 
 * Handles API endpoints for system metrics including cache monitoring and warming
 */

const { redisClient } = require('@src/middleware/cache/redis.client');
const { isAdmin } = require('@src/middleware/auth.middleware');
const logger = require('@src/utils/logger');

/**
 * Get current cache metrics
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCacheMetrics = async (req, res) => {
  try {
    // Check if cache monitoring is enabled
    const monitoringEnabled = process.env.ENABLE_CACHE_MONITORING === 'true';
    if (!monitoringEnabled) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cache monitoring is not enabled' 
      });
    }

    // Get metrics from Redis
    const metricsKey = 'cache:metrics:current';
    const metricsData = await redisClient.get(metricsKey);
    
    if (!metricsData) {
      return res.status(200).json({ 
        success: true, 
        metrics: {
          overall: { hits: 0, misses: 0, total: 0, hitRate: 0 },
          resources: {}
        }
      });
    }

    const metrics = JSON.parse(metricsData);
    
    return res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error('Error fetching cache metrics:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch cache metrics' 
    });
  }
};

/**
 * Get historical cache metrics
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCacheMetricsHistory = async (req, res) => {
  try {
    // Check if cache monitoring is enabled
    const monitoringEnabled = process.env.ENABLE_CACHE_MONITORING === 'true';
    if (!monitoringEnabled) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cache monitoring is not enabled' 
      });
    }

    // Get limit from query params (default to 24 snapshots)
    const limit = parseInt(req.query.limit) || 24;
    
    // Get history from Redis
    const historyKey = 'cache:metrics:history';
    const historyData = await redisClient.lrange(historyKey, 0, limit - 1);
    
    if (!historyData || historyData.length === 0) {
      return res.status(200).json({ 
        success: true, 
        history: []
      });
    }

    // Parse each history item
    const history = historyData.map(item => JSON.parse(item));
    
    return res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('Error fetching cache metrics history:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch cache metrics history' 
    });
  }
};

/**
 * Reset cache metrics
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetCacheMetrics = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    // Check if cache monitoring is enabled
    const monitoringEnabled = process.env.ENABLE_CACHE_MONITORING === 'true';
    if (!monitoringEnabled) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cache monitoring is not enabled' 
      });
    }

    // Reset metrics in Redis
    const metricsKey = 'cache:metrics:current';
    const historyKey = 'cache:metrics:history';
    
    // Initialize empty metrics
    const emptyMetrics = {
      overall: { hits: 0, misses: 0, total: 0, hitRate: 0 },
      resources: {},
      timestamp: new Date().toISOString()
    };
    
    // Set current metrics to empty
    await redisClient.set(metricsKey, JSON.stringify(emptyMetrics));
    
    // Clear history
    await redisClient.del(historyKey);
    
    return res.status(200).json({
      success: true,
      message: 'Cache metrics reset successfully'
    });
  } catch (error) {
    logger.error('Error resetting cache metrics:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to reset cache metrics' 
    });
  }
};

/**
 * Trigger cache warming
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const triggerCacheWarming = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    // Check if cache warming is enabled
    const warmingEnabled = process.env.ENABLE_CACHE_WARMING === 'true';
    if (!warmingEnabled) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cache warming is not enabled' 
      });
    }

    // Get access tracking data from Redis
    const accessKey = 'cache:access:tracking';
    const accessData = await redisClient.get(accessKey);
    
    if (!accessData) {
      return res.status(200).json({ 
        success: true, 
        result: {
          warmed: 0,
          total: 0,
          duration: 0
        }
      });
    }

    const accessTracking = JSON.parse(accessData);
    const startTime = Date.now();
    let warmedCount = 0;
    
    // Trigger warming for each resource
    // In a real implementation, this would call the actual endpoints
    // Here we're simulating the warming process
    for (const [resourceType, resources] of Object.entries(accessTracking)) {
      for (const resource of Object.keys(resources)) {
        // Simulate warming by setting a cache entry
        const cacheKey = `cache:${resourceType}:${resource}`;
        await redisClient.set(cacheKey, JSON.stringify({ 
          data: `Warmed data for ${resourceType}:${resource}`,
          timestamp: new Date().toISOString()
        }), 'EX', 3600); // 1 hour TTL
        
        warmedCount++;
      }
    }
    
    const duration = Date.now() - startTime;
    const totalResources = warmedCount;
    
    return res.status(200).json({
      success: true,
      result: {
        warmed: warmedCount,
        total: totalResources,
        duration
      }
    });
  } catch (error) {
    logger.error('Error triggering cache warming:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to trigger cache warming' 
    });
  }
};

/**
 * Get adaptive TTL configuration
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAdaptiveTTLConfig = async (req, res) => {
  try {
    // Check if adaptive TTL is enabled
    const adaptiveTTLEnabled = process.env.ENABLE_ADAPTIVE_TTL === 'true';
    if (!adaptiveTTLEnabled) {
      return res.status(200).json({ 
        success: true, 
        enabled: false,
        message: 'Adaptive TTL is not enabled'
      });
    }

    // Get configuration from Redis
    const configKey = 'cache:adaptive:config';
    const configData = await redisClient.get(configKey);
    
    let config = {
      enabled: true,
      defaultTTL: 3600, // 1 hour
      minTTL: 300, // 5 minutes
      maxTTL: 86400, // 24 hours
      weights: {
        accessFrequency: 0.5,
        missRate: 0.3,
        latency: 0.2
      }
    };
    
    if (configData) {
      config = { ...config, ...JSON.parse(configData) };
    }
    
    return res.status(200).json({
      success: true,
      config
    });
  } catch (error) {
    logger.error('Error fetching adaptive TTL configuration:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch adaptive TTL configuration',
      error: error.message 
    });
  }
};

/**
 * Update adaptive TTL configuration
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateAdaptiveTTLConfig = async (req, res) => {
  try {
    // Check if user is admin
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }
    
    // Check if adaptive TTL is enabled
    const adaptiveTTLEnabled = process.env.ENABLE_ADAPTIVE_TTL === 'true';
    if (!adaptiveTTLEnabled) {
      return res.status(400).json({ 
        success: false, 
        message: 'Adaptive TTL is not enabled on this server'
      });
    }

    // Validate request body
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({
        success: false,
        message: 'Configuration object is required'
      });
    }

    // Validate configuration values
    if (config.minTTL && config.maxTTL && config.minTTL >= config.maxTTL) {
      return res.status(400).json({
        success: false,
        message: 'minTTL must be less than maxTTL'
      });
    }

    if (config.defaultTTL && (config.minTTL > config.defaultTTL || config.maxTTL < config.defaultTTL)) {
      return res.status(400).json({
        success: false,
        message: 'defaultTTL must be between minTTL and maxTTL'
      });
    }

    // Get current configuration
    const configKey = 'cache:adaptive:config';
    const currentConfigData = await redisClient.get(configKey);
    let currentConfig = {
      enabled: true,
      defaultTTL: 3600, // 1 hour
      minTTL: 300, // 5 minutes
      maxTTL: 86400, // 24 hours
      weights: {
        accessFrequency: 0.5,
        missRate: 0.3,
        latency: 0.2
      }
    };
    
    if (currentConfigData) {
      currentConfig = { ...currentConfig, ...JSON.parse(currentConfigData) };
    }

    // Merge with new configuration
    const newConfig = {
      ...currentConfig,
      ...config,
      weights: {
        ...currentConfig.weights,
        ...(config.weights || {})
      }
    };

    // Save to Redis
    await redisClient.set(configKey, JSON.stringify(newConfig), 'EX', 86400 * 30); // 30 days TTL

    return res.status(200).json({
      success: true,
      message: 'Adaptive TTL configuration updated',
      config: newConfig
    });
  } catch (error) {
    logger.error('Error updating adaptive TTL configuration:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update adaptive TTL configuration',
      error: error.message 
    });
  }
};

/**
 * Get resource access tracking data
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getResourceAccessTracking = async (req, res) => {
  try {
    // Check if adaptive TTL is enabled
    const adaptiveTTLEnabled = process.env.ENABLE_ADAPTIVE_TTL === 'true';
    if (!adaptiveTTLEnabled) {
      return res.status(404).json({ 
        success: false, 
        message: 'Adaptive TTL is not enabled'
      });
    }

    // Get access tracking data from Redis
    const accessKey = 'cache:access:tracking';
    const accessData = await redisClient.get(accessKey);
    
    if (!accessData) {
      return res.status(200).json({ 
        success: true, 
        tracking: {}
      });
    }

    const tracking = JSON.parse(accessData);
    
    return res.status(200).json({
      success: true,
      tracking
    });
  } catch (error) {
    logger.error('Error fetching resource access tracking:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch resource access tracking',
      error: error.message 
    });
  }
};

/**
 * Decay resource access counts manually
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const decayResourceAccessCounts = async (req, res) => {
  try {
    // Check if user is admin
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }
    
    // Check if adaptive TTL is enabled
    const adaptiveTTLEnabled = process.env.ENABLE_ADAPTIVE_TTL === 'true';
    if (!adaptiveTTLEnabled) {
      return res.status(400).json({ 
        success: false, 
        message: 'Adaptive TTL is not enabled on this server'
      });
    }

    // Import decay function
    const { decayAccessCounts } = require('@src/middleware/cache/adaptive-ttl');
    
    // Run decay process
    await decayAccessCounts();

    return res.status(200).json({
      success: true,
      message: 'Resource access counts decayed successfully'
    });
  } catch (error) {
    logger.error('Error decaying resource access counts:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to decay resource access counts',
      error: error.message 
    });
  }
};

module.exports = {
  getCacheMetrics,
  getCacheMetricsHistory,
  resetCacheMetrics,
  triggerCacheWarming,
  getAdaptiveTTLConfig,
  updateAdaptiveTTLConfig,
  getResourceAccessTracking,
  decayResourceAccessCounts
};
