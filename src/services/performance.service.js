/**
 * Performance Service
 * 
 * Handles performance monitoring and optimization
 */

const { cacheService } = require('../database/connection');
const mongoose = require('mongoose');

class PerformanceService {
  constructor() {
    this.metrics = {
      queryTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      errorCount: 0
    };
    this.startTime = Date.now();
  }

  /**
   * Record query execution time
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   */
  recordQueryTime(operation, duration) {
    this.metrics.queryTimes.push({
      operation,
      duration,
      timestamp: new Date()
    });

    // Keep only last 1000 entries
    if (this.metrics.queryTimes.length > 1000) {
      this.metrics.queryTimes = this.metrics.queryTimes.slice(-1000);
    }
  }

  /**
   * Record cache hit
   */
  recordCacheHit() {
    this.metrics.cacheHits++;
  }

  /**
   * Record cache miss
   */
  recordCacheMiss() {
    this.metrics.cacheMisses++;
  }

  /**
   * Record request
   */
  recordRequest() {
    this.metrics.totalRequests++;
  }

  /**
   * Record error
   */
  recordError() {
    this.metrics.errorCount++;
  }

  /**
   * Get performance metrics
   * @returns {object} Performance metrics
   */
  getMetrics() {
    const now = Date.now();
    const uptime = now - this.startTime;
    
    const avgQueryTime = this.metrics.queryTimes.length > 0
      ? this.metrics.queryTimes.reduce((sum, q) => sum + q.duration, 0) / this.metrics.queryTimes.length
      : 0;

    const cacheHitRate = (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
      ? (this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100
      : 0;

    const errorRate = this.metrics.totalRequests > 0
      ? (this.metrics.errorCount / this.metrics.totalRequests) * 100
      : 0;

    return {
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime),
      requests: {
        total: this.metrics.totalRequests,
        errors: this.metrics.errorCount,
        errorRate: parseFloat(errorRate.toFixed(2))
      },
      database: {
        avgQueryTime: parseFloat(avgQueryTime.toFixed(2)),
        totalQueries: this.metrics.queryTimes.length,
        slowQueries: this.metrics.queryTimes.filter(q => q.duration > 1000).length
      },
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: parseFloat(cacheHitRate.toFixed(2))
      },
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Format uptime in human readable format
   * @param {number} uptime - Uptime in milliseconds
   * @returns {string} Formatted uptime
   */
  formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get slow queries (> 1 second)
   * @returns {array} Slow queries
   */
  getSlowQueries() {
    return this.metrics.queryTimes
      .filter(q => q.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  /**
   * Get query performance by operation
   * @returns {object} Query performance grouped by operation
   */
  getQueryPerformanceByOperation() {
    const operations = {};
    
    this.metrics.queryTimes.forEach(query => {
      if (!operations[query.operation]) {
        operations[query.operation] = {
          count: 0,
          totalTime: 0,
          avgTime: 0,
          maxTime: 0,
          minTime: Infinity
        };
      }
      
      const op = operations[query.operation];
      op.count++;
      op.totalTime += query.duration;
      op.maxTime = Math.max(op.maxTime, query.duration);
      op.minTime = Math.min(op.minTime, query.duration);
      op.avgTime = op.totalTime / op.count;
    });

    // Format results
    Object.keys(operations).forEach(key => {
      operations[key].avgTime = parseFloat(operations[key].avgTime.toFixed(2));
      operations[key].minTime = operations[key].minTime === Infinity ? 0 : operations[key].minTime;
    });

    return operations;
  }

  /**
   * Optimize database queries by adding indexes
   * @param {string} collection - Collection name
   * @param {object} indexSpec - Index specification
   */
  async addDatabaseIndex(collection, indexSpec) {
    try {
      const db = mongoose.connection.db;
      await db.collection(collection).createIndex(indexSpec);
      console.log(`Index created on ${collection}:`, indexSpec);
      return true;
    } catch (error) {
      console.error('Error creating index:', error);
      return false;
    }
  }

  /**
   * Get database collection statistics
   * @returns {object} Collection statistics
   */
  async getDatabaseStats() {
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const stats = {};

      for (const collection of collections) {
        const collStats = await db.collection(collection.name).stats();
        stats[collection.name] = {
          count: collStats.count,
          size: collStats.size,
          avgObjSize: collStats.avgObjSize,
          indexCount: collStats.nindexes,
          totalIndexSize: collStats.totalIndexSize
        };
      }

      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return {};
    }
  }

  /**
   * Clear performance metrics
   */
  clearMetrics() {
    this.metrics = {
      queryTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      errorCount: 0
    };
    this.startTime = Date.now();
  }

  /**
   * Monitor query performance
   * @param {function} queryFunction - Function that executes the query
   * @param {string} operation - Operation name
   * @returns {any} Query result
   */
  async monitorQuery(queryFunction, operation) {
    const startTime = Date.now();
    
    try {
      const result = await queryFunction();
      const duration = Date.now() - startTime;
      this.recordQueryTime(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordQueryTime(operation, duration);
      this.recordError();
      throw error;
    }
  }

  /**
   * Cache-aware query execution
   * @param {string} cacheKey - Cache key
   * @param {function} queryFunction - Function that executes the query
   * @param {number} ttl - Cache TTL in seconds
   * @returns {any} Query result
   */
  async cachedQuery(cacheKey, queryFunction, ttl = 3600) {
    try {
      // Try to get from cache first
      const cached = await cacheService.get(cacheKey);
      if (cached !== null) {
        this.recordCacheHit();
        return cached;
      }

      // Cache miss - execute query
      this.recordCacheMiss();
      const result = await queryFunction();
      
      // Store in cache
      await cacheService.set(cacheKey, result, ttl);
      
      return result;
    } catch (error) {
      this.recordError();
      throw error;
    }
  }

  /**
   * Batch cache invalidation
   * @param {string[]} patterns - Cache key patterns to invalidate
   */
  async invalidateCache(patterns) {
    try {
      for (const pattern of patterns) {
        await cacheService.del(pattern);
      }
      return true;
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return false;
    }
  }

  /**
   * Get system health status
   * @returns {object} Health status
   */
  async getHealthStatus() {
    const metrics = this.getMetrics();
    const dbStats = await this.getDatabaseStats();
    
    const health = {
      status: 'healthy',
      checks: {
        database: mongoose.connection.readyState === 1,
        cache: cacheService.isConnected,
        memory: process.memoryUsage().heapUsed < 1024 * 1024 * 1024, // < 1GB
        errorRate: metrics.requests.errorRate < 5, // < 5%
        responseTime: metrics.database.avgQueryTime < 1000 // < 1s
      },
      metrics,
      database: dbStats,
      timestamp: new Date().toISOString()
    };

    // Determine overall health status
    const failedChecks = Object.values(health.checks).filter(check => !check).length;
    if (failedChecks > 0) {
      health.status = failedChecks > 2 ? 'unhealthy' : 'degraded';
    }

    return health;
  }
}

// Create singleton instance
const performanceService = new PerformanceService();

module.exports = performanceService;
