/**
 * Main Application Entry Point
 */

// Register module aliases before any other imports
require('./core/module-alias');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { connectDB } = require('@data/connection');
const apiRoutes = require('@api/routes');
const swaggerRoutes = require('@api/swagger');
const { trainingRoutes } = require('@modules/training');
const chatbotService = require('@modules/bot/core');
const { logger } = require('@utils');
const { pluginLoader } = require('@utils/pluginLoader');
const integrationManager = require('@modules/integrations/integration.manager');
const usageMonitoringService = require('@modules/monitoring/usage.service');
const scalingService = require('@modules/scaling/scaling.service');
const { trackRequest } = require('@modules/scaling/scaling.middleware');
const config = require('@core/config');

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(morgan('combined')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(trackRequest); // Track requests for scaling logging

// Apply rate limiting middleware
const { applyRateLimiting } = require('@middleware/rate-limit');
applyRateLimiting(app, { useRedis: config.useRedisRateLimit });

// API routes
app.use('/api', apiRoutes);

// Training routes
app.use('/api/training', trainingRoutes);

// Billing routes
const paymentController = require('./billing/controllers/payment.controller');
const subscriptionRoutes = require('./billing/routes/subscription.routes');
const paymentMethodsRoutes = require('./billing/routes/payment-methods.routes');
const featureAccessRoutes = require('./billing/routes/feature-access.routes');
const subscriptionLifecycleRoutes = require('./billing/routes/subscription-lifecycle.routes');
const webhookRoutes = require('./billing/routes/webhook.routes');
const paymentRecoveryRoutes = require('./billing/routes/payment-recovery.routes');
const paymentMonitoringRoutes = require('./billing/routes/payment-monitoring.routes');

app.use('/api/billing/payment', paymentController);
app.use('/api/billing/subscriptions', subscriptionRoutes);
app.use('/api/billing/payment-methods', paymentMethodsRoutes);
app.use('/api/billing/feature-access', featureAccessRoutes);
app.use('/api/billing', subscriptionLifecycleRoutes);
app.use('/api/billing/webhook', webhookRoutes);
app.use('/api/billing', paymentRecoveryRoutes);
app.use('/api/billing/monitoring', paymentMonitoringRoutes);

// Swagger documentation
app.use(swaggerRoutes);

// Integration routes
app.use('/integrations', integrationManager.getRouter());

// Analytics routes
const analyticsDashboardRoutes = require('./analytics/routes/dashboard.routes');
const analyticsExportRoutes = require('./analytics/routes/export.routes');
app.use('/api/analytics/dashboard', analyticsDashboardRoutes);
app.use('/api/analytics/export', analyticsExportRoutes);

// Health check routes
const healthCheckRoutes = require('./routes/health-check.routes');
app.use('/health', healthCheckRoutes);

// Monitoring routes
const monitoringRoutes = require('./routes/monitoring.routes');
app.use('/api/monitoring', monitoringRoutes);

// Alert routes
const alertRoutes = require('./routes/alert.routes');
app.use('/api/alerts', alertRoutes);

// Serve static files
app.use(express.static('public'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    // Initialize services
    const initServices = async () => {
      try {
        // Initialize database connection
        await connectDB();
        logger.info('Database connected successfully');
        
        // Initialize payment retry scheduler
        const paymentRetryScheduler = require('./billing/jobs/payment-retry-scheduler');
        paymentRetryScheduler.initScheduler();
        logger.info('Payment retry scheduler initialized');
        
        // Initialize other services here
        
      } catch (error) {
        logger.error(`Error initializing services: ${error.message}`);
        process.exit(1);
      }
    };
    
    await initServices();
    
    // Load and register plugins
    await pluginLoader.loadAllPlugins();
    
    // Initialize plugins
    await pluginLoader.initializePlugins();
    
    // Initialize chatbot service
    await chatbotService.initialize();
    logger.info('Chatbot service initialized');
    require('@src/training');
    trainingService.setBotService(chatbotService);
    logger.info('Training service initialized');
    
    // Initialize integration manager
    await integrationManager.initialize(server);
    logger.info('Integration manager initialized');
    
    // Initialize usage monitoring service
    await usageMonitoringService.initialize();
    logger.info('Usage monitoring service initialized');
    
    // Initialize scaling service
    await scalingService.initialize();
    logger.info('Scaling service initialized');
    
    // Initialize monitoring service
    const monitoringService = require('./services/monitoring.service');
    await monitoringService.initialize();
    logger.info('Monitoring service initialized');
    
    // Initialize alert service
    const alertService = require('./services/alert.service');
    await alertService.initialize();
    logger.info('Alert service initialized');
    
    // Initialize health check service
    const healthCheckService = require('./services/health-check.service');
    await healthCheckService.initialize({
      enablePeriodicChecks: true,
      checkIntervalMs: 60000, // 1 minute
      externalServices: [
        { name: 'payment-gateway', url: config.services?.paymentGateway?.url || 'https://api.stripe.com/v1/health' },
        { name: 'email-service', url: config.services?.emailService?.url || 'https://api.sendgrid.com/v3/health' }
      ]
    });
    logger.info('Health check service initialized');
    
    logger.info('Application initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize application:', error.message);
    return false;
  }
}

// Initialize app when this module is loaded
initializeApp().catch(err => {
  logger.error('Initialization error:', err.message);
  process.exit(1);
});

// Export both app and server
module.exports = { app, server };
