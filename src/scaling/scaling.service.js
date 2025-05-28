/**
 * Scaling Service
 * 
 * Handles load balancing, auto-scaling, and performance optimization
 */

const os = require('os');
const cluster = require('cluster');
const { logger } = require('../utils');
const config = require('../config');

class ScalingService {
  constructor() {
    this.isInitialized = false;
    this.workers = new Map();
    this.metrics = {
      cpuUsage: 0,
      memoryUsage: 0,
      requestsPerMinute: 0,
      activeConnections: 0,
      responseTime: 0
    };
    this.thresholds = {
      cpu: 70, // 70% CPU usage threshold
      memory: 80, // 80% memory usage threshold
      requestsPerMinute: 1000, // 1000 requests per minute threshold
      responseTime: 500 // 500ms response time threshold
    };
    this.metricsInterval = null;
    this.scalingInterval = null;
    this.requestCounts = [];
    this.responseTimes = [];
  }

  /**
   * Initialize the scaling service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      logger.info('Initializing scaling service');
      
      // Load configuration
      this.loadConfiguration();
      
      // Start metrics collection
      this.startMetricsCollection();
      
      // Start auto-scaling if enabled
      if (this.config.autoScaling) {
        this.startAutoScaling();
      }
      
      this.isInitialized = true;
      logger.info('Scaling service initialized successfully');
    } catch (error) {
      logger.error('Error initializing scaling service:', error.message);
      throw error;
    }
  }

  /**
   * Load scaling configuration
   * @private
   */
  loadConfiguration() {
    this.config = {
      enabled: process.env.SCALING_ENABLED === 'true' || false,
      autoScaling: process.env.AUTO_SCALING_ENABLED === 'true' || false,
      minInstances: parseInt(process.env.MIN_INSTANCES || '1', 10),
      maxInstances: parseInt(process.env.MAX_INSTANCES || os.cpus().length, 10),
      metricsInterval: parseInt(process.env.METRICS_INTERVAL || '60000', 10), // 1 minute
      scalingInterval: parseInt(process.env.SCALING_INTERVAL || '300000', 10), // 5 minutes
      scaleUpThreshold: parseInt(process.env.SCALE_UP_THRESHOLD || '70', 10), // 70%
      scaleDownThreshold: parseInt(process.env.SCALE_DOWN_THRESHOLD || '30', 10), // 30%
      cooldownPeriod: parseInt(process.env.COOLDOWN_PERIOD || '600000', 10), // 10 minutes
      requestsWindowSize: parseInt(process.env.REQUESTS_WINDOW_SIZE || '60', 10), // 60 seconds
      responseTimeWindowSize: parseInt(process.env.RESPONSE_TIME_WINDOW_SIZE || '60', 10) // 60 seconds
    };
    
    // Override thresholds from config
    this.thresholds.cpu = this.config.scaleUpThreshold;
    
    logger.info('Scaling configuration loaded:', this.config);
  }

  /**
   * Start metrics collection
   * @private
   */
  startMetricsCollection() {
    // Clear existing interval if any
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Start collecting metrics
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.metricsInterval);
    
