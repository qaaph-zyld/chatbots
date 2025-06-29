/**
 * Performance Optimization Module
 * 
 * Provides utilities and middleware for optimizing application performance,
 * including caching, compression, and resource optimization.
 */

const compression = require('compression');
const { createClient } = require('redis');
const NodeCache = require('node-cache');
const { logger } = require('../logger');

// Default configuration
const DEFAULT_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_CACHE_DB || '0'),
  },
  nodeCache: {
    stdTTL: 600, // 10 minutes
    checkperiod: 120, // 2 minutes
    maxKeys: 1000,
  },
  compression: {
    level: 6,
    threshold: 1024, // 1KB
  },
};

// Cache clients
let redisClient = null;
let localCache = null;

/**
 * Initialize the performance module
 * 
 * @param {Object} config - Configuration options
 * @returns {Promise<Object>} - Initialized performance utilities
 */
const initialize = async (config = {}) => {
  const options = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  try {
    // Initialize Redis client if enabled
    if (options.useRedis !== false) {
      redisClient = createClient(options.redis);
      
      redisClient.on('error', (err) => {
        logger.error(`Performance: Redis error: ${err.message}`);
      });
      
      redisClient.on('connect', () => {
        logger.info('Performance: Connected to Redis cache');
      });
      
      await redisClient.connect();
    }
    
    // Initialize local cache
    localCache = new NodeCache(options.nodeCache);
    
    logger.info('Performance: Initialized performance module');
    
    return {
      redisClient,
      localCache,
    };
  } catch (err) {
    logger.error(`Performance: Initialization failed: ${err.message}`);
    throw err;
  }
};

/**
 * Create middleware for HTTP compression
 * 
 * @param {Object} options - Compression options
 * @returns {Function} - Compression middleware
 */
const compressionMiddleware = (options = {}) => {
  const compressionOptions = {
    ...DEFAULT_CONFIG.compression,
    ...options,
  };
  
  return compression(compressionOptions);
};

/**
 * Create middleware for response caching
 * 
 * @param {Object} options - Cache options
 * @returns {Function} - Cache middleware
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 60, // 1 minute default
    methods = ['GET'],
    keyGenerator = (req) => `${req.originalUrl || req.url}`,
    condition = () => true,
  } = options;
  
  return async (req, res, next) => {
    // Skip cache if method is not cacheable
    if (!methods.includes(req.method)) {
      return next();
    }
    
    // Skip cache based on custom condition
    if (!condition(req)) {
      return next();
    }
    
    const cacheKey = `http-cache:${keyGenerator(req)}`;
    
    try {
      // Try to get from cache
      let cachedResponse;
      
      if (redisClient && redisClient.isReady) {
        cachedResponse = await redisClient.get(cacheKey);
        if (cachedResponse) {
          cachedResponse = JSON.parse(cachedResponse);
        }
      } else if (localCache) {
        cachedResponse = localCache.get(cacheKey);
      }
      
      if (cachedResponse) {
        // Return cached response
        res.status(cachedResponse.status);
        
        // Set headers
        for (const [key, value] of Object.entries(cachedResponse.headers)) {
          res.setHeader(key, value);
        }
        
        res.setHeader('X-Cache', 'HIT');
        return res.send(cachedResponse.body);
      }
      
      // Store original methods
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;
      
      // Capture response
      res.send = function (body) {
        // Store in cache
        const responseToCache = {
          status: res.statusCode,
          headers: res._headers || {},
          body: body,
        };
        
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (redisClient && redisClient.isReady) {
            redisClient.set(cacheKey, JSON.stringify(responseToCache), { EX: ttl })
              .catch(err => logger.error(`Performance: Redis cache error: ${err.message}`));
          } else if (localCache) {
            localCache.set(cacheKey, responseToCache, ttl);
          }
        }
        
        res.setHeader('X-Cache', 'MISS');
        return originalSend.call(this, body);
      };
      
      res.json = function (body) {
        return res.send(JSON.stringify(body));
      };
      
      res.end = function (body) {
        if (body) {
          return res.send(body);
        }
        return originalEnd.call(this);
      };
      
      next();
    } catch (err) {
      logger.error(`Performance: Cache middleware error: ${err.message}`);
      next();
    }
  };
};

/**
 * Create middleware for ETags and conditional requests
 * 
 * @returns {Function} - ETag middleware
 */
