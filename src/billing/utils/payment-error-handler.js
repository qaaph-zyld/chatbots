/**
 * Payment Error Handler
 * 
 * Utility for handling and standardizing Stripe payment errors
 * Provides consistent error messages and logging for payment-related errors
 */

const logger = require('../../utils/logger');

/**
 * Error categories for payment processing
 */
const ERROR_CATEGORIES = {
  CARD: 'card_error',
  AUTHENTICATION: 'authentication_error',
  RATE_LIMIT: 'rate_limit_error',
  INVALID_REQUEST: 'invalid_request_error',
  API: 'api_error',
  IDEMPOTENCY: 'idempotency_error',
  UNKNOWN: 'unknown_error'
};

/**
 * Maps Stripe error codes to user-friendly messages
 */
const ERROR_MESSAGES = {
  // Card errors
  card_declined: 'Your card was declined. Please try a different payment method.',
  expired_card: 'Your card has expired. Please update your payment information.',
  incorrect_cvc: 'The security code (CVC) is incorrect. Please check and try again.',
  incorrect_number: 'The card number is incorrect. Please check and try again.',
  invalid_cvc: 'The security code (CVC) is invalid. Please check and try again.',
  invalid_expiry_month: 'The expiration month is invalid. Please check and try again.',
  invalid_expiry_year: 'The expiration year is invalid. Please check and try again.',
  invalid_number: 'The card number is invalid. Please check and try again.',
  processing_error: 'An error occurred while processing your card. Please try again later.',
  
  // Authentication errors
  authentication_required: 'This payment requires authentication. Please complete the verification process.',
  
  // Rate limit errors
  rate_limit: 'Too many requests. Please try again later.',
  
  // Invalid request errors
  parameter_invalid_empty: 'One or more required fields are missing. Please check and try again.',
  parameter_invalid_integer: 'One or more fields contain invalid values. Please check and try again.',
  parameter_invalid_string_empty: 'One or more required fields are empty. Please check and try again.',
  parameter_unknown: 'Unknown parameter provided. Please contact support.',
  
  // API errors
  api_connection_error: 'We could not connect to the payment provider. Please try again later.',
  api_error: 'An error occurred with the payment provider. Please try again later.',
  
  // Default error
  default: 'An error occurred while processing your payment. Please try again later.'
};

/**
 * Handles Stripe errors and returns standardized error response
 * @param {Error} error - The error object from Stripe
 * @param {string} operation - The operation being performed (e.g., 'create_subscription')
 * @param {Object} metadata - Additional metadata for logging
 * @returns {Object} Standardized error response
 */
const handleStripeError = (error, operation, metadata = {}) => {
  // Extract error details from Stripe error
  const stripeError = error.raw || error;
  const errorType = stripeError.type || ERROR_CATEGORIES.UNKNOWN;
  const errorCode = stripeError.code || 'unknown';
  const errorMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;
  
  // Log the error with context
  logger.error(`Stripe error during ${operation}: ${errorCode}`, {
    errorType,
    errorCode,
    operation,
    message: stripeError.message,
    ...metadata
  });
  
  // Return standardized error response
  return {
    success: false,
    error: {
      type: errorType,
      code: errorCode,
      message: errorMessage,
      technical: stripeError.message,
      operation
    }
  };
};

/**
 * Handles general payment errors (non-Stripe specific)
 * @param {Error} error - The error object
 * @param {string} operation - The operation being performed
 * @param {Object} metadata - Additional metadata for logging
 * @returns {Object} Standardized error response
 */
const handlePaymentError = (error, operation, metadata = {}) => {
  // Check if this is a Stripe error
  if (error.type || error.raw) {
    return handleStripeError(error, operation, metadata);
  }
  
  // Handle general errors
  logger.error(`Payment error during ${operation}: ${error.message}`, {
    operation,
    stack: error.stack,
    ...metadata
  });
  
  return {
    success: false,
    error: {
      type: ERROR_CATEGORIES.UNKNOWN,
      code: 'general_error',
      message: ERROR_MESSAGES.default,
      technical: error.message,
      operation
    }
  };
};

/**
 * Formats error response for API
 * @param {Object} errorResponse - The error response from handleStripeError or handlePaymentError
 * @param {boolean} includeDetails - Whether to include technical details (for admin/debug only)
 * @returns {Object} Formatted error response for API
 */
const formatErrorResponse = (errorResponse, includeDetails = false) => {
  const response = {
    success: false,
    error: errorResponse.error.message,
    code: errorResponse.error.code,
    type: errorResponse.error.type
  };
  
  // Include technical details if requested (for admin/debug only)
  if (includeDetails) {
    response.details = {
      technical: errorResponse.error.technical,
      operation: errorResponse.error.operation
    };
  }
  
  return response;
};

/**
 * Determines if an error is recoverable (can be retried)
 * @param {Object} errorResponse - The error response from handleStripeError or handlePaymentError
 * @returns {boolean} Whether the error is recoverable
 */
const isRecoverableError = (errorResponse) => {
  const nonRecoverableCodes = [
    'expired_card',
    'invalid_number',
    'invalid_cvc',
    'invalid_expiry_month',
    'invalid_expiry_year',
    'parameter_invalid_empty',
    'parameter_invalid_integer',
    'parameter_invalid_string_empty',
    'parameter_unknown'
  ];
  
  return !nonRecoverableCodes.includes(errorResponse.error.code);
};

/**
 * Determines if an error should trigger dunning process
 * @param {Object} errorResponse - The error response from handleStripeError or handlePaymentError
 * @returns {boolean} Whether the error should trigger dunning
 */
const shouldTriggerDunning = (errorResponse) => {
  const dunningTriggerCodes = [
    'card_declined',
    'processing_error',
    'insufficient_funds',
    'lost_card',
    'stolen_card',
    'expired_card'
  ];
  
  return dunningTriggerCodes.includes(errorResponse.error.code);
};

module.exports = {
  handleStripeError,
  handlePaymentError,
  formatErrorResponse,
  isRecoverableError,
  shouldTriggerDunning,
  ERROR_CATEGORIES,
  ERROR_MESSAGES
};
