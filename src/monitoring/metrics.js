/**
 * Prometheus Metrics Collection Module
 * 
 * Provides metrics collection and exposure for monitoring the application.
 * Uses prom-client for Prometheus metrics generation.
 */

const promClient = require('prom-client');
const { logger } = require('../utils/logger');

// Create a Registry to register metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Define custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const chatbotConversationsTotal = new promClient.Counter({
  name: 'chatbot_conversations_total',
  help: 'Total number of chatbot conversations',
  labelNames: ['bot_id', 'template_id']
});

const chatbotMessagesTotal = new promClient.Counter({
  name: 'chatbot_messages_total',
  help: 'Total number of chatbot messages',
  labelNames: ['bot_id', 'direction'] // direction: 'incoming' or 'outgoing'
});

const chatbotResponseTime = new promClient.Histogram({
  name: 'chatbot_response_time_ms',
  help: 'Response time of chatbot in ms',
  labelNames: ['bot_id', 'template_id'],
  buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000]
});

const databaseOperationDuration = new promClient.Histogram({
  name: 'database_operation_duration_ms',
  help: 'Duration of database operations in ms',
  labelNames: ['operation', 'collection'],
  buckets: [1, 5, 15, 50, 100, 250, 500, 1000]
});

const activeContextsGauge = new promClient.Gauge({
  name: 'chatbot_active_contexts',
  help: 'Number of active conversation contexts'
});

// Register custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);
register.registerMetric(chatbotConversationsTotal);
register.registerMetric(chatbotMessagesTotal);
register.registerMetric(chatbotResponseTime);
register.registerMetric(databaseOperationDuration);
register.registerMetric(activeContextsGauge);

/**
 * Initialize the metrics module
 * 
 * @returns {void}
 */
const initialize = () => {
  logger.info('Metrics: Prometheus metrics initialized');
};

/**
 * Create an Express middleware for HTTP request metrics
 * 
 * @returns {Function} Express middleware
 */
const httpMetricsMiddleware = () => {
  return (req, res, next) => {
    const start = Date.now();
    
    // Record the path without params to avoid high cardinality
    const route = req.route ? req.route.path : req.path;
    
    // Add response hook to capture metrics after response is sent
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      httpRequestDurationMicroseconds
        .labels(req.method, route, res.statusCode)
        .observe(duration);
      
      httpRequestCounter
        .labels(req.method, route, res.statusCode)
        .inc();
    });
    
    next();
  };
};

/**
 * Record a new chatbot conversation
 * 
 * @param {string} botId - The ID of the chatbot
 * @param {string} templateId - The ID of the template used
 */
const recordConversation = (botId, templateId) => {
  chatbotConversationsTotal.labels(botId, templateId).inc();
};

/**
 * Record a chatbot message
 * 
 * @param {string} botId - The ID of the chatbot
 * @param {string} direction - Direction of the message ('incoming' or 'outgoing')
 */
const recordMessage = (botId, direction) => {
  chatbotMessagesTotal.labels(botId, direction).inc();
};

/**
 * Record chatbot response time
 * 
 * @param {string} botId - The ID of the chatbot
 * @param {string} templateId - The ID of the template used
 * @param {number} duration - Response time in milliseconds
 */
const recordResponseTime = (botId, templateId, duration) => {
  chatbotResponseTime.labels(botId, templateId).observe(duration);
};

/**
 * Record database operation duration
 * 
 * @param {string} operation - Type of operation (find, insert, update, delete)
 * @param {string} collection - Name of the collection
 * @param {number} duration - Operation duration in milliseconds
 */
const recordDatabaseOperation = (operation, collection, duration) => {
  databaseOperationDuration.labels(operation, collection).observe(duration);
};

/**
 * Update the number of active contexts
 * 
 * @param {number} count - Number of active contexts
 */
const updateActiveContexts = (count) => {
  activeContextsGauge.set(count);
};

/**
 * Get metrics in Prometheus format
 * 
 * @returns {Promise<string>} - Metrics in Prometheus format
 */
const getMetrics = async () => {
  return register.metrics();
};

/**
 * Get metrics in JSON format
 * 
 * @returns {Promise<Object>} - Metrics in JSON format
 */
const getMetricsAsJson = async () => {
  return register.getMetricsAsJSON();
};

/**
 * Create an Express route handler for exposing Prometheus metrics
 * 
 * @returns {Function} Express route handler
 */
const metricsHandler = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error(`Metrics: Error generating metrics: ${err.message}`);
    res.status(500).end();
  }
};

module.exports = {
  initialize,
  httpMetricsMiddleware,
  recordConversation,
  recordMessage,
  recordResponseTime,
  recordDatabaseOperation,
  updateActiveContexts,
  getMetrics,
  getMetricsAsJson,
  metricsHandler
};