/**
 * Database Connection Pool Manager
 * 
 * This module manages MongoDB connection pooling to optimize database performance
 * by reusing connections and properly handling connection lifecycle events.
 */

const { MongoClient } = require('mongodb');
const config = require('../config');
const { createIndexes } = require('./indexes');

class ConnectionPool {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.connectionPromise = null;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
  }

  /**
   * Get the MongoDB client instance
   * @returns {Promise<MongoClient>} MongoDB client
   */
  async getClient() {
    if (this.client && this.isConnected) {
      return this.client;
    }
    
    await this.connect();
    return this.client;
  }

  /**
   * Get the database instance
   * @returns {Promise<Db>} MongoDB database
   */
  async getDb() {
    if (this.db && this.isConnected) {
      return this.db;
    }
    
    await this.connect();
    return this.db;
  }

  /**
   * Connect to MongoDB with optimized connection pool settings
   * @returns {Promise<void>}
   */
  async connect() {
    // If already connecting, return the existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        if (this.isConnected && this.client) {
          resolve();
          return;
        }

        const options = {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: config.mongodb.maxPoolSize || 100,
          minPoolSize: config.mongodb.minPoolSize || 5,
          connectTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          serverSelectionTimeoutMS: 30000,
          heartbeatFrequencyMS: 10000,
          retryWrites: true,
          retryReads: true,
        };

        console.log('Connecting to MongoDB...');
        this.client = new MongoClient(config.mongodb.uri, options);
        
        await this.client.connect();
        this.db = this.client.db(config.mongodb.dbName);
        this.isConnected = true;
        this.connectionAttempts = 0;
        
        console.log('Connected to MongoDB successfully');
        
        // Set up connection monitoring
        this.client.on('serverHeartbeatSucceeded', () => {
          if (!this.isConnected) {
            console.log('MongoDB connection restored');
            this.isConnected = true;
          }
        });

        this.client.on('serverHeartbeatFailed', (event) => {
          console.warn('MongoDB server heartbeat failed:', event);
          this.isConnected = false;
        });

        this.client.on('close', () => {
          console.warn('MongoDB connection closed');
          this.isConnected = false;
          this._scheduleReconnect();
        });

        this.client.on('error', (error) => {
          console.error('MongoDB connection error:', error);
          this.isConnected = false;
          this._scheduleReconnect();
        });

        // Create database indexes
        await createIndexes(this.db);
        
        resolve();
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        this.isConnected = false;
        
        if (this.connectionAttempts < this.maxConnectionAttempts) {
          this._scheduleReconnect();
        }
        
        reject(error);
      } finally {
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  /**
   * Schedule a reconnection attempt
   * @private
   */
  _scheduleReconnect() {
    this.connectionAttempts += 1;
    
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      console.log(`Scheduling MongoDB reconnection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts} in ${this.reconnectInterval}ms`);
      
      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection attempt failed:', error);
        });
      }, this.reconnectInterval);
    } else {
      console.error(`Maximum MongoDB connection attempts (${this.maxConnectionAttempts}) reached. Giving up.`);
    }
  }

  /**
   * Close the MongoDB connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client) {
      try {
        await this.client.close(true);
        this.isConnected = false;
        this.db = null;
        console.log('MongoDB connection closed');
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        throw error;
      }
    }
  }

  /**
   * Get a collection from the database
   * @param {string} name - Collection name
   * @returns {Promise<Collection>} MongoDB collection
   */
  async getCollection(name) {
    const db = await this.getDb();
    return db.collection(name);
  }

  /**
   * Run a health check on the database connection
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected' };
      }
      
      // Check if we can execute a simple command
      const adminDb = this.client.db().admin();
      const result = await adminDb.ping();
      
      if (result && result.ok === 1) {
        return { 
          status: 'connected',
          ping: result.ok,
          connectionPoolStats: await this._getConnectionPoolStats()
        };
      } else {
        return { status: 'unhealthy' };
      }
    } catch (error) {
      console.error('Database health check failed:', error);
      return { 
        status: 'error',
        message: error.message
      };
    }
  }

  /**
   * Get connection pool statistics
   * @private
   * @returns {Promise<Object>} Connection pool stats
   */
  async _getConnectionPoolStats() {
    try {
      const db = await this.getDb();
      const serverStatus = await db.command({ serverStatus: 1 });
      
      return {
        active: serverStatus.connections.active,
        available: serverStatus.connections.available,
        current: serverStatus.connections.current,
        totalCreated: serverStatus.connections.totalCreated
      };
    } catch (error) {
      console.error('Failed to get connection pool stats:', error);
      return null;
    }
  }
}

// Export singleton instance
const connectionPool = new ConnectionPool();
module.exports = connectionPool;
