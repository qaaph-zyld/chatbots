/**
 * Payment Retry Scheduler
 * 
 * Cron job to automatically process scheduled payment retries
 * Runs at regular intervals to check for and process due payment attempts
 */

const cron = require('node-cron');
const paymentRecoveryService = require('../services/payment-recovery.service');
const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * Schedule for running the payment retry processor
 * Default: Every hour at minute 0 (e.g., 1:00, 2:00, etc.)
 */
const SCHEDULE = process.env.PAYMENT_RETRY_CRON || '0 * * * *';

/**
 * Flag to enable/disable the scheduler
 */
const ENABLED = process.env.ENABLE_PAYMENT_RETRY_SCHEDULER !== 'false';

/**
 * Process scheduled payment retries
 * @returns {Promise<void>}
 */
const processRetries = async () => {
  try {
    logger.info('Starting scheduled payment retry processing');
    
    const startTime = Date.now();
    const results = await paymentRecoveryService.processScheduledRetries();
    const duration = Date.now() - startTime;
    
    const successCount = results.filter(r => r.status === 'succeeded').length;
    const failedCount = results.filter(r => r.status === 'failed').length;
    
    logger.info(`Completed payment retry processing in ${duration}ms`, {
      processed: results.length,
      succeeded: successCount,
      failed: failedCount,
      duration
    });
    
    return {
      processed: results.length,
      succeeded: successCount,
      failed: failedCount,
      duration
    };
  } catch (error) {
    logger.error(`Error processing payment retries: ${error.message}`, {
      stack: error.stack
    });
    
    throw error;
  }
};

/**
 * Initialize the payment retry scheduler
 */
const initScheduler = () => {
  if (!ENABLED) {
    logger.info('Payment retry scheduler is disabled');
    return;
  }
  
  try {
    // Validate cron schedule
    if (!cron.validate(SCHEDULE)) {
      logger.error(`Invalid cron schedule: ${SCHEDULE}`);
      return;
    }
    
    logger.info(`Initializing payment retry scheduler with schedule: ${SCHEDULE}`);
    
    // Schedule the job
    const job = cron.schedule(SCHEDULE, async () => {
      try {
        await processRetries();
      } catch (error) {
        logger.error(`Scheduled payment retry job failed: ${error.message}`);
      }
    });
    
    // Run immediately on startup if configured
    if (process.env.RUN_PAYMENT_RETRY_ON_STARTUP === 'true') {
      logger.info('Running payment retry processing on startup');
      processRetries().catch(error => {
        logger.error(`Initial payment retry processing failed: ${error.message}`);
      });
    }
    
    return job;
  } catch (error) {
    logger.error(`Failed to initialize payment retry scheduler: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initScheduler,
  processRetries
};
