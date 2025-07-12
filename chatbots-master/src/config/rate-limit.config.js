/**
 * Rate Limiting Configuration
 * 
 * Configuration settings for rate limiting different API endpoints
 */

// Default rate limit settings
const defaultRateLimits = {
  // General API rate limit (100 requests per 15 minutes)
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      success: false,
      message: 'Too many API requests, please try again later.'
    }
  },
  
  // Authentication rate limit (5 requests per 5 minutes)
  auth: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 requests per window
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  
  // Chatbot conversation rate limit (60 requests per minute)
  conversation: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per window
    message: {
      success: false,
      message: 'Too many conversation requests, please try again later.'
    }
  },
  
  // Sentiment analysis rate limit (30 requests per minute)
  sentiment: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per window
    message: {
      success: false,
      message: 'Too many sentiment analysis requests, please try again later.'
    }
  }
};

// Environment-specific rate limit settings
const environmentRateLimits = {
  development: {
    // Higher limits for development
    api: {
      ...defaultRateLimits.api,
      max: 1000 // 1000 requests per window in development
    },
    auth: {
      ...defaultRateLimits.auth,
      max: 50 // 50 requests per window in development
    }
  },
  
  test: {
    // No rate limiting in test environment
    api: {
      ...defaultRateLimits.api,
      max: 0 // Disable rate limiting
    },
    auth: {
      ...defaultRateLimits.auth,
      max: 0 // Disable rate limiting
    },
    conversation: {
      ...defaultRateLimits.conversation,
      max: 0 // Disable rate limiting
    },
    sentiment: {
      ...defaultRateLimits.sentiment,
      max: 0 // Disable rate limiting
    }
  },
  
  production: {
    // Use default rate limits for production
    ...defaultRateLimits
  }
};

/**
 * Get rate limit configuration for the current environment
 * @returns {Object} - Rate limit configuration
 */
const getRateLimitConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return environmentRateLimits[env] || defaultRateLimits;
};

module.exports = {
  getRateLimitConfig
};
