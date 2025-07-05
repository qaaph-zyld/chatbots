/**
 * Query Optimizer
 * 
 * This module provides utilities for optimizing MongoDB queries
 * to improve database performance and reduce query execution time.
 */

const connectionPool = require('./connection-pool');

class QueryOptimizer {
  /**
   * Optimize a find query by applying best practices
   * @param {string} collectionName - Name of the collection
   * @param {Object} query - Query filter
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async optimizedFind(collectionName, query = {}, options = {}) {
    const collection = await this._getCollection(collectionName);
    
    // Apply default options for better performance
    const optimizedOptions = this._applyDefaultOptions(options);
    
    // Add query execution metrics in development
    const startTime = Date.now();
    
    try {
      // Execute the optimized query
      const result = await collection.find(query, optimizedOptions).toArray();
      
      // Log query performance metrics
      this._logQueryPerformance('find', collectionName, query, startTime);
      
      return result;
    } catch (error) {
      console.error(`Error executing optimized find on ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Optimize an aggregation pipeline
   * @param {string} collectionName - Name of the collection
   * @param {Array} pipeline - Aggregation pipeline
   * @param {Object} options - Aggregation options
   * @returns {Promise<Array>} Aggregation results
   */
  async optimizedAggregate(collectionName, pipeline = [], options = {}) {
    const collection = await this._getCollection(collectionName);
    
    // Apply performance optimizations to the pipeline
    const optimizedPipeline = this._optimizeAggregationPipeline(pipeline);
    
    // Set default options for better performance
    const optimizedOptions = {
      allowDiskUse: true,  // Allow using disk for large aggregations
      maxTimeMS: 60000,    // Set a reasonable timeout
      ...options
    };
    
    const startTime = Date.now();
    
    try {
      // Execute the optimized aggregation
      const result = await collection.aggregate(optimizedPipeline, optimizedOptions).toArray();
      
      // Log query performance metrics
      this._logQueryPerformance('aggregate', collectionName, { pipeline: optimizedPipeline }, startTime);
      
      return result;
    } catch (error) {
      console.error(`Error executing optimized aggregate on ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Optimize a count operation
   * @param {string} collectionName - Name of the collection
   * @param {Object} query - Query filter
   * @returns {Promise<number>} Count result
   */
  async optimizedCount(collectionName, query = {}) {
    const collection = await this._getCollection(collectionName);
    
    const startTime = Date.now();
    
    try {
      // Use countDocuments for accurate counts with filters
      // Use estimatedDocumentCount for total counts (no filter)
      const result = Object.keys(query).length > 0
        ? await collection.countDocuments(query)
        : await collection.estimatedDocumentCount();
      
      // Log query performance metrics
      this._logQueryPerformance('count', collectionName, query, startTime);
      
      return result;
    } catch (error) {
      console.error(`Error executing optimized count on ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Optimize a findOne operation
   * @param {string} collectionName - Name of the collection
   * @param {Object} query - Query filter
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query result
   */
  async optimizedFindOne(collectionName, query = {}, options = {}) {
    const collection = await this._getCollection(collectionName);
    
    // Apply default options for better performance
    const optimizedOptions = this._applyDefaultOptions(options);
    
    const startTime = Date.now();
    
    try {
      // Execute the optimized query
      const result = await collection.findOne(query, optimizedOptions);
      
      // Log query performance metrics
      this._logQueryPerformance('findOne', collectionName, query, startTime);
      
      return result;
    } catch (error) {
      console.error(`Error executing optimized findOne on ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Optimize a bulk write operation
   * @param {string} collectionName - Name of the collection
   * @param {Array} operations - Bulk write operations
   * @param {Object} options - Bulk write options
   * @returns {Promise<Object>} Bulk write result
   */
  async optimizedBulkWrite(collectionName, operations = [], options = {}) {
    const collection = await this._getCollection(collectionName);
    
    // Set default options for better performance
    const optimizedOptions = {
      ordered: false,  // Allow parallel processing of operations
      ...options
    };
    
    const startTime = Date.now();
    
    try {
      // Execute the optimized bulk write
      const result = await collection.bulkWrite(operations, optimizedOptions);
      
      // Log query performance metrics
      this._logQueryPerformance('bulkWrite', collectionName, { operationCount: operations.length }, startTime);
      
      return result;
    } catch (error) {
      console.error(`Error executing optimized bulkWrite on ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Optimize an update operation
   * @param {string} collectionName - Name of the collection
   * @param {Object} filter - Update filter
   * @param {Object} update - Update document
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Update result
   */
  async optimizedUpdate(collectionName, filter = {}, update = {}, options = {}) {
    const collection = await this._getCollection(collectionName);
    
    // Set default options for better performance
    const optimizedOptions = {
      ...options
    };
    
    const startTime = Date.now();
    
    try {
      // Determine whether to use updateOne or updateMany
      const method = options.multi === true ? 'updateMany' : 'updateOne';
      
      // Execute the optimized update
      const result = await collection[method](filter, update, optimizedOptions);
      
      // Log query performance metrics
      this._logQueryPerformance(method, collectionName, { filter, update }, startTime);
      
      return result;
    } catch (error) {
      console.error(`Error executing optimized update on ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get a collection from the database
   * @private
   * @param {string} collectionName - Name of the collection
   * @returns {Promise<Collection>} MongoDB collection
   */
  async _getCollection(collectionName) {
    return connectionPool.getCollection(collectionName);
  }

  /**
   * Apply default options to a query for better performance
   * @private
   * @param {Object} options - Original options
   * @returns {Object} Optimized options
   */
  _applyDefaultOptions(options = {}) {
    return {
      // Only return needed fields
      projection: options.projection || options.fields || null,
      
      // Set a reasonable limit if not provided
      limit: options.limit || null,
      
      // Set a reasonable timeout
      maxTimeMS: options.maxTimeMS || 30000,
      
      // Use appropriate batch size for cursor efficiency
      batchSize: options.batchSize || 1000,
      
      // Include other original options
      ...options
    };
  }

  /**
   * Optimize an aggregation pipeline
   * @private
   * @param {Array} pipeline - Original aggregation pipeline
   * @returns {Array} Optimized pipeline
   */
  _optimizeAggregationPipeline(pipeline = []) {
    // Make a deep copy of the pipeline to avoid modifying the original
    const optimizedPipeline = JSON.parse(JSON.stringify(pipeline));
    
    // Look for opportunities to optimize the pipeline
    for (let i = 0; i < optimizedPipeline.length; i++) {
      const stage = optimizedPipeline[i];
      
      // Move $match stages as early as possible
      if (stage.$match && i > 0) {
        // Check if we can move this $match earlier
        const canMoveEarlier = this._canMoveMatchEarlier(stage.$match, optimizedPipeline.slice(0, i));
        
        if (canMoveEarlier.possible) {
          // Move the $match to the target position
          optimizedPipeline.splice(i, 1);
          optimizedPipeline.splice(canMoveEarlier.position, 0, stage);
        }
      }
      
      // Add $limit after $sort when possible to reduce documents to sort
      if (stage.$sort && i < optimizedPipeline.length - 1 && !optimizedPipeline[i + 1].$limit) {
        // Check if there's a $limit later in the pipeline
        const limitIndex = this._findLaterStageIndex(optimizedPipeline, i + 1, '$limit');
        
        if (limitIndex > -1) {
          // Move the $limit right after the $sort
          const limitStage = optimizedPipeline[limitIndex];
          optimizedPipeline.splice(limitIndex, 1);
          optimizedPipeline.splice(i + 1, 0, limitStage);
        }
      }
    }
    
    return optimizedPipeline;
  }

  /**
   * Check if a $match stage can be moved earlier in the pipeline
   * @private
   * @param {Object} matchStage - The $match stage to move
   * @param {Array} previousStages - Stages before the current $match
   * @returns {Object} Result indicating if move is possible and target position
   */
  _canMoveMatchEarlier(matchStage, previousStages) {
    // By default, assume we can't move it
    const result = { possible: false, position: 0 };
    
    // Start from the end of previous stages and work backwards
    for (let i = previousStages.length - 1; i >= 0; i--) {
      const stage = previousStages[i];
      
      // Can't move before $lookup, $unwind, or other stages that change document structure
      if (stage.$lookup || stage.$unwind || stage.$group || stage.$project) {
        // We can move it after this stage
        result.possible = true;
        result.position = i + 1;
        break;
      }
      
      // If we reach the beginning, we can move it to position 0
      if (i === 0) {
        result.possible = true;
        result.position = 0;
      }
    }
    
    return result;
  }

  /**
   * Find the index of a specific stage type later in the pipeline
   * @private
   * @param {Array} pipeline - Aggregation pipeline
   * @param {number} startIndex - Index to start searching from
   * @param {string} stageType - Type of stage to find (e.g., '$limit')
   * @returns {number} Index of the stage or -1 if not found
   */
  _findLaterStageIndex(pipeline, startIndex, stageType) {
    for (let i = startIndex; i < pipeline.length; i++) {
      if (pipeline[i][stageType] !== undefined) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Log query performance metrics
   * @private
   * @param {string} operation - Operation type
   * @param {string} collection - Collection name
   * @param {Object} query - Query details
   * @param {number} startTime - Query start time
   */
  _logQueryPerformance(operation, collection, query, startTime) {
    const duration = Date.now() - startTime;
    
    // Log slow queries (> 100ms)
    if (duration > 100) {
      console.warn(`Slow query detected: ${operation} on ${collection} took ${duration}ms`, {
        operation,
        collection,
        query: JSON.stringify(query).substring(0, 200) + (JSON.stringify(query).length > 200 ? '...' : ''),
        duration
      });
    }
    
    // In development, log all query performance
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query performance: ${operation} on ${collection} took ${duration}ms`);
    }
    
    // In production, this would be sent to a metrics collection system
  }
}

// Export singleton instance
const queryOptimizer = new QueryOptimizer();
module.exports = queryOptimizer;
