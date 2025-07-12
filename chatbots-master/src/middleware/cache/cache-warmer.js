/**
 * Cache Warming System
 * 
 * Preloads frequently accessed resources into cache to improve performance
 */

// Import dependencies
const { warming } = require('@config/cache.config');
const logger = require('@core/logger');

// Track frequently accessed resources
const accessTracker = {
  resources: new Map(),
  lastWarmed: Date.now()
};

// Warming interval
let warmingInterval = null;

/**
 * Initialize the cache warming system
 * 
 * @param {Object} redisClient - Redis client instance
 * @param {Object} options - Warming options
 * @returns {Object} Warming instance
 */
const initWarming = (redisClient, options = {}) => {
  const config = {
    ...warming,
    ...options
  };
  
  if (!config.enabled) {
    logger.debug('Cache warming disabled');
    return { trackAccess: () => {}, warmCache: () => {} };
  }
  
  logger.info('Initializing cache warming system');
  
  // Start periodic warming
  if (warmingInterval) {
    clearInterval(warmingInterval);
  }
  
  warmingInterval = setInterval(() => {
    warmCache(redisClient, config);
  }, config.interval);
  
  return {
    trackAccess,
    warmCache: () => warmCache(redisClient, config),
    getTopResources,
    resetTracker
  };
};

/**
 * Track resource access for warming
 * 
 * @param {string} resourceType - Type of resource
 * @param {string} key - Resource identifier
 * @param {Function} fetchFunction - Function to fetch the resource
 */
const trackAccess = (resourceType, key, fetchFunction) => {
  if (!warming.enabled) {
    return;
  }
  
  const resourceKey = `${resourceType}:${key}`;
  
  if (!accessTracker.resources.has(resourceKey)) {
    accessTracker.resources.set(resourceKey, {
      resourceType,
      key,
      fetchFunction,
      hits: 1,
      lastAccessed: Date.now()
    });
  } else {
    const resource = accessTracker.resources.get(resourceKey);
    resource.hits++;
    resource.lastAccessed = Date.now();
    accessTracker.resources.set(resourceKey, resource);
  }
};

/**
 * Warm the cache with frequently accessed resources
 * 
 * @param {Object} redisClient - Redis client instance
 * @param {Object} config - Warming configuration
 */
const warmCache = async (redisClient, config = warming) => {
  if (!config.enabled || !redisClient) {
    return;
  }
  
  logger.info('Starting cache warming cycle');
  const startTime = Date.now();
  
  try {
    // Get top resources to warm
    const topResources = getTopResources(config.maxItems, config.minHits);
    
    if (topResources.length === 0) {
      logger.debug('No resources to warm');
      return;
    }
    
    logger.info(`Warming ${topResources.length} resources`);
    
    // Warm each resource
    const warmingPromises = topResources.map(async (resource) => {
      try {
        if (typeof resource.fetchFunction !== 'function') {
          logger.warn(`No fetch function for resource: ${resource.resourceType}:${resource.key}`);
          return null;
        }
        
        // Fetch the resource
        const data = await resource.fetchFunction();
        
        // Store in cache if fetch was successful
        if (data) {
          await redisClient.setex(
            `${resource.resourceType}:${resource.key}`,
            3600, // 1 hour TTL for warmed resources
            JSON.stringify(data)
          );
          return resource;
        }
      } catch (error) {
        logger.error(`Error warming resource ${resource.resourceType}:${resource.key}: ${error.message}`);
      }
      return null;
    });
    
    // Wait for all warming operations to complete
    const results = await Promise.all(warmingPromises);
    const warmedCount = results.filter(Boolean).length;
    
    const duration = Date.now() - startTime;
    logger.info(`Cache warming completed: ${warmedCount}/${topResources.length} resources warmed in ${duration}ms`);
    
    // Update last warmed timestamp
    accessTracker.lastWarmed = Date.now();
    
    return {
      warmed: warmedCount,
      total: topResources.length,
      duration
    };
  } catch (error) {
    logger.error(`Cache warming error: ${error.message}`);
    return {
      warmed: 0,
      total: 0,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
};

/**
 * Get top accessed resources for warming
 * 
 * @param {number} limit - Maximum number of resources to return
 * @param {number} minHits - Minimum number of hits to qualify for warming
 * @returns {Array} Top resources
 */
const getTopResources = (limit = warming.maxItems, minHits = warming.minHits) => {
  // Convert map to array
  const resources = Array.from(accessTracker.resources.values());
  
  // Filter by minimum hits
  const qualifiedResources = resources.filter(resource => resource.hits >= minHits);
  
  // Sort by hits (descending)
  qualifiedResources.sort((a, b) => b.hits - a.hits);
  
  // Return top resources
  return qualifiedResources.slice(0, limit);
};

/**
 * Reset the access tracker
 */
const resetTracker = () => {
  accessTracker.resources.clear();
  accessTracker.lastWarmed = Date.now();
  logger.info('Cache access tracker reset');
};

module.exports = {
  initWarming,
  trackAccess,
  warmCache,
  getTopResources,
  resetTracker
};
