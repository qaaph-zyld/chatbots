/**
 * Development Environment Configuration
 */

module.exports = {
  // Server configuration
  server: {
    port: 3000,
    host: 'localhost',
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    },
    rateLimiting: {
      enabled: false
    }
  },
  
  // Database configuration
  database: {
    uri: 'mongodb://localhost:27017/chatbots_dev',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: true
    }
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: 'dev_jwt_secret_key_change_in_production',
    jwtExpiresIn: '1h',
    refreshTokenSecret: 'dev_refresh_token_secret_key_change_in_production',
    refreshTokenExpiresIn: '7d',
    saltRounds: 10
  },
  
  // Logging configuration
  logging: {
    level: 'debug',
    format: 'dev',
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
      defaultModel: 'gpt-3.5-turbo'
    },
    azure: {
      cognitiveServicesKey: process.env.AZURE_COGNITIVE_SERVICES_KEY || 'your_azure_key',
      region: process.env.AZURE_REGION || 'eastus'
    }
  },
  
  // Storage configuration
  storage: {
    type: 'local',
    local: {
      uploadDir: './uploads'
    }
  },
  
  // Cache configuration
  cache: {
    enabled: true,
    type: 'memory',
    ttl: 60 * 5 // 5 minutes
  }
};
