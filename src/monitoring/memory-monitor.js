/**
 * Memory Usage Monitor
 * 
 * This module provides utilities for monitoring and optimizing memory usage
 * in the application, helping to prevent memory leaks and excessive consumption.
 */

const os = require('os');
const v8 = require('v8');
const EventEmitter = require('events');

class MemoryMonitor extends EventEmitter {
  /**
   * Create a new memory monitor
   * @param {Object} options - Monitor configuration options
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      checkInterval: options.checkInterval || 60000, // Check every minute
      heapThresholdPercent: options.heapThresholdPercent || 85, // Warn at 85% heap usage
      rssThresholdMB: options.rssThresholdMB || 1024, // Warn at 1GB RSS
      gcThresholdPercent: options.gcThresholdPercent || 70, // Trigger GC at 70% heap usage
      enableGC: options.enableGC || false, // Whether to enable manual GC
      logLevel: options.logLevel || 'info', // Log level
      ...options
    };
    
    this.isRunning = false;
    this.checkIntervalId = null;
    this.memoryUsageHistory = [];
    this.historyMaxLength = 100; // Keep last 100 measurements
    
    // Bind methods
    this._checkMemoryUsage = this._checkMemoryUsage.bind(this);
    
    // Initialize logger
    this.logger = options.logger || console;
  }

  /**
   * Start memory monitoring
   * @returns {MemoryMonitor} This monitor instance for chaining
   */
  start() {
    if (this.isRunning) {
      return this;
    }
    
    this.logger.info('Starting memory monitor');
    
    this.isRunning = true;
    
    // Take initial measurement
    this._checkMemoryUsage();
    
    // Start periodic checks
    this.checkIntervalId = setInterval(
      this._checkMemoryUsage,
      this.options.checkInterval
    );
    
    // Expose memory usage via /metrics endpoint if metrics are enabled
    if (this.options.exposeMetrics && global.metrics) {
      this._registerMetrics();
    }
    
    this.emit('started');
    
    return this;
  }

  /**
   * Stop memory monitoring
   * @returns {MemoryMonitor} This monitor instance for chaining
   */
  stop() {
    if (!this.isRunning) {
      return this;
    }
    
    this.logger.info('Stopping memory monitor');
    
    this.isRunning = false;
    
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
    
    this.emit('stopped');
    
    return this;
  }

  /**
   * Get current memory usage statistics
   * @returns {Object} Memory usage statistics
   */
  getMemoryUsage() {
    // Get Node.js memory usage
    const memoryUsage = process.memoryUsage();
    
    // Get V8 heap statistics
    const heapStats = v8.getHeapStatistics();
    
    // Get system memory information
    const totalSystemMemory = os.totalmem();
    const freeSystemMemory = os.freemem();
    const systemMemoryUsed = totalSystemMemory - freeSystemMemory;
    
    // Calculate percentages
    const heapUsedPercent = (memoryUsage.heapUsed / heapStats.heap_size_limit) * 100;
    const heapTotalPercent = (memoryUsage.heapTotal / heapStats.heap_size_limit) * 100;
    const systemMemoryUsedPercent = (systemMemoryUsed / totalSystemMemory) * 100;
    
    // Format values in MB
    const formatMB = (bytes) => Math.round(bytes / 1024 / 1024);
    
    return {
      timestamp: Date.now(),
      process: {
        rss: formatMB(memoryUsage.rss),
        heapTotal: formatMB(memoryUsage.heapTotal),
        heapUsed: formatMB(memoryUsage.heapUsed),
        external: formatMB(memoryUsage.external),
        arrayBuffers: formatMB(memoryUsage.arrayBuffers || 0)
      },
      v8: {
        heapSizeLimit: formatMB(heapStats.heap_size_limit),
        totalHeapSize: formatMB(heapStats.total_heap_size),
        totalHeapSizeExecutable: formatMB(heapStats.total_heap_size_executable),
        totalPhysicalSize: formatMB(heapStats.total_physical_size),
        totalAvailableSize: formatMB(heapStats.total_available_size),
        usedHeapSize: formatMB(heapStats.used_heap_size),
        heapSizeLimit: formatMB(heapStats.heap_size_limit),
        mallocedMemory: formatMB(heapStats.malloced_memory),
        peakMallocedMemory: formatMB(heapStats.peak_malloced_memory),
        doesZapGarbage: heapStats.does_zap_garbage
      },
      system: {
        totalMemory: formatMB(totalSystemMemory),
        freeMemory: formatMB(freeSystemMemory),
        usedMemory: formatMB(systemMemoryUsed),
        usedMemoryPercent: systemMemoryUsedPercent.toFixed(2)
      },
      percentages: {
        heapUsed: heapUsedPercent.toFixed(2),
        heapTotal: heapTotalPercent.toFixed(2),
        systemMemoryUsed: systemMemoryUsedPercent.toFixed(2)
      }
    };
  }

