/**
 * GraphQL Query Batching Utility
 * 
 * This utility provides a mechanism for batching multiple GraphQL queries into a single request,
 * reducing network overhead and improving performance for complex frontend components.
 */

class GraphQLBatcher {
  /**
   * Create a new GraphQL batcher
   * @param {Object} options - Configuration options
   * @param {string} options.endpoint - GraphQL endpoint URL
   * @param {number} options.maxBatchSize - Maximum number of operations per batch (default: 10)
   * @param {number} options.batchInterval - Time in ms to wait before sending a batch (default: 10)
   * @param {Function} options.fetchFn - Custom fetch function (default: global fetch)
   * @param {Object} options.defaultHeaders - Default headers to include in all requests
   * @param {Function} options.onError - Error handler function
   * @param {boolean} options.debug - Enable debug logging
   */
  constructor(options = {}) {
    this.options = {
      endpoint: options.endpoint || '/graphql',
      maxBatchSize: options.maxBatchSize || 10,
      batchInterval: options.batchInterval || 10,
      fetchFn: options.fetchFn || (typeof fetch === 'function' ? fetch : null),
      defaultHeaders: options.defaultHeaders || {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      onError: options.onError || ((error) => console.error('GraphQL batch error:', error)),
      debug: options.debug || false,
      ...options
    };
    
    if (!this.options.fetchFn) {
      throw new Error('No fetch implementation available. Please provide a fetchFn option.');
    }
    
    this.queue = [];
    this.batchTimeoutId = null;
    this.logger = options.logger || console;
  }

  /**
   * Execute a GraphQL query or mutation
   * @param {Object} operation - GraphQL operation
   * @param {string} operation.query - GraphQL query/mutation string
   * @param {Object} operation.variables - Query variables
   * @param {string} operation.operationName - Operation name
   * @param {Object} operation.context - Additional context (headers, etc.)
   * @returns {Promise<Object>} Query result
   */
  async query(operation) {
    if (this.options.debug) {
      this.logger.debug('GraphQL operation queued:', operation.operationName || 'anonymous');
    }
    
    return new Promise((resolve, reject) => {
      // Add operation to queue
      this.queue.push({
        operation,
        resolve,
        reject
      });
      
      // Schedule batch if not already scheduled
      if (!this.batchTimeoutId) {
        this.scheduleBatch();
      }
      
      // Process immediately if max batch size reached
      if (this.queue.length >= this.options.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  /**
   * Schedule a batch to be processed
   * @private
   */
  scheduleBatch() {
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
    }
    
    this.batchTimeoutId = setTimeout(() => {
      this.processBatch();
    }, this.options.batchInterval);
  }

  /**
   * Process the current batch of operations
   * @private
   */
  async processBatch() {
    // Clear timeout
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
      this.batchTimeoutId = null;
    }
    
    // Get operations from queue
    const batch = this.queue.splice(0, this.options.maxBatchSize);
    
    if (batch.length === 0) {
      return;
    }
    
    if (this.options.debug) {
      this.logger.debug(`Processing GraphQL batch of ${batch.length} operations`);
    }
    
    try {
      // If batch has only one operation, send as a single query
      if (batch.length === 1) {
        const { operation, resolve, reject } = batch[0];
        const result = await this.executeSingleOperation(operation);
        resolve(result);
        return;
      }
      
      // Otherwise, send as a batched query
      const results = await this.executeBatch(batch.map(item => item.operation));
      
      // Distribute results back to callers
      batch.forEach((item, index) => {
        if (results[index].errors) {
          item.reject(new GraphQLBatchError(results[index].errors, results[index].data));
        } else {
          item.resolve(results[index]);
        }
      });
    } catch (error) {
      // Handle batch-level errors
      batch.forEach(item => {
        item.reject(error);
      });
      
      if (typeof this.options.onError === 'function') {
        this.options.onError(error);
      }
    }
  }

  /**
   * Execute a single GraphQL operation
   * @private
   * @param {Object} operation - GraphQL operation
   * @returns {Promise<Object>} Operation result
   */
  async executeSingleOperation(operation) {
    const { query, variables, operationName, context = {} } = operation;
    
    const headers = {
      ...this.options.defaultHeaders,
      ...(context.headers || {})
    };
    
    const response = await this.options.fetchFn(this.options.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
        operationName
      }),
      ...(context.fetchOptions || {})
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }
    
    if (result.errors) {
      throw new GraphQLBatchError(result.errors, result.data);
    }
    
    return result;
  }

  /**
   * Execute a batch of GraphQL operations
   * @private
   * @param {Array<Object>} operations - GraphQL operations
   * @returns {Promise<Array<Object>>} Operation results
   */
  async executeBatch(operations) {
    // Merge headers from all operations
    const headers = { ...this.options.defaultHeaders };
    const fetchOptions = {};
    
    operations.forEach(op => {
      if (op.context && op.context.headers) {
        Object.assign(headers, op.context.headers);
      }
      
      if (op.context && op.context.fetchOptions) {
        Object.assign(fetchOptions, op.context.fetchOptions);
      }
    });
    
    // Prepare batch request
    const batchBody = operations.map(op => ({
      query: op.query,
      variables: op.variables,
      operationName: op.operationName
    }));
    
    // Execute batch request
    const response = await this.options.fetchFn(this.options.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(batchBody),
      ...fetchOptions
    });
    
    if (!response.ok) {
      throw new Error(`GraphQL batch request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Clear the current queue and cancel any pending batch
   */
  clearQueue() {
    if (this.batchTimeoutId) {
      clearTimeout(this.batchTimeoutId);
      this.batchTimeoutId = null;
    }
    
    const queueLength = this.queue.length;
    
    this.queue.forEach(item => {
      item.reject(new Error('GraphQL batch operation cancelled'));
    });
    
    this.queue = [];
    
    if (this.options.debug && queueLength > 0) {
      this.logger.debug(`Cleared GraphQL batch queue (${queueLength} operations)`);
    }
  }
}

/**
 * GraphQL Batch Error
 * Custom error class for GraphQL batch errors
 */
class GraphQLBatchError extends Error {
  /**
   * Create a new GraphQL batch error
   * @param {Array<Object>} graphqlErrors - GraphQL errors
   * @param {Object} data - Partial data returned
   */
  constructor(graphqlErrors, data) {
    const message = graphqlErrors.map(e => e.message).join(', ');
    super(`GraphQL Error: ${message}`);
    
    this.name = 'GraphQLBatchError';
    this.graphqlErrors = graphqlErrors;
    this.data = data;
  }
}

/**
 * Create a React hook for using the GraphQL batcher
 * @param {Object} options - Batcher options
 * @returns {Object} GraphQL hook functions
 */
function createGraphQLHook(options = {}) {
  const batcher = new GraphQLBatcher(options);
  
  return {
    /**
     * Execute a GraphQL query
     * @param {string} query - GraphQL query string
     * @param {Object} variables - Query variables
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Query result
     */
    query: (query, variables = {}, options = {}) => {
      return batcher.query({
        query,
        variables,
        operationName: options.operationName,
        context: options.context
      });
    },
    
    /**
     * Execute a GraphQL mutation
     * @param {string} mutation - GraphQL mutation string
     * @param {Object} variables - Mutation variables
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Mutation result
     */
    mutate: (mutation, variables = {}, options = {}) => {
      return batcher.query({
        query: mutation,
        variables,
        operationName: options.operationName,
        context: options.context
      });
    },
    
    /**
     * Clear the current batch queue
     */
    clearQueue: () => {
      batcher.clearQueue();
    }
  };
}

module.exports = {
  GraphQLBatcher,
  GraphQLBatchError,
  createGraphQLHook
};
