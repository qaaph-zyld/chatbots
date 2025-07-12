/**
 * Staging Environment Configuration
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.CORS_ORIGIN || ['https://staging.chatbots-app.com'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    },
    rateLimiting: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/chatbots_staging',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true
    }
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'staging_jwt_secret_key_change_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'staging_refresh_token_secret_key_change_in_production',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    saltRounds: 10
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined',
    enableConsole: true,
    enableFile: true,
    fileOptions: {
      filename: './logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
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
      apiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key',
      defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo'
    },
    azure: {
      cognitiveServicesKey: process.env.AZURE_COGNITIVE_SERVICES_KEY || 'your_azure_key',
      region: process.env.AZURE_REGION || 'eastus'
    }
  },
  
  // Storage configuration
  storage: {
    type: process.env.STORAGE_TYPE || 's3',
    s3: {
      bucket: process.env.S3_BUCKET || 'chatbots-staging',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    },
    local: {
      uploadDir: './uploads'
    }
  },
  
  // Cache configuration
  cache: {
    enabled: true,
    type: process.env.CACHE_TYPE || 'redis',
    redis: {
      host: process.env.REDIS_HOST || 'redis',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    },
    ttl: 60 * 15 // 15 minutes
  }
};
