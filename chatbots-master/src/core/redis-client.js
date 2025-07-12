/**
 * Redis Client Factory
 * 
 * Creates and manages Redis client connections
 */

// Import dependencies
const redis = require('redis');
const logger = require('@core/logger');

// Redis client instance
let redisClient = null;

/**
 * Create a Redis client with the specified options
 * @param {Object} options - Redis connection options
 * @returns {Object} - Redis client instance
 */
const createRedisClient = (options = {}) => {
  // Default options
  const defaultOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        // End reconnecting on a specific error
        logger.error('Redis connection refused. Check if Redis server is running.');
        return new Error('The server refused the connection');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        // End reconnecting after 1 hour
        logger.error('Redis retry time exhausted');
        return new Error('Retry time exhausted');
      }
      if (options.attempt > 10) {
        // End reconnecting with built in error
        logger.error('Redis max retry attempts reached');
        return undefined;
      }
      // Reconnect after
      return Math.min(options.attempt * 100, 3000);
    }
  };

  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };

  try {
    // Create Redis client
    const client = redis.createClient(mergedOptions);

    // Handle connection events
    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    client.on('error', (err) => {
      logger.error(`Redis client error: ${err.message}`);
    });

    client.on('end', () => {
      logger.info('Redis client connection closed');
    });

    return client;
  } catch (error) {
    logger.error(`Error creating Redis client: ${error.message}`);
    throw error;
  }
};

/**
 * Get a Redis client instance (singleton pattern)
 * @param {Object} options - Redis connection options
 * @returns {Object} - Redis client instance
 */
const getRedisClient = (options = {}) => {
  if (!redisClient) {
    redisClient = createRedisClient(options);
  }
  return redisClient;
};

/**
 * Close the Redis client connection
 * @returns {Promise} - Promise that resolves when the connection is closed
 */
const closeRedisConnection = async () => {
  if (redisClient) {
    logger.info('Closing Redis client connection');
    await redisClient.quit();
    redisClient = null;
  }
};

module.exports = {
  createRedisClient,
  getRedisClient,
  closeRedisConnection
};
