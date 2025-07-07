/**
 * Rate Limiting Middleware
 * 
 * This module implements rate limiting for API endpoints to protect
 * against abuse and ensure fair usage of resources.
 */

const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');

// Get Redis connection details from environment variables
const REDIS_URI = process.env.REDIS_URI || 'redis://localhost:6379';
const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'chatbots:ratelimit:';

// Create Redis client for rate limiting
const redisClient = new Redis(REDIS_URI, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3
});

// Handle Redis connection errors
redisClient.on('error', (err) => {
  console.error('Rate limiter Redis error:', err);
});

/**
 * Create a rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware function
 */
function createRateLimiter(options = {}) {
  const {
    points = 100,           // Number of points
    duration = 60,          // Per duration in seconds
    blockDuration = 0,      // Block duration in seconds (0 = no block)
    keyPrefix = 'rlflx',    // Key prefix in Redis
    storeClient = redisClient, // Redis client
    inmemoryBlockOnConsumed = 0, // If consumed more than this value, block inmemory
    inmemoryBlockDuration = 0,   // Inmemory block duration in seconds
    insuranceLimiter = null,     // Insurance limiter for Redis outages
    getUserId = (req) => req.ip, // Function to get user ID
    errorMessage = 'Too many requests, please try again later.',
    customResponseHandler = null, // Custom response handler
    skipFailedRequests = false,  // Skip failed requests (status >= 400)
    skipSuccessfulRequests = false, // Skip successful requests (status < 400)
    requestWasSuccessful = (req, res) => res.statusCode < 400, // Function to determine if request was successful
    logger = console
  } = options;

  // Create rate limiter instance
  const rateLimiter = new RateLimiterRedis({
    storeClient,
    keyPrefix: `${REDIS_KEY_PREFIX}${keyPrefix}`,
    points,
    duration,
    blockDuration,
    inmemoryBlockOnConsumed,
    inmemoryBlockDuration,
    insuranceLimiter
  });

  // Return middleware function
  return async (req, res, next) => {
    // Skip rate limiting for certain paths or IPs if needed
    if (shouldSkipRateLimit(req)) {
      return next();
    }

    // Get user identifier (IP, user ID, API key, etc.)
    const userId = getUserId(req);
    
    try {
      // Consume points
      const rateLimiterRes = await rateLimiter.consume(userId);
      
      // Set rate limit headers
      setRateLimitHeaders(res, rateLimiterRes);
      
      // If we're skipping based on request success/failure, add response listener
      if (skipFailedRequests || skipSuccessfulRequests) {
        res.on('finish', async () => {
          const wasSuccessful = requestWasSuccessful(req, res);
          
          if ((skipFailedRequests && !wasSuccessful) || 
              (skipSuccessfulRequests && wasSuccessful)) {
            try {
              // Give points back
              await rateLimiter.reward(userId);
            } catch (err) {
              logger.error('Error rewarding points:', err);
            }
          }
        });
      }
      
      next();
    } catch (rejRes) {
      // Check if it's a rate limiter response
      if (rejRes instanceof Error) {
        logger.error('Rate limiter error:', rejRes);
        next(rejRes);
        return;
      }
      
      // Set rate limit headers for rejected request
      setRateLimitHeaders(res, rejRes, true);
      
      // Use custom response handler if provided
      if (customResponseHandler) {
        return customResponseHandler(req, res, next, rejRes);
      }
      
      // Default response
      const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', retryAfter);
      res.status(429).json({
        error: 'Too Many Requests',
        message: errorMessage,
        retryAfter
      });
    }
  };
}

/**
 * Set rate limit headers on response
 * @param {Object} res - Express response object
 * @param {Object} rateLimiterRes - Rate limiter result
 * @param {boolean} isRateLimited - Whether request is rate limited
 */
function setRateLimitHeaders(res, rateLimiterRes, isRateLimited = false) {
  res.set('X-RateLimit-Limit', rateLimiterRes.limit);
  res.set('X-RateLimit-Remaining', isRateLimited ? 0 : rateLimiterRes.remainingPoints);
  res.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + rateLimiterRes.msBeforeNext / 1000));
}

/**
 * Check if rate limiting should be skipped for this request
 * @param {Object} req - Express request object
 * @returns {boolean} Whether to skip rate limiting
 */
function shouldSkipRateLimit(req) {
  // Skip internal paths
  if (req.path.startsWith('/internal/') || req.path.startsWith('/health')) {
    return true;
  }
  
  // Skip localhost in development
  if (process.env.NODE_ENV === 'development' && 
      (req.ip === '127.0.0.1' || req.ip === '::1')) {
    return true;
  }
  
  // Skip based on custom header (for internal services)
  if (req.get('X-Internal-Service') === process.env.INTERNAL_SERVICE_SECRET) {
    return true;
  }
  
  return false;
}

/**
 * Predefined rate limiters for different API endpoints
 */
const rateLimiters = {
  /**
   * Global rate limiter for all API endpoints
   */
  global: createRateLimiter({
    points: 300,
    duration: 60,
    keyPrefix: 'global',
    errorMessage: 'Too many requests, please try again later.'
  }),
  
  /**
   * Rate limiter for authentication endpoints
   */
  auth: createRateLimiter({
    points: 10,
    duration: 60,
    blockDuration: 300, // Block for 5 minutes after too many attempts
    keyPrefix: 'auth',
    errorMessage: 'Too many authentication attempts, please try again later.'
  }),
  
  /**
   * Rate limiter for chatbot creation endpoints
   */
  chatbotCreation: createRateLimiter({
    points: 20,
    duration: 3600, // 1 hour
    keyPrefix: 'chatbot-create',
    errorMessage: 'You have created too many chatbots recently, please try again later.',
    getUserId: (req) => req.user ? req.user.id : req.ip
  }),
  
  /**
   * Rate limiter for message sending endpoints
   */
  messageSending: createRateLimiter({
    points: 60,
    duration: 60,
    keyPrefix: 'message-send',
    errorMessage: 'You are sending messages too quickly, please slow down.',
    getUserId: (req) => req.user ? req.user.id : req.ip
  }),
  
  /**
   * Rate limiter for knowledge base updates
   */
  knowledgeBaseUpdate: createRateLimiter({
    points: 100,
    duration: 3600, // 1 hour
    keyPrefix: 'kb-update',
    errorMessage: 'Too many knowledge base updates, please try again later.',
    getUserId: (req) => req.user ? req.user.id : req.ip
  }),
  
  /**
   * Rate limiter for API endpoints
   */
  api: createRateLimiter({
    points: 1000,
    duration: 3600, // 1 hour
    keyPrefix: 'api',
    errorMessage: 'API rate limit exceeded, please upgrade your plan for higher limits.',
    getUserId: (req) => req.get('X-API-Key') || req.ip,
    customResponseHandler: (req, res, next, rejRes) => {
      const retryAfter = Math.ceil(rejRes.msBeforeNext / 1000) || 1;
      res.set('Retry-After', retryAfter);
      res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: 'API rate limit exceeded, please upgrade your plan for higher limits.',
        retryAfter,
        currentLimit: rejRes.limit,
        upgradeUrl: 'https://example.com/upgrade'
      });
    }
  }),
  
  /**
   * Create a custom rate limiter with specific options
   * @param {Object} options - Rate limiter options
   * @returns {Function} Express middleware function
   */
  custom: (options) => createRateLimiter(options)
};

module.exports = rateLimiters;
