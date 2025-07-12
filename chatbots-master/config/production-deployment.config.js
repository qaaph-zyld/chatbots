/**
 * Production Deployment Configuration
 * 
 * This file contains configuration settings for production deployment
 * of the Customizable Chatbots platform.
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://app.chatbots.example.com'],
    trustProxy: true,
    rateLimits: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    }
  },

  // Database configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbots',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10
      }
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_DB || 0,
      keyPrefix: 'chatbots:',
      maxRetriesPerRequest: 3
    },
    weaviate: {
      scheme: process.env.WEAVIATE_SCHEME || 'http',
      host: process.env.WEAVIATE_HOST || 'localhost:8080',
      apiKey: process.env.WEAVIATE_API_KEY || '',
      headers: {}
    }
  },

  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    saltRounds: 10
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json',
    transports: ['console', 'file'],
    fileOptions: {
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }
  },

  // Monitoring and alerting
  monitoring: {
    enabled: true,
    prometheus: {
      enabled: true,
      port: process.env.PROMETHEUS_PORT || 9090
    },
    healthCheck: {
      path: '/health',
      includeInStatus: ['database', 'redis', 'weaviate']
    },
    alerting: {
      email: {
        enabled: process.env.EMAIL_ALERTS_ENABLED === 'true',
        recipients: process.env.ALERT_RECIPIENTS ? process.env.ALERT_RECIPIENTS.split(',') : [],
        sender: process.env.ALERT_SENDER || 'alerts@chatbots.example.com'
      },
      slack: {
        enabled: process.env.SLACK_ALERTS_ENABLED === 'true',
        webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
        channel: process.env.SLACK_CHANNEL || '#alerts'
      }
    }
  },

  // Resource limits for tenants
  tenantLimits: {
    default: {
      apiCalls: 10000,
      storage: 5 * 1024 * 1024 * 1024, // 5GB
      conversations: 1000,
      templates: 100,
      knowledgeBaseSize: 1 * 1024 * 1024 * 1024, // 1GB
      users: 10
    },
    premium: {
      apiCalls: 100000,
      storage: 50 * 1024 * 1024 * 1024, // 50GB
      conversations: 10000,
      templates: 1000,
      knowledgeBaseSize: 10 * 1024 * 1024 * 1024, // 10GB
      users: 100
    },
    enterprise: {
      apiCalls: 1000000,
      storage: 500 * 1024 * 1024 * 1024, // 500GB
      conversations: 100000,
      templates: 10000,
      knowledgeBaseSize: 100 * 1024 * 1024 * 1024, // 100GB
      users: 1000
    }
  },

  // Cache configuration
  cache: {
    ttl: {
      short: 60, // 1 minute
      medium: 300, // 5 minutes
      long: 3600, // 1 hour
      day: 86400 // 24 hours
    },
    keys: {
      templates: 'templates:',
      conversations: 'conversations:',
      users: 'users:',
      tenants: 'tenants:'
    }
  },

  // File storage configuration
  storage: {
    type: process.env.STORAGE_TYPE || 'local', // 'local', 's3', 'azure'
    local: {
      path: process.env.LOCAL_STORAGE_PATH || './uploads'
    },
    s3: {
      bucket: process.env.S3_BUCKET || 'chatbots-uploads',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || ''
    },
    azure: {
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
      container: process.env.AZURE_STORAGE_CONTAINER || 'chatbots-uploads'
    }
  },

  // Security configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' }
    },
    cors: {
      origin: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://app.chatbots.example.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
      exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
      credentials: true,
      maxAge: 86400 // 24 hours
    }
  },

  // AI model configuration
  ai: {
    defaultModel: process.env.DEFAULT_AI_MODEL || 'open-source-model',
    models: {
      'open-source-model': {
        type: 'local',
        url: process.env.LOCAL_MODEL_URL || 'http://localhost:8000',
        apiKey: process.env.LOCAL_MODEL_API_KEY || '',
        contextWindow: 8192,
        maxTokens: 1024
      },
      'huggingface': {
        type: 'huggingface',
        url: process.env.HUGGINGFACE_URL || 'https://api-inference.huggingface.co/models/',
        apiKey: process.env.HUGGINGFACE_API_KEY || '',
        model: process.env.HUGGINGFACE_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2',
        contextWindow: 4096,
        maxTokens: 1024
      }
    }
  }
};
