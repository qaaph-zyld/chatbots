/**
 * Database Connection
 * 
 * Handles connection to MongoDB database with performance optimizations
 */

const mongoose = require('mongoose');
const config = require('../config');
const cacheService = require('./cache');

/**
 * Connect to MongoDB database with optimized settings
 * @returns {Promise} Mongoose connection promise
 */
const connectDatabase = async () => {
  try {
    // Optimized connection options
    const optimizedOptions = {
      ...config.database.options,
      maxPoolSize: 10, // Maximum number of connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      compressors: ['zlib'], // Enable compression
      zlibCompressionLevel: 6 // Compression level
    };

    const connection = await mongoose.connect(config.database.url, optimizedOptions);
    
    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

    // Initialize cache service
    try {
      await cacheService.connect();
      console.log('Cache service initialized');
    } catch (cacheError) {
      console.warn('Cache service failed to initialize:', cacheError.message);
    }

    console.log(`MongoDB Connected: ${connection.connection.host}`);
    console.log(`Connection pool size: ${optimizedOptions.maxPoolSize}`);
    
    return connection;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database and cache
 * @returns {Promise} Mongoose disconnection promise
 */
const disconnectDatabase = async () => {
  try {
    // Disconnect cache service first
    await cacheService.disconnect();
    
    // Then disconnect MongoDB
    await mongoose.disconnect();
    console.log('MongoDB and Cache Disconnected');
  } catch (error) {
    console.error(`Error disconnecting from databases: ${error.message}`);
  }
};

/**
 * Get database performance metrics
 * @returns {object} Performance metrics
 */
const getPerformanceMetrics = async () => {
  try {
    const mongoStats = {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };

    const cacheStats = await cacheService.getStats();

    return {
      mongodb: mongoStats,
      cache: cacheStats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return { error: error.message };
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getPerformanceMetrics,
  cacheService
};
