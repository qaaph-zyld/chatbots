/**
 * Real-time Performance Dashboard
 * 
 * This module provides a real-time dashboard for monitoring application performance metrics,
 * including memory usage, response times, database queries, and other key indicators.
 */

const EventEmitter = require('events');
const os = require('os');
const v8 = require('v8');

class PerformanceDashboard extends EventEmitter {
  /**
   * Create a new performance dashboard
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      updateInterval: options.updateInterval || 5000, // 5 seconds
      retentionPeriod: options.retentionPeriod || 3600000, // 1 hour
      maxDataPoints: options.maxDataPoints || 720, // 1 hour at 5 second intervals
      enableMemoryMonitoring: options.enableMemoryMonitoring !== false,
      enableCpuMonitoring: options.enableCpuMonitoring !== false,
      enableResponseTimeMonitoring: options.enableResponseTimeMonitoring !== false,
      enableDatabaseMonitoring: options.enableDatabaseMonitoring !== false,
      enableSystemMonitoring: options.enableSystemMonitoring !== false,
      logger: options.logger || console,
      ...options
    };
    
    this.isRunning = false;
    this.updateIntervalId = null;
    this.metrics = {
      memory: [],
      cpu: [],
      responseTimes: [],
      database: [],
      system: [],
      errors: []
    };
    
    // Initialize data collectors
    this.collectors = {};
    
    if (this.options.enableMemoryMonitoring) {
      this.collectors.memory = this._createMemoryCollector();
    }
    
    if (this.options.enableCpuMonitoring) {
      this.collectors.cpu = this._createCpuCollector();
    }
    
    if (this.options.enableResponseTimeMonitoring) {
      this.collectors.responseTimes = this._createResponseTimeCollector();
    }
    
    if (this.options.enableDatabaseMonitoring) {
      this.collectors.database = this._createDatabaseCollector();
    }
    
    if (this.options.enableSystemMonitoring) {
      this.collectors.system = this._createSystemCollector();
    }
    
    // Bind methods
    this._collectMetrics = this._collectMetrics.bind(this);
  }

  /**
   * Start the performance dashboard
   * @returns {PerformanceDashboard} This instance for chaining
   */
  start() {
    if (this.isRunning) {
      return this;
    }
    
    this.options.logger.info('Starting performance dashboard');
    
    this.isRunning = true;
    
    // Perform initial collection
    this._collectMetrics();
    
    // Start periodic collection
    this.updateIntervalId = setInterval(
      this._collectMetrics,
      this.options.updateInterval
    );
    
    this.emit('started');
    
    return this;
  }

  /**
   * Stop the performance dashboard
   * @returns {PerformanceDashboard} This instance for chaining
   */
  stop() {
    if (!this.isRunning) {
      return this;
    }
    
    this.options.logger.info('Stopping performance dashboard');
    
    this.isRunning = false;
    
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
    
    this.emit('stopped');
    
    return this;
  }

  /**
   * Get all metrics
   * @returns {Object} All metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get specific metric data
   * @param {string} metricType - Metric type (memory, cpu, responseTimes, database, system, errors)
   * @param {Object} options - Options for filtering and aggregation
   * @returns {Array<Object>} Metric data
   */
  getMetricData(metricType, options = {}) {
    if (!this.metrics[metricType]) {
      return [];
    }
    
    let data = [...this.metrics[metricType]];
    
    // Apply time range filter
    if (options.startTime) {
      data = data.filter(item => item.timestamp >= options.startTime);
    }
    
    if (options.endTime) {
      data = data.filter(item => item.timestamp <= options.endTime);
    }
    
    // Apply aggregation
    if (options.aggregate) {
      data = this._aggregateData(data, options.aggregate);
    }
    
    // Apply limit
    if (options.limit) {
      data = data.slice(-options.limit);
    }
    
    return data;
  }

