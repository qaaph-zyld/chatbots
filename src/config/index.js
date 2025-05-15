/**
 * Configuration module
 * 
 * Centralizes application configuration and environment variables
 */

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
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
  }
};

module.exports = config;
