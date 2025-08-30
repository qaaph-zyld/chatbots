/**
 * Database Query Profiler
 * 
 * This module provides utilities for profiling and optimizing database queries,
 * including query timing, analysis, and suggestions for optimization.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const os = require('os');

// Promisify fs functions
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const appendFile = promisify(fs.appendFile);

/**
 * Database Query Profiler
 */
class DBQueryProfiler extends EventEmitter {
  /**
   * Create a new database query profiler
   * @param {Object} options - Profiler options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      enabled: options.enabled !== false,
      slowQueryThreshold: options.slowQueryThreshold || 100, // ms
      logSlowQueries: options.logSlowQueries !== false,
      logAllQueries: options.logAllQueries || false,
      logFormat: options.logFormat || 'json',
      logFile: options.logFile || path.join(process.cwd(), 'logs', 'db-queries.log'),
      maxQueryLength: options.maxQueryLength || 1000,
      maxLogSize: options.maxLogSize || 10 * 1024 * 1024, // 10 MB
      rotateLogFiles: options.rotateLogFiles !== false,
      maxLogFiles: options.maxLogFiles || 5,
      sampleRate: options.sampleRate || 1.0, // 1.0 = 100% of queries
      stackTraceEnabled: options.stackTraceEnabled || false,
      stackTraceLimit: options.stackTraceLimit || 3,
      logger: options.logger || console,
      ...options
    };
    
    this.stats = {
      totalQueries: 0,
      slowQueries: 0,
      totalQueryTime: 0,
      longestQuery: {
        query: '',
        time: 0,
        timestamp: null
      },
      queriesByType: {},
      queriesByCollection: {},
      queriesByOperation: {},
      startTime: Date.now()
    };
    
    // Initialize
    this._init();
  }
  
  /**
   * Initialize the profiler
   * @private
   */
  _init() {
    // Create log directory if needed
    if (this.options.logSlowQueries || this.options.logAllQueries) {
      const logDir = path.dirname(this.options.logFile);
      
      mkdir(logDir, { recursive: true })
        .catch(err => {
          this.options.logger.error('Error creating log directory:', err);
        });
    }
    
    // Set stack trace limit
    if (this.options.stackTraceEnabled) {
      Error.stackTraceLimit = this.options.stackTraceLimit;
    }
  }
  
  /**
   * Start profiling a query
   * @param {string} query - Query string or object
   * @param {Object} [options] - Query options
   * @returns {Function} End profiling function
   */
  start(query, options = {}) {
    if (!this.options.enabled || Math.random() > this.options.sampleRate) {
      // Return no-op function if disabled or not sampled
      return () => ({});
    }
    
    const startTime = process.hrtime();
    const timestamp = new Date();
    
    // Get stack trace if enabled
    let stack = null;
    
    if (this.options.stackTraceEnabled) {
      const stackObj = {};
      Error.captureStackTrace(stackObj);
      stack = stackObj.stack
        .split('\n')
        .slice(2, 2 + this.options.stackTraceLimit)
        .map(line => line.trim());
    }
    
    // Parse query info
    const queryInfo = this._parseQueryInfo(query, options);
    
    // Return end function
    return (error) => {
      const hrDiff = process.hrtime(startTime);
      const duration = hrDiff[0] * 1000 + hrDiff[1] / 1000000; // Convert to ms
      
      // Record query
      return this._recordQuery({
        query: this._formatQuery(query),
        queryInfo,
        duration,
        timestamp,
        stack,
        error,
        ...options
      });
    };
  }
  
  /**
   * Profile a query function
   * @param {Function} queryFn - Query function to profile
   * @param {string|Object} query - Query string or object
   * @param {Object} [options] - Query options
   * @returns {Promise<*>} Query result
   */
  async profile(queryFn, query, options = {}) {
    if (!this.options.enabled || Math.random() > this.options.sampleRate) {
      // Execute without profiling if disabled or not sampled
      return queryFn();
    }
    
    const end = this.start(query, options);
    
    try {
      const result = await queryFn();
      end();
      return result;
    } catch (error) {
      end(error);
      throw error;
    }
  }
  
