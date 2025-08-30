/**
 * MongoDB Connection Helper
 * 
 * Utility to diagnose and fix MongoDB connection issues
 */

const mongoose = require('mongoose');
require('@src/utils\logger');

/**
 * Test MongoDB connection with various configurations
 * @param {Object} options Connection options
 * @returns {Promise<Object>} Connection test results
 */
async function testConnection(options = {}) {
  const results = {
    defaultConnection: false,
    testConnection: false,
    customConnection: false,
    error: null,
    successfulUri: null
  };
  
  // Try default connection
  try {
    logger.info('Testing default MongoDB connection');
    await mongoose.connect('mongodb://localhost:27017/chatbots', {
      serverSelectionTimeoutMS: 5000
    });
    results.defaultConnection = true;
    results.successfulUri = 'mongodb://localhost:27017/chatbots';
    await mongoose.disconnect();
    logger.info('Default MongoDB connection successful');
  } catch (error) {
    logger.error('Default MongoDB connection failed', { error: error.message });
    results.error = error.message;
  }
  
  // Try test database connection
  try {
    if (!results.defaultConnection) {
      logger.info('Testing test database MongoDB connection');
      await mongoose.connect('mongodb://localhost:27017/chatbots-test', {
        serverSelectionTimeoutMS: 5000
      });
      results.testConnection = true;
      results.successfulUri = 'mongodb://localhost:27017/chatbots-test';
      await mongoose.disconnect();
      logger.info('Test database MongoDB connection successful');
    }
  } catch (error) {
    logger.error('Test database MongoDB connection failed', { error: error.message });
    if (!results.error) results.error = error.message;
  }
  
  // Try custom connection if provided
  if (options.uri && !results.defaultConnection && !results.testConnection) {
    try {
      logger.info('Testing custom MongoDB connection', { uri: options.uri });
      await mongoose.connect(options.uri, {
        serverSelectionTimeoutMS: 5000
      });
      results.customConnection = true;
      results.successfulUri = options.uri;
      await mongoose.disconnect();
      logger.info('Custom MongoDB connection successful');
    } catch (error) {
      logger.error('Custom MongoDB connection failed', { error: error.message });
      if (!results.error) results.error = error.message;
    }
  }
  
  return results;
}

/**
 * Check if MongoDB is running and accessible
 * @returns {Promise<boolean>} Whether MongoDB is accessible
 */
async function isMongoDBRunning() {
  try {
    const results = await testConnection();
    return results.defaultConnection || results.testConnection;
  } catch (error) {
    logger.error('Error checking MongoDB status', { error: error.message });
    return false;
  }
}

/**
 * Get recommended MongoDB connection URI based on tests
 * @param {Object} options Connection options
 * @returns {Promise<string|null>} Recommended connection URI or null if none successful
 */
async function getRecommendedUri(options = {}) {
  const results = await testConnection(options);
  return results.successfulUri;
}

/**
 * Update environment variables with working MongoDB URI
 * @returns {Promise<boolean>} Whether update was successful
 */
async function updateEnvironmentWithWorkingUri() {
  try {
    const uri = await getRecommendedUri();
    if (uri) {
      process.env.MONGODB_URI = uri;
      logger.info('Updated environment with working MongoDB URI', { uri });
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to update environment with working URI', { error: error.message });
    return false;
  }
}

module.exports = {
  testConnection,
  isMongoDBRunning,
  getRecommendedUri,
  updateEnvironmentWithWorkingUri
};
