/**
 * Configuration module
 * 
 * Centralizes application configuration and environment variables
 */

require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }
  },
  
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/chatbots',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },
  
  // Authentication configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'development-secret-key',
    jwtExpiration: process.env.JWT_EXPIRATION || '1d',
    apiKey: process.env.API_KEY,
    apiKeyRequired: process.env.API_KEY_REQUIRED === 'true'
  },
  
  // GitHub configuration
  github: {
    token: process.env.GITHUB_TOKEN,
  },
  
  // Chatbot configuration
  chatbot: {
    defaultEngine: process.env.DEFAULT_ENGINE || 'botpress',
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
    maxContextLength: parseInt(process.env.MAX_CONTEXT_LENGTH || '10'),
    enabledEngines: (process.env.ENABLED_ENGINES || 'botpress,huggingface').split(','),
    enabledChannels: (process.env.ENABLED_CHANNELS || 'web').split(',')
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    filePath: process.env.LOG_FILE_PATH
  }
};

module.exports = config;