  /**
   * Record a query
   * @private
   * @param {Object} queryData - Query data
   * @returns {Object} Query profile
   */
  _recordQuery(queryData) {
    const { query, queryInfo, duration, timestamp, stack, error } = queryData;
    
    // Update stats
    this.stats.totalQueries++;
    this.stats.totalQueryTime += duration;
    
    // Track by type
    const { type, collection, operation } = queryInfo;
    
    if (type) {
      this.stats.queriesByType[type] = (this.stats.queriesByType[type] || 0) + 1;
    }
    
    if (collection) {
      this.stats.queriesByCollection[collection] = (this.stats.queriesByCollection[collection] || 0) + 1;
    }
    
    if (operation) {
      this.stats.queriesByOperation[operation] = (this.stats.queriesByOperation[operation] || 0) + 1;
    }
    
    // Check if slow query
    const isSlowQuery = duration >= this.options.slowQueryThreshold;
    
    if (isSlowQuery) {
      this.stats.slowQueries++;
    }
    
    // Check if longest query
    if (duration > this.stats.longestQuery.time) {
      this.stats.longestQuery = {
        query: this._truncateQuery(query),
        time: duration,
        timestamp
      };
    }
    
    // Create query profile
    const profile = {
      query: this._truncateQuery(query),
      duration,
      timestamp: timestamp.toISOString(),
      slow: isSlowQuery,
      type,
      collection,
      operation,
      stack,
      error: error ? error.message : null
    };
    
    // Log query if needed
    if ((isSlowQuery && this.options.logSlowQueries) || this.options.logAllQueries) {
      this._logQuery(profile);
    }
    
    // Emit events
    this.emit('query', profile);
    
    if (isSlowQuery) {
      this.emit('slow-query', profile);
    }
    
    if (error) {
      this.emit('query-error', { ...profile, error });
    }
    
    return profile;
  }
  
  /**
   * Parse query info
   * @private
   * @param {string|Object} query - Query string or object
   * @param {Object} options - Query options
   * @returns {Object} Query info
   */
  _parseQueryInfo(query, options) {
    const info = {
      type: options.type || this._detectQueryType(query),
      collection: options.collection || this._detectCollection(query),
      operation: options.operation || this._detectOperation(query)
    };
    
    return info;
  }
  
  /**
   * Detect query type
   * @private
   * @param {string|Object} query - Query string or object
   * @returns {string|null} Query type
   */
  _detectQueryType(query) {
    if (typeof query === 'string') {
      // SQL query
      if (query.match(/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|BEGIN|COMMIT|ROLLBACK)/i)) {
        return 'sql';
      }
    } else if (query && typeof query === 'object') {
      // MongoDB query
      if (query.find || query.findOne || query.updateOne || query.updateMany || 
          query.deleteOne || query.deleteMany || query.aggregate || query.insertOne || 
          query.insertMany) {
        return 'mongodb';
      }
    }
    
