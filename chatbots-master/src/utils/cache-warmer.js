/**
 * Cache Warmer Utility
 * 
 * This module provides functionality to pre-populate caches for frequently accessed data,
 * improving response times and reducing database load during peak usage periods.
 */

const EventEmitter = require('events');

class CacheWarmer extends EventEmitter {
  /**
   * Create a new cache warmer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      redisClient: options.redisClient,
      mongooseConnection: options.mongooseConnection,
      logger: options.logger || console,
      concurrency: options.concurrency || 5,
      retries: options.retries || 3,
      retryDelay: options.retryDelay || 1000,
      warmupStrategies: options.warmupStrategies || [],
      schedules: options.schedules || [],
      ...options
    };
    
    this.isRunning = false;
    this.scheduledJobs = new Map();
    this.activeJobs = new Set();
    this.stats = {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      lastRun: null,
      itemsWarmed: 0,
      errors: []
    };
  }

  /**
   * Add a warmup strategy
   * @param {Object} strategy - Warmup strategy
   * @param {string} strategy.name - Strategy name
   * @param {Function} strategy.getItems - Function to get items to warm
   * @param {Function} strategy.warmItem - Function to warm a single item
   * @param {number} strategy.priority - Priority (higher numbers run first)
   * @param {string} strategy.description - Strategy description
   * @returns {CacheWarmer} This instance for chaining
   */
  addStrategy(strategy) {
    if (!strategy.name) {
      throw new Error('Strategy must have a name');
    }
    
    if (typeof strategy.getItems !== 'function') {
      throw new Error('Strategy must have a getItems function');
    }
    
    if (typeof strategy.warmItem !== 'function') {
      throw new Error('Strategy must have a warmItem function');
    }
    
    // Set default values
    strategy.priority = strategy.priority || 0;
    strategy.description = strategy.description || `Warmup strategy for ${strategy.name}`;
    
    this.options.warmupStrategies.push(strategy);
    
    return this;
  }

  /**
   * Add a schedule for automatic cache warming
   * @param {Object} schedule - Schedule configuration
   * @param {string} schedule.name - Schedule name
   * @param {string} schedule.cron - Cron expression
   * @param {Array<string>} schedule.strategies - Strategy names to run
   * @param {boolean} schedule.enabled - Whether the schedule is enabled
   * @returns {CacheWarmer} This instance for chaining
   */
  addSchedule(schedule) {
    if (!schedule.name) {
      throw new Error('Schedule must have a name');
    }
    
    if (!schedule.cron) {
      throw new Error('Schedule must have a cron expression');
    }
    
    if (!Array.isArray(schedule.strategies) || schedule.strategies.length === 0) {
      throw new Error('Schedule must have at least one strategy');
    }
    
    // Set default values
    schedule.enabled = schedule.enabled !== false;
    
    this.options.schedules.push(schedule);
    
    return this;
  }

  /**
   * Start the cache warmer
   * @returns {CacheWarmer} This instance for chaining
   */
  start() {
    if (this.isRunning) {
      return this;
    }
    
    this.options.logger.info('Starting cache warmer');
    
    this.isRunning = true;
    
    // Schedule all enabled schedules
    this._scheduleJobs();
    
    this.emit('started');
    
    return this;
  }

  /**
   * Stop the cache warmer
   * @returns {CacheWarmer} This instance for chaining
   */
  stop() {
    if (!this.isRunning) {
      return this;
    }
    
    this.options.logger.info('Stopping cache warmer');
    
    this.isRunning = false;
    
    // Cancel all scheduled jobs
    this._cancelJobs();
    
    this.emit('stopped');
    
    return this;
  }

