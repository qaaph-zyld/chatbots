/**
 * Cache Monitoring System
 * 
 * Tracks cache hit/miss rates and provides metrics for cache performance analysis
 */

// Import dependencies
const { monitoring } = require('@config/cache.config');
const logger = require('@core/logger');

// In-memory storage for metrics
// In a production environment, consider using a time-series database
const metrics = {
  hits: {},
  misses: {},
  latency: {},
  size: {},
  timestamp: Date.now(),
  history: [],
  resources: {} // Track metrics by resource type
};

// Snapshot interval for time-series data
let metricsInterval = null;

/**
 * Initialize the cache monitoring system
 * 
 * @param {Object} options - Monitoring options
 * @returns {Object} Monitoring instance
 */
const initMonitoring = (options = {}) => {
  const config = {
    ...monitoring,
    ...options
  };
  
  if (!config.enabled) {
    logger.debug('Cache monitoring disabled');
    return { recordHit: () => {}, recordMiss: () => {}, getMetrics: () => ({}) };
  }
  
  logger.info('Initializing cache monitoring system');
  
  // Start periodic snapshots for time-series data
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }
  
  metricsInterval = setInterval(() => {
    takeSnapshot();
  }, config.metricsInterval);
  
  return {
    recordHit,
    recordMiss,
    getMetrics,
    getHistory,
    resetMetrics,
    takeSnapshot
  };
};

/**
 * Record a cache hit
 * 
 * @param {string} prefix - Cache prefix
 * @param {string} key - Cache key
 * @param {number} latency - Time taken to retrieve from cache in ms
 * @param {number} size - Size of cached item in bytes
 * @param {string} resourceType - Optional resource type for adaptive TTL
 */
const recordHit = (prefix, key, latency = 0, size = 0, resourceType = null) => {
  try {
    // Initialize prefix if needed
    if (!metrics.hits[prefix]) {
      metrics.hits[prefix] = 0;
      metrics.latency[prefix] = 0;
      metrics.size[prefix] = 0;
    }
    
    // Increment hit count
    metrics.hits[prefix]++;
    
    // Track latency
    metrics.latency[prefix] += latency;
    
    // Track size
    metrics.size[prefix] += size;
    
    // Update timestamp
    metrics.timestamp = Date.now();
    
    // Track resource-specific metrics if resource type is provided
    if (resourceType) {
      // Initialize resource type if needed
      if (!metrics.resources[resourceType]) {
        metrics.resources[resourceType] = {
          hits: 0,
          misses: 0,
          totalLatency: 0,
          avgLatency: 0,
          totalSize: 0,
          avgSize: 0,
          keys: {}
        };
      }
      
      // Update resource type metrics
      metrics.resources[resourceType].hits++;
      metrics.resources[resourceType].totalLatency += latency;
      metrics.resources[resourceType].avgLatency = 
        metrics.resources[resourceType].totalLatency / 
        (metrics.resources[resourceType].hits + metrics.resources[resourceType].misses || 1);
      metrics.resources[resourceType].totalSize += size;
      metrics.resources[resourceType].avgSize = 
        metrics.resources[resourceType].totalSize / 
        (metrics.resources[resourceType].hits + metrics.resources[resourceType].misses || 1);
      
      // Extract resource key from cache key
      const resourceKey = key.split(':')[1] || key;
      
      // Initialize resource key if needed
      if (!metrics.resources[resourceType].keys[resourceKey]) {
        metrics.resources[resourceType].keys[resourceKey] = {
          hits: 0,
          misses: 0,
          lastAccess: Date.now()
        };
      }
      
      // Update resource key metrics
      metrics.resources[resourceType].keys[resourceKey].hits++;
      metrics.resources[resourceType].keys[resourceKey].lastAccess = Date.now();
    }
    
    // Store metrics in Redis for adaptive TTL strategy
    const { redisClient } = require('./redis.client');
    if (redisClient && process.env.ENABLE_ADAPTIVE_TTL === 'true') {
      redisClient.set('cache:metrics:current', JSON.stringify(metrics), 'EX', 86400); // 24 hours TTL
    }
    
    logger.debug(`Cache hit for ${prefix}:${key} (${latency.toFixed(2)}ms, ${size} bytes)`);
  } catch (error) {
    logger.error(`Error recording cache hit: ${error.message}`);
  }
};

/**
 * Record a cache miss
 * 
 * @param {string} prefix - Cache prefix
 * @param {string} key - Cache key
 * @param {string} resourceType - Optional resource type for adaptive TTL
 */
