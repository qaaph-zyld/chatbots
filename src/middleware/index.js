/**
 * Middleware Index
 * 
 * Exports all middleware modules
 */

const { errorMiddleware, notFoundMiddleware } = require('./error.middleware');
const requestLogger = require('./logger.middleware');
const { apiKeyAuth, checkRole } = require('./auth.middleware');

module.exports = {
  errorMiddleware,
  notFoundMiddleware,
  requestLogger,
  apiKeyAuth,
  checkRole
};
