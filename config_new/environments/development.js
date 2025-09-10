/**
 * Development Environment Configuration
 */

module.exports = {
  // Development-specific database settings
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/chatbots_dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    }
  },

  // Development cache settings
  cache: {
    url: process.env.REDIS_URL || 'redis://localhost:6379/0',
    ttl: 300, // 5 minutes for faster development
  },

  // Relaxed rate limiting for development
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 1000, // Higher limit for development
    skip: () => true // Disable rate limiting in development
  },

  // Development logging
  logging: {
    level: 'debug',
    console: true,
    file: false
  },

  // Development security (less strict)
  security: {
    bcryptRounds: 4, // Faster for development
    csrfProtection: false
  },

  // Development-specific features
  features: {
    hotReload: true,
    debugMode: true,
    mockExternalServices: true
  }
};