  /**
   * Record a response time metric
   * @param {Object} data - Response time data
   * @returns {PerformanceDashboard} This instance for chaining
   */
  recordResponseTime(data) {
    if (!this.options.enableResponseTimeMonitoring) {
      return this;
    }
    
    const metric = {
      timestamp: Date.now(),
      path: data.path,
      method: data.method,
      statusCode: data.statusCode,
      duration: data.duration,
      contentLength: data.contentLength
    };
    
    this.metrics.responseTimes.push(metric);
    
    // Trim if needed
    if (this.metrics.responseTimes.length > this.options.maxDataPoints) {
      this.metrics.responseTimes.shift();
    }
    
    this.emit('responseTimeRecorded', metric);
    
    return this;
  }

  /**
   * Record a database query metric
   * @param {Object} data - Database query data
   * @returns {PerformanceDashboard} This instance for chaining
   */
  recordDatabaseQuery(data) {
    if (!this.options.enableDatabaseMonitoring) {
      return this;
    }
    
    const metric = {
      timestamp: Date.now(),
      collection: data.collection,
      operation: data.operation,
      duration: data.duration,
      query: data.query,
      resultCount: data.resultCount
    };
    
    this.metrics.database.push(metric);
    
    // Trim if needed
    if (this.metrics.database.length > this.options.maxDataPoints) {
      this.metrics.database.shift();
    }
    
    this.emit('databaseQueryRecorded', metric);
    
    return this;
  }

  /**
   * Record an error metric
   * @param {Object} data - Error data
   * @returns {PerformanceDashboard} This instance for chaining
   */
  recordError(data) {
    const metric = {
      timestamp: Date.now(),
      type: data.type || 'unknown',
      message: data.message,
      stack: data.stack,
      context: data.context || {}
    };
    
    this.metrics.errors.push(metric);
    
    // Trim if needed
    if (this.metrics.errors.length > this.options.maxDataPoints) {
      this.metrics.errors.shift();
    }
    
    this.emit('errorRecorded', metric);
    
    return this;
  }

  /**
   * Collect metrics from all enabled collectors
   * @private
   */
  _collectMetrics() {
    const timestamp = Date.now();
    
    // Collect from each enabled collector
    for (const [type, collector] of Object.entries(this.collectors)) {
      try {
        const data = collector();
        
        if (data) {
          const metric = {
            timestamp,
            ...data
          };
          
          this.metrics[type].push(metric);
          
          // Trim if needed
          if (this.metrics[type].length > this.options.maxDataPoints) {
            this.metrics[type].shift();
          }
          
          this.emit(`${type}Collected`, metric);
        }
      } catch (err) {
        this.options.logger.error(`Error collecting ${type} metrics:`, err);
      }
    }
    
    // Emit all metrics collected event
    this.emit('metricsCollected', {
      timestamp,
      metrics: this.getMetrics()
    });
  }

  /**
   * Create memory metrics collector
   * @private
   * @returns {Function} Collector function
   */
  _createMemoryCollector() {
    return () => {
      const memoryUsage = process.memoryUsage();
      const heapStats = v8.getHeapStatistics();
      
      return {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
        arrayBuffers: memoryUsage.arrayBuffers,
        heapSizeLimit: heapStats.heap_size_limit,
        totalHeapSize: heapStats.total_heap_size,
        totalAvailableSize: heapStats.total_available_size,
        usedHeapSize: heapStats.used_heap_size,
        heapUsedPercent: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        rssPercent: (memoryUsage.rss / os.totalmem()) * 100
      };
    };
  }

