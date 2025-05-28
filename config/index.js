/**
 * Configuration Manager
 * 
 * Loads environment-specific configuration based on NODE_ENV
 */

const path = require('path');
const { logger } = require('../src/utils');

// Default to development environment if NODE_ENV is not set
const env = process.env.NODE_ENV || 'development';

// Load environment-specific configuration
let config;
try {
  config = require(path.join(__dirname, 'environments', env));
  logger.info(`Loaded configuration for ${env} environment`);
} catch (error) {
  logger.error(`Failed to load configuration for ${env} environment:`, error.message);
  logger.info('Falling back to development configuration');
  config = require(path.join(__dirname, 'environments', 'development'));
}

// Add environment to config
config.env = env;

// Add common configuration
config.common = {
  appName: 'Chatbots Platform',
  version: require('../package.json').version,
  description: 'Customizable Chatbots Platform',
  baseUrl: process.env.BASE_URL || (env === 'production' 
    ? 'https://api.chatbots-platform.com' 
    : env === 'staging' 
      ? 'https://api-staging.chatbots-platform.com' 
      : 'http://localhost:3000')
};

module.exports = config;
