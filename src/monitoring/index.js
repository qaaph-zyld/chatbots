/**
 * Monitoring Module
 * 
 * This module provides services for monitoring system resources,
 * application performance, usage statistics, rate limiting, and
 * integration with open-source monitoring tools like Prometheus and Grafana.
 */

const { resourceMonitorService } = require('./resource-monitor.service');
const { rateLimiterService } = require('./rate-limiter.service');
const { prometheusExporterService } = require('./prometheus-exporter.service');
const { metricsServer } = require('./metrics-server');

module.exports = {
  resourceMonitorService,
  rateLimiterService,
  prometheusExporterService,
  metricsServer
};
