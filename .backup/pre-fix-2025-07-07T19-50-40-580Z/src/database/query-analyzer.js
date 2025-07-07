/**
 * Database Query Analyzer Utility
 * 
 * This module provides functionality to analyze, log, and optimize database queries
 * to help identify performance bottlenecks and improve query execution times.
 */

const EventEmitter = require('events');

class QueryAnalyzer extends EventEmitter {
  /**
   * Create a new query analyzer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      mongooseConnection: options.mongooseConnection,
      slowQueryThreshold: options.slowQueryThreshold || 100, // ms
      verySlowQueryThreshold: options.verySlowQueryThreshold || 500, // ms
      logAllQueries: options.logAllQueries || false,
      logSlowQueries: options.logSlowQueries !== false,
      logQueryPlans: options.logQueryPlans !== false,
      collectStats: options.collectStats !== false,
      sampleRate: options.sampleRate || 1.0, // 1.0 = 100% of queries
      maxQueryHistory: options.maxQueryHistory || 100,
      logger: options.logger || console,
      ...options
    };
    
    this.isEnabled = false;
    this.stats = {
      totalQueries: 0,
      slowQueries: 0,
      verySlowQueries: 0,
      totalQueryTime: 0,
      averageQueryTime: 0,
      queryCountByCollection: {},
      slowQueryCountByCollection: {}
    };
    
    this.queryHistory = [];
    this.originalExec = null;
    this.originalFind = null;
    this.originalFindOne = null;
    this.originalAggregate = null;
  }

  /**
   * Enable query analysis
   * @returns {QueryAnalyzer} This instance for chaining
   */
  enable() {
    if (this.isEnabled) {
      return this;
    }
    
    this.options.logger.info('Enabling database query analyzer');
    
    if (!this.options.mongooseConnection) {
      throw new Error('Mongoose connection is required to enable query analyzer');
    }
    
    // Patch Mongoose Query prototype
    const Query = this.options.mongooseConnection.base.Query;
    this.originalExec = Query.prototype.exec;
    
    Query.prototype.exec = async function(...args) {
      return await this._queryAnalyzer_execWithAnalysis(this, args);
    }.bind(this);
    
    // Patch model methods
    const modelNames = this.options.mongooseConnection.modelNames();
    
    for (const modelName of modelNames) {
      const model = this.options.mongooseConnection.model(modelName);
      
      // Save original methods
      this.originalFind = this.originalFind || model.find;
      this.originalFindOne = this.originalFindOne || model.findOne;
      this.originalAggregate = this.originalAggregate || model.aggregate;
      
      // Patch find method
      model.find = function(...args) {
        const query = this.originalFind.apply(model, args);
        query._queryAnalyzer_source = {
          method: 'find',
          model: modelName,
          args
        };
        return query;
      }.bind(this);
      
      // Patch findOne method
      model.findOne = function(...args) {
        const query = this.originalFindOne.apply(model, args);
        query._queryAnalyzer_source = {
          method: 'findOne',
          model: modelName,
          args
        };
        return query;
      }.bind(this);
      
      // Patch aggregate method
      model.aggregate = function(...args) {
        const aggregate = this.originalAggregate.apply(model, args);
        aggregate._queryAnalyzer_source = {
          method: 'aggregate',
          model: modelName,
          args
        };
        
        // Patch aggregate exec method
        const originalAggregateExec = aggregate.exec;
        
        aggregate.exec = async function(...execArgs) {
          return await this._queryAnalyzer_execAggregateWithAnalysis(aggregate, execArgs);
        }.bind(this);
        
        return aggregate;
      }.bind(this);
    }
    
    this.isEnabled = true;
    this.emit('enabled');
    
    return this;
  }

