/**
 * MongoDB Database Connection Module
 * 
 * Provides connection pooling, transaction support, and connection management
 * for MongoDB database operations throughout the application.
 */

const mongoose = require('mongoose');
const { logger } = require('../../utils/logger');

// Configuration with defaults that can be overridden
const DEFAULT_CONFIG = {
  poolSize: 10,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true
};

// Track connection state
let isConnected = false;
let connectionPromise = null;

/**
 * Initialize the MongoDB connection with connection pooling
 * 
 * @param {Object} config - MongoDB connection configuration
 * @param {string} config.uri - MongoDB connection URI
 * @param {Object} config.options - Additional connection options
 * @returns {Promise} - Resolves when connection is established
 */
const initialize = async (config) => {
  if (isConnected) {
    logger.info('MongoDB: Using existing connection');
    return mongoose.connection;
  }

  if (connectionPromise) {
    logger.info('MongoDB: Connection in progress, waiting...');
    return connectionPromise;
  }

  const { uri, options = {} } = config;
  
  if (!uri) {
    throw new Error('MongoDB: Connection URI is required');
  }

  const connectionOptions = {
    ...DEFAULT_CONFIG,
    ...options
  };

  logger.info('MongoDB: Initializing connection pool');
  
  // Create a promise for the connection attempt
  connectionPromise = mongoose.connect(uri, connectionOptions)
    .then((connection) => {
      isConnected = true;
      logger.info('MongoDB: Connection established successfully');
      
      // Set up connection event handlers
      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB: Connection error: ${err.message}`);
        isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB: Disconnected from database');
        isConnected = false;
      });
      
      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB: Reconnected to database');
        isConnected = true;
      });
      
      return connection;
    })
    .catch((err) => {
      logger.error(`MongoDB: Connection failed: ${err.message}`);
      connectionPromise = null;
      throw err;
    });

  return connectionPromise;
};

/**
 * Close the MongoDB connection
 * 
 * @returns {Promise} - Resolves when connection is closed
 */
const disconnect = async () => {
  if (!isConnected) {
    logger.info('MongoDB: No active connection to close');
    return;
  }
  
  try {
    await mongoose.disconnect();
    logger.info('MongoDB: Connection closed successfully');
    isConnected = false;
    connectionPromise = null;
  } catch (err) {
    logger.error(`MongoDB: Error closing connection: ${err.message}`);
    throw err;
  }
};

/**
 * Get the current MongoDB connection
 * 
 * @returns {Object} - Mongoose connection object
 */
const getConnection = () => {
  if (!isConnected) {
    logger.warn('MongoDB: Attempting to get connection before initialization');
  }
  return mongoose.connection;
};

/**
 * Start a MongoDB transaction
 * 
 * @returns {Promise<Object>} - MongoDB session with transaction
 */
const startTransaction = async () => {
  if (!isConnected) {
    throw new Error('MongoDB: Cannot start transaction, no active connection');
  }
  
  const session = await mongoose.startSession();
  session.startTransaction();
  logger.debug('MongoDB: Transaction started');
  return session;
};

/**
 * Check if the database connection is healthy
 * 
 * @returns {Promise<boolean>} - True if connection is healthy
 */
const healthCheck = async () => {
  if (!isConnected) {
    return false;
  }
  
  try {
    // Execute a simple command to verify connection
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (err) {
    logger.error(`MongoDB: Health check failed: ${err.message}`);
    return false;
  }
};

module.exports = {
  initialize,
  disconnect,
  getConnection,
  startTransaction,
  healthCheck,
  isConnected: () => isConnected
};