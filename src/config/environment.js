/**
 * Environment Configuration
 * 
 * Centralizes access to environment variables with defaults and validation
 */

/**
 * Environment variable configuration with defaults
 * @type {Object}
 */
const environment = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server configuration
  PORT: parseInt(process.env.PORT || '3000', 10),
  
  // Database configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbots',
  
  // Redis configuration
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_TLS: process.env.REDIS_TLS === 'true',
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'development_jwt_secret',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'development_refresh_token_secret',
  
  // External API keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_DEFAULT_MODEL: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
  AZURE_COGNITIVE_SERVICES_KEY: process.env.AZURE_COGNITIVE_SERVICES_KEY || '',
  AZURE_REGION: process.env.AZURE_REGION || 'eastus',
  
  // S3 configuration
  S3_BUCKET: process.env.S3_BUCKET || 'chatbots-development',
  S3_REGION: process.env.S3_REGION || 'us-east-1',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',
  
  // Proxy configuration
  PROXY_PROTOCOL: process.env.PROXY_PROTOCOL || 'http',
  PROXY_HOST: process.env.PROXY_HOST || '104.129.196.38',
  PROXY_PORT: parseInt(process.env.PROXY_PORT || '10563', 10),
  
  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Feature flags
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS !== 'false',
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
};

/**
 * Get environment value by key
 * @param {string} key - Environment variable key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Environment value or default
 */
function get(key, defaultValue) {
  return environment[key] !== undefined ? environment[key] : defaultValue;
}

/**
 * Check if environment is production
 * @returns {boolean} True if production environment
 */
function isProduction() {
  return environment.NODE_ENV === 'production';
}

/**
 * Check if environment is development
 * @returns {boolean} True if development environment
 */
function isDevelopment() {
  return environment.NODE_ENV === 'development';
}

/**
 * Check if environment is test
 * @returns {boolean} True if test environment
 */
function isTest() {
  return environment.NODE_ENV === 'test';
}

module.exports = {
  get,
  isProduction,
  isDevelopment,
  isTest,
  ...environment
};