  /**
   * Get memory usage history
   * @returns {Array<Object>} Memory usage history
   */
  getMemoryUsageHistory() {
    return this.memoryUsageHistory;
  }

  /**
   * Force garbage collection if --expose-gc flag is enabled
   * @returns {boolean} Whether GC was triggered
   */
  forceGC() {
    if (global.gc) {
      this.logger.info('Forcing garbage collection');
      global.gc();
      return true;
    } else {
      this.logger.warn('Cannot force GC. Start Node.js with --expose-gc flag to enable this feature');
      return false;
    }
  }

  /**
   * Get memory leak detection report
   * @returns {Object} Memory leak detection report
   */
  getLeakReport() {
    // This is a simplified leak detection
    // For production use, consider using tools like node-memwatch
    
    if (this.memoryUsageHistory.length < 10) {
      return {
        sufficientData: false,
        message: 'Insufficient data for leak detection. Need at least 10 measurements.'
      };
    }
    
    // Get the last 10 measurements
    const recentMeasurements = this.memoryUsageHistory.slice(-10);
    
    // Calculate the trend of heap usage
    const heapUsedTrend = recentMeasurements.map(m => m.process.heapUsed);
    const isIncreasing = this._isConsistentlyIncreasing(heapUsedTrend);
    
    // Calculate the rate of increase
    const firstHeapUsed = recentMeasurements[0].process.heapUsed;
    const lastHeapUsed = recentMeasurements[recentMeasurements.length - 1].process.heapUsed;
    const heapGrowthMB = lastHeapUsed - firstHeapUsed;
    const timeSpanMinutes = (recentMeasurements[recentMeasurements.length - 1].timestamp - 
                           recentMeasurements[0].timestamp) / 1000 / 60;
    const growthRateMBPerHour = (heapGrowthMB / timeSpanMinutes) * 60;
    
    return {
      sufficientData: true,
      isLeakSuspected: isIncreasing && growthRateMBPerHour > 10, // More than 10MB/hour growth
      growthRateMBPerHour: growthRateMBPerHour.toFixed(2),
      timeSpanMinutes: timeSpanMinutes.toFixed(2),
      heapGrowthMB: heapGrowthMB.toFixed(2),
      isConsistentlyIncreasing: isIncreasing,
      recommendations: this._getLeakRecommendations(isIncreasing, growthRateMBPerHour)
    };
  }

