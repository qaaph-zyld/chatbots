/**
 * Metrics Server
 * 
 * This module creates an HTTP server to expose metrics endpoints
 * for Prometheus and other monitoring systems.
 */

const express = require('express');
require('@src/utils');
require('@src/monitoring\prometheus-exporter.service');
require('@src/monitoring\resource-monitor.service');

/**
 * Metrics Server class
 */
class MetricsServer {
  /**
   * Initialize the metrics server
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      port: parseInt(process.env.METRICS_SERVER_PORT || '9090'),
      host: process.env.METRICS_SERVER_HOST || 'localhost',
      path: process.env.METRICS_PATH || '/metrics',
      enableAuth: process.env.METRICS_AUTH_ENABLED === 'true' || false,
      username: process.env.METRICS_AUTH_USERNAME || 'admin',
      password: process.env.METRICS_AUTH_PASSWORD || 'password',
      ...options
    };

    this.app = null;
    this.server = null;
    this.isRunning = false;

    logger.info('Metrics Server initialized with options:', {
      port: this.options.port,
      host: this.options.host,
      path: this.options.path,
      enableAuth: this.options.enableAuth
    });
  }

  /**
   * Start the metrics server
   * @returns {Promise<boolean>} - Success status
   */
  async start() {
    try {
      if (this.isRunning) {
        logger.warn('Metrics server is already running');
        return true;
      }

      // Create Express app
      this.app = express();

      // Add basic authentication if enabled
      if (this.options.enableAuth) {
        this.app.use((req, res, next) => {
          // Check for basic auth header
          if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
            res.set('WWW-Authenticate', 'Basic realm="Metrics Server"');
            return res.status(401).send('Authentication required');
          }

          // Verify auth credentials
          const base64Credentials = req.headers.authorization.split(' ')[1];
          const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
          const [username, password] = credentials.split(':');

          if (username !== this.options.username || password !== this.options.password) {
            return res.status(401).send('Invalid authentication credentials');
          }

          // Authentication successful
          next();
        });

        logger.info('Basic authentication enabled for metrics server');
      }

      // Add metrics endpoint
      this.app.get(this.options.path, async (req, res) => {
        try {
          // Generate metrics
          const metrics = await prometheusExporterService.generateMetrics();

          // Set content type for Prometheus
          res.set('Content-Type', 'text/plain');
          res.send(metrics);
        } catch (error) {
          logger.error('Error serving metrics:', error.message);
          res.status(500).send('Error generating metrics');
        }
      });

      // Add health check endpoint
      this.app.get('/health', (req, res) => {
        res.status(200).json({
          status: 'ok',
          timestamp: new Date().toISOString()
        });
      });

      // Add Grafana dashboard endpoint
      this.app.get('/grafana-dashboard', (req, res) => {
        try {
          const dashboard = prometheusExporterService.createGrafanaDashboard();
          res.json(dashboard);
        } catch (error) {
          logger.error('Error generating Grafana dashboard:', error.message);
          res.status(500).json({ error: 'Error generating Grafana dashboard' });
        }
      });

      // Start resource monitoring
      await resourceMonitorService.start();

      // Start server
      return new Promise((resolve) => {
        this.server = this.app.listen(this.options.port, this.options.host, () => {
          this.isRunning = true;
          logger.info(`Metrics server started on http://${this.options.host}:${this.options.port}${this.options.path}`);
          resolve(true);
        });
      });
    } catch (error) {
      logger.error('Error starting metrics server:', error.message);
      return false;
    }
  }

  /**
   * Stop the metrics server
   * @returns {Promise<boolean>} - Success status
   */
  async stop() {
    try {
      if (!this.isRunning) {
        logger.warn('Metrics server is not running');
        return true;
      }

      // Stop resource monitoring
      resourceMonitorService.stop();

      // Stop server
      return new Promise((resolve) => {
        this.server.close(() => {
          this.isRunning = false;
          this.server = null;
          this.app = null;
          logger.info('Metrics server stopped');
          resolve(true);
        });
      });
    } catch (error) {
      logger.error('Error stopping metrics server:', error.message);
      return false;
    }
  }
}

// Create and export server instance
const metricsServer = new MetricsServer();

module.exports = {
  MetricsServer,
  metricsServer
};
