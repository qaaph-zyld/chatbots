/**
 * Mongoose Test Setup
 * 
 * Helper utilities for managing Mongoose models in test environments
 */

const mongoose = require('mongoose');
require('../../utils');

/**
 * Clear all Mongoose models to prevent "Cannot overwrite model" errors
 * This is useful for tests where models might be defined multiple times
 */
const clearModels = () => {
  try {
    // Store the current models
    const modelNames = Object.keys(mongoose.models || {});
    
    // Delete each model
    modelNames.forEach((modelName) => {
      delete mongoose.models[modelName];
    });
    
    // Clear model schemas
    if (mongoose.modelSchemas) {
      const schemaNames = Object.keys(mongoose.modelSchemas);
      schemaNames.forEach((schemaName) => {
        delete mongoose.modelSchemas[schemaName];
      });
    }
    
    // Reset mongoose internal cache
    if (mongoose.connection && mongoose.connection.models) {
      Object.keys(mongoose.connection.models).forEach(modelName => {
        delete mongoose.connection.models[modelName];
      });
    }
    
    logger.debug(`Cleared ${modelNames.length} Mongoose models for testing`);
  } catch (error) {
    logger.error('Error clearing Mongoose models', { error: error.message });
  }
};

/**
 * Connect to a test database
 * @returns {Promise<mongoose.Connection>} Database connection
 */
const connectTestDB = async () => {
  try {
    // Use in-memory MongoDB for testing
    const uri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chatbots-test';
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info('Connected to test database');
    return mongoose.connection;
  } catch (error) {
    logger.error('Error connecting to test database', { error: error.message });
    throw error;
  }
};

/**
 * Disconnect from the test database
 * @returns {Promise<void>}
 */
const disconnectTestDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('Disconnected from test database');
  } catch (error) {
    logger.error('Error disconnecting from test database', { error: error.message });
    throw error;
  }
};

/**
 * Clear all collections in the test database
 * @returns {Promise<void>}
 */
const clearDatabase = async () => {
  try {
    const { collections } = mongoose.connection;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    logger.debug('Cleared all collections in test database');
  } catch (error) {
    logger.error('Error clearing test database', { error: error.message });
    throw error;
  }
};

module.exports = {
  clearModels,
  connectTestDB,
  disconnectTestDB,
  clearDatabase
};
