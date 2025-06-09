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

// API routes
app.use('/api', apiRoutes);

// Training routes
app.use('/api/training', trainingRoutes);

// Swagger documentation
app.use(swaggerRoutes);

// Integration routes
app.use('/integrations', integrationManager.getRouter());

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
    // Connect to database
    await connectDB();
    logger.info('Connected to database');
    
    // Initialize chatbot service
    await chatbotService.initialize();
    logger.info('Chatbot service initialized');
    
    // Load and register plugins
    await pluginLoader.loadAllPlugins();
    
    // Initialize plugins
    await pluginLoader.initializePlugins();
    
    // Initialize training service with bot service for integration
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