const etagMiddleware = () => {
  const etag = require('etag');
  
  return (req, res, next) => {
    // Store original methods
    const originalSend = res.send;
    
    res.send = function (body) {
      // Skip for streaming responses
      if (res.headersSent) {
        return originalSend.call(this, body);
      }
      
      // Generate ETag
      const etagValue = etag(body);
      res.setHeader('ETag', etagValue);
      
      // Check for If-None-Match header
      const ifNoneMatch = req.headers['if-none-match'];
      
      if (ifNoneMatch === etagValue) {
        // Return 304 Not Modified
        res.status(304).end();
        return;
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};

/**
 * Database query optimization utilities
 */
const dbOptimization = {
  /**
   * Create a cached repository wrapper
   * 
   * @param {Object} repository - Repository to wrap
   * @param {Object} options - Cache options
   * @returns {Object} - Cached repository
   */
  createCachedRepository: (repository, options = {}) => {
    const {
      ttl = 300, // 5 minutes default
      methods = ['findById', 'findOne', 'find'],
      keyPrefix = 'db-cache:',
    } = options;
    
    const cachedRepository = {};
    
    // Wrap each method
    for (const method of Object.keys(repository)) {
      if (typeof repository[method] === 'function') {
        if (methods.includes(method)) {
          // Cache this method
          cachedRepository[method] = async (...args) => {
            const cacheKey = `${keyPrefix}${method}:${JSON.stringify(args)}`;
            
            try {
              // Try to get from cache
              let cachedResult;
              
              if (redisClient && redisClient.isReady) {
                cachedResult = await redisClient.get(cacheKey);
                if (cachedResult) {
                  cachedResult = JSON.parse(cachedResult);
                }
              } else if (localCache) {
                cachedResult = localCache.get(cacheKey);
              }
              
              if (cachedResult) {
                return cachedResult;
              }
              
              // Get from repository
              const result = await repository[method](...args);
              
              // Store in cache
              if (redisClient && redisClient.isReady) {
                await redisClient.set(cacheKey, JSON.stringify(result), { EX: ttl });
              } else if (localCache) {
                localCache.set(cacheKey, result, ttl);
              }
              
              return result;
            } catch (err) {
              logger.error(`Performance: DB cache error: ${err.message}`);
              // Fall back to original method
              return repository[method](...args);
            }
          };
        } else {
          // Pass through without caching
          cachedRepository[method] = (...args) => repository[method](...args);
        }
      } else {
        // Copy non-function properties
        cachedRepository[method] = repository[method];
      }
    }
    
    return cachedRepository;
  },
  
  /**
   * Invalidate cache for a repository
   * 
   * @param {string} prefix - Cache key prefix
   * @returns {Promise<void>}
   */
  invalidateCache: async (prefix) => {
    try {
      if (redisClient && redisClient.isReady) {
        const keys = await redisClient.keys(`db-cache:${prefix}*`);
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } else if (localCache) {
        const keys = localCache.keys();
        for (const key of keys) {
          if (key.startsWith(`db-cache:${prefix}`)) {
            localCache.del(key);
          }
        }
      }
    } catch (err) {
      logger.error(`Performance: Cache invalidation error: ${err.message}`);
    }
  }
};

/**
 * Resource optimization utilities
 */
const resourceOptimization = {
  /**
   * Create a connection pool
   * 
   * @param {Function} createConnection - Function to create a connection
   * @param {Object} options - Pool options
   * @returns {Object} - Connection pool
   */
  createConnectionPool: (createConnection, options = {}) => {
    const {
      min = 2,
      max = 10,
      idleTimeoutMillis = 30000,
    } = options;
    
    const genericPool = require('generic-pool');
    
    const factory = {
      create: async () => {
        return createConnection();
      },
      destroy: async (connection) => {
        if (connection.close) {
          await connection.close();
        } else if (connection.end) {
          await connection.end();
        } else if (connection.disconnect) {
          await connection.disconnect();
        }
      }
    };
    
    const pool = genericPool.createPool(factory, {
      min,
      max,
      idleTimeoutMillis,
    });
    
    return {
      acquire: () => pool.acquire(),
      release: (connection) => pool.release(connection),
      drain: () => pool.drain().then(() => pool.clear()),
      stats: () => ({
        size: pool.size,
        available: pool.available,
        borrowed: pool.borrowed,
        pending: pool.pending,
        max: pool.max,
        min: pool.min,
      }),
    };
  },
  
  /**
   * Create a rate limiter for resource usage
   * 
   * @param {Object} options - Rate limiter options
   * @returns {Function} - Rate limiter function
   */
  createRateLimiter: (options = {}) => {
    const {
      tokensPerInterval = 10,
      interval = 1000, // 1 second
      maxBurst = 5,
    } = options;
    
    const { RateLimiterMemory } = require('rate-limiter-flexible');
    
    const limiter = new RateLimiterMemory({
      points: tokensPerInterval,
      duration: interval / 1000, // Convert to seconds
    });
    
    return async (key, cost = 1) => {
      try {
        await limiter.consume(key, cost);
        return true;
      } catch (err) {
        return false;
      }
    };
  }
};

/**
 * Memory optimization utilities
 */
const memoryOptimization = {
  /**
   * Monitor memory usage
   * 
   * @param {Object} options - Monitor options
   * @returns {Function} - Stop monitoring function
   */
  monitorMemoryUsage: (options = {}) => {
    const {
      interval = 60000, // 1 minute
      threshold = 0.8, // 80% of max heap
      onThresholdExceeded = null,
    } = options;
    
    const intervalId = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const heapUsed = memoryUsage.heapUsed / 1024 / 1024; // MB
      const heapTotal = memoryUsage.heapTotal / 1024 / 1024; // MB
      const external = memoryUsage.external / 1024 / 1024; // MB
      const rss = memoryUsage.rss / 1024 / 1024; // MB
      
      logger.debug(`Performance: Memory usage - Heap: ${heapUsed.toFixed(2)}MB/${heapTotal.toFixed(2)}MB, External: ${external.toFixed(2)}MB, RSS: ${rss.toFixed(2)}MB`);
      
      // Check threshold
      const heapUsageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;
      
      if (heapUsageRatio > threshold) {
        logger.warn(`Performance: Memory usage threshold exceeded: ${(heapUsageRatio * 100).toFixed(2)}%`);
        
        if (onThresholdExceeded && typeof onThresholdExceeded === 'function') {
          onThresholdExceeded({
            heapUsed,
            heapTotal,
            external,
            rss,
            heapUsageRatio,
          });
        }
        
        // Force garbage collection if available
        if (global.gc) {
          logger.info('Performance: Forcing garbage collection');
          global.gc();
        }
      }
    }, interval);
    
    return () => clearInterval(intervalId);
  },
  
  /**
   * Create a memory-efficient object stream
   * 
   * @param {Object} options - Stream options
   * @returns {Object} - Transform stream
   */
  createObjectStream: (options = {}) => {
    const { Transform } = require('stream');
    const {
      highWaterMark = 16,
      objectMode = true,
      transform = (chunk, encoding, callback) => callback(null, chunk),
    } = options;
    
    return new Transform({
      highWaterMark,
      objectMode,
      transform,
    });
  }
};

/**
 * Apply all performance middleware to an Express app
 * 
 * @param {Object} app - Express app
 * @param {Object} options - Configuration options
 */
const applyPerformanceMiddleware = (app, options = {}) => {
  if (!app || typeof app.use !== 'function') {
    throw new Error('Invalid Express app');
  }
  
  // Apply compression
  app.use(compressionMiddleware(options.compression));
  
  // Apply ETag middleware
  app.use(etagMiddleware());
  
  logger.info('Performance: Applied performance middleware');
};

module.exports = {
  initialize,
  compressionMiddleware,
  cacheMiddleware,
  etagMiddleware,
  dbOptimization,
  resourceOptimization,
  memoryOptimization,
  applyPerformanceMiddleware,
};
