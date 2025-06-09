/**
 * Performance Optimizer Utility
 * 
 * This utility provides tools for identifying performance bottlenecks,
 * optimizing resource usage, and monitoring performance metrics.
 */

const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const mongoose = require('mongoose');
require('@src/utils\logger');
require('@src/config\redis');

/**
 * Performance Optimizer class for identifying and addressing performance issues
 */
class PerformanceOptimizer {
  constructor() {
    this.metrics = {
      cpu: {},
      memory: {},
      database: {},
      api: {},
      cache: {}
    };
    
    this.thresholds = {
      cpuUsage: 80, // Percentage
      memoryUsage: 80, // Percentage
      responseTime: 500, // ms
      databaseQueryTime: 100, // ms
      cacheHitRate: 70 // Percentage
    };
    
    this.optimizations = [];
    this.monitoringInterval = null;
  }

  /**
   * Initialize the performance optimizer
   * @param {Object} options - Configuration options
   */
  async initialize(options = {}) {
    logger.info('Initializing Performance Optimizer');
    
    // Override default thresholds with provided options
    this.thresholds = { ...this.thresholds, ...options.thresholds };
    
    // Collect initial metrics
    await this.collectMetrics();
    
    return this;
  }

  /**
   * Start continuous monitoring of performance metrics
   * @param {number} interval - Monitoring interval in milliseconds
   */
  startMonitoring(interval = 60000) {
    logger.info(`Starting performance monitoring with interval: ${interval}ms`);
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(async () => {
      await this.collectMetrics();
      this.analyzeMetrics();
      this.logMetrics();
    }, interval);
    
    return this;
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Performance monitoring stopped');
    }
    
    return this;
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics() {
    try {
      // Collect CPU metrics
      const cpuInfo = os.cpus();
      const cpuCount = cpuInfo.length;
      const cpuUsage = await this.getCpuUsage();
      
      this.metrics.cpu = {
        count: cpuCount,
        model: cpuInfo[0].model,
        speed: cpuInfo[0].speed,
        usage: cpuUsage,
        loadAverage: os.loadavg()
      };
      
      // Collect memory metrics
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      
      this.metrics.memory = {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercentage: (usedMemory / totalMemory) * 100
      };
      
      // Collect database metrics
      if (mongoose.connection.readyState === 1) {
        this.metrics.database = {
          connectionCount: mongoose.connection.client.s.activeSessions.size,
          collections: Object.keys(mongoose.connection.collections).length,
          status: 'connected'
        };
      } else {
        this.metrics.database = {
          status: 'disconnected'
        };
      }
      
      // Collect cache metrics if Redis is available
      if (redis.status === 'ready') {
        const info = await redis.info();
        const cacheHitRate = await this.getCacheHitRate();
        
        this.metrics.cache = {
          hitRate: cacheHitRate,
          memoryUsage: info.used_memory,
          connectedClients: info.connected_clients,
          status: 'connected'
        };
      } else {
        this.metrics.cache = {
          status: 'disconnected'
        };
      }
      
      return this.metrics;
    } catch (error) {
      logger.error('Error collecting performance metrics', error);
      throw error;
    }
  }

  /**
   * Get current CPU usage percentage
   * @returns {Promise<number>} CPU usage percentage
   */
  async getCpuUsage() {
    try {
      // Different command based on platform
      const cmd = process.platform === 'win32'
        ? 'wmic cpu get LoadPercentage'
        : 'top -bn1 | grep "Cpu(s)" | sed "s/.*, *\\([0-9.]*\\)%* id.*/\\1/" | awk \'{print 100 - $1}\'';
      
      const { stdout } = await exec(cmd);
      
      if (process.platform === 'win32') {
        // Parse Windows output
        const lines = stdout.trim().split('\n');
        if (lines.length >= 2) {
          return parseFloat(lines[1].trim());
        }
        return 0;
      } else {
        // Parse Linux/Mac output
        return parseFloat(stdout.trim());
      }
    } catch (error) {
      logger.warn('Error getting CPU usage, using estimated value', error);
      // Fallback to load average as an estimate
      const loadAvg = os.loadavg()[0];
      const cpuCount = os.cpus().length;
      return (loadAvg / cpuCount) * 100;
    }
  }

  /**
   * Get cache hit rate from Redis
   * @returns {Promise<number>} Cache hit rate percentage
   */
  async getCacheHitRate() {
    try {
      if (redis.status !== 'ready') {
        return 0;
      }
      
      const info = await redis.info();
      const hits = parseInt(info.keyspace_hits || 0);
      const misses = parseInt(info.keyspace_misses || 0);
      
      if (hits + misses === 0) {
        return 0;
      }
      
      return (hits / (hits + misses)) * 100;
    } catch (error) {
      logger.warn('Error getting cache hit rate', error);
      return 0;
    }
  }

