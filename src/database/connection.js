/**
 * Database Connection
 * 
 * Handles connection to MongoDB database
 */

const mongoose = require('mongoose');
const config = require('../config');

/**
 * Connect to MongoDB database
 * @returns {Promise} Mongoose connection promise
 */
const connectDatabase = async () => {
  try {
    const connection = await mongoose.connect(config.database.url, config.database.options);
    console.log(`MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise} Mongoose disconnection promise
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error(`Error disconnecting from MongoDB: ${error.message}`);
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase
};
