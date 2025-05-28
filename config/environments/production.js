/**
 * Production Environment Configuration
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN || ['https://app.chatbots-platform.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    helmet: {
      enabled: true
    },
    compression: {
      enabled: true
    }
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: false, // Don't build indexes in production
      poolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    }
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    saltRounds: 12
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined',
    enableConsole: false,
    enableFile: true,
    fileOptions: {
      filename: './logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    }
  },
  
  // API configuration
  api: {
    version: 'v1',
    prefix: '/api/v1'
  },
  
  // External services
  services: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4'
    },
    azure: {
      cognitiveServicesKey: process.env.AZURE_COGNITIVE_SERVICES_KEY,
      region: process.env.AZURE_REGION || 'eastus'
    }
  },
  
  // Storage configuration
  storage: {
    type: process.env.STORAGE_TYPE || 's3',
    s3: {
      bucket: process.env.S3_BUCKET || 'chatbots-production',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    }
  },
  
  // Cache configuration
  cache: {
    enabled: true,
    type: process.env.CACHE_TYPE || 'redis',
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true'
    },
    ttl: 60 * 30 // 30 minutes
  },
  
  // Monitoring configuration
  monitoring: {
    enabled: true,
    type: process.env.MONITORING_TYPE || 'prometheus',
    interval: process.env.MONITORING_INTERVAL || 5000
  }
};
