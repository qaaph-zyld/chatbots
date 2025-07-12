/**
 * Error Middleware
 * 
 * Express middleware for handling errors
 */

require('@src/utils');

/**
 * Error handling middleware
 */
function errorMiddleware(err, req, res, next) {
  // Use the global error handler from utils/errors
  errors.globalErrorHandler(err, req, res, next);
}

/**
 * Not found middleware for handling undefined routes
 */
function notFoundMiddleware(req, res, next) {
  const err = new errors.NotFoundError(`Route not found: ${req.originalUrl}`);
  next(err);
}

module.exports = {
  errorMiddleware,
  notFoundMiddleware
};
