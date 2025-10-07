/**
 * Server Entry Point
 */

// Register module aliases as early as possible
require('./core/module-alias');

// Core imports
const { app, server } = require('@src/app');
require('@src/utils');
const config = require('../config');
const clusterManager = require('@src/scaling/cluster');

// Get port from config or use default
const PORT = (config && config.server && config.server.port) || process.env.PORT || 3000;

// Start server with clustering
const startServer = async () => {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`API available at http://localhost:${PORT}/api`);
    logger.info(`WebSocket server available at ws://localhost:${PORT}/integrations/ws`);
  });
};

// Initialize clustering
clusterManager.initialize(startServer).catch(err => {
  logger.error('Error initializing clustering:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  
  // Close server and exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  
  // Close server and exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = server;
