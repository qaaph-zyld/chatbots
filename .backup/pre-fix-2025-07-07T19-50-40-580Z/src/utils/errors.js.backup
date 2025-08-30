/**
 * Error Handling Utility
 * 
 * Provides custom error classes and error handling functions
 */

require('@src/utils\logger');

/**
 * Base custom error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Indicates if this is an operational error
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found error
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * Bad request error
 */
class BadRequestError extends AppError {
  constructor(message = 'Invalid request parameters') {
    super(message, 400, 'BAD_REQUEST');
  }
}

/**
 * Unauthorized error
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Forbidden error
 */
class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Validation error
 */
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/**
 * Tenant access error
 */
class TenantAccessError extends AppError {
  constructor(message = 'Tenant access violation') {
    super(message, 403, 'TENANT_ACCESS_VIOLATION');
  }
}

/**
 * Security violation error
 * Used for security-related violations that require immediate attention
 */
class SecurityViolationError extends AppError {
  constructor(message = 'Security violation detected', details = {}) {
    super(message, 403, 'SECURITY_VIOLATION');
    this.details = details;
    this.severity = 'HIGH';
  }
}

/**
 * Global error handler for Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function globalErrorHandler(err, req, res, next) {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, err);
  
  // Set default values
  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || 'INTERNAL_ERROR';
  const message = err.isOperational ? err.message : 'An unexpected error occurred';
  
  // Send response based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message,
    ...(isProduction ? {} : { stack: err.stack, details: err.errors })
  });
}

/**
 * Async error handler wrapper for Express route handlers
 * @param {Function} fn - Express route handler function
 * @returns {Function} - Wrapped function that catches async errors
 */
function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  TenantAccessError,
  SecurityViolationError,
  globalErrorHandler,
  catchAsync
};