  /**
   * Run cache warming for specified strategies
   * @param {Array<string>} strategyNames - Strategy names to run
   * @param {Object} options - Run options
   * @returns {Promise<Object>} Run results
   */
  async run(strategyNames = [], options = {}) {
    const startTime = Date.now();
    
    // Get strategies to run
    const strategies = this._getStrategies(strategyNames);
    
    if (strategies.length === 0) {
      return {
        success: false,
        message: 'No strategies found to run',
        duration: 0,
        itemsWarmed: 0,
        errors: []
      };
    }
    
    // Update stats
    this.stats.totalRuns++;
    this.stats.lastRun = new Date();
    
    // Sort strategies by priority (higher first)
    strategies.sort((a, b) => b.priority - a.priority);
    
    const runId = this._generateRunId();
    const errors = [];
    let itemsWarmed = 0;
    
    this.emit('runStarted', {
      runId,
      strategies: strategies.map(s => s.name)
    });
    
    try {
      // Run each strategy
      for (const strategy of strategies) {
        try {
          this.options.logger.info(`Running warmup strategy: ${strategy.name}`);
          
          // Get items to warm
          const items = await this._getItemsWithRetry(strategy);
          
          if (!items || items.length === 0) {
            this.options.logger.info(`No items to warm for strategy: ${strategy.name}`);
            continue;
          }
          
          this.options.logger.info(`Warming ${items.length} items for strategy: ${strategy.name}`);
          
          // Warm items with concurrency limit
          const results = await this._warmItemsWithConcurrency(strategy, items);
          
          // Update stats
          itemsWarmed += results.success;
          
          if (results.errors.length > 0) {
            errors.push(...results.errors.map(error => ({
              strategy: strategy.name,
              error: error.message,
              item: error.item
            })));
          }
        } catch (err) {
          this.options.logger.error(`Error running strategy ${strategy.name}:`, err);
          
          errors.push({
            strategy: strategy.name,
            error: err.message,
            phase: 'strategy'
          });
        }
      }
      
      // Update stats
      this.stats.itemsWarmed += itemsWarmed;
      
      if (errors.length > 0) {
        this.stats.failedRuns++;
        this.stats.errors = [...this.stats.errors, ...errors].slice(-100); // Keep last 100 errors
      } else {
        this.stats.successfulRuns++;
      }
      
      const duration = Date.now() - startTime;
      
      this.emit('runCompleted', {
        runId,
        success: errors.length === 0,
        duration,
        itemsWarmed,
        errors
      });
      
      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `Successfully warmed ${itemsWarmed} items` 
          : `Completed with ${errors.length} errors`,
        duration,
        itemsWarmed,
        errors
      };
    } catch (err) {
      this.options.logger.error('Error running cache warmer:', err);
      
      this.stats.failedRuns++;
      
      const duration = Date.now() - startTime;
      
      this.emit('runFailed', {
        runId,
        duration,
        error: err.message
      });
      
      return {
        success: false,
        message: `Failed to run cache warmer: ${err.message}`,
        duration,
        itemsWarmed,
        errors: [{
          phase: 'global',
          error: err.message
        }]
      };
    }
  }

  /**
   * Get cache warmer statistics
   * @returns {Object} Cache warmer statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get all strategies
   * @returns {Array<Object>} All strategies
   */
  getStrategies() {
    return this.options.warmupStrategies.map(strategy => ({
      name: strategy.name,
      description: strategy.description,
      priority: strategy.priority
    }));
  }

  /**
   * Get all schedules
   * @returns {Array<Object>} All schedules
   */
  getSchedules() {
    return this.options.schedules.map(schedule => ({
      name: schedule.name,
      cron: schedule.cron,
      strategies: [...schedule.strategies],
      enabled: schedule.enabled,
      nextRun: this.scheduledJobs.get(schedule.name)?.nextDate?.()
    }));
  }

  /**
   * Schedule all enabled jobs
   * @private
   */
  _scheduleJobs() {
    // Cancel existing jobs first
    this._cancelJobs();
    
    // Skip if node-cron is not available
    if (!this._hasCronSupport()) {
      this.options.logger.warn('node-cron is not available, skipping job scheduling');
      return;
    }
    
    // Import node-cron dynamically
    const cron = require('node-cron');
    
    // Schedule each enabled schedule
    for (const schedule of this.options.schedules) {
      if (!schedule.enabled) {
        continue;
      }
      
      try {
        const job = cron.schedule(schedule.cron, async () => {
          this.options.logger.info(`Running scheduled job: ${schedule.name}`);
          
          try {
            await this.run(schedule.strategies, { scheduled: true });
          } catch (err) {
            this.options.logger.error(`Error running scheduled job ${schedule.name}:`, err);
          }
        });
        
        this.scheduledJobs.set(schedule.name, job);
        
        this.options.logger.info(`Scheduled job ${schedule.name}: ${schedule.cron}`);
      } catch (err) {
        this.options.logger.error(`Error scheduling job ${schedule.name}:`, err);
      }
    }
  }

  /**
   * Cancel all scheduled jobs
   * @private
   */
  _cancelJobs() {
    for (const [name, job] of this.scheduledJobs.entries()) {
      try {
        job.stop();
        this.options.logger.info(`Cancelled scheduled job: ${name}`);
      } catch (err) {
        this.options.logger.error(`Error cancelling job ${name}:`, err);
      }
    }
    
    this.scheduledJobs.clear();
  }

  /**
   * Get strategies by name
   * @private
   * @param {Array<string>} strategyNames - Strategy names to get
   * @returns {Array<Object>} Strategies
   */
  _getStrategies(strategyNames) {
    // If no strategy names provided, return all strategies
    if (!strategyNames || strategyNames.length === 0) {
      return [...this.options.warmupStrategies];
    }
    
    // Filter strategies by name
    return this.options.warmupStrategies.filter(strategy => 
      strategyNames.includes(strategy.name)
    );
  }

  /**
   * Get items to warm with retry
   * @private
   * @param {Object} strategy - Warmup strategy
   * @returns {Promise<Array>} Items to warm
   */
  async _getItemsWithRetry(strategy) {
    let lastError;
    
    for (let attempt = 0; attempt < this.options.retries; attempt++) {
      try {
        return await strategy.getItems();
      } catch (err) {
        lastError = err;
        
        if (attempt < this.options.retries - 1) {
          this.options.logger.warn(`Error getting items for strategy ${strategy.name}, retrying (${attempt + 1}/${this.options.retries}):`, err);
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        }
      }
    }
    
    throw new Error(`Failed to get items for strategy ${strategy.name} after ${this.options.retries} attempts: ${lastError.message}`);
  }

  /**
   * Warm items with concurrency limit
   * @private
   * @param {Object} strategy - Warmup strategy
   * @param {Array} items - Items to warm
   * @returns {Promise<Object>} Warm results
   */
  async _warmItemsWithConcurrency(strategy, items) {
    const results = {
      total: items.length,
      success: 0,
      failed: 0,
      errors: []
    };
    
    // Process items in batches based on concurrency
    for (let i = 0; i < items.length; i += this.options.concurrency) {
      const batch = items.slice(i, i + this.options.concurrency);
      
      // Process batch in parallel
      const batchPromises = batch.map(item => this._warmItemWithRetry(strategy, item));
      
      // Wait for all items in batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const item = batch[j];
        
        if (result.status === 'fulfilled') {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            item,
            message: result.reason.message
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Warm a single item with retry
   * @private
   * @param {Object} strategy - Warmup strategy
   * @param {*} item - Item to warm
   * @returns {Promise<*>} Warm result
   */
  async _warmItemWithRetry(strategy, item) {
    let lastError;
    
    for (let attempt = 0; attempt < this.options.retries; attempt++) {
      try {
        return await strategy.warmItem(item);
      } catch (err) {
        lastError = err;
        
        if (attempt < this.options.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        }
      }
    }
    
    throw new Error(`Failed to warm item for strategy ${strategy.name} after ${this.options.retries} attempts: ${lastError.message}`);
  }

  /**
   * Generate a unique run ID
   * @private
   * @returns {string} Run ID
   */
  _generateRunId() {
    return `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if node-cron is available
   * @private
   * @returns {boolean} Whether node-cron is available
   */
  _hasCronSupport() {
    try {
      require('node-cron');
      return true;
    } catch (err) {
      return false;
    }
  }
}

/**
 * Create common warmup strategies
 * @param {Object} options - Options for creating strategies
 * @returns {Object} Common warmup strategies
 */
function createCommonStrategies(options = {}) {
  const strategies = {};
  
  // Redis key pattern strategy
  if (options.redisClient) {
    strategies.redisKeyPattern = {
      name: 'redisKeyPattern',
      description: 'Warm Redis cache based on key patterns',
      priority: 10,
      getItems: async () => {
        const patterns = options.redisPatterns || ['cache:*'];
        const keys = [];
        
        for (const pattern of patterns) {
          const patternKeys = await options.redisClient.keys(pattern);
          keys.push(...patternKeys);
        }
        
        return keys;
      },
      warmItem: async (key) => {
        return await options.redisClient.get(key);
      }
    };
  }
  
  // MongoDB collection strategy
  if (options.mongooseConnection) {
    strategies.mongoCollection = {
      name: 'mongoCollection',
      description: 'Warm MongoDB query cache for frequently accessed collections',
      priority: 20,
      getItems: async () => {
        const collections = options.mongoCollections || [];
        const items = [];
        
        for (const collection of collections) {
          if (!collection.model || !collection.query) {
            continue;
          }
          
          const model = options.mongooseConnection.model(collection.model);
          const query = collection.query;
          const limit = collection.limit || 100;
          
          items.push({
            model: collection.model,
            query,
            limit
          });
        }
        
        return items;
      },
      warmItem: async (item) => {
        const model = options.mongooseConnection.model(item.model);
        return await model.find(item.query).limit(item.limit).lean();
      }
    };
  }
  
  // API endpoint strategy
  if (options.apiBaseUrl) {
    strategies.apiEndpoint = {
      name: 'apiEndpoint',
      description: 'Warm API endpoint cache by making requests',
      priority: 30,
      getItems: async () => {
        return options.apiEndpoints || [];
      },
      warmItem: async (endpoint) => {
        const axios = require('axios');
        const url = `${options.apiBaseUrl}${endpoint.path}`;
        
        return await axios({
          method: endpoint.method || 'GET',
          url,
          headers: endpoint.headers || {},
          data: endpoint.data,
          params: endpoint.params,
          timeout: endpoint.timeout || 5000
        });
      }
    };
  }
  
  return strategies;
}

module.exports = {
  CacheWarmer,
  createCommonStrategies
};