    logger.info(`Metrics collection started with interval: ${this.config.metricsInterval}ms`);
  }

  /**
   * Collect system and application metrics
   * @private
   */
  collectMetrics() {
    try {
      // CPU usage
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
      }
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const cpuUsage = 100 - (idle / total) * 100;
      
      // Memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
      
      // Update metrics
      this.metrics.cpuUsage = cpuUsage;
      this.metrics.memoryUsage = memoryUsage;
      
      // Calculate requests per minute
      const now = Date.now();
      this.requestCounts = this.requestCounts.filter(item => now - item.timestamp < 60000);
      const requestCount = this.requestCounts.reduce((total, item) => total + item.count, 0);
      this.metrics.requestsPerMinute = requestCount;
      
      // Calculate average response time
      this.responseTimes = this.responseTimes.filter(item => now - item.timestamp < 60000);
      if (this.responseTimes.length > 0) {
        const totalResponseTime = this.responseTimes.reduce((total, item) => total + item.time, 0);
        this.metrics.responseTime = totalResponseTime / this.responseTimes.length;
      } else {
        this.metrics.responseTime = 0;
      }
      
      logger.debug('Collected metrics:', this.metrics);
    } catch (error) {
      logger.error('Error collecting metrics:', error.message);
    }
  }

  /**
   * Start auto-scaling
   * @private
   */
  startAutoScaling() {
    // Only primary process should handle scaling
    if (!cluster.isPrimary) {
      return;
    }
    
    // Clear existing interval if any
    if (this.scalingInterval) {
      clearInterval(this.scalingInterval);
    }
    
    // Start auto-scaling
    this.scalingInterval = setInterval(() => {
      this.evaluateScaling();
    }, this.config.scalingInterval);
    
    logger.info(`Auto-scaling started with interval: ${this.config.scalingInterval}ms`);
  }

  /**
   * Evaluate if scaling is needed
   * @private
   */
  evaluateScaling() {
    try {
      const currentWorkers = this.workers.size;
      
      // Check if we need to scale up
      if (this.shouldScaleUp() && currentWorkers < this.config.maxInstances) {
        this.scaleUp();
        return;
      }
      
      // Check if we need to scale down
      if (this.shouldScaleDown() && currentWorkers > this.config.minInstances) {
        this.scaleDown();
        return;
      }
      
      logger.debug('No scaling action needed');
    } catch (error) {
      logger.error('Error evaluating scaling:', error.message);
    }
  }

  /**
   * Check if we should scale up
   * @returns {boolean} True if we should scale up
   * @private
   */
  shouldScaleUp() {
    // Check CPU usage
    if (this.metrics.cpuUsage > this.thresholds.cpu) {
      logger.info(`CPU usage (${this.metrics.cpuUsage.toFixed(2)}%) exceeds threshold (${this.thresholds.cpu}%)`);
      return true;
    }
    
    // Check memory usage
    if (this.metrics.memoryUsage > this.thresholds.memory) {
      logger.info(`Memory usage (${this.metrics.memoryUsage.toFixed(2)}%) exceeds threshold (${this.thresholds.memory}%)`);
      return true;
    }
    
    // Check requests per minute
    if (this.metrics.requestsPerMinute > this.thresholds.requestsPerMinute) {
      logger.info(`Requests per minute (${this.metrics.requestsPerMinute}) exceeds threshold (${this.thresholds.requestsPerMinute})`);
      return true;
    }
    
    // Check response time
    if (this.metrics.responseTime > this.thresholds.responseTime) {
      logger.info(`Response time (${this.metrics.responseTime.toFixed(2)}ms) exceeds threshold (${this.thresholds.responseTime}ms)`);
      return true;
    }
    
    return false;
  }

  /**
   * Check if we should scale down
   * @returns {boolean} True if we should scale down
   * @private
   */
  shouldScaleDown() {
    // Check CPU usage
    if (this.metrics.cpuUsage < this.config.scaleDownThreshold) {
      logger.info(`CPU usage (${this.metrics.cpuUsage.toFixed(2)}%) below threshold (${this.config.scaleDownThreshold}%)`);
      return true;
    }
    
    // Check memory usage
    if (this.metrics.memoryUsage < this.config.scaleDownThreshold) {
      logger.info(`Memory usage (${this.metrics.memoryUsage.toFixed(2)}%) below threshold (${this.config.scaleDownThreshold}%)`);
      return true;
    }
    
    return false;
  }

  /**
   * Scale up by adding a new worker
   * @private
   */
  scaleUp() {
    try {
      logger.info('Scaling up: Adding a new worker');
      
      // Fork a new worker
      const worker = cluster.fork();
      
      // Add worker to the map
      this.workers.set(worker.id, {
        worker,
        startTime: Date.now()
      });
      
      // Set up event handlers
      worker.on('exit', (code, signal) => {
        logger.warn(`Worker ${worker.id} exited with code ${code} and signal ${signal}`);
        this.workers.delete(worker.id);
        
        // Replace the worker if it died unexpectedly
        if (code !== 0 && !worker.exitedAfterDisconnect) {
          logger.info(`Replacing dead worker ${worker.id}`);
          this.scaleUp();
        }
      });
      
      logger.info(`Worker ${worker.id} started`);
    } catch (error) {
      logger.error('Error scaling up:', error.message);
    }
  }

  /**
   * Scale down by removing a worker
   * @private
   */
  scaleDown() {
    try {
      logger.info('Scaling down: Removing a worker');
      
      // Find the newest worker to remove
      let newestWorkerId = null;
      let newestWorkerTime = 0;
      
      for (const [id, data] of this.workers.entries()) {
        if (data.startTime > newestWorkerTime) {
          newestWorkerId = id;
          newestWorkerTime = data.startTime;
        }
      }
      
      if (newestWorkerId) {
        const workerData = this.workers.get(newestWorkerId);
        
        // Gracefully disconnect the worker
        workerData.worker.disconnect();
        
        logger.info(`Worker ${newestWorkerId} disconnected`);
      } else {
        logger.warn('No workers to remove');
      }
    } catch (error) {
      logger.error('Error scaling down:', error.message);
    }
  }

  /**
   * Track a request
   * @returns {void}
   */
  trackRequest() {
    const now = Date.now();
    const lastMinute = this.requestCounts.find(item => now - item.timestamp < 1000);
    
    if (lastMinute) {
      lastMinute.count++;
    } else {
      this.requestCounts.push({
        timestamp: now,
        count: 1
      });
    }
  }

  /**
   * Track response time
   * @param {number} time - Response time in milliseconds
   * @returns {void}
   */
  trackResponseTime(time) {
    this.responseTimes.push({
      timestamp: Date.now(),
      time
    });
  }

  /**
   * Get current metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      workers: this.workers.size,
      timestamp: Date.now()
    };
  }

  /**
   * Get scaling configuration
   * @returns {Object} Scaling configuration
   */
  getConfiguration() {
    return this.config;
  }

  /**
   * Update scaling configuration
   * @param {Object} newConfig - New configuration
   * @returns {Object} Updated configuration
   */
  updateConfiguration(newConfig) {
    // Update configuration
    this.config = {
      ...this.config,
      ...newConfig
    };
    
    // Update thresholds
    if (newConfig.scaleUpThreshold) {
      this.thresholds.cpu = newConfig.scaleUpThreshold;
    }
    
    // Restart metrics collection if interval changed
    if (newConfig.metricsInterval && newConfig.metricsInterval !== this.config.metricsInterval) {
      this.startMetricsCollection();
    }
    
    // Restart auto-scaling if interval changed
    if (newConfig.scalingInterval && newConfig.scalingInterval !== this.config.scalingInterval) {
      this.startAutoScaling();
    }
    
    logger.info('Scaling configuration updated:', this.config);
    
    return this.config;
  }
}

module.exports = new ScalingService();
