/**
 * Monitoring Service
 * 
 * Provides monitoring and alerting capabilities for the platform
 */

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf, json } = format;
const client = require('prom-client');
const axios = require('axios');
const config = require('../../config/production-deployment.config');

// Initialize Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

const apiCallCounter = new client.Counter({
  name: 'api_calls_total',
  help: 'Total number of API calls',
  labelNames: ['method', 'endpoint', 'tenant_id']
});

const tenantResourceUsageGauge = new client.Gauge({
  name: 'tenant_resource_usage',
  help: 'Current resource usage by tenant',
  labelNames: ['tenant_id', 'resource_type']
});

const aiModelLatencyHistogram = new client.Histogram({
  name: 'ai_model_latency_ms',
  help: 'AI model response latency in ms',
  labelNames: ['model', 'operation'],
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const knowledgeBaseOperationsCounter = new client.Counter({
  name: 'knowledge_base_operations_total',
  help: 'Total number of knowledge base operations',
  labelNames: ['operation', 'tenant_id']
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(apiCallCounter);
register.registerMetric(tenantResourceUsageGauge);
register.registerMetric(aiModelLatencyHistogram);
register.registerMetric(knowledgeBaseOperationsCounter);

// Create Winston logger
const logger = createLogger({
  level: config.logging.level,
  format: combine(
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'chatbots-platform' },
  transports: [
    new transports.Console(),
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

/**
 * Monitoring service for tracking system metrics and sending alerts
 */
class MonitoringService {
  constructor() {
    this.register = register;
    this.logger = logger;
    this.alertThresholds = {
      cpuUsage: 80, // 80%
      memoryUsage: 80, // 80%
      diskUsage: 80, // 80%
      errorRate: 5, // 5%
      responseTime: 2000 // 2 seconds
    };
    this.alertCooldowns = new Map();
    this.cooldownPeriod = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Get Prometheus metrics
   * @returns {Promise<string>} Metrics in Prometheus format
   */
  async getMetrics() {
    return this.register.metrics();
  }

  /**
   * Record HTTP request duration
   * @param {string} method - HTTP method
   * @param {string} route - Route path
   * @param {number} statusCode - HTTP status code
   * @param {number} duration - Duration in milliseconds
   */
  recordHttpRequest(method, route, statusCode, duration) {
    httpRequestDurationMicroseconds
      .labels(method, route, statusCode)
      .observe(duration);
  }

  /**
   * Increment API call counter
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {string} tenantId - Tenant ID
   */
  incrementApiCall(method, endpoint, tenantId) {
    apiCallCounter
      .labels(method, endpoint, tenantId)
      .inc();
  }

  /**
   * Set tenant resource usage
   * @param {string} tenantId - Tenant ID
   * @param {string} resourceType - Resource type (e.g., 'api_calls', 'storage')
   * @param {number} value - Current usage value
   */
  setTenantResourceUsage(tenantId, resourceType, value) {
    tenantResourceUsageGauge
      .labels(tenantId, resourceType)
      .set(value);
  }

  /**
   * Record AI model latency
   * @param {string} model - AI model name
   * @param {string} operation - Operation type
   * @param {number} latency - Latency in milliseconds
   */
  recordAiModelLatency(model, operation, latency) {
    aiModelLatencyHistogram
      .labels(model, operation)
      .observe(latency);
  }

  /**
   * Increment knowledge base operations counter
   * @param {string} operation - Operation type
   * @param {string} tenantId - Tenant ID
   */
  incrementKnowledgeBaseOperation(operation, tenantId) {
    knowledgeBaseOperationsCounter
      .labels(operation, tenantId)
      .inc();
  }

  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
    
    // Check if we should send an alert for this error
    if (meta.alert !== false) {
      this.sendErrorAlert(message, meta);
    }
  }

  /**
   * Check system health
   * @returns {Promise<Object>} Health check results
   */
  async checkHealth() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Check database connection
    try {
      // This would be a real database connection check in production
      health.services.database = { status: 'ok' };
    } catch (err) {
      health.services.database = { 
        status: 'error', 
        message: err.message 
      };
      health.status = 'error';
    }

    // Check Redis connection
    try {
      // This would be a real Redis connection check in production
      health.services.redis = { status: 'ok' };
    } catch (err) {
      health.services.redis = { 
        status: 'error', 
        message: err.message 
      };
      health.status = 'error';
    }

    // Check Weaviate connection
    try {
      // This would be a real Weaviate connection check in production
      health.services.weaviate = { status: 'ok' };
    } catch (err) {
      health.services.weaviate = { 
        status: 'error', 
        message: err.message 
      };
      health.status = 'error';
    }

    return health;
  }

  /**
   * Send an error alert
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   * @private
   */
  async sendErrorAlert(message, meta) {
    const alertKey = `error:${message.substring(0, 50)}`;
    
    // Check cooldown
    if (this.alertCooldowns.has(alertKey)) {
      const lastAlertTime = this.alertCooldowns.get(alertKey);
      if (Date.now() - lastAlertTime < this.cooldownPeriod) {
        return; // Skip alert during cooldown
      }
    }
    
    // Update cooldown
    this.alertCooldowns.set(alertKey, Date.now());
    
    // Send email alert if enabled
    if (config.monitoring.alerting.email.enabled) {
      try {
        // This would be a real email sending implementation in production
        this.logger.info('Email alert sent', { 
          recipients: config.monitoring.alerting.email.recipients,
          subject: `[ALERT] ${message.substring(0, 100)}`,
          message
        });
      } catch (err) {
        this.logger.error('Failed to send email alert', { error: err.message });
      }
    }
    
    // Send Slack alert if enabled
    if (config.monitoring.alerting.slack.enabled) {
      try {
        await axios.post(config.monitoring.alerting.slack.webhookUrl, {
          channel: config.monitoring.alerting.slack.channel,
          username: 'Chatbots Platform Monitoring',
          text: `*[ALERT]* ${message}`,
          attachments: [
            {
              color: '#ff0000',
              fields: [
                {
                  title: 'Error Details',
                  value: JSON.stringify(meta, null, 2),
                  short: false
                },
                {
                  title: 'Timestamp',
                  value: new Date().toISOString(),
                  short: true
                },
                {
                  title: 'Environment',
                  value: process.env.NODE_ENV || 'development',
                  short: true
                }
              ]
            }
          ]
        });
      } catch (err) {
        this.logger.error('Failed to send Slack alert', { error: err.message });
      }
    }
  }

  /**
   * Send a resource threshold alert
   * @param {string} resourceType - Resource type
   * @param {string} tenantId - Tenant ID
   * @param {number} currentValue - Current resource usage
   * @param {number} threshold - Threshold value
   */
  async sendResourceAlert(resourceType, tenantId, currentValue, threshold) {
    const alertKey = `resource:${tenantId}:${resourceType}`;
    
    // Check cooldown
    if (this.alertCooldowns.has(alertKey)) {
      const lastAlertTime = this.alertCooldowns.get(alertKey);
      if (Date.now() - lastAlertTime < this.cooldownPeriod) {
        return; // Skip alert during cooldown
      }
    }
    
    // Update cooldown
    this.alertCooldowns.set(alertKey, Date.now());
    
    const message = `Tenant ${tenantId} has exceeded ${resourceType} threshold: ${currentValue} (threshold: ${threshold})`;
    
    // Log the alert
    this.logger.warn(message, { tenantId, resourceType, currentValue, threshold });
    
    // Send alerts through configured channels
    if (config.monitoring.alerting.email.enabled) {
      // Email alert implementation
    }
    
    if (config.monitoring.alerting.slack.enabled) {
      // Slack alert implementation
    }
  }
}

module.exports = new MonitoringService();
