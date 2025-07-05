/**
 * Distributed Cache System
 * 
 * This module provides a distributed caching system that can work across multiple
 * server instances using Redis as the central cache store. It includes features
 * for cache invalidation, pub/sub for cache updates, and fallback mechanisms.
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

// Default serializer/deserializer
const defaultSerializer = {
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data)
};

/**
 * Distributed Cache
 */
class DistributedCache extends EventEmitter {
  /**
   * Create a new distributed cache
   * @param {Object} options - Cache options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      prefix: options.prefix || 'dcache:',
      ttl: options.ttl || 3600, // 1 hour in seconds
      localTTL: options.localTTL || 60, // 1 minute in seconds
      useLocalCache: options.useLocalCache !== false,
      localMaxSize: options.localMaxSize || 1000,
      serializer: options.serializer || defaultSerializer,
      logger: options.logger || console,
      redisClient: options.redisClient,
      pubSubClient: options.pubSubClient,
      pubSubChannel: options.pubSubChannel || 'cache-invalidation',
      enablePubSub: options.enablePubSub !== false,
      clusterMode: options.clusterMode || false,
      ...options
    };
    
    // Local cache
    this.localCache = new Map();
    this.localExpiry = new Map();
    
    // Stats
    this.stats = {
      hits: 0,
      misses: 0,
      localHits: 0,
      redisHits: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    // Initialize
    this._init();
  }
  
  /**
   * Initialize the cache
   * @private
   */
  _init() {
    // Set up pub/sub for invalidation if enabled
    if (this.options.enablePubSub && this.options.pubSubClient) {
      try {
        this.options.pubSubClient.subscribe(this.options.pubSubChannel);
        
        this.options.pubSubClient.on('message', (channel, message) => {
          if (channel === this.options.pubSubChannel) {
            try {
              const invalidation = JSON.parse(message);
              
              if (invalidation.type === 'invalidate' && invalidation.keys) {
                // Invalidate keys
                invalidation.keys.forEach(key => {
                  this._invalidateLocalCache(key);
                });
                
                this.emit('invalidate', invalidation.keys);
              } else if (invalidation.type === 'clear') {
                // Clear all
                this._clearLocalCache();
                this.emit('clear');
              }
            } catch (err) {
              this.options.logger.error('Error processing invalidation message:', err);
              this.stats.errors++;
            }
          }
        });
        
        this.options.logger.info(`Subscribed to cache invalidation channel: ${this.options.pubSubChannel}`);
      } catch (err) {
        this.options.logger.error('Error setting up pub/sub:', err);
        this.stats.errors++;
      }
    }
    
    // Set up periodic cleanup of local cache
    if (this.options.useLocalCache) {
      this._localCacheCleanupInterval = setInterval(() => {
        this._cleanupLocalCache();
      }, 60000); // Clean up every minute
    }
  }
  
  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @param {Function} [fallback] - Fallback function to get value if not in cache
   * @param {Object} [options] - Get options
   * @returns {Promise<*>} Cached value
   */
  async get(key, fallback, options = {}) {
    const cacheKey = this._getCacheKey(key);
    const opts = { ...this.options, ...options };
    
    try {
      // Try local cache first if enabled
      if (opts.useLocalCache) {
        const localValue = this._getFromLocalCache(cacheKey);
        
        if (localValue !== undefined) {
          this.stats.hits++;
          this.stats.localHits++;
          this.emit('hit', { key, source: 'local' });
          return localValue;
        }
      }
      
      // Try Redis cache
      if (opts.redisClient) {
        const redisValue = await opts.redisClient.get(cacheKey);
        
        if (redisValue) {
          const value = opts.serializer.deserialize(redisValue);
          
          // Store in local cache if enabled
          if (opts.useLocalCache) {
            this._setInLocalCache(cacheKey, value, opts.localTTL);
          }
          
          this.stats.hits++;
          this.stats.redisHits++;
          this.emit('hit', { key, source: 'redis' });
          return value;
        }
      }
      
      // Cache miss, use fallback if provided
      this.stats.misses++;
      this.emit('miss', { key });
      
      if (typeof fallback === 'function') {
        const value = await fallback();
        
        // Cache the fallback value
        if (value !== undefined && value !== null) {
          await this.set(key, value, options);
        }
        
        return value;
      }
      
      return null;
    } catch (err) {
      this.options.logger.error(`Error getting from cache: ${key}`, err);
      this.stats.errors++;
      this.emit('error', { key, operation: 'get', error: err });
      
      // Use fallback on error if provided
      if (typeof fallback === 'function') {
        try {
          return await fallback();
        } catch (fallbackErr) {
          this.options.logger.error(`Fallback error for key: ${key}`, fallbackErr);
          throw fallbackErr;
        }
      }
      
      throw err;
    }
  }
  
  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {Object} [options] - Set options
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, options = {}) {
    const cacheKey = this._getCacheKey(key);
    const opts = { ...this.options, ...options };
    
    try {
      // Skip if value is undefined or null
      if (value === undefined || value === null) {
        return false;
      }
      
      // Set in Redis if available
      if (opts.redisClient) {
        const serialized = opts.serializer.serialize(value);
        
        if (opts.ttl > 0) {
          await opts.redisClient.setex(cacheKey, opts.ttl, serialized);
        } else {
          await opts.redisClient.set(cacheKey, serialized);
        }
      }
      
      // Set in local cache if enabled
      if (opts.useLocalCache) {
        this._setInLocalCache(cacheKey, value, opts.localTTL);
      }
      
      this.stats.sets++;
      this.emit('set', { key, ttl: opts.ttl });
      return true;
    } catch (err) {
      this.options.logger.error(`Error setting in cache: ${key}`, err);
      this.stats.errors++;
      this.emit('error', { key, operation: 'set', error: err });
      return false;
    }
  }
  
  /**
   * Delete a value from the cache
   * @param {string|Array<string>} keys - Cache key(s)
   * @param {Object} [options] - Delete options
   * @returns {Promise<boolean>} Success status
   */
  async delete(keys, options = {}) {
    const opts = { ...this.options, ...options };
    const keyArray = Array.isArray(keys) ? keys : [keys];
    const cacheKeys = keyArray.map(key => this._getCacheKey(key));
    
    try {
      // Delete from Redis if available
      if (opts.redisClient && cacheKeys.length > 0) {
        if (opts.clusterMode) {
          // In cluster mode, delete keys one by one
          await Promise.all(cacheKeys.map(key => opts.redisClient.del(key)));
        } else {
          await opts.redisClient.del(...cacheKeys);
        }
      }
      
      // Delete from local cache if enabled
      if (opts.useLocalCache) {
        cacheKeys.forEach(key => this._invalidateLocalCache(key));
      }
      
      // Publish invalidation if enabled
      if (opts.enablePubSub && opts.pubSubClient && keyArray.length > 0) {
        await this._publishInvalidation(keyArray);
      }
      
      this.stats.deletes++;
      this.emit('delete', { keys: keyArray });
      return true;
    } catch (err) {
      this.options.logger.error(`Error deleting from cache: ${keyArray.join(', ')}`, err);
      this.stats.errors++;
      this.emit('error', { keys: keyArray, operation: 'delete', error: err });
      return false;
    }
  }
  
  /**
   * Clear the entire cache
   * @param {Object} [options] - Clear options
   * @returns {Promise<boolean>} Success status
   */
  async clear(options = {}) {
    const opts = { ...this.options, ...options };
    
    try {
      // Clear Redis if available
      if (opts.redisClient) {
        if (opts.clusterMode) {
          // In cluster mode, use scan to delete keys with prefix
          let cursor = '0';
          do {
            const reply = await opts.redisClient.scan(
              cursor,
              'MATCH',
              `${opts.prefix}*`,
              'COUNT',
              1000
            );
            
            cursor = reply[0];
            const keys = reply[1];
            
            if (keys.length > 0) {
              await opts.redisClient.del(...keys);
            }
          } while (cursor !== '0');
        } else {
          // Get all keys with prefix
          const keys = await opts.redisClient.keys(`${opts.prefix}*`);
          
          if (keys.length > 0) {
            await opts.redisClient.del(...keys);
          }
        }
      }
      
      // Clear local cache if enabled
      if (opts.useLocalCache) {
        this._clearLocalCache();
      }
      
      // Publish clear if enabled
      if (opts.enablePubSub && opts.pubSubClient) {
        await this._publishClear();
      }
      
      this.emit('clear');
      return true;
    } catch (err) {
      this.options.logger.error('Error clearing cache:', err);
      this.stats.errors++;
      this.emit('error', { operation: 'clear', error: err });
      return false;
    }
  }
  
  /**
   * Get multiple values from the cache
   * @param {Array<string>} keys - Cache keys
   * @param {Object} [options] - Get options
   * @returns {Promise<Object>} Object with key-value pairs
   */
  async getMany(keys, options = {}) {
    const opts = { ...this.options, ...options };
    const result = {};
    const missingKeys = [];
    const cacheKeys = keys.map(key => this._getCacheKey(key));
    
    try {
      // Try local cache first if enabled
      if (opts.useLocalCache) {
        keys.forEach((key, index) => {
          const cacheKey = cacheKeys[index];
          const localValue = this._getFromLocalCache(cacheKey);
          
          if (localValue !== undefined) {
            result[key] = localValue;
            this.stats.localHits++;
          } else {
            missingKeys.push({ key, index });
          }
        });
      } else {
        // All keys are missing if local cache is disabled
        keys.forEach((key, index) => {
          missingKeys.push({ key, index });
        });
      }
      
      // Try Redis for missing keys
      if (opts.redisClient && missingKeys.length > 0) {
        const missingCacheKeys = missingKeys.map(item => cacheKeys[item.index]);
        
        let redisValues;
        if (opts.clusterMode) {
          // In cluster mode, get keys one by one
          redisValues = await Promise.all(
            missingCacheKeys.map(key => opts.redisClient.get(key))
          );
        } else {
          redisValues = await opts.redisClient.mget(...missingCacheKeys);
        }
        
        // Process Redis values
        redisValues.forEach((value, index) => {
          if (value) {
            const key = missingKeys[index].key;
            const deserializedValue = opts.serializer.deserialize(value);
            
            result[key] = deserializedValue;
            this.stats.redisHits++;
            
            // Store in local cache if enabled
            if (opts.useLocalCache) {
              this._setInLocalCache(
                cacheKeys[missingKeys[index].index],
                deserializedValue,
                opts.localTTL
              );
            }
          }
        });
      }
      
      // Update stats
      const hitCount = Object.keys(result).length;
      this.stats.hits += hitCount;
      this.stats.misses += keys.length - hitCount;
      
      return result;
    } catch (err) {
      this.options.logger.error(`Error getting multiple keys from cache: ${keys.join(', ')}`, err);
      this.stats.errors++;
      this.emit('error', { keys, operation: 'getMany', error: err });
      throw err;
    }
  }
  
  /**
   * Set multiple values in the cache
   * @param {Object} keyValues - Object with key-value pairs
   * @param {Object} [options] - Set options
   * @returns {Promise<boolean>} Success status
   */
  async setMany(keyValues, options = {}) {
    const opts = { ...this.options, ...options };
    
    try {
      // Skip if no key-values
      if (!keyValues || Object.keys(keyValues).length === 0) {
        return false;
      }
      
      // Set in Redis if available
      if (opts.redisClient) {
        if (opts.clusterMode || opts.ttl > 0) {
          // In cluster mode or with TTL, set keys one by one
          await Promise.all(
            Object.entries(keyValues).map(([key, value]) => {
              const cacheKey = this._getCacheKey(key);
              const serialized = opts.serializer.serialize(value);
              
              if (opts.ttl > 0) {
                return opts.redisClient.setex(cacheKey, opts.ttl, serialized);
              } else {
                return opts.redisClient.set(cacheKey, serialized);
              }
            })
          );
        } else {
          // Use mset for better performance
          const redisKeyValues = {};
          
          Object.entries(keyValues).forEach(([key, value]) => {
            const cacheKey = this._getCacheKey(key);
            redisKeyValues[cacheKey] = opts.serializer.serialize(value);
          });
          
          await opts.redisClient.mset(redisKeyValues);
        }
      }
      
      // Set in local cache if enabled
      if (opts.useLocalCache) {
        Object.entries(keyValues).forEach(([key, value]) => {
          const cacheKey = this._getCacheKey(key);
          this._setInLocalCache(cacheKey, value, opts.localTTL);
        });
      }
      
      this.stats.sets += Object.keys(keyValues).length;
      this.emit('setMany', { keys: Object.keys(keyValues), ttl: opts.ttl });
      return true;
    } catch (err) {
      this.options.logger.error(`Error setting multiple keys in cache: ${Object.keys(keyValues).join(', ')}`, err);
      this.stats.errors++;
      this.emit('error', { keys: Object.keys(keyValues), operation: 'setMany', error: err });
      return false;
    }
  }
  
  /**
   * Check if a key exists in the cache
   * @param {string} key - Cache key
   * @param {Object} [options] - Options
   * @returns {Promise<boolean>} Whether key exists
   */
  async exists(key, options = {}) {
    const cacheKey = this._getCacheKey(key);
    const opts = { ...this.options, ...options };
    
    try {
      // Check local cache first if enabled
      if (opts.useLocalCache) {
        if (this.localCache.has(cacheKey) && !this._isLocalExpired(cacheKey)) {
          return true;
        }
      }
      
      // Check Redis if available
      if (opts.redisClient) {
        const exists = await opts.redisClient.exists(cacheKey);
        return exists === 1;
      }
      
      return false;
    } catch (err) {
      this.options.logger.error(`Error checking if key exists: ${key}`, err);
      this.stats.errors++;
      this.emit('error', { key, operation: 'exists', error: err });
      return false;
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    const localCacheSize = this.localCache.size;
    
    return {
      ...this.stats,
      hitRate,
      localCacheSize
    };
  }
  
  /**
   * Get a value from the local cache
   * @private
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  _getFromLocalCache(key) {
    // Check if key exists and not expired
    if (this.localCache.has(key) && !this._isLocalExpired(key)) {
      return this.localCache.get(key);
    }
    
    // Remove expired key
    if (this.localCache.has(key)) {
      this.localCache.delete(key);
      this.localExpiry.delete(key);
    }
    
    return undefined;
  }
  
  /**
   * Set a value in the local cache
   * @private
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  _setInLocalCache(key, value, ttl) {
    // Check if cache is full
    if (this.localCache.size >= this.options.localMaxSize) {
      // Remove oldest entry
      const oldestKey = this.localCache.keys().next().value;
      this.localCache.delete(oldestKey);
      this.localExpiry.delete(oldestKey);
    }
    
    // Set value and expiry
    this.localCache.set(key, value);
    this.localExpiry.set(key, Date.now() + (ttl * 1000));
  }
  
  /**
   * Check if a local cache key is expired
   * @private
   * @param {string} key - Cache key
   * @returns {boolean} Whether key is expired
   */
  _isLocalExpired(key) {
    const expiry = this.localExpiry.get(key);
    return expiry !== undefined && expiry < Date.now();
  }
  
  /**
   * Invalidate a key in the local cache
   * @private
   * @param {string} key - Cache key
   */
  _invalidateLocalCache(key) {
    this.localCache.delete(key);
    this.localExpiry.delete(key);
  }
  
  /**
   * Clear the local cache
   * @private
   */
  _clearLocalCache() {
    this.localCache.clear();
    this.localExpiry.clear();
  }
  
  /**
   * Clean up expired items in the local cache
   * @private
   */
  _cleanupLocalCache() {
    const now = Date.now();
    
    for (const [key, expiry] of this.localExpiry.entries()) {
      if (expiry < now) {
        this.localCache.delete(key);
        this.localExpiry.delete(key);
      }
    }
  }
  
  /**
   * Publish an invalidation message
   * @private
   * @param {Array<string>} keys - Keys to invalidate
   * @returns {Promise<void>}
   */
  async _publishInvalidation(keys) {
    if (!this.options.pubSubClient) {
      return;
    }
    
    try {
      const message = JSON.stringify({
        type: 'invalidate',
        keys,
        timestamp: Date.now()
      });
      
      await this.options.pubSubClient.publish(this.options.pubSubChannel, message);
    } catch (err) {
      this.options.logger.error('Error publishing invalidation:', err);
      this.stats.errors++;
    }
  }
  
  /**
   * Publish a clear message
   * @private
   * @returns {Promise<void>}
   */
  async _publishClear() {
    if (!this.options.pubSubClient) {
      return;
    }
    
    try {
      const message = JSON.stringify({
        type: 'clear',
        timestamp: Date.now()
      });
      
      await this.options.pubSubClient.publish(this.options.pubSubChannel, message);
    } catch (err) {
      this.options.logger.error('Error publishing clear:', err);
      this.stats.errors++;
    }
  }
  
  /**
   * Get a cache key with prefix
   * @private
   * @param {string} key - Original key
   * @returns {string} Cache key
   */
  _getCacheKey(key) {
    return `${this.options.prefix}${key}`;
  }
  
  /**
   * Dispose the cache
   */
  dispose() {
    // Clear cleanup interval
    if (this._localCacheCleanupInterval) {
      clearInterval(this._localCacheCleanupInterval);
    }
    
    // Unsubscribe from pub/sub
    if (this.options.enablePubSub && this.options.pubSubClient) {
      try {
        this.options.pubSubClient.unsubscribe(this.options.pubSubChannel);
      } catch (err) {
        this.options.logger.error('Error unsubscribing from pub/sub:', err);
      }
    }
    
    // Clear local cache
    this._clearLocalCache();
    
    // Remove all listeners
    this.removeAllListeners();
  }
}

