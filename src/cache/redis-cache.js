/**
 * Redis Cache Implementation
 * 
 * This module provides a Redis-based caching layer for the application
 * to improve performance by reducing database load for frequently accessed data.
 */

const Redis = require('ioredis');
const { promisify } = require('util');
const config = require('../config');

class RedisCache {
  constructor() {
    this.client = null;
    this.connected = false;
    this.defaultTTL = 3600; // 1 hour default TTL
  }

  /**
   * Initialize the Redis connection
   */
  async connect() {
    try {
      this.client = new Redis(config.redis.uri, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        connectTimeout: 10000,
        keyPrefix: config.redis.keyPrefix || 'chatbot:',
      });

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis cache');
        this.connected = true;
      });

      this.client.on('reconnecting', () => {
        console.log('Reconnecting to Redis cache');
      });

      // Wait for connection
      await new Promise((resolve) => {
        if (this.client.status === 'ready') {
          this.connected = true;
          resolve();
        } else {
          this.client.once('ready', () => {
            this.connected = true;
            resolve();
          });
        }
      });

      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Fallback to no caching but don't crash the application
      this.connected = false;
      return null;
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached value or null if not found
   */
  async get(key) {
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      
      return JSON.parse(value);
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} [ttl=defaultTTL] - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.set(key, serialized, 'EX', ttl);
      return true;
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async del(key) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear cache by pattern
   * @param {string} pattern - Key pattern to clear
   * @returns {Promise<boolean>} - Success status
   */
  async clearPattern(pattern) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Error clearing cache pattern ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if key exists
   */
  async exists(key) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set multiple values in cache
   * @param {Object} keyValueMap - Map of key-value pairs to cache
   * @param {number} [ttl=defaultTTL] - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async mset(keyValueMap, ttl = this.defaultTTL) {
    if (!this.connected || !this.client) {
      return false;
    }

    try {
      const pipeline = this.client.pipeline();
      
      Object.entries(keyValueMap).forEach(([key, value]) => {
        const serialized = JSON.stringify(value);
        pipeline.set(key, serialized, 'EX', ttl);
      });
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Error setting multiple cache keys:', error);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   * @param {Array<string>} keys - Cache keys
   * @returns {Promise<Object>} - Map of key-value pairs found in cache
   */
  async mget(keys) {
    if (!this.connected || !this.client) {
      return {};
    }

    try {
      const values = await this.client.mget(keys);
      const result = {};
      
      keys.forEach((key, index) => {
        if (values[index]) {
          result[key] = JSON.parse(values[index]);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error getting multiple cache keys:', error);
      return {};
    }
  }

  /**
   * Increment a counter in cache
   * @param {string} key - Cache key
   * @param {number} [increment=1] - Increment value
   * @param {number} [ttl=defaultTTL] - Time to live in seconds
   * @returns {Promise<number|null>} - New value or null on error
   */
  async increment(key, increment = 1, ttl = this.defaultTTL) {
    if (!this.connected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.incrby(key, increment);
      await this.client.expire(key, ttl);
      return value;
    } catch (error) {
      console.error(`Error incrementing cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Close the Redis connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.connected = false;
      console.log('Redis connection closed');
    }
  }
}

// Export singleton instance
const redisCache = new RedisCache();
module.exports = redisCache;
