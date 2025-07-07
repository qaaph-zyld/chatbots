/**
 * Monitoring Service
 * 
 * Provides functionality to collect, store, and analyze system health metrics
 */

const mongoose = require('mongoose');
const os = require('os');
const healthService = require('./health.service');
const alertService = require('./alert.service');

// Define a schema for health metrics
const MetricSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  type: { type: String, required: true, index: true },
  component: { type: String, required: true, index: true },
  status: { type: String, required: true, enum: ['healthy', 'unhealthy', 'degraded', 'unknown'] },
  responseTime: { type: Number },
  details: { type: mongoose.Schema.Types.Mixed },
});

// Create model if it doesn't exist
let Metric;
try {
  Metric = mongoose.model('Metric');
} catch (error) {
  Metric = mongoose.model('Metric', MetricSchema);
}

class MonitoringService {
  constructor() {
    this.collectionInterval = null;
    this.alertHandlers = [];
    this.metricRetention = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.collectionFrequency = 60 * 1000; // 1 minute in milliseconds
  }

  /**
   * Initialize the monitoring service
   * @param {Object} options - Configuration options
   */
  initialize(options = {}) {
    if (options.metricRetention) {
      this.metricRetention = options.metricRetention;
    }

    if (options.collectionFrequency) {
      this.collectionFrequency = options.collectionFrequency;
    }

    // Start collecting metrics
    this.startMetricCollection();

    // Set up cleanup job for old metrics
    this.setupMetricCleanup();

    console.log('Monitoring service initialized');
  }

