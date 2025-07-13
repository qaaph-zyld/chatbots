/**
 * Middleware Index
 * 
 * Exports all middleware modules
 */

const { errorMiddleware } = require('../utils/error-handler');
const { notFoundMiddleware } = require('./not-found.middleware');
const { requestLogger } = require('./logger.middleware');
const { apiKeyAuth, checkRole } = require('./auth.middleware');

// Export all middleware functions
module.exports = {
  errorMiddleware,
  notFoundMiddleware,
  requestLogger,
  apiKeyAuth,
  checkRole
};