  /**
   * Disable query analysis
   * @returns {QueryAnalyzer} This instance for chaining
   */
  disable() {
    if (!this.isEnabled) {
      return this;
    }
    
    this.options.logger.info('Disabling database query analyzer');
    
    // Restore original methods
    if (this.originalExec) {
      const Query = this.options.mongooseConnection.base.Query;
      Query.prototype.exec = this.originalExec;
      this.originalExec = null;
    }
    
    const modelNames = this.options.mongooseConnection.modelNames();
    
    for (const modelName of modelNames) {
      const model = this.options.mongooseConnection.model(modelName);
      
      // Restore original methods
      if (this.originalFind) {
        model.find = this.originalFind;
      }
      
      if (this.originalFindOne) {
        model.findOne = this.originalFindOne;
      }
      
      if (this.originalAggregate) {
        model.aggregate = this.originalAggregate;
      }
    }
    
    this.originalFind = null;
    this.originalFindOne = null;
    this.originalAggregate = null;
    
    this.isEnabled = false;
    this.emit('disabled');
    
    return this;
  }

  /**
   * Reset query statistics
   * @returns {QueryAnalyzer} This instance for chaining
   */
  resetStats() {
    this.stats = {
      totalQueries: 0,
      slowQueries: 0,
      verySlowQueries: 0,
      totalQueryTime: 0,
      averageQueryTime: 0,
      queryCountByCollection: {},
      slowQueryCountByCollection: {}
    };
    
    this.queryHistory = [];
    
    return this;
  }

  /**
   * Get query statistics
   * @returns {Object} Query statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get query history
   * @param {number} limit - Maximum number of queries to return
   * @param {Object} filter - Filter criteria
   * @returns {Array<Object>} Query history
   */
  getQueryHistory(limit = 100, filter = {}) {
    let filteredHistory = [...this.queryHistory];
    
    // Apply filters
    if (filter.collection) {
      filteredHistory = filteredHistory.filter(q => q.collection === filter.collection);
    }
    
    if (filter.method) {
      filteredHistory = filteredHistory.filter(q => q.method === filter.method);
    }
    
    if (filter.minDuration) {
      filteredHistory = filteredHistory.filter(q => q.duration >= filter.minDuration);
    }
    
    if (filter.hasOwnProperty('slow')) {
      if (filter.slow) {
        filteredHistory = filteredHistory.filter(q => q.duration >= this.options.slowQueryThreshold);
      } else {
        filteredHistory = filteredHistory.filter(q => q.duration < this.options.slowQueryThreshold);
      }
    }
    
    // Sort by timestamp (newest first)
    filteredHistory.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    return filteredHistory.slice(0, limit);
  }

  /**
   * Get slow query recommendations
   * @returns {Array<Object>} Slow query recommendations
   */
  getRecommendations() {
    const recommendations = [];
    
    // Get slow queries
    const slowQueries = this.queryHistory.filter(q => q.duration >= this.options.slowQueryThreshold);
    
    // Group by collection and query pattern
    const queryGroups = {};
    
    for (const query of slowQueries) {
      const key = `${query.collection}:${JSON.stringify(query.filter || {})}`;
      
      if (!queryGroups[key]) {
        queryGroups[key] = {
          collection: query.collection,
          filter: query.filter,
          count: 0,
          totalDuration: 0,
          averageDuration: 0,
          examples: []
        };
      }
      
      queryGroups[key].count++;
      queryGroups[key].totalDuration += query.duration;
      
      if (queryGroups[key].examples.length < 3) {
        queryGroups[key].examples.push({
          timestamp: query.timestamp,
          duration: query.duration,
          method: query.method
        });
      }
    }
    
    // Calculate average durations
    for (const key in queryGroups) {
      queryGroups[key].averageDuration = queryGroups[key].totalDuration / queryGroups[key].count;
    }
    
    // Convert to array and sort by average duration
    const sortedGroups = Object.values(queryGroups)
      .sort((a, b) => b.averageDuration - a.averageDuration);
    
    // Generate recommendations
    for (const group of sortedGroups) {
      const recommendation = {
        collection: group.collection,
        filter: group.filter,
        count: group.count,
        averageDuration: group.averageDuration,
        examples: group.examples,
        recommendations: []
      };
      
      // Add index recommendations
      if (group.filter) {
        const indexFields = this._suggestIndexFields(group.filter);
        
        if (indexFields.length > 0) {
          recommendation.recommendations.push({
            type: 'index',
            description: `Create an index on ${indexFields.join(', ')}`,
            implementation: `db.${group.collection}.createIndex({ ${indexFields.map(f => `${f}: 1`).join(', ')} })`,
            impact: 'high'
          });
        }
      }
      
      // Add projection recommendation if applicable
      if (group.count >= 5 && group.averageDuration >= this.options.verySlowQueryThreshold) {
        recommendation.recommendations.push({
          type: 'projection',
          description: 'Use projection to limit returned fields',
          implementation: 'Add a second argument to find() with the fields you need',
          example: `Model.find(${JSON.stringify(group.filter)}, { field1: 1, field2: 1 })`,
          impact: 'medium'
        });
      }
      
      // Add limit recommendation if applicable
      if (group.count >= 5 && group.averageDuration >= this.options.verySlowQueryThreshold) {
        recommendation.recommendations.push({
          type: 'limit',
          description: 'Use limit() to reduce the number of documents returned',
          implementation: 'Add .limit(N) to your query',
          example: `Model.find(${JSON.stringify(group.filter)}).limit(100)`,
          impact: 'high'
        });
      }
      
      // Add lean recommendation
      recommendation.recommendations.push({
        type: 'lean',
        description: 'Use .lean() for read-only operations to skip hydrating documents',
        implementation: 'Add .lean() to your query',
        example: `Model.find(${JSON.stringify(group.filter)}).lean()`,
        impact: 'medium'
      });
      
      recommendations.push(recommendation);
    }
    
    return recommendations;
  }

