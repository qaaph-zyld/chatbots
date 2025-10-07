const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.retryAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        retryWrites: true,
        w: 'majority'
      };

      logger.info('Connecting to MongoDB...');
      
      await mongoose.connect(mongoUri, options);
      
      this.isConnected = true;
      this.retryAttempts = 0;
      
      logger.info('Successfully connected to MongoDB');
      
      // Handle connection events
      mongoose.connection.on('error', this.handleError.bind(this));
      mongoose.connection.on('disconnected', this.handleDisconnect.bind(this));
      mongoose.connection.on('reconnected', this.handleReconnect.bind(this));
      
      return true;
    } catch (error) {
      logger.error('MongoDB connection failed:', error.message);
      
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        logger.info(`Retrying connection in ${this.retryDelay / 1000} seconds... (Attempt ${this.retryAttempts}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connect();
      } else {
        logger.error('Max retry attempts reached. Could not connect to MongoDB');
        throw error;
      }
    }
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await mongoose.disconnect();
        this.isConnected = false;
        logger.info('Disconnected from MongoDB');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error.message);
      throw error;
    }
  }

  handleError(error) {
    logger.error('MongoDB connection error:', error.message);
    this.isConnected = false;
  }

  handleDisconnect() {
    logger.warn('MongoDB disconnected');
    this.isConnected = false;
  }

  handleReconnect() {
    logger.info('MongoDB reconnected');
    this.isConnected = true;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

module.exports = new DatabaseConnection();
