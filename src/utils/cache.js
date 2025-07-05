/**
 * Cache Utility
 * 
 * A simple in-memory caching mechanism with TTL support
 * Used for improving performance of frequently accessed data
 */

const logger = require('./logger');

// In-memory cache store
const cacheStore = new Map();

/**
 * Cache entry structure
 * @typedef {Object} CacheEntry
 * @property {*} value - The cached value
 * @property {number} expiry - Timestamp when this entry expires
 */

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @returns {*|null} Cached value or null if not found or expired
 */
function get(key) {
  if (!key) {
    logger.warn('Cache get: No key provided');
    return null;
  }

  const entry = cacheStore.get(key);
  
  // Return null if entry doesn't exist
  if (!entry) {
    return null;
  }
  
  // Check if entry has expired
  if (entry.expiry && entry.expiry < Date.now()) {
    // Remove expired entry
    cacheStore.delete(key);
    return null;
  }
  
  return entry.value;
}

/**
 * Set a value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {boolean} Success status
 */
function set(key, value, ttlSeconds = 300) {
  if (!key) {
    logger.warn('Cache set: No key provided');
    return false;
  }
  
  try {
    const expiry = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null;
    
    cacheStore.set(key, {
      value,
      expiry
    });
    
    return true;
  } catch (error) {
    logger.error('Cache set error', { error: error.message, key });
    return false;
  }
}

/**
 * Delete a value from cache
 * @param {string} key - Cache key
 * @returns {boolean} Success status
 */
function del(key) {
  if (!key) {
    return false;
  }
  
  return cacheStore.delete(key);
}

/**
 * Clear all entries from cache
 * @returns {boolean} Success status
 */
function clear() {
  try {
    cacheStore.clear();
    return true;
  } catch (error) {
    logger.error('Cache clear error', { error: error.message });
    return false;
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function stats() {
  const now = Date.now();
  let activeEntries = 0;
  let expiredEntries = 0;
  
  cacheStore.forEach(entry => {
    if (!entry.expiry || entry.expiry > now) {
      activeEntries++;
    } else {
      expiredEntries++;
    }
  });
  
  return {
    size: cacheStore.size,
    activeEntries,
    expiredEntries
  };
}

/**
 * Wrap a function call with cache
 * If the value exists in cache, returns it
 * Otherwise calls the function, caches the result, and returns it
 * 
 * @param {string} key - Cache key
 * @param {Function} fn - Function to call if cache miss
 * @param {number} ttlSeconds - Time to live in seconds
 * @returns {Promise<*>} Function result
 */
async function wrap(key, fn, ttlSeconds = 300) {
  // Try to get from cache first
  const cachedValue = get(key);
  
  if (cachedValue !== null) {
    return cachedValue;
  }
  
  try {
    // Cache miss, call the function
    const result = await fn();
    
    // Cache the result
    set(key, result, ttlSeconds);
    
    return result;
  } catch (error) {
    logger.error('Cache wrap error', { error: error.message, key });
    throw error;
  }
}

/**
 * Cleanup expired entries
 * This should be called periodically to prevent memory leaks
 * 
 * @returns {number} Number of entries removed
 */
function cleanup() {
  const now = Date.now();
  let removed = 0;
  
  cacheStore.forEach((entry, key) => {
    if (entry.expiry && entry.expiry < now) {
      cacheStore.delete(key);
      removed++;
    }
  });
  
  return removed;
}

// Export the cache API
module.exports = {
  get,
  set,
  del,
  clear,
  stats,
  wrap,
  cleanup
};