  /**
   * Execute a query with analysis
   * @private
   * @param {Object} query - Mongoose query
   * @param {Array} args - Original exec arguments
   * @returns {Promise<*>} Query result
   */
  async _queryAnalyzer_execWithAnalysis(query, args) {
    // Skip analysis based on sample rate
    if (Math.random() > this.options.sampleRate) {
      return await this.originalExec.apply(query, args);
    }
    
    const startTime = Date.now();
    let error = null;
    let result = null;
    
    try {
      result = await this.originalExec.apply(query, args);
      return result;
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      await this._analyzeQuery(query, duration, result, error);
    }
  }

  /**
   * Execute an aggregate with analysis
   * @private
   * @param {Object} aggregate - Mongoose aggregate
   * @param {Array} args - Original exec arguments
   * @returns {Promise<*>} Aggregate result
   */
  async _queryAnalyzer_execAggregateWithAnalysis(aggregate, args) {
    // Skip analysis based on sample rate
    if (Math.random() > this.options.sampleRate) {
      return await aggregate.constructor.prototype.exec.apply(aggregate, args);
    }
    
    const startTime = Date.now();
    let error = null;
    let result = null;
    
    try {
      result = await aggregate.constructor.prototype.exec.apply(aggregate, args);
      return result;
    } catch (err) {
      error = err;
      throw err;
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      await this._analyzeAggregate(aggregate, duration, result, error);
    }
  }

  /**
   * Analyze a query
   * @private
   * @param {Object} query - Mongoose query
   * @param {number} duration - Query duration in ms
   * @param {*} result - Query result
   * @param {Error} error - Query error
   * @returns {Promise<void>}
   */
  async _analyzeQuery(query, duration, result, error) {
    // Extract query information
    const source = query._queryAnalyzer_source || {};
    const model = source.model || (query.model && query.model.modelName) || 'unknown';
    const method = source.method || 'unknown';
    const filter = query._conditions || {};
    const options = query.options || {};
    const projection = query._fields || {};
    
    // Update stats
    this._updateStats(model, duration);
    
    // Create query record
    const queryRecord = {
      timestamp: new Date(),
      collection: model,
      method,
      filter,
      projection,
      options,
      duration,
      slow: duration >= this.options.slowQueryThreshold,
      verySlow: duration >= this.options.verySlowQueryThreshold,
      error: error ? error.message : null,
      resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
    };
    
    // Add query plan if enabled
    if (this.options.logQueryPlans && !error) {
      try {
        queryRecord.queryPlan = await this._getQueryPlan(model, filter, options);
      } catch (err) {
        this.options.logger.debug('Failed to get query plan:', err);
      }
    }
    
    // Add to history
    this._addToHistory(queryRecord);
    
    // Log query if needed
    this._logQuery(queryRecord);
    
    // Emit events
    this.emit('query', queryRecord);
    
    if (queryRecord.slow) {
      this.emit('slowQuery', queryRecord);
    }
    
    if (queryRecord.verySlow) {
      this.emit('verySlowQuery', queryRecord);
    }
    
    if (error) {
      this.emit('queryError', { ...queryRecord, error });
    }
  }

