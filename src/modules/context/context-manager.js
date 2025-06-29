/**
 * Conversation Context Management System
 * 
 * Provides session-based context storage in Redis with expiration policies,
 * context sharing between chatbot instances, and analytics capabilities.
 */

const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../utils/logger');

// Default configuration values
const DEFAULT_CONFIG = {
  host: 'localhost',
  port: 6379,
  keyPrefix: 'chatbot:context:',
  defaultTTL: 3600, // 1 hour in seconds
  maxContextSize: 100 * 1024, // 100KB max context size
};

let redisClient = null;

/**
 * Initialize the context manager with Redis connection
 * 
 * @param {Object} config - Redis connection configuration
 * @returns {Promise<void>}
 */
const initialize = async (config = {}) => {
  const options = { ...DEFAULT_CONFIG, ...config };
  
  try {
    redisClient = new Redis({
      host: options.host,
      port: options.port,
      keyPrefix: options.keyPrefix,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis Context Manager: Connection error: ${err.message}`);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Context Manager: Connected successfully');
    });

    // Test connection
    await redisClient.ping();
    logger.info('Redis Context Manager: Initialized successfully');
  } catch (err) {
    logger.error(`Redis Context Manager: Initialization failed: ${err.message}`);
    throw err;
  }
};

/**
 * Create a new conversation context
 * 
 * @param {Object} initialData - Initial context data
 * @param {Object} options - Context options
 * @param {number} options.ttl - Time to live in seconds
 * @returns {Promise<string>} - The context ID
 */
const createContext = async (initialData = {}, options = {}) => {
  if (!redisClient) {
    throw new Error('Redis Context Manager: Not initialized');
  }

  const contextId = uuidv4();
  const ttl = options.ttl || DEFAULT_CONFIG.defaultTTL;
  
  const contextData = {
    ...initialData,
    _metadata: {
      created: Date.now(),
      lastUpdated: Date.now(),
      expiresAt: Date.now() + (ttl * 1000),
    }
  };
  
  try {
    await redisClient.set(
      contextId,
      JSON.stringify(contextData),
      'EX',
      ttl
    );
    
    logger.debug(`Redis Context Manager: Created context ${contextId}`);
    return contextId;
  } catch (err) {
    logger.error(`Redis Context Manager: Error creating context: ${err.message}`);
    throw err;
  }
};

/**
 * Get a conversation context by ID
 * 
 * @param {string} contextId - The context ID
 * @returns {Promise<Object|null>} - The context data or null if not found
 */
const getContext = async (contextId) => {
  if (!redisClient) {
    throw new Error('Redis Context Manager: Not initialized');
  }
  
  try {
    const data = await redisClient.get(contextId);
    
    if (!data) {
      logger.debug(`Redis Context Manager: Context ${contextId} not found`);
      return null;
    }
    
    return JSON.parse(data);
  } catch (err) {
    logger.error(`Redis Context Manager: Error retrieving context: ${err.message}`);
    throw err;
  }
};

/**
 * Update a conversation context
 * 
 * @param {string} contextId - The context ID
 * @param {Object} updateData - Data to update in the context
 * @param {Object} options - Update options
 * @param {boolean} options.resetTTL - Whether to reset the TTL
 * @param {number} options.ttl - New TTL in seconds
 * @returns {Promise<boolean>} - True if updated, false if context not found
 */
const updateContext = async (contextId, updateData, options = {}) => {
  if (!redisClient) {
    throw new Error('Redis Context Manager: Not initialized');
  }
  
  try {
    const currentContext = await getContext(contextId);
    
    if (!currentContext) {
      return false;
    }
    
    // Deep merge the update data with current context
    const updatedContext = {
      ...currentContext,
      ...updateData,
      _metadata: {
        ...currentContext._metadata,
        lastUpdated: Date.now(),
      }
    };
    
    // Ensure context size doesn't exceed limits
    const contextSize = JSON.stringify(updatedContext).length;
    if (contextSize > DEFAULT_CONFIG.maxContextSize) {
      logger.warn(`Redis Context Manager: Context size (${contextSize} bytes) exceeds limit`);
    }
    
    const ttl = options.ttl || DEFAULT_CONFIG.defaultTTL;
    
    if (options.resetTTL) {
      updatedContext._metadata.expiresAt = Date.now() + (ttl * 1000);
      await redisClient.set(
        contextId,
        JSON.stringify(updatedContext),
        'EX',
        ttl
      );
    } else {
      // Get remaining TTL
      const remainingTTL = await redisClient.ttl(contextId);
      if (remainingTTL > 0) {
        await redisClient.set(
          contextId,
          JSON.stringify(updatedContext),
          'EX',
          remainingTTL
        );
      } else {
        // If no TTL found, set default
        await redisClient.set(
          contextId,
          JSON.stringify(updatedContext),
          'EX',
          ttl
        );
      }
    }
    
    logger.debug(`Redis Context Manager: Updated context ${contextId}`);
    return true;
  } catch (err) {
    logger.error(`Redis Context Manager: Error updating context: ${err.message}`);
    throw err;
  }
};

/**
 * Delete a conversation context
 * 
 * @param {string} contextId - The context ID
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
const deleteContext = async (contextId) => {
  if (!redisClient) {
    throw new Error('Redis Context Manager: Not initialized');
  }
  
  try {
    const result = await redisClient.del(contextId);
    const deleted = result === 1;
    
    if (deleted) {
      logger.debug(`Redis Context Manager: Deleted context ${contextId}`);
    } else {
      logger.debug(`Redis Context Manager: Context ${contextId} not found for deletion`);
    }
    
    return deleted;
  } catch (err) {
    logger.error(`Redis Context Manager: Error deleting context: ${err.message}`);
    throw err;
  }
};

/**
 * Extend the TTL of a context
 * 
 * @param {string} contextId - The context ID
 * @param {number} ttl - New TTL in seconds
 * @returns {Promise<boolean>} - True if extended, false if not found
 */
const extendContextTTL = async (contextId, ttl = DEFAULT_CONFIG.defaultTTL) => {
  if (!redisClient) {
    throw new Error('Redis Context Manager: Not initialized');
  }
  
  try {
    const result = await redisClient.expire(contextId, ttl);
    const extended = result === 1;
    
    if (extended) {
      logger.debug(`Redis Context Manager: Extended TTL for context ${contextId}`);
      
      // Update metadata
      const context = await getContext(contextId);
      if (context) {
        context._metadata.expiresAt = Date.now() + (ttl * 1000);
        await redisClient.set(
          contextId,
          JSON.stringify(context),
          'EX',
          ttl
        );
      }
    } else {
      logger.debug(`Redis Context Manager: Context ${contextId} not found for TTL extension`);
    }
    
    return extended;
  } catch (err) {
    logger.error(`Redis Context Manager: Error extending context TTL: ${err.message}`);
    throw err;
  }
};

/**
 * Get analytics about context usage
 * 
 * @returns {Promise<Object>} - Context usage statistics
 */
const getContextAnalytics = async () => {
  if (!redisClient) {
    throw new Error('Redis Context Manager: Not initialized');
  }
  
  try {
    // Get all keys with the context prefix
    const keys = await redisClient.keys('*');
    
    // Get memory usage
    const info = await redisClient.info('memory');
    const usedMemory = info.split('\r\n')
      .find(line => line.startsWith('used_memory:'))
      ?.split(':')[1] || 0;
    
    return {
      activeContexts: keys.length,
      memoryUsage: parseInt(usedMemory, 10),
      timestamp: Date.now()
    };
  } catch (err) {
    logger.error(`Redis Context Manager: Error getting analytics: ${err.message}`);
    throw err;
  }
};

/**
 * Close the Redis connection
 * 
 * @returns {Promise<void>}
 */
const shutdown = async () => {
  if (!redisClient) {
    logger.info('Redis Context Manager: No connection to close');
    return;
  }
  
  try {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis Context Manager: Connection closed successfully');
  } catch (err) {
    logger.error(`Redis Context Manager: Error closing connection: ${err.message}`);
    throw err;
  }
};

module.exports = {
  initialize,
  createContext,
  getContext,
  updateContext,
  deleteContext,
  extendContextTTL,
  getContextAnalytics,
  shutdown
};