/**
 * Integration Tests Global Setup
 * 
 * This file contains setup code that runs once before all integration tests
 */

const { logger } = require('../../utils');

module.exports = async () => {
  // Disable logging during tests
  logger.silent = true;
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.API_KEY_SECRET = 'test-api-key-secret';
  
  console.log('Global setup for integration tests completed');
};
