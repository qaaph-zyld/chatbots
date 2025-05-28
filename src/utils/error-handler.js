/**
 * Enhanced Error Handler
 * 
 * A comprehensive error handling utility for the chatbot platform.
 * Provides standardized error handling, logging, and recovery mechanisms.
 */

const { logger } = require('./logger');

/**
 * Custom error types
 */
class AppError extends Error {
  /**
   * Create a new application error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether this is an operational error
   */
  constructor(message, code = 'INTERNAL_ERROR', statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super(message, 'VALIDATION_ERROR', 400, true);
    this.fields = fields;
  }
}

class AuthenticationError extends AppError {
  constructor(message) {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

class AuthorizationError extends AppError {
  constructor(message) {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

class NotFoundError extends AppError {
  constructor(message, resource) {
    super(message, 'NOT_FOUND', 404, true);
    this.resource = resource;
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 'CONFLICT', 409, true);
  }
}

class RateLimitError extends AppError {
  constructor(message, retryAfter) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true);
    this.retryAfter = retryAfter;
  }
}

class DatabaseError extends AppError {
  constructor(message, operation, collection) {
    super(message, 'DATABASE_ERROR', 500, true);
    this.operation = operation;
    this.collection = collection;
  }
}

class ExternalServiceError extends AppError {
  constructor(message, service, statusCode) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, true);
    this.service = service;
    this.externalStatusCode = statusCode;
  }
}

/**
 * Error handler for Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorMiddleware(err, req, res, next) {
  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details = undefined;
  let isOperational = false;
  
  // Log the error
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    isOperational = err.isOperational;
    
    // Add specific details based on error type
    if (err instanceof ValidationError) {
      details = { fields: err.fields };
    } else if (err instanceof NotFoundError) {
      details = { resource: err.resource };
    } else if (err instanceof RateLimitError) {
      details = { retryAfter: err.retryAfter };
      res.set('Retry-After', err.retryAfter);
    } else if (err instanceof DatabaseError) {
      details = { 
        operation: err.operation,
        collection: err.collection
      };
    } else if (err instanceof ExternalServiceError) {
      details = { 
        service: err.service,
        statusCode: err.externalStatusCode
      };
    }
    
    // Log operational errors as warnings
    logger.warn(`${err.name}: ${err.message}`, {
      code: err.code,
      statusCode: err.statusCode,
      details,
      path: req.path,
      method: req.method,
      requestId: req.id,
      stack: err.stack
    });
  } else {
    // For non-AppErrors, log as errors
    logger.error(`Unhandled error: ${err.message}`, {
      error: err,
      path: req.path,
      method: req.method,
      requestId: req.id,
      stack: err.stack
    });
  }
  
  // Don't expose error details in production
  const isDev = process.env.NODE_ENV === 'development';
  
  // Send response
  res.status(statusCode).json({
    status: 'error',
    code: errorCode,
    message,
    details: isDev ? details : undefined,
    stack: isDev && !isOperational ? err.stack : undefined,
    requestId: req.id
  });
}

/**
 * Async handler to catch errors in async route handlers
 * @param {Function} fn - Async route handler
 * @returns {Function} - Wrapped route handler
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Process uncaught exceptions and unhandled rejections
 * @param {Error} error - The error object
 * @param {string} type - Error type ('exception' or 'rejection')
 */
function handleUncaughtError(error, type) {
  logger.error(`Uncaught ${type}: ${error.message}`, {
    error,
    stack: error.stack
  });
  
  // Perform cleanup
  // For critical errors, we may want to exit the process
  // but give it time to log the error and perform cleanup
  setTimeout(() => {
    process.exit(1);
  }, 1000);
}

/**
 * Setup global error handlers
 */
function setupGlobalErrorHandlers() {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    handleUncaughtError(error, 'exception');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (error) => {
    handleUncaughtError(error, 'rejection');
  });
  
  logger.info('Global error handlers configured');
}

/**
 * Attempts to recover from a database error
 * @param {Function} operation - Database operation to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<any>} - Result of the operation
 */
async function retryDatabaseOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      logger.warn(`Database operation failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
      
      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  // If we get here, all retries failed
  throw new DatabaseError(
    `Operation failed after ${maxRetries} attempts: ${lastError.message}`,
    'retry',
    lastError.collection || 'unknown'
  );
}

/**
 * Attempts to recover from an external service error
 * @param {Function} operation - External service operation to retry
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in ms
 * @param {string} serviceName - Name of the external service
 * @returns {Promise<any>} - Result of the operation
 */
async function retryExternalServiceOperation(operation, maxRetries = 3, delay = 1000, serviceName = 'external') {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      logger.warn(`External service operation failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
      
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw new ExternalServiceError(
          `Client error from ${serviceName}: ${error.message}`,
          serviceName,
          error.response.status
        );
      }
      
      if (attempt < maxRetries) {
        // Wait before retrying with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  // If we get here, all retries failed
  throw new ExternalServiceError(
    `Operation failed after ${maxRetries} attempts: ${lastError.message}`,
    serviceName,
    lastError.response ? lastError.response.status : 0
  );
}

// Export error classes and utilities
module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  
  // Middleware and handlers
  errorMiddleware,
  asyncHandler,
  
  // Setup function
  setupGlobalErrorHandlers,
  
  // Recovery utilities
  retryDatabaseOperation,
  retryExternalServiceOperation
};
