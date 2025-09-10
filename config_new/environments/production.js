/**
 * Production Environment Configuration
 */

module.exports = {
  // Production database settings
  database: {
    url: process.env.DATABASE_URL,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ssl: true,
      sslValidate: true
    }
  },

  // Production cache settings
  cache: {
    url: process.env.REDIS_URL,
    ttl: 3600, // 1 hour
    options: {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      connectTimeout: 60000,
      lazyConnect: true
    }
  },

  // Strict rate limiting for production
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests, please try again later.'
    }
  },

  // Production logging
  logging: {
    level: 'warn',
    console: false,
    file: true,
    maxFiles: 10,
    maxSize: '50m'
  },

  // Production security (strict)
  security: {
    bcryptRounds: 12,
    csrfProtection: true,
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },

  // Production-specific features
  features: {
    hotReload: false,
    debugMode: false,
    mockExternalServices: false,
    compression: true,
    clustering: true
  }
};
