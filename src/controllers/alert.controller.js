/**
 * Alert Controller
 * 
 * Provides API endpoints to manage system alerts
 */

const alertService = require('../services/alert.service');

class AlertController {
  /**
   * Get recent alerts
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAlerts(req, res) {
    try {
      const options = {
        limit: parseInt(req.query.limit) || 100,
        skip: parseInt(req.query.skip) || 0,
        level: req.query.level,
        source: req.query.source,
        resolved: req.query.resolved === 'true' ? true : 
                 req.query.resolved === 'false' ? false : undefined,
        acknowledged: req.query.acknowledged === 'true' ? true : 
                     req.query.acknowledged === 'false' ? false : undefined,
        startTime: req.query.startTime,
        endTime: req.query.endTime
      };

      const alerts = await alertService.getAlerts(options);
      
      res.status(200).json({
        success: true,
        count: alerts.length,
        data: alerts
      });
    } catch (error) {
      console.error('Error retrieving alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve alerts',
        error: error.message
      });
    }
  }

  /**
   * Create a new alert
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createAlert(req, res) {
    try {
      const { level, source, message, details } = req.body;

      if (!source || !message) {
        return res.status(400).json({
          success: false,
          message: 'Source and message are required'
        });
      }

      const alert = await alertService.createAlert({
        level,
        source,
        message,
        details
      });

      res.status(201).json({
        success: true,
        message: 'Alert created successfully',
        data: alert
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create alert',
        error: error.message
      });
    }
  }

  /**
   * Acknowledge an alert
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async acknowledgeAlert(req, res) {
    try {
      const { alertId } = req.params;
      const { acknowledgedBy } = req.body;

      if (!acknowledgedBy) {
        return res.status(400).json({
          success: false,
          message: 'acknowledgedBy is required'
        });
      }

      const alert = await alertService.acknowledgeAlert(alertId, acknowledgedBy);

      res.status(200).json({
        success: true,
        message: 'Alert acknowledged successfully',
        data: alert
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to acknowledge alert',
        error: error.message
      });
    }
  }

  /**
   * Resolve an alert
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async resolveAlert(req, res) {
    try {
      const { alertId } = req.params;

      const alert = await alertService.resolveAlert(alertId);

      res.status(200).json({
        success: true,
        message: 'Alert resolved successfully',
        data: alert
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resolve alert',
        error: error.message
      });
    }
  }

  /**
   * Get alert statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAlertStats(req, res) {
    try {
      const startTime = req.query.startTime || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24 hours
      const endTime = req.query.endTime || new Date();

      // Get all alerts within the time range
      const alerts = await alertService.getAlerts({
        startTime,
        endTime,
        limit: 1000 // Get a large number for statistics
      });

      // Calculate statistics
      const stats = {
        total: alerts.length,
        byLevel: {
          info: alerts.filter(a => a.level === 'info').length,
          warning: alerts.filter(a => a.level === 'warning').length,
          critical: alerts.filter(a => a.level === 'critical').length
        },
        bySource: {},
        resolved: alerts.filter(a => a.resolved).length,
        unresolved: alerts.filter(a => !a.resolved).length,
        acknowledged: alerts.filter(a => a.acknowledged).length,
        unacknowledged: alerts.filter(a => !a.acknowledged).length,
        averageTimeToAcknowledge: 0,
        averageTimeToResolve: 0
      };

      // Calculate by source
      alerts.forEach(alert => {
        if (!stats.bySource[alert.source]) {
          stats.bySource[alert.source] = 0;
        }
        stats.bySource[alert.source]++;
      });

      // Calculate average time to acknowledge
      const acknowledgedAlerts = alerts.filter(a => a.acknowledged && a.acknowledgedAt);
      if (acknowledgedAlerts.length > 0) {
        const totalTimeToAcknowledge = acknowledgedAlerts.reduce((total, alert) => {
          return total + (new Date(alert.acknowledgedAt) - new Date(alert.timestamp));
        }, 0);
        stats.averageTimeToAcknowledge = totalTimeToAcknowledge / acknowledgedAlerts.length / (1000 * 60); // In minutes
      }

      // Calculate average time to resolve
      const resolvedAlerts = alerts.filter(a => a.resolved && a.resolvedAt);
      if (resolvedAlerts.length > 0) {
        const totalTimeToResolve = resolvedAlerts.reduce((total, alert) => {
          return total + (new Date(alert.resolvedAt) - new Date(alert.timestamp));
        }, 0);
        stats.averageTimeToResolve = totalTimeToResolve / resolvedAlerts.length / (1000 * 60); // In minutes
      }

      res.status(200).json({
        success: true,
        timeRange: {
          start: startTime,
          end: endTime
        },
        stats
      });
    } catch (error) {
      console.error('Error retrieving alert statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve alert statistics',
        error: error.message
      });
    }
  }
}

module.exports = new AlertController();
