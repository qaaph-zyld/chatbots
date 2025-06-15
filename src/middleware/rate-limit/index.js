/**
 * Rate Limiting Middleware Index
 * 
 * Configures and applies rate limiting to API routes
 */

// Import dependencies
const { createRateLimiter, configureRateLimits } = require('./rate-limit.middleware');
const { getRateLimitConfig } = require('@config/rate-limit.config');
const { getRedisClient } = require('@core/redis-client');
const logger = require('@core/logger');

/**
 * Apply rate limiting to Express app routes
 * @param {Object} app - Express application
 * @param {Object} options - Configuration options
 * @returns {Object} - Configured rate limiters
 */
const applyRateLimiting = (app, options = {}) => {
  try {
    logger.info('Configuring rate limiting middleware');
    
    // Get rate limit configuration
    const rateLimitConfig = getRateLimitConfig();
    
    // Check if Redis should be used for rate limiting
    const useRedis = options.useRedis || process.env.USE_REDIS_RATE_LIMIT === 'true';
    
    // If Redis is enabled, create Redis client and add to rate limit config
    if (useRedis) {
      logger.info('Using Redis for rate limiting');
      const redisClient = getRedisClient();
      
      // Add Redis client to each rate limit config
      Object.keys(rateLimitConfig).forEach(key => {
        rateLimitConfig[key].redisClient = redisClient;
      });
    }
    
    // Configure rate limiters
    const limiters = configureRateLimits(rateLimitConfig);
    
    // Apply rate limiters to routes
    if (limiters.api) {
      logger.info('Applying API rate limiter');
      app.use('/api', limiters.api);
    }
    
    if (limiters.auth) {
      logger.info('Applying Auth rate limiter');
      app.use('/api/auth', limiters.auth);
    }
    
    if (limiters.conversation) {
      logger.info('Applying Conversation rate limiter');
      app.use('/api/conversations', limiters.conversation);
    }
    
    if (limiters.sentiment) {
      logger.info('Applying Sentiment rate limiter');
      app.use('/api/sentiment', limiters.sentiment);
    }
    
    return limiters;
  } catch (error) {
    logger.error(`Error applying rate limiting: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createRateLimiter,
  configureRateLimits,
  applyRateLimiting
};