  /**
   * Start collecting metrics at regular intervals
   */
  startMetricCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }

    this.collectionInterval = setInterval(() => {
      // Using an immediately invoked async function to properly handle async/await
      (async () => {
        try {
          const metrics = await this.collectAndStoreMetrics();
          await this.checkForAlerts(metrics);
        } catch (error) {
          console.error('Error in metric collection cycle:', error);
        }
      })();
    }, this.collectionFrequency);
    
    console.log(`Metric collection started with ${this.collectionFrequency/1000}s frequency`);
  }

  /**
   * Stop collecting metrics
   */
  stopMetricCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Set up a job to clean up old metrics
   */
  setupMetricCleanup() {
    // Run cleanup daily
    setInterval(async () => {
      try {
        const cutoffDate = new Date(Date.now() - this.metricRetention);
        await Metric.deleteMany({ timestamp: { $lt: cutoffDate } });
        console.log(`Cleaned up metrics older than ${cutoffDate}`);
      } catch (error) {
        console.error('Error cleaning up old metrics:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  /**
   * Collect and store current system metrics
   * @returns {Promise<Array>} Collected metrics
   */
  async collectAndStoreMetrics() {
    const metrics = [];

    // Collect database metrics
    try {
      const dbStatus = await healthService.checkDatabaseConnection();
      metrics.push({
        type: 'database',
        component: 'mongodb',
        status: dbStatus.status,
        responseTime: parseInt(dbStatus.responseTime) || null,
        details: dbStatus.details || {}
      });
    } catch (error) {
      metrics.push({
        type: 'database',
        component: 'mongodb',
        status: 'unhealthy',
        details: { error: error.message }
      });
    }

    // Collect cache metrics
    try {
      const cacheStatus = await healthService.checkCacheConnection();
      metrics.push({
        type: 'cache',
        component: 'redis',
        status: cacheStatus.status,
        responseTime: parseInt(cacheStatus.responseTime) || null,
        details: cacheStatus.details || {}
      });
    } catch (error) {
      metrics.push({
        type: 'cache',
        component: 'redis',
        status: 'unhealthy',
        details: { error: error.message }
      });
    }

    // Collect external service metrics
    try {
      const externalServices = await healthService.checkExternalServices();
      externalServices.forEach(service => {
        metrics.push({
          type: 'external-service',
          component: service.name,
          status: service.status,
          responseTime: parseInt(service.responseTime) || null,
          details: {
            statusCode: service.statusCode,
            error: service.error
          }
        });
      });
    } catch (error) {
      metrics.push({
        type: 'external-service',
        component: 'unknown',
        status: 'unhealthy',
        details: { error: error.message }
      });
    }

    // Collect system resource metrics
    try {
      const resourceStatus = healthService.checkSystemResources();
      metrics.push({
        type: 'system',
        component: 'resources',
        status: resourceStatus.status,
        details: resourceStatus.details || {}
      });
    } catch (error) {
      metrics.push({
        type: 'system',
        component: 'resources',
        status: 'unhealthy',
        details: { error: error.message }
      });
    }

    // Store all collected metrics
    try {
      await Metric.insertMany(metrics);
    } catch (error) {
      console.error('Error storing metrics:', error);
    }

    return metrics;
  }

  /**
   * Register an alert handler
   * @param {Function} handler - Alert handler function
   */
  registerAlertHandler(handler) {
    if (typeof handler === 'function') {
      this.alertHandlers.push(handler);
    }
  }

  /**
   * Check metrics for alert conditions
   * @param {Array} metrics - Collected metrics
   */
  async checkForAlerts(metrics) {
    const unhealthyMetrics = metrics.filter(metric => metric.status === 'unhealthy');
    
    if (unhealthyMetrics.length > 0) {
      // Create an alert using the alert service
      try {
        await alertService.createAlert({
          level: unhealthyMetrics.some(m => m.type === 'database' || m.type === 'external-service') ? 'critical' : 'warning',
          source: 'system-monitoring',
          message: `${unhealthyMetrics.length} components are unhealthy`,
          details: {
            components: unhealthyMetrics.map(m => `${m.type}:${m.component}`),
            metrics: unhealthyMetrics
          }
        });
        
        console.log(`Alert created for ${unhealthyMetrics.length} unhealthy components`);
      } catch (error) {
        console.error('Error creating alert:', error);
      }

      // Also call all registered alert handlers for backward compatibility
      const alert = {
        timestamp: new Date(),
        level: 'warning',
        message: `${unhealthyMetrics.length} components are unhealthy`,
        components: unhealthyMetrics.map(m => `${m.type}:${m.component}`).join(', '),
        details: unhealthyMetrics
      };

      this.alertHandlers.forEach(handler => {
        try {
          handler(alert);
        } catch (error) {
          console.error('Error in alert handler:', error);
        }
      });
    }
  }

  /**
   * Get metrics for a specific time range
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of metrics
   */
  async getMetrics(options = {}) {
    const query = {};
    
    if (options.startTime) {
      query.timestamp = { $gte: new Date(options.startTime) };
    }
    
    if (options.endTime) {
      query.timestamp = { ...query.timestamp, $lte: new Date(options.endTime) };
    }
    
    if (options.type) {
      query.type = options.type;
    }
    
    if (options.component) {
      query.component = options.component;
    }
    
    if (options.status) {
      query.status = options.status;
    }

    const limit = options.limit || 100;
    const skip = options.skip || 0;
    
    return Metric.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Get aggregated metrics for a specific time range
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of aggregated metrics
   */
  async getAggregatedMetrics(options = {}) {
    const query = {};
    
    if (options.startTime) {
      query.timestamp = { $gte: new Date(options.startTime) };
    }
    
    if (options.endTime) {
      query.timestamp = { ...query.timestamp, $lte: new Date(options.endTime) };
    }
    
    if (options.type) {
      query.type = options.type;
    }
    
    if (options.component) {
      query.component = options.component;
    }

    // Group by time interval (hour by default)
    const interval = options.interval || 'hour';
    let timeFormat;
    
    switch (interval) {
      case 'minute':
        timeFormat = { year: '$year', month: '$month', day: '$dayOfMonth', hour: '$hour', minute: '$minute' };
        break;
      case 'hour':
        timeFormat = { year: '$year', month: '$month', day: '$dayOfMonth', hour: '$hour' };
        break;
      case 'day':
        timeFormat = { year: '$year', month: '$month', day: '$dayOfMonth' };
        break;
      default:
        timeFormat = { year: '$year', month: '$month', day: '$dayOfMonth', hour: '$hour' };
    }

    return Metric.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            time: timeFormat,
            type: '$type',
            component: '$component'
          },
          count: { $sum: 1 },
          healthyCount: {
            $sum: { $cond: [{ $eq: ['$status', 'healthy'] }, 1, 0] }
          },
          unhealthyCount: {
            $sum: { $cond: [{ $eq: ['$status', 'unhealthy'] }, 1, 0] }
          },
          avgResponseTime: { $avg: '$responseTime' }
        }
      },
      {
        $project: {
          _id: 0,
          time: '$_id.time',
          type: '$_id.type',
          component: '$_id.component',
          count: 1,
          healthyCount: 1,
          unhealthyCount: 1,
          healthPercentage: {
            $multiply: [{ $divide: ['$healthyCount', '$count'] }, 100]
          },
          avgResponseTime: 1
        }
      },
      { $sort: { 'time.year': 1, 'time.month': 1, 'time.day': 1, 'time.hour': 1, 'time.minute': 1 } }
    ]);
  }
}

module.exports = new MonitoringService();
