/**
 * Not Found Middleware
 * Handles 404 errors for undefined routes
 */

/**
 * Middleware function to handle 404 errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const notFoundMiddleware = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { notFoundMiddleware };
