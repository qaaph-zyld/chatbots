/**
 * Database Connection Health Checker
 * 
 * This module provides utilities for monitoring and maintaining healthy database connections,
 * automatically detecting and recovering from connection issues.
 */

const EventEmitter = require('events');

class ConnectionHealthChecker extends EventEmitter {
  /**
   * Create a new database connection health checker
   * @param {Object} options - Configuration options
   * @param {Object} options.mongoose - Mongoose instance
   * @param {Object} options.redis - Redis client instance (optional)
   * @param {number} options.checkInterval - Interval in ms to check connections (default: 30000)
   * @param {number} options.reconnectTimeout - Timeout in ms for reconnection attempts (default: 5000)
   * @param {number} options.maxReconnectAttempts - Maximum reconnection attempts (default: 10)
   * @param {Function} options.onMongoDisconnect - Callback when MongoDB disconnects
   * @param {Function} options.onMongoReconnect - Callback when MongoDB reconnects
   * @param {Function} options.onRedisDisconnect - Callback when Redis disconnects
   * @param {Function} options.onRedisReconnect - Callback when Redis reconnects
   * @param {Object} options.logger - Logger instance (default: console)
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      checkInterval: 30000, // 30 seconds
      reconnectTimeout: 5000, // 5 seconds
      maxReconnectAttempts: 10,
      logger: console,
      ...options
    };
    
    this.mongoose = options.mongoose;
    this.redis = options.redis;
    
    this.isRunning = false;
    this.checkIntervalId = null;
    
    this.mongoStatus = {
      isConnected: false,
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      reconnectAttempts: 0,
      errors: []
    };
    
    this.redisStatus = {
      isConnected: false,
      lastConnectedAt: null,
      lastDisconnectedAt: null,
      reconnectAttempts: 0,
      errors: []
    };
    
    // Bind methods
    this._checkConnections = this._checkConnections.bind(this);
    this._setupMongooseListeners = this._setupMongooseListeners.bind(this);
    this._setupRedisListeners = this._setupRedisListeners.bind(this);
    this._reconnectMongo = this._reconnectMongo.bind(this);
    this._reconnectRedis = this._reconnectRedis.bind(this);
    
    // Initialize logger
    this.logger = options.logger || console;
  }

  /**
   * Start connection health monitoring
   * @returns {ConnectionHealthChecker} This instance for chaining
   */
  start() {
    if (this.isRunning) {
      return this;
    }
    
    this.logger.info('Starting database connection health checker');
    
    this.isRunning = true;
    
    // Setup connection event listeners
    if (this.mongoose) {
      this._setupMongooseListeners();
    }
    
    if (this.redis) {
      this._setupRedisListeners();
    }
    
    // Initial connection check
    this._checkConnections();
    
    // Start periodic checks
    this.checkIntervalId = setInterval(
      this._checkConnections,
      this.options.checkInterval
    );
    
    this.emit('started');
    
    return this;
  }

  /**
   * Stop connection health monitoring
   * @returns {ConnectionHealthChecker} This instance for chaining
   */
  stop() {
    if (!this.isRunning) {
      return this;
    }
    
    this.logger.info('Stopping database connection health checker');
    
    this.isRunning = false;
    
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    
    // Remove event listeners
    if (this.mongoose && this.mongoose.connection) {
      this.mongoose.connection.removeAllListeners('connected');
      this.mongoose.connection.removeAllListeners('disconnected');
      this.mongoose.connection.removeAllListeners('error');
    }
    
    if (this.redis) {
      this.redis.removeAllListeners('connect');
      this.redis.removeAllListeners('ready');
      this.redis.removeAllListeners('error');
      this.redis.removeAllListeners('close');
      this.redis.removeAllListeners('reconnecting');
      this.redis.removeAllListeners('end');
    }
    
    this.emit('stopped');
    
    return this;
  }

