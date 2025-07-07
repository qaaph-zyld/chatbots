/**
 * Payment Error Handling Middleware
 * 
 * Middleware for handling payment errors in API routes
 * Provides consistent error responses and logging for payment-related errors
 */

const paymentErrorHandler = require('../utils/payment-error-handler');
const logger = require('../../utils/logger');

/**
 * Middleware to handle payment errors
 * Catches errors from payment processing and formats standardized responses
 */
const paymentErrorMiddleware = (err, req, res, next) => {
  // Check if this is a payment-related error
  if (err.isPaymentError || (err.raw && err.raw.type && err.raw.type.includes('_error'))) {
    const operation = req.originalUrl.split('/').pop() || 'unknown_operation';
    const metadata = {
      userId: req.user?.id,
      tenantId: req.tenant?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    // Handle Stripe errors
    if (err.raw && err.raw.type) {
      const errorResponse = paymentErrorHandler.handleStripeError(err, operation, metadata);
      
      // Log additional context for debugging
      logger.debug('Payment error middleware caught Stripe error', {
        path: req.originalUrl,
        method: req.method,
        errorResponse
      });
      
      // Format response based on user role
      const isAdmin = req.user?.role === 'admin';
      const formattedResponse = paymentErrorHandler.formatErrorResponse(errorResponse, isAdmin);
      
      // Determine appropriate status code
      let statusCode = 400;
      if (err.raw.type === 'authentication_error') statusCode = 401;
      if (err.raw.type === 'rate_limit_error') statusCode = 429;
      if (err.raw.type === 'api_error') statusCode = 502;
      
      return res.status(statusCode).json(formattedResponse);
    }
    
    // Handle general payment errors
    if (err.isPaymentError) {
      const errorResponse = paymentErrorHandler.handlePaymentError(err, operation, metadata);
      
      // Log additional context for debugging
      logger.debug('Payment error middleware caught general payment error', {
        path: req.originalUrl,
        method: req.method,
        errorResponse
      });
      
      // Format response based on user role
      const isAdmin = req.user?.role === 'admin';
      const formattedResponse = paymentErrorHandler.formatErrorResponse(errorResponse, isAdmin);
      
      return res.status(400).json(formattedResponse);
    }
  }
  
  // If not a payment error, pass to next error handler
  next(err);
};

/**
 * Custom error class for payment errors
 */
class PaymentError extends Error {
  constructor(message, code, type = 'payment_error', metadata = {}) {
    super(message);
    this.name = 'PaymentError';
    this.isPaymentError = true;
    this.code = code;
    this.type = type;
    this.metadata = metadata;
  }
}

/**
 * Helper to create payment errors with specific codes
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Object} metadata - Additional metadata
 * @returns {PaymentError} Payment error instance
 */
const createPaymentError = (code, message, metadata = {}) => {
  return new PaymentError(message, code, 'payment_error', metadata);
};

/**
 * Helper to create subscription-specific payment errors
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Object} metadata - Additional metadata
 * @returns {PaymentError} Payment error instance
 */
const createSubscriptionError = (code, message, metadata = {}) => {
  return new PaymentError(message, code, 'subscription_error', metadata);
};

/**
 * Helper to create invoice-specific payment errors
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {Object} metadata - Additional metadata
 * @returns {PaymentError} Payment error instance
 */
const createInvoiceError = (code, message, metadata = {}) => {
  return new PaymentError(message, code, 'invoice_error', metadata);
};

module.exports = {
  paymentErrorMiddleware,
  PaymentError,
  createPaymentError,
  createSubscriptionError,
  createInvoiceError
};