/**
 * Create a distributed cache
 * @param {Object} options - Cache options
 * @returns {DistributedCache} Distributed cache instance
 */
function createDistributedCache(options = {}) {
  return new DistributedCache(options);
}

/**
 * Express middleware for distributed cache
 * @param {DistributedCache} cache - Distributed cache instance
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function distributedCacheMiddleware(cache, options = {}) {
  const opts = {
    ttl: options.ttl || 60, // 1 minute
    methods: options.methods || ['GET'],
    statusCodes: options.statusCodes || [200],
    keyGenerator: options.keyGenerator || defaultKeyGenerator,
    shouldCache: options.shouldCache || defaultShouldCache,
    getCacheKey: options.getCacheKey,
    logger: options.logger || console,
    ...options
  };
  
  // Default key generator
  function defaultKeyGenerator(req) {
    const key = `${req.method}:${req.originalUrl || req.url}`;
    return crypto.createHash('md5').update(key).digest('hex');
  }
  
  // Default cache condition
  function defaultShouldCache(req, res) {
    return opts.methods.includes(req.method) && !req.headers['cache-control']?.includes('no-cache');
  }
  
  return async function(req, res, next) {
    // Skip if shouldn't cache
    if (!opts.shouldCache(req, res)) {
      return next();
    }
    
    // Generate cache key
    const cacheKey = opts.getCacheKey ? opts.getCacheKey(req) : opts.keyGenerator(req);
    
    try {
      // Try to get from cache
      const cachedResponse = await cache.get(cacheKey);
      
      if (cachedResponse) {
        // Set headers from cached response
        if (cachedResponse.headers) {
          Object.entries(cachedResponse.headers).forEach(([key, value]) => {
            res.set(key, value);
          });
        }
        
        // Send cached response
        return res.status(cachedResponse.status || 200).send(cachedResponse.body);
      }
    } catch (err) {
      opts.logger.error(`Cache middleware error for ${req.url}:`, err);
    }
    
    // Store original methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalEnd = res.end;
    
    // Capture response
    const chunks = [];
    let body;
    
    // Override send method
    res.send = function(chunk) {
      body = chunk;
      return originalSend.apply(res, arguments);
    };
    
    // Override json method
    res.json = function(data) {
      body = JSON.stringify(data);
      return originalJson.apply(res, arguments);
    };
    
    // Override end method
    res.end = function(chunk, encoding) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }
      
      // Only cache successful responses
      if (opts.statusCodes.includes(res.statusCode)) {
        const responseBody = body || Buffer.concat(chunks).toString();
        
        // Cache response
        cache.set(cacheKey, {
          body: responseBody,
          status: res.statusCode,
          headers: {
            'Content-Type': res.get('Content-Type'),
            'Cache-Control': res.get('Cache-Control') || `max-age=${opts.ttl}`
          }
        }, { ttl: opts.ttl }).catch(err => {
          opts.logger.error(`Error caching response for ${req.url}:`, err);
        });
      }
      
      return originalEnd.apply(res, arguments);
    };
    
    next();
  };
}

module.exports = {
  DistributedCache,
  createDistributedCache,
  distributedCacheMiddleware
};