  /**
   * Create CPU metrics collector
   * @private
   * @returns {Function} Collector function
   */
  _createCpuCollector() {
    let lastCpuUsage = process.cpuUsage();
    let lastCpuInfo = os.cpus();
    let lastTimestamp = Date.now();
    
    return () => {
      const currentCpuUsage = process.cpuUsage();
      const currentCpuInfo = os.cpus();
      const currentTimestamp = Date.now();
      
      // Calculate process CPU usage
      const userDiff = currentCpuUsage.user - lastCpuUsage.user;
      const systemDiff = currentCpuUsage.system - lastCpuUsage.system;
      const elapsedMs = currentTimestamp - lastTimestamp;
      
      const processCpuPercent = (userDiff + systemDiff) / (elapsedMs * 1000) * 100;
      
      // Calculate system CPU usage
      let systemIdle = 0;
      let systemTotal = 0;
      
      for (let i = 0; i < currentCpuInfo.length; i++) {
        const currentCpu = currentCpuInfo[i].times;
        const lastCpu = lastCpuInfo[i].times;
        
        const idle = currentCpu.idle - lastCpu.idle;
        const total = 
          (currentCpu.user - lastCpu.user) +
          (currentCpu.nice - lastCpu.nice) +
          (currentCpu.sys - lastCpu.sys) +
          (currentCpu.irq - lastCpu.irq) +
          idle;
        
        systemIdle += idle;
        systemTotal += total;
      }
      
      const systemCpuPercent = 100 - (systemIdle / systemTotal * 100);
      
      // Update last values
      lastCpuUsage = currentCpuUsage;
      lastCpuInfo = currentCpuInfo;
      lastTimestamp = currentTimestamp;
      
      return {
        processCpuPercent,
        systemCpuPercent,
        cpuCount: os.cpus().length,
        loadAverage: os.loadavg()
      };
    };
  }

  /**
   * Create response time metrics collector
   * @private
   * @returns {Function} Collector function
   */
  _createResponseTimeCollector() {
    return () => {
      // This collector doesn't actively collect data
      // It relies on recordResponseTime being called
      
      // Return aggregated data
      const responseTimes = this.metrics.responseTimes;
      
      if (responseTimes.length === 0) {
        return null;
      }
      
      // Get data from the last interval
      const intervalStart = Date.now() - this.options.updateInterval;
      const recentResponses = responseTimes.filter(item => item.timestamp >= intervalStart);
      
      if (recentResponses.length === 0) {
        return null;
      }
      
      // Calculate statistics
      const durations = recentResponses.map(item => item.duration);
      const total = durations.reduce((sum, duration) => sum + duration, 0);
      const average = total / durations.length;
      const sorted = [...durations].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      
      return {
        count: recentResponses.length,
        average,
        median,
        p95,
        p99,
        min,
        max
      };
    };
  }

  /**
   * Create database metrics collector
   * @private
   * @returns {Function} Collector function
   */
  _createDatabaseCollector() {
    return () => {
      // This collector doesn't actively collect data
      // It relies on recordDatabaseQuery being called
      
      // Return aggregated data
      const queries = this.metrics.database;
      
      if (queries.length === 0) {
        return null;
      }
      
      // Get data from the last interval
      const intervalStart = Date.now() - this.options.updateInterval;
      const recentQueries = queries.filter(item => item.timestamp >= intervalStart);
      
      if (recentQueries.length === 0) {
        return null;
      }
      
      // Calculate statistics
      const durations = recentQueries.map(item => item.duration);
      const total = durations.reduce((sum, duration) => sum + duration, 0);
      const average = total / durations.length;
      const sorted = [...durations].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      
      // Group by collection
      const collectionStats = {};
      
      for (const query of recentQueries) {
        if (!collectionStats[query.collection]) {
          collectionStats[query.collection] = {
            count: 0,
            totalDuration: 0
          };
        }
        
        collectionStats[query.collection].count++;
        collectionStats[query.collection].totalDuration += query.duration;
      }
      
      // Calculate average by collection
      for (const collection in collectionStats) {
        collectionStats[collection].averageDuration = 
          collectionStats[collection].totalDuration / collectionStats[collection].count;
      }
      
      return {
        count: recentQueries.length,
        average,
        median,
        p95,
        p99,
        min,
        max,
        collectionStats
      };
    };
  }

