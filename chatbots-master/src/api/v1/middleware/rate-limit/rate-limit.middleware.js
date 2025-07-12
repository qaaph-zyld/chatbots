/**
 * Rate Limiting Middleware
 * 
 * Provides rate limiting functionality for API endpoints
 */

// Import dependencies
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const logger = require('@core/logger');

/**
 * Create a rate limiter middleware with specified options
 * @param {Object} options - Rate limiting options
 * @returns {Function} - Express middleware function
 */
const createRateLimiter = (options = {}) => {
  // Default options
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
      res.status(429).json(options.message);
    }
  };

  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };

  // If Redis client is provided, use Redis store
  if (options.redisClient) {
    logger.info('Using Redis store for rate limiting');
    mergedOptions.store = new RedisStore({
      client: options.redisClient,
      prefix: 'rl:', // Key prefix in Redis
      expiry: Math.floor(mergedOptions.windowMs / 1000) // Convert from ms to seconds
    });
    // Remove redisClient from options as it's not needed by rateLimit
    delete mergedOptions.redisClient;
  }

  // Create and return the rate limiter middleware
  return rateLimit(mergedOptions);
};

/**
 * Configure rate limits for different endpoints
 * @param {Object} config - Configuration object with rate limit settings for different endpoints
 * @returns {Object} - Object with configured rate limiters for each endpoint
 */
const configureRateLimits = (config = {}) => {
  const limiters = {};

  // Create rate limiters for each endpoint in the config
  Object.keys(config).forEach(endpoint => {
    limiters[endpoint] = createRateLimiter(config[endpoint]);
    logger.info(`Rate limiter configured for ${endpoint} endpoint`);
  });

  return limiters;
};

module.exports = {
  createRateLimiter,
  configureRateLimits
};