    return null;
  }
  
  /**
   * Detect collection/table name
   * @private
   * @param {string|Object} query - Query string or object
   * @returns {string|null} Collection/table name
   */
  _detectCollection(query) {
    if (typeof query === 'string') {
      // SQL query
      const fromMatch = query.match(/\s+FROM\s+[`"']?([a-zA-Z0-9_]+)[`"']?/i);
      const intoMatch = query.match(/\s+INTO\s+[`"']?([a-zA-Z0-9_]+)[`"']?/i);
      const updateMatch = query.match(/\s*UPDATE\s+[`"']?([a-zA-Z0-9_]+)[`"']?/i);
      
      return fromMatch?.[1] || intoMatch?.[1] || updateMatch?.[1] || null;
    } else if (query && typeof query === 'object') {
      // MongoDB query
      return query.collection || null;
    }
    
    return null;
  }
  
  /**
   * Detect operation type
   * @private
   * @param {string|Object} query - Query string or object
   * @returns {string|null} Operation type
   */
  _detectOperation(query) {
    if (typeof query === 'string') {
      // SQL query
      const firstWord = query.trim().split(/\s+/)[0].toUpperCase();
      
      if (['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE'].includes(firstWord)) {
        return firstWord.toLowerCase();
      }
    } else if (query && typeof query === 'object') {
      // MongoDB query
      const keys = Object.keys(query);
      
      for (const key of keys) {
        if (['find', 'findOne', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 
             'aggregate', 'insertOne', 'insertMany', 'count', 'distinct'].includes(key)) {
          return key;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Format query for logging
   * @private
   * @param {string|Object} query - Query string or object
   * @returns {string} Formatted query
   */
  _formatQuery(query) {
    if (typeof query === 'string') {
      return query;
    }
    
    try {
      return JSON.stringify(query);
    } catch (err) {
      return String(query);
    }
  }
  
  /**
   * Truncate query if too long
   * @private
   * @param {string} query - Query string
   * @returns {string} Truncated query
   */
  _truncateQuery(query) {
    if (query.length <= this.options.maxQueryLength) {
      return query;
    }
    
    return query.substring(0, this.options.maxQueryLength) + '...';
  }
  
  /**
   * Log a query
   * @private
   * @param {Object} profile - Query profile
   */
  _logQuery(profile) {
    try {
      // Format log entry
      let logEntry;
      
      if (this.options.logFormat === 'json') {
        logEntry = JSON.stringify({
          ...profile,
          pid: process.pid,
          hostname: os.hostname()
        });
      } else {
        logEntry = `[${profile.timestamp}] ${profile.slow ? 'SLOW ' : ''}${profile.type} ${profile.operation} ${profile.collection || ''} - ${profile.duration.toFixed(2)}ms - ${profile.query}`;
      }
      
      // Append to log file
      appendFile(this.options.logFile, logEntry + '\n')
        .catch(err => {
          this.options.logger.error('Error writing to query log:', err);
        });
      
      // Check log file size and rotate if needed
      if (this.options.rotateLogFiles) {
        fs.stat(this.options.logFile, (err, stats) => {
          if (err) return;
          
          if (stats.size >= this.options.maxLogSize) {
            this._rotateLogFiles();
          }
        });
      }
    } catch (err) {
      this.options.logger.error('Error logging query:', err);
    }
  }
  
  /**
   * Rotate log files
   * @private
   */
  _rotateLogFiles() {
    try {
      // Rotate log files
      for (let i = this.options.maxLogFiles - 1; i > 0; i--) {
        const oldFile = `${this.options.logFile}.${i}`;
        const newFile = `${this.options.logFile}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile);
        }
      }
      
      // Rename current log file
      if (fs.existsSync(this.options.logFile)) {
        fs.renameSync(this.options.logFile, `${this.options.logFile}.1`);
      }
    } catch (err) {
      this.options.logger.error('Error rotating log files:', err);
    }
  }
  
  /**
   * Get profiler statistics
   * @returns {Object} Profiler statistics
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime;
    const avgQueryTime = this.stats.totalQueries > 0
      ? this.stats.totalQueryTime / this.stats.totalQueries
      : 0;
    
    return {
      ...this.stats,
      uptime,
      avgQueryTime
    };
  }
  
  /**
   * Reset profiler statistics
   */
  resetStats() {
    this.stats = {
      totalQueries: 0,
      slowQueries: 0,
      totalQueryTime: 0,
      longestQuery: {
        query: '',
        time: 0,
        timestamp: null
      },
      queriesByType: {},
      queriesByCollection: {},
      queriesByOperation: {},
      startTime: Date.now()
    };
  }
  
  /**
   * Analyze queries and provide optimization suggestions
   * @param {Object} [options] - Analysis options
   * @returns {Object} Analysis results
   */
  analyzeQueries(options = {}) {
    const opts = {
      minQueryCount: options.minQueryCount || 5,
      slowQueryThreshold: options.slowQueryThreshold || this.options.slowQueryThreshold,
      ...options
    };
    
    const analysis = {
      summary: {
        totalQueries: this.stats.totalQueries,
        slowQueries: this.stats.slowQueries,
        avgQueryTime: this.stats.totalQueries > 0
          ? this.stats.totalQueryTime / this.stats.totalQueries
          : 0,
        slowQueryPercentage: this.stats.totalQueries > 0
          ? (this.stats.slowQueries / this.stats.totalQueries) * 100
          : 0
      },
      slowestQueries: [this.stats.longestQuery].filter(q => q.query),
      frequentCollections: this._getTopItems(this.stats.queriesByCollection, opts.minQueryCount),
      frequentOperations: this._getTopItems(this.stats.queriesByOperation, opts.minQueryCount),
      suggestions: []
    };
    
    // Generate suggestions
    if (analysis.summary.slowQueryPercentage > 10) {
      analysis.suggestions.push({
        type: 'general',
        message: 'High percentage of slow queries detected. Consider adding indexes or optimizing query patterns.'
      });
    }
    
    if (analysis.summary.avgQueryTime > opts.slowQueryThreshold / 2) {
      analysis.suggestions.push({
        type: 'general',
        message: 'Average query time is high. Consider implementing or improving caching strategies.'
      });
    }
    
    // Add collection-specific suggestions
    for (const collection of analysis.frequentCollections) {
      // Check for high-frequency collections that might benefit from caching
      if (collection.count > this.stats.totalQueries * 0.2) {
        analysis.suggestions.push({
          type: 'collection',
          collection: collection.name,
          message: `Collection "${collection.name}" is queried frequently (${collection.count} times). Consider implementing result caching.`
        });
      }
    }
    
    return analysis;
  }
  
  /**
   * Get top items from a stats object
   * @private
   * @param {Object} items - Stats object
   * @param {number} minCount - Minimum count to include
   * @returns {Array<Object>} Top items
   */
  _getTopItems(items, minCount) {
    return Object.entries(items)
      .map(([name, count]) => ({ name, count }))
      .filter(item => item.count >= minCount)
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Create a MongoDB query profiler
   * @param {Object} mongoose - Mongoose instance
   * @param {Object} [options] - Profiler options
   * @returns {DBQueryProfiler} Profiler instance
   */
  static createMongoProfiler(mongoose, options = {}) {
    const profiler = new DBQueryProfiler({
      type: 'mongodb',
      ...options
    });
    
    // Instrument mongoose
    if (mongoose) {
      // Monkey patch Query.prototype.exec
      const originalExec = mongoose.Query.prototype.exec;
      
      mongoose.Query.prototype.exec = function(...args) {
        const collection = this.model.collection.name;
        const operation = this.op;
        const queryObject = this.getQuery();
        
        const end = profiler.start(queryObject, { collection, operation });
        
        return originalExec.apply(this, args)
          .then(result => {
            end();
            return result;
          })
          .catch(err => {
            end(err);
            throw err;
          });
      };
    }
    
    return profiler;
  }
  
  /**
   * Create a SQL query profiler
   * @param {Object} db - Database connection (e.g., mysql2, pg)
   * @param {string} dbType - Database type ('mysql', 'postgres', etc.)
   * @param {Object} [options] - Profiler options
   * @returns {DBQueryProfiler} Profiler instance
   */
  static createSQLProfiler(db, dbType, options = {}) {
    const profiler = new DBQueryProfiler({
      type: 'sql',
      ...options
    });
    
    // Instrument database client
    if (db) {
      if (dbType === 'mysql' || dbType === 'mysql2') {
        // Monkey patch query method
        const originalQuery = db.query;
        
        db.query = function(sql, values, cb) {
          const end = profiler.start(sql);
          
          const handleResult = (err, result) => {
            end(err);
            return result;
          };
          
          // Handle different call signatures
          if (typeof values === 'function') {
            cb = values;
            values = undefined;
          }
          
          if (cb) {
            return originalQuery.call(this, sql, values, (err, result) => {
              end(err);
              cb(err, result);
            });
          }
          
          return originalQuery.call(this, sql, values)
            .then(result => handleResult(null, result))
            .catch(err => {
              handleResult(err);
              throw err;
            });
        };
      } else if (dbType === 'pg') {
        // Monkey patch query method
        const originalQuery = db.query;
        
        db.query = function(config, values, callback) {
          const sql = typeof config === 'string' ? config : config.text;
          const end = profiler.start(sql);
          
          // Handle different call signatures
          if (typeof config === 'string' && typeof values === 'function') {
            callback = values;
            values = undefined;
          }
          
          if (callback) {
            return originalQuery.call(this, config, values, (err, result) => {
              end(err);
              callback(err, result);
            });
          }
          
          return originalQuery.call(this, config, values)
            .then(result => {
              end();
              return result;
            })
            .catch(err => {
              end(err);
              throw err;
            });
        };
      }
    }
    
    return profiler;
  }
}

/**
 * Create a database query profiler
 * @param {Object} options - Profiler options
 * @returns {DBQueryProfiler} Profiler instance
 */
function createQueryProfiler(options = {}) {
  return new DBQueryProfiler(options);
}

/**
 * Express middleware for query profiling
 * @param {DBQueryProfiler} profiler - Profiler instance
 * @param {Object} [options] - Middleware options
 * @returns {Function} Express middleware
 */
function queryProfilerMiddleware(profiler, options = {}) {
  const opts = {
    headerName: options.headerName || 'X-DB-Query-Stats',
    includeStats: options.includeStats !== false,
    ...options
  };
  
  return function(req, res, next) {
    // Add profiler to request
    req.queryProfiler = profiler;
    
    // Add stats to response header if enabled
    if (opts.includeStats) {
      const originalEnd = res.end;
      
      res.end = function(...args) {
        // Add stats header
        const stats = profiler.getStats();
        
        res.set(opts.headerName, JSON.stringify({
          queries: stats.totalQueries,
          slow: stats.slowQueries,
          time: stats.totalQueryTime.toFixed(2)
        }));
        
        return originalEnd.apply(this, args);
      };
    }
    
    next();
  };
}

module.exports = {
  DBQueryProfiler,
  createQueryProfiler,
  queryProfilerMiddleware
};
