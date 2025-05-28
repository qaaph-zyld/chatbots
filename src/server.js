/**
 * Server Entry Point
 */

const { app, server } = require('./app');
const { logger } = require('./utils');
const config = require('./config');
const clusterManager = require('./scaling/cluster');

// Get port from config or use default
const PORT = config.port || 3000;

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