const recordMiss = (prefix, key, resourceType = null) => {
  try {
    // Initialize prefix if needed
    if (!metrics.misses[prefix]) {
      metrics.misses[prefix] = 0;
    }
    
    // Increment miss count
    metrics.misses[prefix]++;
    
    // Update timestamp
    metrics.timestamp = Date.now();
    
    // Track resource-specific metrics if resource type is provided
    if (resourceType) {
      // Initialize resource type if needed
      if (!metrics.resources[resourceType]) {
        metrics.resources[resourceType] = {
          hits: 0,
          misses: 0,
          totalLatency: 0,
          avgLatency: 0,
          totalSize: 0,
          avgSize: 0,
          keys: {}
        };
      }
      
      // Update resource type metrics
      metrics.resources[resourceType].misses++;
      
      // Extract resource key from cache key
      const resourceKey = key.split(':')[1] || key;
      
      // Initialize resource key if needed
      if (!metrics.resources[resourceType].keys[resourceKey]) {
        metrics.resources[resourceType].keys[resourceKey] = {
          hits: 0,
          misses: 0,
          lastAccess: Date.now()
        };
      }
      
      // Update resource key metrics
      metrics.resources[resourceType].keys[resourceKey].misses++;
      metrics.resources[resourceType].keys[resourceKey].lastAccess = Date.now();
    }
    
    // Store metrics in Redis for adaptive TTL strategy
    const { redisClient } = require('./redis.client');
    if (redisClient && process.env.ENABLE_ADAPTIVE_TTL === 'true') {
      redisClient.set('cache:metrics:current', JSON.stringify(metrics), 'EX', 86400); // 24 hours TTL
    }
    
    logger.debug(`Cache miss for ${prefix}:${key}`);
  } catch (error) {
    logger.error(`Error recording cache miss: ${error.message}`);
  }
};

/**
 * Get current cache metrics
 * 
 * @returns {Object} Cache metrics
 */
const getMetrics = () => {
  const result = {
    timestamp: Date.now(),
    uptime: Date.now() - metrics.timestamp,
    resources: {}
  };
  
  // Calculate hit rate and other metrics for each resource type
  const resourceTypes = new Set([
    ...Object.keys(metrics.hits),
    ...Object.keys(metrics.misses)
  ]);
  
  resourceTypes.forEach(resourceType => {
    const hits = metrics.hits[resourceType] || 0;
    const misses = metrics.misses[resourceType] || 0;
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;
    
    const latency = metrics.latency[resourceType] || { total: 0, count: 0 };
    const avgLatency = latency.count > 0 ? latency.total / latency.count : 0;
    
    const size = metrics.size[resourceType] || { total: 0, count: 0 };
    const avgSize = size.count > 0 ? size.total / size.count : 0;
    
    result.resources[resourceType] = {
      hits,
      misses,
      total,
      hitRate,
      avgLatency,
      avgSize
    };
  });
  
  // Calculate overall metrics
  const totalHits = Object.values(metrics.hits).reduce((sum, val) => sum + val, 0);
  const totalMisses = Object.values(metrics.misses).reduce((sum, val) => sum + val, 0);
  const totalRequests = totalHits + totalMisses;
  const overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
  
  result.overall = {
    hits: totalHits,
    misses: totalMisses,
    total: totalRequests,
    hitRate: overallHitRate
  };
  
  return result;
};

/**
 * Get historical metrics
 * 
 * @param {number} limit - Maximum number of records to return
 * @returns {Array} Historical metrics
 */
const getHistory = (limit = 100) => {
  return metrics.history.slice(-limit);
};

/**
 * Take a snapshot of current metrics for historical tracking
 */
const takeSnapshot = () => {
  const currentMetrics = getMetrics();
  
  // Add to history
  metrics.history.push(currentMetrics);
  
  // Trim history to retention period
  const cutoff = Date.now() - monitoring.retentionPeriod;
  metrics.history = metrics.history.filter(item => item.timestamp >= cutoff);
  
  if (monitoring.logLevel === 'info') {
    logger.info(`Cache metrics snapshot taken: ${currentMetrics.overall.hitRate.toFixed(2)} hit rate`);
  }
  
  return currentMetrics;
};

/**
 * Reset all metrics
 */
const resetMetrics = () => {
  metrics.hits = {};
  metrics.misses = {};
  metrics.latency = {};
  metrics.size = {};
  metrics.timestamp = Date.now();
  // Keep history intact
  
  logger.info('Cache metrics reset');
};

/**
 * Track resource metrics by type and key
 * 
 * @param {string} resourceType - Type of resource (e.g., 'sentiment', 'translation')
 * @param {string} resourceKey - Unique identifier for the resource
 */
const trackResource = (resourceType, resourceKey) => {
  try {
    // Initialize resource type if needed
    if (!metrics.resources[resourceType]) {
      metrics.resources[resourceType] = {
        hits: 0,
        misses: 0,
        totalLatency: 0,
        avgLatency: 0,
        totalSize: 0,
        avgSize: 0,
        keys: {}
      };
    }
    
    // Initialize resource key if needed
    if (!metrics.resources[resourceType].keys[resourceKey]) {
      metrics.resources[resourceType].keys[resourceKey] = {
        hits: 0,
        misses: 0,
        lastAccess: Date.now()
      };
    }
    
    // Update last access time
    metrics.resources[resourceType].keys[resourceKey].lastAccess = Date.now();
    
    // Store metrics in Redis for adaptive TTL strategy
    const { redisClient } = require('./redis.client');
    if (redisClient) {
      redisClient.set('cache:metrics:current', JSON.stringify(metrics), 'EX', 86400); // 24 hours TTL
    }
  } catch (error) {
    logger.error(`Error tracking resource metrics: ${error.message}`);
  }
};

module.exports = {
  initMonitoring,
  recordHit,
  recordMiss,
  getMetrics,
  getHistory,
  resetMetrics,
  takeSnapshot,
  trackResource
};
