/**
 * Database Connection Module
 * 
 * Provides database connection functionality for the chatbot platform
 */

const mongoose = require('mongoose');
require('@src/utils');
require('@src/config');

/**
 * Connect to the MongoDB database
 * @returns {Promise<mongoose.Connection>} Database connection
 */
const connectDB = async () => {
  try {
    const options = config.database.options || {
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
    
    logger.info('Connecting to database...', { uri: config.database.uri });
    
    const connection = await mongoose.connect(config.database.uri, options);
    
    logger.info('Database connection established');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('Database connection error', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
    });
    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Database connection closed due to app termination');
      process.exit(0);
    });
    
    return connection;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    throw error;
  }
};

/**
 * Disconnect from the MongoDB database
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', { error: error.message });
    throw error;
  }
};

/**
 * Get the current database connection
 * @returns {mongoose.Connection} Database connection
 */
const getConnection = () => {
  return mongoose.connection;
};

/**
 * Check if the database is connected
 * @returns {boolean} True if connected
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnection,
  isConnected
};
