/**
 * Database Service
 * 
 * Manages MongoDB connection and provides access to repositories
 */

const mongoose = require('mongoose');
require('@src/utils');
require('@src/config');
require('@src/config\mongodb');

// Import repositories
require('@src/data\analytics.repository');
require('@src/data\conversation.repository');
require('@src/data\chatbot.repository');
require('@src/data\preference.repository');
require('@src/data\entity.repository');
require('@src/data\topic.repository');

class DatabaseService {
  constructor() {
    this.isConnected = false;
    
    // Get MongoDB configuration
    const mongoDbConfig = mongoConfig.getMongoConfig();
    this.connectionUri = mongoDbConfig.uri;
    this.connectionOptions = mongoDbConfig.options;
    
    // Repository registry
    this.repositories = {
      analytics: analyticsRepository,
      conversation: conversationRepository,
      chatbot: chatbotRepository,
      preference: preferenceRepository,
      entity: entityRepository,
      topic: topicRepository
    };
    
    // Connection events
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      logger.info('MongoDB connection established');
    });
    
    mongoose.connection.on('error', (err) => {
      this.isConnected = false;
      logger.error('MongoDB connection error', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('MongoDB connection disconnected');
    });
    
    // Handle application termination
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
  }

  /**
   * Connect to MongoDB
   * @param {Object} options Connection options override
   * @returns {Promise<mongoose.Connection>} Mongoose connection
   */
  async connect(options = {}) {
    if (this.isConnected) {
      logger.debug('Already connected to MongoDB');
      return mongoose.connection;
    }
    
    try {
      // Get MongoDB configuration with any overrides
      const mongoDbConfig = mongoConfig.getMongoConfig(options);
      const uri = options.uri || this.connectionUri;
      const connectionOptions = { ...this.connectionOptions, ...options.options };
      
      logger.info('Connecting to MongoDB', { uri: this.maskUri(uri) });
      
      // Connect to MongoDB with retry logic
      let attempts = mongoDbConfig.retry.attempts;
      let lastError = null;
      
      while (attempts > 0) {
        try {
          await mongoose.connect(uri, connectionOptions);
          this.isConnected = true;
          
          // Save successful URI for future use
          mongoConfig.saveSuccessfulUri(uri);
          
          // Create indexes for optimization
          await this.createIndexes();
          
          return mongoose.connection;
        } catch (err) {
          lastError = err;
          attempts--;
          
          if (attempts > 0) {
            logger.warn(`MongoDB connection attempt failed, retrying... (${attempts} attempts left)`, { error: err.message });
            await new Promise(resolve => setTimeout(resolve, mongoDbConfig.retry.delay));
          }
        }
      }
      
      // If we get here, all connection attempts failed
      throw lastError || new Error('Failed to connect to MongoDB after multiple attempts');
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error: error.message });
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      if (!this.isConnected) {
        logger.debug('No MongoDB connection to close');
        return;
      }
      
      logger.info('Disconnecting from MongoDB');
      
      await mongoose.disconnect();
      this.isConnected = false;
    } catch (error) {
      logger.error('Failed to disconnect from MongoDB', { error: error.message });
      throw error;
    }
  }

  /**
   * Gracefully shutdown MongoDB connection
   */
  async gracefulShutdown() {
    try {
      logger.info('Shutting down MongoDB connection');
      
      await this.disconnect();
      
      logger.info('MongoDB connection closed through app termination');
    } catch (error) {
      logger.error('Error during MongoDB shutdown', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Create indexes for collections
   * @returns {Promise<void>}
   */
  async createIndexes() {
    try {
      logger.debug('Creating MongoDB indexes');
      
      // Analytics indexes
      const Analytics = mongoose.model('Analytics');
      await Analytics.collection.createIndex({ chatbotId: 1, period: 1, date: 1 }, { background: true });
      await Analytics.collection.createIndex({ chatbotId: 1, period: 1 }, { background: true });
      
      // Conversation indexes
      const Conversation = mongoose.model('Conversation');
      await Conversation.collection.createIndex({ chatbotId: 1, status: 1, lastActivity: -1 }, { background: true });
      await Conversation.collection.createIndex({ userId: 1, lastActivity: -1 }, { background: true });
      await Conversation.collection.createIndex({ chatbotId: 1, createdAt: 1 }, { background: true });
      
      logger.debug('MongoDB indexes created successfully');
    } catch (error) {
      logger.error('Failed to create MongoDB indexes', { error: error.message });
      // Don't throw error, just log it
    }
  }

  /**
   * Get repository by name
   * @param {string} name - Repository name
   * @returns {BaseRepository} Repository instance
   */
  getRepository(name) {
    const repository = this.repositories[name];
    
    if (!repository) {
      throw new Error(`Repository not found: ${name}`);
    }
    
    return repository;
  }

  /**
   * Register a new repository
   * @param {string} name - Repository name
   * @param {BaseRepository} repository - Repository instance
   */
  registerRepository(name, repository) {
    this.repositories[name] = repository;
    logger.debug(`Repository registered: ${name}`);
  }

  /**
   * Mask MongoDB URI for logging
   * @param {string} uri - MongoDB URI
   * @returns {string} Masked URI
   */
  maskUri(uri) {
    if (!uri) return '';
    
    try {
      const parsedUri = new URL(uri);
      
      if (parsedUri.password) {
        parsedUri.password = '***';
      }
      
      return parsedUri.toString();
    } catch (error) {
      // If URI parsing fails, mask manually
      return uri.replace(/\/\/([^:]+):([^@]+)@/, '//\$1:***@');
    }
  }
}

// Create singleton instance
const databaseService = new DatabaseService();

module.exports = databaseService;