  /**
   * Check if an array of values is consistently increasing
   * @private
   * @param {Array<number>} values - Array of numeric values
   * @returns {boolean} Whether values are consistently increasing
   */
  _isConsistentlyIncreasing(values) {
    let increasingCount = 0;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) {
        increasingCount++;
      }
    }
    
    // Consider it consistently increasing if at least 80% of measurements show an increase
    return (increasingCount / (values.length - 1)) >= 0.8;
  }

  /**
   * Get recommendations for potential memory leaks
   * @private
   * @param {boolean} isIncreasing - Whether memory usage is consistently increasing
   * @param {number} growthRateMBPerHour - Memory growth rate in MB per hour
   * @returns {Array<string>} Recommendations
   */
  _getLeakRecommendations(isIncreasing, growthRateMBPerHour) {
    const recommendations = [];
    
    if (isIncreasing) {
      if (growthRateMBPerHour > 50) {
        recommendations.push('Significant memory growth detected. This likely indicates a memory leak.');
        recommendations.push('Use a heap profiler to identify objects that are accumulating.');
        recommendations.push('Check for event listeners that are not being removed.');
        recommendations.push('Look for large objects being cached indefinitely.');
      } else if (growthRateMBPerHour > 10) {
        recommendations.push('Moderate memory growth detected. This may indicate a slow memory leak.');
        recommendations.push('Monitor the application for longer periods to confirm the trend.');
        recommendations.push('Consider implementing a heap dump mechanism for further analysis.');
      } else {
        recommendations.push('Slight memory growth detected, but it may be normal application behavior.');
        recommendations.push('Continue monitoring to see if the trend persists or accelerates.');
      }
    } else {
      recommendations.push('No consistent memory growth detected. Memory usage appears stable.');
    }
    
    return recommendations;
  }

  /**
   * Check memory usage and take actions if thresholds are exceeded
   * @private
   */
  _checkMemoryUsage() {
    try {
      const memoryUsage = this.getMemoryUsage();
      
      // Add to history
      this.memoryUsageHistory.push(memoryUsage);
      
      // Trim history if needed
      if (this.memoryUsageHistory.length > this.historyMaxLength) {
        this.memoryUsageHistory.shift();
      }
      
      // Log memory usage based on log level
      if (this.options.logLevel === 'debug') {
        this.logger.debug('Memory usage:', memoryUsage);
      } else if (this.options.logLevel === 'info') {
        this.logger.info(`Memory usage - Heap: ${memoryUsage.process.heapUsed}MB (${memoryUsage.percentages.heapUsed}%), RSS: ${memoryUsage.process.rss}MB`);
      }
      
      // Check thresholds
      const heapUsedPercent = parseFloat(memoryUsage.percentages.heapUsed);
      const rssInMB = memoryUsage.process.rss;
      
      // Check if heap usage exceeds threshold
      if (heapUsedPercent > this.options.heapThresholdPercent) {
        this.logger.warn(`High heap usage: ${heapUsedPercent}% (threshold: ${this.options.heapThresholdPercent}%)`);
        this.emit('highHeapUsage', memoryUsage);
      }
      
      // Check if RSS exceeds threshold
      if (rssInMB > this.options.rssThresholdMB) {
        this.logger.warn(`High RSS usage: ${rssInMB}MB (threshold: ${this.options.rssThresholdMB}MB)`);
        this.emit('highRssUsage', memoryUsage);
      }
      
      // Trigger GC if enabled and threshold exceeded
      if (this.options.enableGC && 
          global.gc && 
          heapUsedPercent > this.options.gcThresholdPercent) {
        this.logger.info(`Triggering GC due to high heap usage: ${heapUsedPercent}%`);
        global.gc();
        this.emit('gcTriggered', memoryUsage);
      }
      
      // Emit memory usage event
      this.emit('memoryUsage', memoryUsage);
    } catch (error) {
      this.logger.error('Error checking memory usage:', error);
      this.emit('error', error);
    }
  }

  /**
   * Register metrics for Prometheus if metrics are enabled
   * @private
   */
  _registerMetrics() {
    const metrics = global.metrics;
    
    if (!metrics) {
      return;
    }
    
    // Create gauges for memory metrics
    const nodeHeapUsed = new metrics.Gauge({
      name: 'node_heap_used_mb',
      help: 'Node.js heap used in MB'
    });
    
    const nodeHeapTotal = new metrics.Gauge({
      name: 'node_heap_total_mb',
      help: 'Node.js heap total in MB'
    });
    
    const nodeRss = new metrics.Gauge({
      name: 'node_rss_mb',
      help: 'Node.js RSS in MB'
    });
    
    const nodeHeapUsedPercent = new metrics.Gauge({
      name: 'node_heap_used_percent',
      help: 'Node.js heap used as percentage of limit'
    });
    
    // Update metrics on memory usage event
    this.on('memoryUsage', (memoryUsage) => {
      nodeHeapUsed.set(memoryUsage.process.heapUsed);
      nodeHeapTotal.set(memoryUsage.process.heapTotal);
      nodeRss.set(memoryUsage.process.rss);
      nodeHeapUsedPercent.set(parseFloat(memoryUsage.percentages.heapUsed));
    });
  }
}

module.exports = MemoryMonitor;
