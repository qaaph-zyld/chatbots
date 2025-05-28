/**
 * Cluster Manager
 * 
 * Handles application clustering for scalability
 */

const cluster = require('cluster');
const os = require('os');
const { logger } = require('../utils');

/**
 * Initialize clustering
 * @param {Function} workerFunction - Function to run in worker processes
 * @returns {Promise<void>}
 */
exports.initialize = async (workerFunction) => {
  try {
    // Get number of CPUs
    const numCPUs = os.cpus().length;
    
    // Get number of workers from environment variable or use number of CPUs
    const numWorkers = process.env.WORKERS ? parseInt(process.env.WORKERS, 10) : numCPUs;
    
    // Check if clustering is enabled
    const clusteringEnabled = process.env.CLUSTERING_ENABLED === 'true' || false;
    
    if (cluster.isPrimary && clusteringEnabled) {
      logger.info(`Primary ${process.pid} is running`);
      logger.info(`Starting ${numWorkers} workers`);
      
      // Fork workers
      for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
      }
      
      // Handle worker exit
      cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
        
        // Replace the worker if it died unexpectedly
        if (code !== 0 && !worker.exitedAfterDisconnect) {
          logger.info(`Replacing dead worker ${worker.process.pid}`);
          cluster.fork();
        }
      });
      
      // Handle worker online
      cluster.on('online', (worker) => {
        logger.info(`Worker ${worker.process.pid} is online`);
      });
      
      // Handle worker disconnect
      cluster.on('disconnect', (worker) => {
        logger.info(`Worker ${worker.process.pid} disconnected`);
      });
    } else {
      // Worker process or clustering disabled
      logger.info(`Worker ${process.pid} started`);
      
      // Run worker function
      if (typeof workerFunction === 'function') {
        await workerFunction();
      }
    }
  } catch (error) {
    logger.error('Error initializing clustering:', error.message);
    throw error;
  }
};
