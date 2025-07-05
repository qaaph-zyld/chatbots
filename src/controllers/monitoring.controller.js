/**
 * Monitoring Controller
 * 
 * Provides API endpoints to access system monitoring metrics
 */

const monitoringService = require('../services/monitoring.service');

class MonitoringController {
  /**
   * Get recent metrics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRecentMetrics(req, res) {
    try {
      const options = {
        limit: parseInt(req.query.limit) || 100,
        skip: parseInt(req.query.skip) || 0,
        type: req.query.type,
        component: req.query.component,
        status: req.query.status,
        startTime: req.query.startTime,
        endTime: req.query.endTime
      };

      const metrics = await monitoringService.getMetrics(options);
      
      res.status(200).json({
        success: true,
        count: metrics.length,
        data: metrics
      });
    } catch (error) {
      console.error('Error retrieving metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve metrics',
        error: error.message
      });
    }
  }

  /**
   * Get aggregated metrics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAggregatedMetrics(req, res) {
    try {
      const options = {
        type: req.query.type,
        component: req.query.component,
        startTime: req.query.startTime,
        endTime: req.query.endTime,
        interval: req.query.interval || 'hour'
      };

      const metrics = await monitoringService.getAggregatedMetrics(options);
      
      res.status(200).json({
        success: true,
        count: metrics.length,
        data: metrics
      });
    } catch (error) {
      console.error('Error retrieving aggregated metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve aggregated metrics',
        error: error.message
      });
    }
  }

  /**
   * Get system health overview
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHealthOverview(req, res) {
    try {
      // Get the most recent metrics for each component type
      const database = await monitoringService.getMetrics({
        type: 'database',
        limit: 1
      });

      const cache = await monitoringService.getMetrics({
        type: 'cache',
        limit: 1
      });

      const externalServices = await monitoringService.getMetrics({
        type: 'external-service',
        limit: 10 // Get multiple external services
      });

      const systemResources = await monitoringService.getMetrics({
        type: 'system',
        component: 'resources',
        limit: 1
      });

      // Group external services by component
      const groupedExternalServices = {};
      externalServices.forEach(service => {
        groupedExternalServices[service.component] = service;
      });

      res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        overview: {
          database: database.length > 0 ? database[0] : { status: 'unknown' },
          cache: cache.length > 0 ? cache[0] : { status: 'unknown' },
          externalServices: groupedExternalServices,
          systemResources: systemResources.length > 0 ? systemResources[0] : { status: 'unknown' }
        }
      });
    } catch (error) {
      console.error('Error retrieving health overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve health overview',
        error: error.message
      });
    }
  }

  /**
   * Trigger an immediate metrics collection
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async collectMetricsNow(req, res) {
    try {
      const metrics = await monitoringService.collectAndStoreMetrics();
      
      res.status(200).json({
        success: true,
        message: 'Metrics collected successfully',
        count: metrics.length,
        data: metrics
      });
    } catch (error) {
      console.error('Error collecting metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to collect metrics',
        error: error.message
      });
    }
  }
}

module.exports = new MonitoringController();