  /**
   * Create system metrics collector
   * @private
   * @returns {Function} Collector function
   */
  _createSystemCollector() {
    return () => {
      return {
        uptime: process.uptime(),
        systemUptime: os.uptime(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        memoryUsagePercent: (1 - os.freemem() / os.totalmem()) * 100,
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version
      };
    };
  }

  /**
   * Aggregate data by time interval
   * @private
   * @param {Array<Object>} data - Data to aggregate
   * @param {string} interval - Interval (minute, hour, day)
   * @returns {Array<Object>} Aggregated data
   */
  _aggregateData(data, interval) {
    if (data.length === 0) {
      return [];
    }
    
    // Determine interval in milliseconds
    let intervalMs;
    
    switch (interval) {
      case 'minute':
        intervalMs = 60000;
        break;
      case 'hour':
        intervalMs = 3600000;
        break;
      case 'day':
        intervalMs = 86400000;
        break;
      default:
        return data;
    }
    
    // Group data by interval
    const groups = {};
    
    for (const item of data) {
      const intervalStart = Math.floor(item.timestamp / intervalMs) * intervalMs;
      
      if (!groups[intervalStart]) {
        groups[intervalStart] = [];
      }
      
      groups[intervalStart].push(item);
    }
    
    // Aggregate each group
    const result = [];
    
    for (const [intervalStart, items] of Object.entries(groups)) {
      const aggregated = {
        timestamp: parseInt(intervalStart),
        count: items.length
      };
      
      // Aggregate numeric values
      const numericFields = new Set();
      
      for (const item of items) {
        for (const [key, value] of Object.entries(item)) {
          if (typeof value === 'number' && key !== 'timestamp') {
            numericFields.add(key);
          }
        }
      }
      
      for (const field of numericFields) {
        const values = items.map(item => item[field]).filter(v => v !== undefined);
        
        if (values.length > 0) {
          const sum = values.reduce((total, val) => total + val, 0);
          const avg = sum / values.length;
          const sorted = [...values].sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          const min = sorted[0];
          const max = sorted[sorted.length - 1];
          
          aggregated[field] = {
            avg,
            median,
            min,
            max,
            sum
          };
        }
      }
      
      result.push(aggregated);
    }
    
    // Sort by timestamp
    result.sort((a, b) => a.timestamp - b.timestamp);
    
    return result;
  }
}

/**
 * Express middleware for recording response times
 * @param {PerformanceDashboard} dashboard - Performance dashboard instance
 * @returns {Function} Express middleware
 */
function responseTimeMiddleware(dashboard) {
  return function(req, res, next) {
    const startTime = Date.now();
    
    // Add response listener
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      dashboard.recordResponseTime({
        path: req.originalUrl || req.url,
        method: req.method,
        statusCode: res.statusCode,
        duration,
        contentLength: res.get('Content-Length')
      });
    });
    
    next();
  };
}

/**
 * Create a dashboard API router
 * @param {PerformanceDashboard} dashboard - Performance dashboard instance
 * @param {Object} options - Router options
 * @returns {Object} Express router
 */
function createDashboardRouter(dashboard, options = {}) {
  try {
    const express = require('express');
    const router = express.Router();
    
    // Authentication middleware
    const authenticate = options.authenticate || ((req, res, next) => next());
    
    // Get all metrics
    router.get('/metrics', authenticate, (req, res) => {
      res.json(dashboard.getMetrics());
    });
    
    // Get specific metric type
    router.get('/metrics/:type', authenticate, (req, res) => {
      const { type } = req.params;
      const { startTime, endTime, limit, aggregate } = req.query;
      
      const options = {};
      
      if (startTime) options.startTime = parseInt(startTime);
      if (endTime) options.endTime = parseInt(endTime);
      if (limit) options.limit = parseInt(limit);
      if (aggregate) options.aggregate = aggregate;
      
      const data = dashboard.getMetricData(type, options);
      
      res.json(data);
    });
    
    // Get dashboard status
    router.get('/status', authenticate, (req, res) => {
      res.json({
        isRunning: dashboard.isRunning,
        startTime: dashboard.startTime,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      });
    });
    
    // Start dashboard
    router.post('/start', authenticate, (req, res) => {
      dashboard.start();
      res.json({ status: 'started' });
    });
    
    // Stop dashboard
    router.post('/stop', authenticate, (req, res) => {
      dashboard.stop();
      res.json({ status: 'stopped' });
    });
    
    return router;
  } catch (err) {
    console.error('Failed to create dashboard router:', err);
    return null;
  }
}

module.exports = {
  PerformanceDashboard,
  responseTimeMiddleware,
  createDashboardRouter
};
