const winston = require('winston');
const path = require('path');

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'shopbot-api' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, false);
    this.name = 'DatabaseError';
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message = 'External service unavailable') {
    super(`${service}: ${message}`, 502, false);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log error details
  const errorLog = {
    message: err.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
    statusCode: err.statusCode || 500
  };

  // Log based on severity
  if (err.statusCode >= 500) {
    logger.error('Server Error', errorLog);
  } else if (err.statusCode >= 400) {
    logger.warn('Client Error', errorLog);
  } else {
    logger.info('Request Error', errorLog);
  }

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    const message = 'Invalid resource ID format';
    err = new ValidationError(message);
  }

  // Mongoose duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `${field} already exists`;
    err = new ConflictError(message);
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message).join(', ');
    err = new ValidationError(message);
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    err = new AuthenticationError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    err = new AuthenticationError('Token expired');
  }

  // Multer errors (file upload)
  if (error.code === 'LIMIT_FILE_SIZE') {
    err = new ValidationError('File too large');
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    err = new ValidationError('Unexpected file field');
  }

  // Rate limiting errors
  if (error.type === 'entity.too.large') {
    err = new ValidationError('Request payload too large');
  }

  // Default to 500 server error
  if (!err.statusCode) {
    err = new AppError('Internal server error', 500, false);
  }

  // Send error response
  const response = {
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode,
      timestamp: err.timestamp || new Date().toISOString()
    }
  };

  // Include additional error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
    response.error.details = err;
  }

  // Include field information for validation errors
  if (err.field) {
    response.error.field = err.field;
  }

  // Include service information for external service errors
  if (err.service) {
    response.error.service = err.service;
  }

  res.status(err.statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      logger.info('HTTP server closed.');
      
      // Close database connections
      if (global.mongoose) {
        global.mongoose.connection.close(() => {
          logger.info('MongoDB connection closed.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason.stack || reason
  });
  
  // Close server & exit process
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack
  });
  
  // Close server & exit process
  process.exit(1);
});

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  gracefulShutdown,
  logger,
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError
};
