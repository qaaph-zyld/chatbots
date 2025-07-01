/**
 * Payment Error Middleware
 * 
 * Middleware for handling payment errors in API routes
 * Provides consistent error handling and response formatting for payment-related endpoints
 */

const { formatErrorResponse } = require('../billing/utils/payment-error-handler');
const logger = require('../utils/logger');

/**
 * Middleware to handle payment errors in API routes
 * Catches errors from payment operations and formats them consistently
 */
const paymentErrorMiddleware = (err, req, res, next) => {
  // Check if this is a payment-related route
  const isPaymentRoute = req.path.startsWith('/api/billing') || 
                         req.path.startsWith('/api/payment') || 
                         req.path.startsWith('/api/subscription');
  
  // If not a payment route, pass to next error handler
  if (!isPaymentRoute) {
    return next(err);
  }
  
  // Check if this is an admin request
  const isAdmin = req.user && req.user.role === 'admin';
  
  // Log the error
  logger.error(`Payment API error: ${err.message}`, {
    path: req.path,
    method: req.method,
    tenantId: req.tenantId,
    userId: req.user ? req.user.id : null,
    error: err
  });
  
  // If the error is already formatted by our payment error handler
  if (err.error && err.error.code) {
    return res.status(400).json(formatErrorResponse(err, isAdmin));
  }
  
  // Handle Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      error: err.message,
      code: err.code || 'stripe_error',
      type: err.type
    });
  }
  
  // Handle general payment errors
  return res.status(500).json({
    success: false,
    error: 'An error occurred while processing your payment request.',
    code: 'payment_error'
  });
};

/**
 * Async handler for payment routes
 * Wraps async route handlers to properly catch and forward errors to the error middleware
 * @param {Function} fn - The async route handler function
 * @returns {Function} Express middleware function
 */
const asyncPaymentHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  paymentErrorMiddleware,
  asyncPaymentHandler
};