  /**
   * Analyze an aggregate
   * @private
   * @param {Object} aggregate - Mongoose aggregate
   * @param {number} duration - Aggregate duration in ms
   * @param {*} result - Aggregate result
   * @param {Error} error - Aggregate error
   * @returns {Promise<void>}
   */
  async _analyzeAggregate(aggregate, duration, result, error) {
    // Extract aggregate information
    const source = aggregate._queryAnalyzer_source || {};
    const model = source.model || 'unknown';
    const method = 'aggregate';
    const pipeline = aggregate._pipeline || [];
    
    // Update stats
    this._updateStats(model, duration);
    
    // Create query record
    const queryRecord = {
      timestamp: new Date(),
      collection: model,
      method,
      pipeline,
      duration,
      slow: duration >= this.options.slowQueryThreshold,
      verySlow: duration >= this.options.verySlowQueryThreshold,
      error: error ? error.message : null,
      resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
    };
    
    // Add query plan if enabled
    if (this.options.logQueryPlans && !error) {
      try {
        queryRecord.queryPlan = await this._getAggregatePlan(model, pipeline);
      } catch (err) {
        this.options.logger.debug('Failed to get aggregate plan:', err);
      }
    }
    
    // Add to history
    this._addToHistory(queryRecord);
    
    // Log query if needed
    this._logQuery(queryRecord);
    
    // Emit events
    this.emit('query', queryRecord);
    
    if (queryRecord.slow) {
      this.emit('slowQuery', queryRecord);
    }
    
    if (queryRecord.verySlow) {
      this.emit('verySlowQuery', queryRecord);
    }
    
    if (error) {
      this.emit('queryError', { ...queryRecord, error });
    }
  }

  /**
   * Update query statistics
   * @private
   * @param {string} collection - Collection name
   * @param {number} duration - Query duration in ms
   */
  _updateStats(collection, duration) {
    if (!this.options.collectStats) {
      return;
    }
    
    // Update global stats
    this.stats.totalQueries++;
    this.stats.totalQueryTime += duration;
    this.stats.averageQueryTime = this.stats.totalQueryTime / this.stats.totalQueries;
    
    if (duration >= this.options.slowQueryThreshold) {
      this.stats.slowQueries++;
    }
    
    if (duration >= this.options.verySlowQueryThreshold) {
      this.stats.verySlowQueries++;
    }
    
    // Update collection-specific stats
    if (!this.stats.queryCountByCollection[collection]) {
      this.stats.queryCountByCollection[collection] = 0;
    }
    
    this.stats.queryCountByCollection[collection]++;
    
    if (duration >= this.options.slowQueryThreshold) {
      if (!this.stats.slowQueryCountByCollection[collection]) {
        this.stats.slowQueryCountByCollection[collection] = 0;
      }
      
      this.stats.slowQueryCountByCollection[collection]++;
    }
  }

  /**
   * Add a query record to history
   * @private
   * @param {Object} queryRecord - Query record
   */
  _addToHistory(queryRecord) {
    this.queryHistory.unshift(queryRecord);
    
    // Trim history if needed
    if (this.queryHistory.length > this.options.maxQueryHistory) {
      this.queryHistory.pop();
    }
  }

