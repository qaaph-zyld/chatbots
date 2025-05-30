/**
 * Rate Limiter Service
 * 
 * This service implements rate limiting functionality to protect the chatbot
 * from abuse and ensure fair resource allocation among users.
 */

const { logger } = require('../utils');
const { EventEmitter } = require('events');

/**
 * Rate Limiter Service class
 */
class RateLimiterService extends EventEmitter {
  /**
   * Initialize the rate limiter service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      defaultLimit: parseInt(process.env.DEFAULT_RATE_LIMIT || '100'), // requests per window
      defaultWindow: parseInt(process.env.DEFAULT_RATE_WINDOW || '3600000'), // ms (default: 1 hour)
      cleanupInterval: parseInt(process.env.RATE_LIMITER_CLEANUP_INTERVAL || '300000'), // ms (default: 5 minutes)
      enableRateLimiting: process.env.ENABLE_RATE_LIMITING === 'true' || true,
      ...options
    };

    // Storage for rate limiting data
    this.limiters = new Map();
    
    // Custom rate limits for specific identifiers
    this.customLimits = new Map();
    
    // Cleanup interval reference
    this.cleanupInterval = null;
    
    // Start cleanup interval
    if (this.options.enableRateLimiting) {
      this._startCleanup();
    }

    logger.info('Rate Limiter Service initialized with options:', {
      defaultLimit: this.options.defaultLimit,
      defaultWindow: this.options.defaultWindow,
      cleanupInterval: this.options.cleanupInterval,
      enableRateLimiting: this.options.enableRateLimiting
    });
  }

  /**
   * Start cleanup interval
   * @private
   */
  _startCleanup() {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      
      this.cleanupInterval = setInterval(() => {
        this._cleanup();
      }, this.options.cleanupInterval);
      
      logger.debug('Rate limiter cleanup interval started');
    } catch (error) {
      logger.error('Error starting cleanup interval:', error.message);
    }
  }

  /**
   * Clean up expired rate limiting data
   * @private
   */
  _cleanup() {
    try {
      const now = Date.now();
      let expiredCount = 0;
      
      // Clean up limiters
      for (const [key, limiter] of this.limiters.entries()) {
        // Remove requests older than the window
        limiter.requests = limiter.requests.filter(timestamp => {
          return now - timestamp < limiter.window;
        });
        
        // Remove limiter if it has no requests and is not a custom limit
        if (limiter.requests.length === 0 && !this.customLimits.has(key)) {
          this.limiters.delete(key);
          expiredCount++;
        }
      }
      
      if (expiredCount > 0) {
        logger.debug(`Cleaned up ${expiredCount} expired rate limiters`);
      }
    } catch (error) {
      logger.error('Error cleaning up rate limiters:', error.message);
    }
  }

  /**
   * Set a custom rate limit for a specific identifier
   * @param {string} identifier - Identifier (e.g., userId, IP)
   * @param {Object} limits - Rate limit configuration
   * @returns {boolean} - Success status
   */
  setCustomLimit(identifier, limits) {
    try {
      if (!identifier) {
        throw new Error('Identifier is required');
      }
      
      const { limit, window } = limits;
      
      if (isNaN(limit) || limit <= 0) {
        throw new Error('Limit must be a positive number');
      }
      
      if (isNaN(window) || window <= 0) {
        throw new Error('Window must be a positive number');
      }
      
      // Set custom limit
      this.customLimits.set(identifier, {
        limit,
        window
      });
      
      // Update existing limiter if it exists
      if (this.limiters.has(identifier)) {
        const limiter = this.limiters.get(identifier);
        limiter.limit = limit;
        limiter.window = window;
      }
      
      logger.info(`Custom rate limit set for ${identifier}: ${limit} requests per ${window}ms`);
      return true;
    } catch (error) {
      logger.error('Error setting custom limit:', error.message);
      return false;
    }
  }

  /**
   * Remove a custom rate limit
   * @param {string} identifier - Identifier (e.g., userId, IP)
   * @returns {boolean} - Success status
   */
  removeCustomLimit(identifier) {
    try {
      if (!identifier) {
        throw new Error('Identifier is required');
      }
      
      // Remove custom limit
      const removed = this.customLimits.delete(identifier);
      
      // Reset existing limiter to default if it exists
      if (this.limiters.has(identifier)) {
        const limiter = this.limiters.get(identifier);
        limiter.limit = this.options.defaultLimit;
        limiter.window = this.options.defaultWindow;
      }
      
      if (removed) {
        logger.info(`Custom rate limit removed for ${identifier}`);
      }
      
      return removed;
    } catch (error) {
      logger.error('Error removing custom limit:', error.message);
      return false;
    }
  }

  /**
   * Check if a request is allowed
   * @param {string} identifier - Identifier (e.g., userId, IP)
   * @param {Object} options - Check options
   * @returns {Object} - Rate limit status
   */
  check(identifier, options = {}) {
    try {
      if (!this.options.enableRateLimiting) {
        return {
          allowed: true,
          remaining: Infinity,
          reset: Date.now(),
          limit: Infinity
        };
      }
      
      if (!identifier) {
        throw new Error('Identifier is required');
      }
      
      const { cost = 1, action = 'default' } = options;
      
      // Get or create limiter
      let limiter = this.limiters.get(identifier);
      
      if (!limiter) {
        // Check if there's a custom limit
        const customLimit = this.customLimits.get(identifier);
        
        limiter = {
          limit: customLimit ? customLimit.limit : this.options.defaultLimit,
          window: customLimit ? customLimit.window : this.options.defaultWindow,
          requests: []
        };
        
        this.limiters.set(identifier, limiter);
      }
      
      // Get current time
      const now = Date.now();
      
      // Remove expired requests
      limiter.requests = limiter.requests.filter(timestamp => {
        return now - timestamp < limiter.window;
      });
      
      // Check if limit is exceeded
      const currentCount = limiter.requests.length;
      const allowed = currentCount + cost <= limiter.limit;
      
      // Calculate reset time (when the oldest request expires)
      const resetTime = limiter.requests.length > 0 ?
        limiter.requests[0] + limiter.window : now;
      
      // Create response
      const response = {
        allowed,
        remaining: Math.max(0, limiter.limit - currentCount),
        reset: resetTime,
        limit: limiter.limit
      };
      
      // Add request if allowed
      if (allowed) {
        // Add current timestamp for each cost unit
        for (let i = 0; i < cost; i++) {
          limiter.requests.push(now);
        }
      } else {
        // Emit rate limit exceeded event
        this.emit('exceeded', {
          identifier,
          action,
          limit: limiter.limit,
          window: limiter.window,
          timestamp: now
        });
        
        logger.warn(`Rate limit exceeded for ${identifier} (${action}): ${currentCount}/${limiter.limit}`);
      }
      
      return response;
    } catch (error) {
      logger.error('Error checking rate limit:', error.message);
      
      // Default to allowed in case of error
      return {
        allowed: true,
        remaining: Infinity,
        reset: Date.now(),
        limit: Infinity,
        error: error.message
      };
    }
  }

  /**
   * Consume rate limit tokens
   * @param {string} identifier - Identifier (e.g., userId, IP)
   * @param {Object} options - Consume options
   * @returns {Object} - Rate limit status
   */
  consume(identifier, options = {}) {
    try {
      if (!this.options.enableRateLimiting) {
        return {
          allowed: true,
          remaining: Infinity,
          reset: Date.now(),
          limit: Infinity
        };
      }
      
      if (!identifier) {
        throw new Error('Identifier is required');
      }
      
      const { cost = 1, action = 'default' } = options;
      
      // Check if allowed
      const checkResult = this.check(identifier, { cost: 0, action });
      
      if (!checkResult.allowed) {
        return checkResult;
      }
      
      // Get limiter
      const limiter = this.limiters.get(identifier);
      
      if (!limiter) {
        throw new Error('Limiter not found');
      }
      
      // Add current timestamp for each cost unit
      const now = Date.now();
      for (let i = 0; i < cost; i++) {
        limiter.requests.push(now);
      }
      
      // Calculate remaining
      const remaining = Math.max(0, limiter.limit - limiter.requests.length);
      
      // Calculate reset time
      const resetTime = limiter.requests.length > 0 ?
        limiter.requests[0] + limiter.window : now;
      
      return {
        allowed: true,
        remaining,
        reset: resetTime,
        limit: limiter.limit
      };
    } catch (error) {
      logger.error('Error consuming rate limit:', error.message);
      
      // Default to allowed in case of error
      return {
        allowed: true,
        remaining: Infinity,
        reset: Date.now(),
        limit: Infinity,
        error: error.message
      };
    }
  }

  /**
   * Get rate limit status
   * @param {string} identifier - Identifier (e.g., userId, IP)
   * @returns {Object} - Rate limit status
   */
  getStatus(identifier) {
    try {
      if (!this.options.enableRateLimiting) {
        return {
          allowed: true,
          remaining: Infinity,
          reset: Date.now(),
          limit: Infinity
        };
      }
      
      if (!identifier) {
        throw new Error('Identifier is required');
      }
      
      // Get limiter
      const limiter = this.limiters.get(identifier);
      
      if (!limiter) {
        // Get custom limit if exists
        const customLimit = this.customLimits.get(identifier);
        
        return {
          allowed: true,
          remaining: customLimit ? customLimit.limit : this.options.defaultLimit,
          reset: Date.now(),
          limit: customLimit ? customLimit.limit : this.options.defaultLimit
        };
      }
      
      // Get current time
      const now = Date.now();
      
      // Remove expired requests
      const validRequests = limiter.requests.filter(timestamp => {
        return now - timestamp < limiter.window;
      });
      
      // Calculate remaining
      const remaining = Math.max(0, limiter.limit - validRequests.length);
      
      // Calculate reset time
      const resetTime = validRequests.length > 0 ?
        validRequests[0] + limiter.window : now;
      
      return {
        allowed: remaining > 0,
        remaining,
        reset: resetTime,
        limit: limiter.limit
      };
    } catch (error) {
      logger.error('Error getting rate limit status:', error.message);
      
      // Default to allowed in case of error
      return {
        allowed: true,
        remaining: Infinity,
        reset: Date.now(),
        limit: Infinity,
        error: error.message
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   * @param {string} identifier - Identifier (e.g., userId, IP)
   * @returns {boolean} - Success status
   */
  reset(identifier) {
    try {
      if (!identifier) {
        throw new Error('Identifier is required');
      }
      
      // Reset limiter
      if (this.limiters.has(identifier)) {
        const limiter = this.limiters.get(identifier);
        limiter.requests = [];
        
        logger.info(`Rate limit reset for ${identifier}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error resetting rate limit:', error.message);
      return false;
    }
  }

  /**
   * Get all rate limiters
   * @returns {Array} - List of rate limiters
   */
  getAllLimiters() {
    try {
      const result = [];
      
      for (const [identifier, limiter] of this.limiters.entries()) {
        const now = Date.now();
        
        // Remove expired requests
        const validRequests = limiter.requests.filter(timestamp => {
          return now - timestamp < limiter.window;
        });
        
        // Calculate remaining
        const remaining = Math.max(0, limiter.limit - validRequests.length);
        
        // Calculate reset time
        const resetTime = validRequests.length > 0 ?
          validRequests[0] + limiter.window : now;
        
        result.push({
          identifier,
          limit: limiter.limit,
          window: limiter.window,
          remaining,
          reset: resetTime,
          isCustom: this.customLimits.has(identifier)
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Error getting all limiters:', error.message);
      return [];
    }
  }
}

// Create and export service instance
const rateLimiterService = new RateLimiterService();

module.exports = {
  RateLimiterService,
  rateLimiterService
};
