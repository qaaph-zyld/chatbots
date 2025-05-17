/**
 * Main application entry point
 * 
 * This file initializes the server and sets up the main application components.
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

// Import core modules
const config = require('./config');
const apiRoutes = require('./api/routes');
const { errorMiddleware, notFoundMiddleware, requestLogger, apiKeyAuth } = require('./middleware');
const { logger } = require('./utils');
const chatbotService = require('./services/chatbot.service');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API routes with authentication
app.use('/api', apiKeyAuth, apiRoutes);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// Handle 404 errors for undefined routes
app.use(notFoundMiddleware);

// Error handling middleware
app.use(errorMiddleware);

/**
 * Initialize application services and start server
 */
async function startServer() {
  try {
    // Initialize chatbot service
    logger.info('Initializing chatbot service...');
    const initialized = await chatbotService.initialize();
    
    if (!initialized) {
      logger.error('Failed to initialize chatbot service');
      process.exit(1);
    }
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
