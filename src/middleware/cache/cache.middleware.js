/**
 * Cache Middleware
 * 
 * Express middleware for caching API responses with monitoring and warming
 */

// Import dependencies
const crypto = require('crypto');
const logger = require('@core/logger');
const { getConfig } = require('@config/cache.config');
const { initMonitoring, recordHit, recordMiss } = require('./cache-monitor');
const { initWarming, trackAccess } = require('./cache-warmer');
const { calculateAdaptiveTTL, trackResourceAccess } = require('./adaptive-ttl');

/**
 * Generate a cache key from request data
 * @param {Object} req - Express request object
 * @param {String} prefix - Optional prefix for the cache key
 * @returns {String} - Cache key
 */
const generateCacheKey = (req, prefix = '') => {
  // Create a string representation of the request
  const requestData = {
    path: req.path,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? req.user._id : 'anonymous'
  };
  
  // Create a hash of the request data
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(requestData))
    .digest('hex');
  
  // Return the cache key with optional prefix
  return `${prefix}:${hash}`;
};

/**
 * Create a caching middleware
 * @param {Object} redisClient - Redis client instance
 * @param {Object} options - Caching options
 * @returns {Function} - Express middleware function
 */
const createCacheMiddleware = (redisClient, options = {}) => {
  // Default options
  const defaultOptions = {
    ttl: 3600, // Cache TTL in seconds (1 hour)
    prefix: 'cache', // Cache key prefix
    enabled: true, // Whether caching is enabled
    logHits: true, // Whether to log cache hits
    bypassHeader: 'X-Bypass-Cache', // Header to bypass cache
    bypassQuery: '_nocache', // Query parameter to bypass cache
    monitoring: true, // Whether to enable monitoring
    warming: true, // Whether to enable cache warming
    adaptiveTTL: true // Whether to enable adaptive TTL
  };
  
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Initialize monitoring and warming if enabled
  const monitor = mergedOptions.monitoring ? initMonitoring() : null;
  const warmer = mergedOptions.warming ? initWarming(redisClient) : null;
  
  // Return middleware function
  return async (req, res, next) => {
    // Skip caching if disabled
    if (!mergedOptions.enabled) {
      return next();
    }
    
    // Skip caching for non-GET requests
    if (req.method !== 'GET' && req.method !== 'POST') {
      return next();
    }
    
    // Check for cache bypass header or query parameter
    if (
      req.headers[mergedOptions.bypassHeader.toLowerCase()] ||
      req.query[mergedOptions.bypassQuery]
    ) {
      logger.debug('Cache bypass requested');
      return next();
    }
    
    try {
      // Generate cache key
      const cacheKey = generateCacheKey(req, mergedOptions.prefix);
      
      // Check if response is in cache
      const cachedResponse = await redisClient.get(cacheKey);
      
      if (cachedResponse) {
        // Cache hit
        if (mergedOptions.logHits) {
          logger.debug(`Cache hit for ${req.path}`);
        }
        
        // Parse cached response
        const parsedResponse = JSON.parse(cachedResponse);
        
        // Record cache hit for monitoring
        if (monitor && mergedOptions.monitoring) {
          const startTime = process.hrtime();
          const result = res.status(parsedResponse.status).json(parsedResponse.body);
          const [seconds, nanoseconds] = process.hrtime(startTime);
          const latency = seconds * 1000 + nanoseconds / 1000000;
          const size = cachedResponse.length;
          
          monitor.recordHit(mergedOptions.prefix, cacheKey, latency, size);
          return result;
        } else {
          // Send cached response without monitoring
          return res.status(parsedResponse.status).json(parsedResponse.body);
        }
      }
      
      // Cache miss, continue to handler
      logger.debug(`Cache miss for ${req.path}`);
      
      // Record cache miss for monitoring
      if (monitor && mergedOptions.monitoring) {
        monitor.recordMiss(mergedOptions.prefix, cacheKey);
      }
      
      // Store original res.json method
      const originalJson = res.json;
      
      // Override res.json method to cache response
      res.json = function(body) {
        // Restore original res.json method
        res.json = originalJson;
        
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Cache response
          const responseToCache = {
            status: res.statusCode,
            body
          };
          
          // Determine resource type from request path
          const resourceType = req.path.split('/').filter(Boolean)[1] || 'default';
          const resourceKey = cacheKey.split(':')[1] || 'default';
          
          // Track resource access for adaptive TTL
          if (mergedOptions.adaptiveTTL) {
            trackResourceAccess(resourceType, resourceKey).catch(err => {
              logger.error(`Error tracking resource access: ${err.message}`);
            });
          }
          
          // Calculate TTL (adaptive or default)
          const getTTL = async () => {
            if (mergedOptions.adaptiveTTL && process.env.ENABLE_ADAPTIVE_TTL === 'true') {
              return await calculateAdaptiveTTL(resourceType, resourceKey);
            }
            return mergedOptions.ttl;
          };
          
          // Store in Redis with calculated TTL
          getTTL().then(ttl => {
            redisClient.setex(
              cacheKey,
              ttl,
              JSON.stringify(responseToCache)
            ).catch(err => {
              logger.error(`Error caching response: ${err.message}`);
            });
            
            if (mergedOptions.adaptiveTTL && ttl !== mergedOptions.ttl) {
              logger.debug(`Using adaptive TTL of ${ttl}s for ${resourceType}:${resourceKey}`);
            }
          }).catch(err => {
            // Fallback to default TTL on error
            logger.error(`Error calculating adaptive TTL: ${err.message}`);
            redisClient.setex(
              cacheKey,
              mergedOptions.ttl,
              JSON.stringify(responseToCache)
            ).catch(err => {
              logger.error(`Error caching response: ${err.message}`);
            });
          });
          
          // Track access for cache warming
          if (warmer && mergedOptions.warming) {
            warmer.trackAccess(req.path, cacheKey);
          }
          
          // Track resource type and key for monitoring
          if (monitor && mergedOptions.monitoring) {
            // Add resource tracking if monitoring supports it
            if (typeof monitor.trackResource === 'function') {
              monitor.trackResource(resourceType, resourceKey);
            }
          }
          
          // Track this resource for potential warming
          if (warmer && mergedOptions.warming) {
            // Create a fetch function for this resource
            const fetchFunction = async () => {
              try {
                return responseToCache;
              } catch (error) {
                logger.error(`Error fetching resource for warming: ${error.message}`);
                return null;
              }
            };
            
            warmer.trackAccess(mergedOptions.prefix, cacheKey, fetchFunction);
          }
        }
        
        // Call original res.json method
        return originalJson.call(this, body);
      };
      
      // Continue to handler
      next();
    } catch (error) {
      logger.error(`Cache middleware error: ${error.message}`);
      next();
    }
  };
};

/**
 * Clear cache for a specific pattern
 * @param {Object} redisClient - Redis client instance
 * @param {String} pattern - Pattern to match cache keys
 * @returns {Promise<Number>} - Number of keys removed
 */
const clearCache = async (redisClient, pattern) => {
  try {
    // Get keys matching pattern
    const keys = await redisClient.keys(pattern);
    
    if (keys.length === 0) {
      logger.debug(`No cache keys found matching pattern: ${pattern}`);
      return 0;
    }
    
    // Delete keys
    const result = await redisClient.del(keys);
    logger.info(`Cleared ${result} cache entries matching pattern: ${pattern}`);
    return result;
  } catch (error) {
    logger.error(`Error clearing cache: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createCacheMiddleware,
  generateCacheKey,
  clearCache
};