  /**
   * Get current connection status
   * @returns {Object} Connection status for MongoDB and Redis
   */
  getStatus() {
    return {
      mongo: { ...this.mongoStatus },
      redis: { ...this.redisStatus },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Force reconnection to databases
   * @returns {Promise<Object>} Reconnection results
   */
  async forceReconnect() {
    const results = {
      mongo: { attempted: false, success: false },
      redis: { attempted: false, success: false }
    };
    
    if (this.mongoose) {
      results.mongo.attempted = true;
      try {
        await this._reconnectMongo();
        results.mongo.success = true;
      } catch (error) {
        results.mongo.error = error.message;
      }
    }
    
    if (this.redis) {
      results.redis.attempted = true;
      try {
        await this._reconnectRedis();
        results.redis.success = true;
      } catch (error) {
        results.redis.error = error.message;
      }
    }
    
    return results;
  }

  /**
   * Setup Mongoose connection event listeners
   * @private
   */
  _setupMongooseListeners() {
    if (!this.mongoose || !this.mongoose.connection) {
      return;
    }
    
    const connection = this.mongoose.connection;
    
    // Remove existing listeners to avoid duplicates
    connection.removeAllListeners('connected');
    connection.removeAllListeners('disconnected');
    connection.removeAllListeners('error');
    
    // Connected event
    connection.on('connected', () => {
      this.logger.info('MongoDB connected');
      
      this.mongoStatus.isConnected = true;
      this.mongoStatus.lastConnectedAt = new Date();
      this.mongoStatus.reconnectAttempts = 0;
      
      this.emit('mongoConnected');
      
      if (typeof this.options.onMongoReconnect === 'function') {
        this.options.onMongoReconnect();
      }
    });
    
    // Disconnected event
    connection.on('disconnected', () => {
      this.logger.warn('MongoDB disconnected');
      
      this.mongoStatus.isConnected = false;
      this.mongoStatus.lastDisconnectedAt = new Date();
      
      this.emit('mongoDisconnected');
      
      if (typeof this.options.onMongoDisconnect === 'function') {
        this.options.onMongoDisconnect();
      }
      
      // Attempt to reconnect
      if (this.isRunning) {
        this._reconnectMongo();
      }
    });
    
    // Error event
    connection.on('error', (error) => {
      this.logger.error('MongoDB connection error:', error);
      
      this.mongoStatus.errors.push({
        timestamp: new Date(),
        message: error.message
      });
      
      // Keep only the last 10 errors
      if (this.mongoStatus.errors.length > 10) {
        this.mongoStatus.errors.shift();
      }
      
      this.emit('mongoError', error);
    });
  }

  /**
   * Setup Redis connection event listeners
   * @private
   */
  _setupRedisListeners() {
    if (!this.redis) {
      return;
    }
    
    // Remove existing listeners to avoid duplicates
    this.redis.removeAllListeners('connect');
    this.redis.removeAllListeners('ready');
    this.redis.removeAllListeners('error');
    this.redis.removeAllListeners('close');
    this.redis.removeAllListeners('reconnecting');
    this.redis.removeAllListeners('end');
    
    // Connect event
    this.redis.on('connect', () => {
      this.logger.info('Redis connected');
      
      this.redisStatus.isConnected = true;
      this.redisStatus.lastConnectedAt = new Date();
      this.redisStatus.reconnectAttempts = 0;
      
      this.emit('redisConnected');
    });
    
    // Ready event (fully connected and ready for commands)
    this.redis.on('ready', () => {
      this.logger.info('Redis ready');
      
      if (typeof this.options.onRedisReconnect === 'function') {
        this.options.onRedisReconnect();
      }
    });
    
    // Error event
    this.redis.on('error', (error) => {
      this.logger.error('Redis error:', error);
      
      this.redisStatus.errors.push({
        timestamp: new Date(),
        message: error.message
      });
      
      // Keep only the last 10 errors
      if (this.redisStatus.errors.length > 10) {
        this.redisStatus.errors.shift();
      }
      
      this.emit('redisError', error);
    });
    
    // Close event
    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
      
      this.redisStatus.isConnected = false;
      this.redisStatus.lastDisconnectedAt = new Date();
      
      this.emit('redisDisconnected');
      
      if (typeof this.options.onRedisDisconnect === 'function') {
        this.options.onRedisDisconnect();
      }
    });
    
    // Reconnecting event
    this.redis.on('reconnecting', () => {
      this.logger.info('Redis reconnecting');
      this.redisStatus.reconnectAttempts++;
      
      this.emit('redisReconnecting', this.redisStatus.reconnectAttempts);
    });
    
    // End event (connection closed permanently)
    this.redis.on('end', () => {
      this.logger.warn('Redis connection ended');
      
      this.redisStatus.isConnected = false;
      this.redisStatus.lastDisconnectedAt = new Date();
      
      this.emit('redisEnded');
      
      // Attempt to reconnect if running
      if (this.isRunning) {
        this._reconnectRedis();
      }
    });
  }

  /**
   * Check database connections
   * @private
   */
  async _checkConnections() {
    try {
      // Check MongoDB connection
      if (this.mongoose) {
        const mongoState = this.mongoose.connection.readyState;
        
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        if (mongoState === 1) {
          // Connected - perform a simple query to verify connection is working
          try {
            await this.mongoose.connection.db.admin().ping();
            
            if (!this.mongoStatus.isConnected) {
              this.logger.info('MongoDB connection verified');
              this.mongoStatus.isConnected = true;
              this.mongoStatus.lastConnectedAt = new Date();
              this.emit('mongoConnected');
            }
          } catch (error) {
            this.logger.error('MongoDB ping failed:', error);
            
            this.mongoStatus.isConnected = false;
            this.mongoStatus.lastDisconnectedAt = new Date();
            
            this.emit('mongoDisconnected');
            
            // Attempt to reconnect
            this._reconnectMongo();
          }
        } else if (mongoState === 0 && this.isRunning) {
          // Disconnected - attempt to reconnect
          this.logger.warn('MongoDB disconnected, attempting to reconnect');
          
          this.mongoStatus.isConnected = false;
          this.mongoStatus.lastDisconnectedAt = new Date();
          
          this.emit('mongoDisconnected');
          
          this._reconnectMongo();
        }
      }
      
      // Check Redis connection
      if (this.redis) {
        try {
          // Perform a simple ping to verify connection
          const pingResult = await this.redis.ping();
          
          if (pingResult === 'PONG') {
            if (!this.redisStatus.isConnected) {
              this.logger.info('Redis connection verified');
              this.redisStatus.isConnected = true;
              this.redisStatus.lastConnectedAt = new Date();
              this.emit('redisConnected');
            }
          } else {
            throw new Error('Redis ping failed');
          }
        } catch (error) {
          this.logger.error('Redis check failed:', error);
          
          this.redisStatus.isConnected = false;
          this.redisStatus.lastDisconnectedAt = new Date();
          
          this.emit('redisDisconnected');
          
          // Attempt to reconnect
          if (this.isRunning) {
            this._reconnectRedis();
          }
        }
      }
      
      // Emit status update
      this.emit('statusUpdate', this.getStatus());
    } catch (error) {
      this.logger.error('Error checking connections:', error);
      this.emit('error', error);
    }
  }