  /**
   * Log a query
   * @private
   * @param {Object} queryRecord - Query record
   */
  _logQuery(queryRecord) {
    // Skip logging if disabled
    if (!this.options.logAllQueries && !this.options.logSlowQueries) {
      return;
    }
    
    // Skip non-slow queries if only logging slow queries
    if (!this.options.logAllQueries && !queryRecord.slow) {
      return;
    }
    
    // Determine log level
    let logMethod = 'info';
    
    if (queryRecord.error) {
      logMethod = 'error';
    } else if (queryRecord.verySlow) {
      logMethod = 'warn';
    } else if (queryRecord.slow) {
      logMethod = 'warn';
    }
    
    // Create log message
    let message = `[DB] ${queryRecord.method} ${queryRecord.collection} took ${queryRecord.duration}ms`;
    
    if (queryRecord.resultCount !== undefined) {
      message += ` (${queryRecord.resultCount} results)`;
    }
    
    if (queryRecord.error) {
      message += ` - ERROR: ${queryRecord.error}`;
    }
    
    // Log query details
    this.options.logger[logMethod](message, {
      filter: queryRecord.filter,
      projection: queryRecord.projection,
      options: queryRecord.options,
      pipeline: queryRecord.pipeline
    });
    
    // Log query plan if available
    if (queryRecord.queryPlan && this.options.logQueryPlans) {
      this.options.logger.debug('Query plan:', queryRecord.queryPlan);
    }
  }

  /**
   * Get query plan for a query
   * @private
   * @param {string} modelName - Model name
   * @param {Object} filter - Query filter
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query plan
   */
  async _getQueryPlan(modelName, filter, options) {
    try {
      const model = this.options.mongooseConnection.model(modelName);
      const collection = model.collection;
      
      const explain = await collection.find(filter, options).explain('executionStats');
      
      return {
        executionStats: explain.executionStats,
        queryPlanner: explain.queryPlanner
      };
    } catch (err) {
      this.options.logger.debug(`Failed to get query plan for ${modelName}:`, err);
      return null;
    }
  }

  /**
   * Get query plan for an aggregate
   * @private
   * @param {string} modelName - Model name
   * @param {Array} pipeline - Aggregate pipeline
   * @returns {Promise<Object>} Query plan
   */
  async _getAggregatePlan(modelName, pipeline) {
    try {
      const model = this.options.mongooseConnection.model(modelName);
      const collection = model.collection;
      
      const explain = await collection.aggregate([
        ...pipeline,
        { $explain: true }
      ]).toArray();
      
      return explain[0];
    } catch (err) {
      this.options.logger.debug(`Failed to get aggregate plan for ${modelName}:`, err);
      return null;
    }
  }

  /**
   * Suggest index fields for a query
   * @private
   * @param {Object} filter - Query filter
   * @returns {Array<string>} Suggested index fields
   */
  _suggestIndexFields(filter) {
    const indexFields = [];
    
    // Extract fields from filter
    for (const field in filter) {
      // Skip special operators
      if (field.startsWith('$')) {
        continue;
      }
      
      // Handle simple equality conditions
      if (typeof filter[field] !== 'object' || filter[field] === null) {
        indexFields.push(field);
        continue;
      }
      
      // Handle operators
      if (filter[field].$eq !== undefined || 
          filter[field].$in !== undefined || 
          filter[field].$gt !== undefined || 
          filter[field].$gte !== undefined || 
          filter[field].$lt !== undefined || 
          filter[field].$lte !== undefined) {
        indexFields.push(field);
      }
    }
    
    // Sort fields by specificity (equality first, range later)
    indexFields.sort((a, b) => {
      const aValue = filter[a];
      const bValue = filter[b];
      
      const aIsEquality = typeof aValue !== 'object' || aValue === null || aValue.$eq !== undefined || aValue.$in !== undefined;
      const bIsEquality = typeof bValue !== 'object' || bValue === null || bValue.$eq !== undefined || bValue.$in !== undefined;
      
      if (aIsEquality && !bIsEquality) {
        return -1;
      }
      
      if (!aIsEquality && bIsEquality) {
        return 1;
      }
      
      return 0;
    });
    
    return indexFields;
  }
}

module.exports = QueryAnalyzer;