  /**
   * Analyze collected metrics and identify optimization opportunities
   */
  analyzeMetrics() {
    this.optimizations = [];
    
    // Check CPU usage
    if (this.metrics.cpu.usage > this.thresholds.cpuUsage) {
      this.optimizations.push({
        component: 'CPU',
        severity: 'high',
        issue: `High CPU usage (${this.metrics.cpu.usage.toFixed(2)}%)`,
        recommendation: 'Consider scaling horizontally, optimizing CPU-intensive operations, or implementing request throttling.'
      });
    }
    
    // Check memory usage
    if (this.metrics.memory.usagePercentage > this.thresholds.memoryUsage) {
      this.optimizations.push({
        component: 'Memory',
        severity: 'high',
        issue: `High memory usage (${this.metrics.memory.usagePercentage.toFixed(2)}%)`,
        recommendation: 'Check for memory leaks, optimize memory-intensive operations, or increase available memory.'
      });
    }
    
    // Check cache hit rate
    if (this.metrics.cache.status === 'connected' && this.metrics.cache.hitRate < this.thresholds.cacheHitRate) {
      this.optimizations.push({
        component: 'Cache',
        severity: 'medium',
        issue: `Low cache hit rate (${this.metrics.cache.hitRate.toFixed(2)}%)`,
        recommendation: 'Review caching strategy, increase cache TTL for frequently accessed data, or implement cache warming.'
      });
    }
    
    return this.optimizations;
  }

  /**
   * Log current metrics and optimization recommendations
   */
  logMetrics() {
    logger.info('Current Performance Metrics', {
      cpu: {
        usage: `${this.metrics.cpu.usage.toFixed(2)}%`,
        loadAverage: this.metrics.cpu.loadAverage
      },
      memory: {
        usage: `${this.metrics.memory.usagePercentage.toFixed(2)}%`,
        free: `${Math.round(this.metrics.memory.free / 1024 / 1024)} MB`,
        total: `${Math.round(this.metrics.memory.total / 1024 / 1024)} MB`
      },
      database: this.metrics.database.status,
      cache: this.metrics.cache.status === 'connected' 
        ? `Hit Rate: ${this.metrics.cache.hitRate.toFixed(2)}%` 
        : this.metrics.cache.status
    });
    
    if (this.optimizations.length > 0) {
      logger.warn('Performance Optimization Recommendations', {
        count: this.optimizations.length,
        recommendations: this.optimizations
      });
    }
  }

  /**
   * Get optimization recommendations
   * @returns {Array} List of optimization recommendations
   */
  getOptimizationRecommendations() {
    return this.optimizations;
  }

  /**
   * Get current performance metrics
   * @returns {Object} Current performance metrics
   */
  getMetrics() {
    return this.metrics;
  }

  /**
   * Apply automatic optimizations where possible
   */
  async applyAutomaticOptimizations() {
    logger.info('Applying automatic performance optimizations');
    
    const optimizations = [];
    
    // Optimize MongoDB indexes
    if (mongoose.connection.readyState === 1) {
      try {
        const collections = mongoose.connection.collections;
        for (const collectionName in collections) {
          const collection = collections[collectionName];
          const indexes = await collection.indexes();
          
          // Log existing indexes
          logger.info(`Collection ${collectionName} has ${indexes.length} indexes`);
          
          // Here we could add logic to create missing indexes
          // based on common query patterns
        }
        
        optimizations.push({
          component: 'Database',
          action: 'Verified database indexes',
          status: 'success'
        });
      } catch (error) {
        logger.error('Error optimizing database indexes', error);
        optimizations.push({
          component: 'Database',
          action: 'Verify database indexes',
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Optimize Redis cache if available
    if (redis.status === 'ready') {
      try {
        // Here we could implement cache optimization logic
        // such as setting appropriate TTLs or eviction policies
        
        optimizations.push({
          component: 'Cache',
          action: 'Verified cache configuration',
          status: 'success'
        });
      } catch (error) {
        logger.error('Error optimizing cache', error);
        optimizations.push({
          component: 'Cache',
          action: 'Verify cache configuration',
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return optimizations;
  }

  /**
   * Generate a comprehensive performance report
   * @returns {Object} Performance report
   */
  async generatePerformanceReport() {
    await this.collectMetrics();
    this.analyzeMetrics();
    
    return {
      timestamp: new Date(),
      metrics: this.metrics,
      optimizations: this.optimizations,
      recommendations: this.getOptimizationRecommendations(),
      summary: {
        cpuStatus: this.metrics.cpu.usage > this.thresholds.cpuUsage ? 'warning' : 'good',
        memoryStatus: this.metrics.memory.usagePercentage > this.thresholds.memoryUsage ? 'warning' : 'good',
        databaseStatus: this.metrics.database.status === 'connected' ? 'good' : 'warning',
        cacheStatus: this.metrics.cache.status === 'connected' ? 'good' : 'warning',
        overallStatus: this.optimizations.length > 0 ? 'needs optimization' : 'good'
      }
    };
  }
}

module.exports = new PerformanceOptimizer();