  /**
   * Reconnect to MongoDB
   * @private
   * @returns {Promise<void>}
   */
  async _reconnectMongo() {
    if (!this.mongoose) {
      return;
    }
    
    // Check if max reconnect attempts reached
    if (this.mongoStatus.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.logger.error(`MongoDB max reconnect attempts (${this.options.maxReconnectAttempts}) reached`);
      this.emit('mongoMaxReconnectAttemptsReached');
      return;
    }
    
    this.mongoStatus.reconnectAttempts++;
    
    this.logger.info(`Attempting to reconnect to MongoDB (attempt ${this.mongoStatus.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    
    try {
      // Close existing connection if it exists
      if (this.mongoose.connection.readyState !== 0) {
        await this.mongoose.connection.close();
      }
      
      // Reconnect
      await this.mongoose.connect(this.mongoose.connectionString || process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: this.options.reconnectTimeout,
        connectTimeoutMS: this.options.reconnectTimeout
      });
      
      this.logger.info('MongoDB reconnected successfully');
      
      this.mongoStatus.isConnected = true;
      this.mongoStatus.lastConnectedAt = new Date();
      
      this.emit('mongoReconnected');
      
      if (typeof this.options.onMongoReconnect === 'function') {
        this.options.onMongoReconnect();
      }
    } catch (error) {
      this.logger.error('MongoDB reconnection failed:', error);
      
      this.mongoStatus.errors.push({
        timestamp: new Date(),
        message: error.message
      });
      
      // Keep only the last 10 errors
      if (this.mongoStatus.errors.length > 10) {
        this.mongoStatus.errors.shift();
      }
      
      this.emit('mongoReconnectFailed', error);
      
      // Schedule another reconnection attempt
      if (this.isRunning && this.mongoStatus.reconnectAttempts < this.options.maxReconnectAttempts) {
        setTimeout(() => {
          this._reconnectMongo();
        }, this.options.reconnectTimeout);
      }
    }
  }

  /**
   * Reconnect to Redis
   * @private
   * @returns {Promise<void>}
   */
  async _reconnectRedis() {
    if (!this.redis) {
      return;
    }
    
    // Check if max reconnect attempts reached
    if (this.redisStatus.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.logger.error(`Redis max reconnect attempts (${this.options.maxReconnectAttempts}) reached`);
      this.emit('redisMaxReconnectAttemptsReached');
      return;
    }
    
    this.redisStatus.reconnectAttempts++;
    
    this.logger.info(`Attempting to reconnect to Redis (attempt ${this.redisStatus.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    
    try {
      // For Redis clients that support reconnect()
      if (typeof this.redis.reconnect === 'function') {
        await this.redis.reconnect();
      } 
      // For Redis clients that support connect()
      else if (typeof this.redis.connect === 'function') {
        await this.redis.connect();
      }
      // For older Redis clients that don't have explicit reconnect methods
      else {
        // Try to ping, which may trigger an auto-reconnect in some clients
        await this.redis.ping();
      }
      
      this.logger.info('Redis reconnected successfully');
      
      this.redisStatus.isConnected = true;
      this.redisStatus.lastConnectedAt = new Date();
      
      this.emit('redisReconnected');
      
      if (typeof this.options.onRedisReconnect === 'function') {
        this.options.onRedisReconnect();
      }
    } catch (error) {
      this.logger.error('Redis reconnection failed:', error);
      
      this.redisStatus.errors.push({
        timestamp: new Date(),
        message: error.message
      });
      
      // Keep only the last 10 errors
      if (this.redisStatus.errors.length > 10) {
        this.redisStatus.errors.shift();
      }
      
      this.emit('redisReconnectFailed', error);
      
      // Schedule another reconnection attempt
      if (this.isRunning && this.redisStatus.reconnectAttempts < this.options.maxReconnectAttempts) {
        setTimeout(() => {
          this._reconnectRedis();
        }, this.options.reconnectTimeout);
      }
    }
  }
}

module.exports = ConnectionHealthChecker;
