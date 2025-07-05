/**
 * Database Connection Optimizer
 * 
 * This module provides utilities for optimizing database connections,
 * including connection pooling, retry mechanisms, and performance monitoring.
 */

const EventEmitter = require('events');
const { promisify } = require('util');

class ConnectionOptimizer extends EventEmitter {
  /**
   * Create a new connection optimizer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      poolSize: options.poolSize || 10,
      minPoolSize: options.minPoolSize || 2,
      maxPoolSize: options.maxPoolSize || 20,
      idleTimeoutMs: options.idleTimeoutMs || 30000, // 30 seconds
      maxWaitingClients: options.maxWaitingClients || 50,
      acquireTimeoutMs: options.acquireTimeoutMs || 10000, // 10 seconds
      retryAttempts: options.retryAttempts || 3,
      retryDelayMs: options.retryDelayMs || 1000, // 1 second
      monitorIntervalMs: options.monitorIntervalMs || 60000, // 1 minute
      logger: options.logger || console,
      ...options
    };
    
    this.pools = new Map();
    this.monitors = new Map();
    this.stats = new Map();
    
    // Bind methods
    this._monitorPool = this._monitorPool.bind(this);
  }

  /**
   * Create a MongoDB connection pool
   * @param {string} name - Pool name
   * @param {Object} options - Pool options
   * @returns {Object} Connection pool
   */
  createMongoPool(name, options = {}) {
    try {
      const mongoose = require('mongoose');
      
      // Check if pool already exists
      if (this.pools.has(name)) {
        return this.pools.get(name);
      }
      
      const poolOptions = {
        ...this.options,
        ...options
      };
      
      // Set up connection options
      const mongooseOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: poolOptions.maxPoolSize,
        minPoolSize: poolOptions.minPoolSize,
        connectTimeoutMS: poolOptions.acquireTimeoutMs,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 30000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        retryReads: true,
        ...poolOptions.mongooseOptions
      };
      
      // Create connection
      const connection = mongoose.createConnection(
        poolOptions.uri,
        mongooseOptions
      );
      
      // Set up event listeners
      connection.on('connected', () => {
        this.options.logger.info(`MongoDB connection pool '${name}' connected`);
        this.emit('connected', { name, connection });
      });
      
      connection.on('disconnected', () => {
        this.options.logger.warn(`MongoDB connection pool '${name}' disconnected`);
        this.emit('disconnected', { name });
      });
      
      connection.on('error', (err) => {
        this.options.logger.error(`MongoDB connection pool '${name}' error:`, err);
        this.emit('error', { name, error: err });
      });
      
      connection.on('reconnected', () => {
        this.options.logger.info(`MongoDB connection pool '${name}' reconnected`);
        this.emit('reconnected', { name });
      });
      
      // Store pool
      this.pools.set(name, connection);
      
      // Initialize stats
      this.stats.set(name, {
        created: Date.now(),
        connections: 0,
        maxConnections: 0,
        acquireCount: 0,
        releaseCount: 0,
        errorCount: 0,
        idleCount: 0,
        waitingCount: 0,
        waitTime: 0,
        totalQueryTime: 0,
        queryCount: 0
      });
      
      // Start monitoring
      this._startMonitoring(name, connection);
      
      return connection;
    } catch (err) {
      this.options.logger.error(`Failed to create MongoDB connection pool '${name}':`, err);
      throw err;
    }
  }

  /**
   * Create a MySQL connection pool
   * @param {string} name - Pool name
   * @param {Object} options - Pool options
   * @returns {Object} Connection pool
   */
  createMySQLPool(name, options = {}) {
    try {
      const mysql = require('mysql2');
      
      // Check if pool already exists
      if (this.pools.has(name)) {
        return this.pools.get(name);
      }
      
      const poolOptions = {
        ...this.options,
        ...options
      };
      
      // Create pool
      const pool = mysql.createPool({
        host: poolOptions.host,
        user: poolOptions.user,
        password: poolOptions.password,
        database: poolOptions.database,
        connectionLimit: poolOptions.poolSize,
        queueLimit: poolOptions.maxWaitingClients,
        waitForConnections: true,
        ...poolOptions.mysqlOptions
      });
      
      // Promisify pool
      const promisePool = pool.promise();
      
      // Store pool
      this.pools.set(name, promisePool);
      
      // Initialize stats
      this.stats.set(name, {
        created: Date.now(),
        connections: 0,
        maxConnections: 0,
        acquireCount: 0,
        releaseCount: 0,
        errorCount: 0,
        idleCount: 0,
        waitingCount: 0,
        waitTime: 0,
        totalQueryTime: 0,
        queryCount: 0
      });
      
      // Start monitoring
      this._startMonitoring(name, promisePool);
      
      return promisePool;
    } catch (err) {
      this.options.logger.error(`Failed to create MySQL connection pool '${name}':`, err);
      throw err;
    }
  }

  /**
   * Create a PostgreSQL connection pool
   * @param {string} name - Pool name
   * @param {Object} options - Pool options
   * @returns {Object} Connection pool
   */
  createPgPool(name, options = {}) {
    try {
      const { Pool } = require('pg');
      
      // Check if pool already exists
      if (this.pools.has(name)) {
        return this.pools.get(name);
      }
      
      const poolOptions = {
        ...this.options,
        ...options
      };
      
      // Create pool
      const pool = new Pool({
        host: poolOptions.host,
        user: poolOptions.user,
        password: poolOptions.password,
        database: poolOptions.database,
        port: poolOptions.port || 5432,
        max: poolOptions.maxPoolSize,
        idleTimeoutMillis: poolOptions.idleTimeoutMs,
        connectionTimeoutMillis: poolOptions.acquireTimeoutMs,
        ...poolOptions.pgOptions
      });
      
      // Set up event listeners
      pool.on('connect', (client) => {
        const stats = this.stats.get(name);
        if (stats) {
          stats.connections++;
          stats.maxConnections = Math.max(stats.maxConnections, stats.connections);
          stats.acquireCount++;
        }
        
        this.emit('acquire', { name, client });
      });
      
      pool.on('error', (err, client) => {
        const stats = this.stats.get(name);
        if (stats) {
          stats.errorCount++;
        }
        
        this.options.logger.error(`PostgreSQL connection pool '${name}' error:`, err);
        this.emit('error', { name, error: err, client });
      });
      
      pool.on('remove', (client) => {
        const stats = this.stats.get(name);
        if (stats) {
          stats.connections--;
          stats.releaseCount++;
        }
        
        this.emit('release', { name, client });
      });
      
      // Store pool
      this.pools.set(name, pool);
      
      // Initialize stats
      this.stats.set(name, {
        created: Date.now(),
        connections: 0,
        maxConnections: 0,
        acquireCount: 0,
        releaseCount: 0,
        errorCount: 0,
        idleCount: 0,
        waitingCount: 0,
        waitTime: 0,
        totalQueryTime: 0,
        queryCount: 0
      });
      
      // Start monitoring
      this._startMonitoring(name, pool);
      
      return pool;
    } catch (err) {
      this.options.logger.error(`Failed to create PostgreSQL connection pool '${name}':`, err);
      throw err;
    }
  }

  /**
   * Create a Redis connection pool
   * @param {string} name - Pool name
   * @param {Object} options - Pool options
   * @returns {Object} Connection pool
   */
  createRedisPool(name, options = {}) {
    try {
      const Redis = require('ioredis');
      
      // Check if pool already exists
      if (this.pools.has(name)) {
        return this.pools.get(name);
      }
      
      const poolOptions = {
        ...this.options,
        ...options
      };
      
      // Create Redis client
      const redis = new Redis({
        host: poolOptions.host,
        port: poolOptions.port || 6379,
        password: poolOptions.password,
        db: poolOptions.db || 0,
        maxRetriesPerRequest: poolOptions.retryAttempts,
        connectTimeout: poolOptions.acquireTimeoutMs,
        ...poolOptions.redisOptions
      });
      
      // Set up event listeners
      redis.on('connect', () => {
        this.options.logger.info(`Redis connection '${name}' connected`);
        this.emit('connected', { name, connection: redis });
      });
      
      redis.on('error', (err) => {
        const stats = this.stats.get(name);
        if (stats) {
          stats.errorCount++;
        }
        
        this.options.logger.error(`Redis connection '${name}' error:`, err);
        this.emit('error', { name, error: err });
      });
      
      redis.on('close', () => {
        this.options.logger.warn(`Redis connection '${name}' closed`);
        this.emit('disconnected', { name });
      });
      
      redis.on('reconnecting', () => {
        this.options.logger.info(`Redis connection '${name}' reconnecting`);
      });
      
      redis.on('ready', () => {
        this.options.logger.info(`Redis connection '${name}' ready`);
      });
      
      // Store pool
      this.pools.set(name, redis);
      
      // Initialize stats
      this.stats.set(name, {
        created: Date.now(),
        connections: 1,
        maxConnections: 1,
        acquireCount: 1,
        releaseCount: 0,
        errorCount: 0,
        idleCount: 0,
        waitingCount: 0,
        waitTime: 0,
        totalQueryTime: 0,
        queryCount: 0
      });
      
      // Start monitoring
      this._startMonitoring(name, redis);
      
      return redis;
    } catch (err) {
      this.options.logger.error(`Failed to create Redis connection '${name}':`, err);
      throw err;
    }
  }

  /**
   * Get a connection pool
   * @param {string} name - Pool name
   * @returns {Object} Connection pool
   */
  getPool(name) {
    if (!this.pools.has(name)) {
      throw new Error(`Connection pool '${name}' not found`);
    }
    
    return this.pools.get(name);
  }

  /**
   * Execute a query with retry logic
   * @param {string} poolName - Pool name
   * @param {Function} queryFn - Query function
   * @param {Object} options - Query options
   * @returns {Promise<any>} Query result
   */
  async executeQuery(poolName, queryFn, options = {}) {
    const pool = this.getPool(poolName);
    const stats = this.stats.get(poolName);
    
    const queryOptions = {
      retryAttempts: options.retryAttempts || this.options.retryAttempts,
      retryDelayMs: options.retryDelayMs || this.options.retryDelayMs,
      timeout: options.timeout || 30000,
      ...options
    };
    
    let attempts = 0;
    let lastError = null;
    
    const startTime = Date.now();
    
    while (attempts < queryOptions.retryAttempts) {
      attempts++;
      
      try {
        // Execute query
        const result = await Promise.race([
          queryFn(pool),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(`Query timeout after ${queryOptions.timeout}ms`));
            }, queryOptions.timeout);
          })
        ]);
        
        // Update stats
        if (stats) {
          const duration = Date.now() - startTime;
          stats.queryCount++;
          stats.totalQueryTime += duration;
        }
        
        // Emit query success event
        this.emit('querySuccess', {
          poolName,
          duration: Date.now() - startTime,
          attempts
        });
        
        return result;
      } catch (err) {
        lastError = err;
        
        // Update stats
        if (stats) {
          stats.errorCount++;
        }
        
        // Emit query error event
        this.emit('queryError', {
          poolName,
          error: err,
          attempt: attempts,
          maxAttempts: queryOptions.retryAttempts
        });
        
        // Check if we should retry
        if (attempts >= queryOptions.retryAttempts) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, queryOptions.retryDelayMs));
      }
    }
    
    // All attempts failed
    throw lastError;
  }

  /**
   * Get pool statistics
   * @param {string} [name] - Pool name (optional, if not provided returns all stats)
   * @returns {Object} Pool statistics
   */
  getStats(name) {
    if (name) {
      if (!this.stats.has(name)) {
        throw new Error(`Connection pool '${name}' not found`);
      }
      
      return { ...this.stats.get(name) };
    }
    
    // Return all stats
    const allStats = {};
    
    for (const [poolName, stats] of this.stats.entries()) {
      allStats[poolName] = { ...stats };
    }
    
    return allStats;
  }

  /**
   * Close all connection pools
   * @returns {Promise<void>} Promise that resolves when all pools are closed
   */
  async closeAll() {
    const closePromises = [];
    
    for (const [name, pool] of this.pools.entries()) {
      closePromises.push(this._closePool(name, pool));
    }
    
    await Promise.all(closePromises);
    
    // Clear maps
    this.pools.clear();
    this.stats.clear();
    
    // Stop all monitors
    for (const [name, interval] of this.monitors.entries()) {
      clearInterval(interval);
    }
    
    this.monitors.clear();
  }

  /**
   * Close a specific connection pool
   * @param {string} name - Pool name
   * @returns {Promise<void>} Promise that resolves when the pool is closed
   */
  async closePool(name) {
    if (!this.pools.has(name)) {
      throw new Error(`Connection pool '${name}' not found`);
    }
    
    const pool = this.pools.get(name);
    
    await this._closePool(name, pool);
    
    // Remove from maps
    this.pools.delete(name);
    this.stats.delete(name);
    
    // Stop monitor
    if (this.monitors.has(name)) {
      clearInterval(this.monitors.get(name));
      this.monitors.delete(name);
    }
  }

  /**
   * Start monitoring a connection pool
   * @private
   * @param {string} name - Pool name
   * @param {Object} pool - Connection pool
   */
  _startMonitoring(name, pool) {
    // Stop existing monitor if any
    if (this.monitors.has(name)) {
      clearInterval(this.monitors.get(name));
    }
    
    // Start new monitor
    const interval = setInterval(
      () => this._monitorPool(name, pool),
      this.options.monitorIntervalMs
    );
    
    this.monitors.set(name, interval);
  }

  /**
   * Monitor a connection pool
   * @private
   * @param {string} name - Pool name
   * @param {Object} pool - Connection pool
   */
  _monitorPool(name, pool) {
    try {
      const stats = this.stats.get(name);
      
      if (!stats) {
        return;
      }
      
      // Get pool stats based on pool type
      let poolStats = {};
      
      if (pool.db && typeof pool.db.serverConfig === 'object') {
        // MongoDB pool
        poolStats = this._getMongoPoolStats(pool);
      } else if (pool.pool && typeof pool.pool.getConnection === 'function') {
        // MySQL pool
        poolStats = this._getMySQLPoolStats(pool);
      } else if (typeof pool.totalCount === 'function') {
        // PostgreSQL pool
        poolStats = this._getPgPoolStats(pool);
      } else if (typeof pool.status === 'function') {
        // Redis connection
        poolStats = this._getRedisPoolStats(pool);
      }
      
      // Update stats
      Object.assign(stats, poolStats);
      
      // Emit monitor event
      this.emit('monitor', {
        name,
        stats: { ...stats }
      });
    } catch (err) {
      this.options.logger.error(`Error monitoring connection pool '${name}':`, err);
    }
  }

  /**
   * Get MongoDB pool statistics
   * @private
   * @param {Object} pool - MongoDB connection pool
   * @returns {Object} Pool statistics
   */
  _getMongoPoolStats(pool) {
    try {
      const serverConfig = pool.db.serverConfig;
      
      return {
        connections: serverConfig.s?.pool?.totalConnections || 0,
        availableConnections: serverConfig.s?.pool?.availableConnections || 0,
        waitingCount: serverConfig.s?.pool?.waitQueueSize || 0
      };
    } catch (err) {
      this.options.logger.debug('Error getting MongoDB pool stats:', err);
      return {};
    }
  }

  /**
   * Get MySQL pool statistics
   * @private
   * @param {Object} pool - MySQL connection pool
   * @returns {Object} Pool statistics
   */
  _getMySQLPoolStats(pool) {
    try {
      const rawPool = pool.pool || pool;
      
      return {
        connections: rawPool._allConnections?.length || 0,
        availableConnections: rawPool._freeConnections?.length || 0,
        waitingCount: rawPool._connectionQueue?.length || 0
      };
    } catch (err) {
      this.options.logger.debug('Error getting MySQL pool stats:', err);
      return {};
    }
  }

  /**
   * Get PostgreSQL pool statistics
   * @private
   * @param {Object} pool - PostgreSQL connection pool
   * @returns {Object} Pool statistics
   */
  _getPgPoolStats(pool) {
    try {
      return {
        connections: pool.totalCount(),
        availableConnections: pool.idleCount(),
        waitingCount: pool.waitingCount()
      };
    } catch (err) {
      this.options.logger.debug('Error getting PostgreSQL pool stats:', err);
      return {};
    }
  }

  /**
   * Get Redis connection statistics
   * @private
   * @param {Object} redis - Redis connection
   * @returns {Object} Connection statistics
   */
  _getRedisPoolStats(redis) {
    try {
      const status = redis.status;
      
      return {
        connections: status === 'ready' ? 1 : 0,
        availableConnections: status === 'ready' ? 1 : 0,
        waitingCount: 0
      };
    } catch (err) {
      this.options.logger.debug('Error getting Redis connection stats:', err);
      return {};
    }
  }

  /**
   * Close a connection pool
   * @private
   * @param {string} name - Pool name
   * @param {Object} pool - Connection pool
   * @returns {Promise<void>} Promise that resolves when the pool is closed
   */
  async _closePool(name, pool) {
    try {
      if (!pool) {
        return;
      }
      
      this.options.logger.info(`Closing connection pool '${name}'`);
      
      // Close based on pool type
      if (typeof pool.close === 'function') {
        // MongoDB or Redis
        await pool.close();
      } else if (typeof pool.end === 'function') {
        // MySQL or PostgreSQL
        await pool.end();
      } else if (pool.pool && typeof pool.pool.end === 'function') {
        // MySQL promise pool
        await pool.pool.end();
      }
      
      this.options.logger.info(`Connection pool '${name}' closed`);
      
      this.emit('poolClosed', { name });
    } catch (err) {
      this.options.logger.error(`Error closing connection pool '${name}':`, err);
      throw err;
    }
  }
}

/**
 * Create a connection optimizer instance
 * @param {Object} options - Configuration options
 * @returns {ConnectionOptimizer} Connection optimizer instance
 */
function createConnectionOptimizer(options = {}) {
  return new ConnectionOptimizer(options);
}

module.exports = {
  ConnectionOptimizer,
  createConnectionOptimizer
};
