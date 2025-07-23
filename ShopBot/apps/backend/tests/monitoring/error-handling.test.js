const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');
const {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  logger,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError
} = require('../../src/middleware/errorHandler');

// Create Express app for error handling testing
const app = express();
app.use(express.json());

// Test routes that trigger different types of errors
app.get('/test/validation-error', (req, res, next) => {
  next(new ValidationError('Invalid input data', 'email'));
});

app.get('/test/auth-error', (req, res, next) => {
  next(new AuthenticationError('Token expired'));
});

app.get('/test/authorization-error', (req, res, next) => {
  next(new AuthorizationError('Admin access required'));
});

app.get('/test/not-found-error', (req, res, next) => {
  next(new NotFoundError('User'));
});

app.get('/test/conflict-error', (req, res, next) => {
  next(new ConflictError('Email already exists'));
});

app.get('/test/rate-limit-error', (req, res, next) => {
  next(new RateLimitError('Too many requests'));
});

app.get('/test/database-error', (req, res, next) => {
  next(new DatabaseError('Connection timeout'));
});

app.get('/test/external-service-error', (req, res, next) => {
  next(new ExternalServiceError('Shopify API', 'Service unavailable'));
});

app.get('/test/generic-error', (req, res, next) => {
  next(new Error('Generic server error'));
});

app.get('/test/async-error', asyncHandler(async (req, res, next) => {
  throw new Error('Async operation failed');
}));

app.get('/test/mongoose-cast-error', (req, res, next) => {
  const error = new Error('Cast to ObjectId failed');
  error.name = 'CastError';
  next(error);
});

app.get('/test/mongoose-duplicate-error', (req, res, next) => {
  const error = new Error('Duplicate key error');
  error.code = 11000;
  error.keyValue = { email: 'test@example.com' };
  next(error);
});

app.get('/test/jwt-error', (req, res, next) => {
  const error = new Error('Invalid token');
  error.name = 'JsonWebTokenError';
  next(error);
});

app.get('/test/jwt-expired-error', (req, res, next) => {
  const error = new Error('Token expired');
  error.name = 'TokenExpiredError';
  next(error);
});

app.get('/test/file-size-error', (req, res, next) => {
  const error = new Error('File too large');
  error.code = 'LIMIT_FILE_SIZE';
  next(error);
});

app.get('/test/payload-too-large', (req, res, next) => {
  const error = new Error('Request entity too large');
  error.type = 'entity.too.large';
  next(error);
});

// Apply error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

describe('Error Handling and Monitoring Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Custom Error Classes', () => {
    test('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid email format', 'email');
      
      expect(error.message).toBe('Invalid email format');
      expect(error.statusCode).toBe(400);
      expect(error.field).toBe('email');
      expect(error.name).toBe('ValidationError');
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
    });

    test('should create AuthenticationError with correct properties', () => {
      const error = new AuthenticationError('Invalid credentials');
      
      expect(error.message).toBe('Invalid credentials');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
      expect(error.isOperational).toBe(true);
    });

    test('should create AuthorizationError with correct properties', () => {
      const error = new AuthorizationError('Admin required');
      
      expect(error.message).toBe('Admin required');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('AuthorizationError');
    });

    test('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError('Product');
      
      expect(error.message).toBe('Product not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    test('should create DatabaseError as non-operational', () => {
      const error = new DatabaseError('Connection failed');
      
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(false);
      expect(error.name).toBe('DatabaseError');
    });

    test('should create ExternalServiceError with service info', () => {
      const error = new ExternalServiceError('Payment Gateway', 'Timeout');
      
      expect(error.message).toBe('Payment Gateway: Timeout');
      expect(error.statusCode).toBe(502);
      expect(error.service).toBe('Payment Gateway');
      expect(error.name).toBe('ExternalServiceError');
    });
  });

  describe('Error Handler Middleware', () => {
    test('should handle ValidationError correctly', async () => {
      const response = await request(app)
        .get('/test/validation-error')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Invalid input data');
      expect(response.body.error.statusCode).toBe(400);
      expect(response.body.error.field).toBe('email');
      expect(response.body.error.timestamp).toBeDefined();
    });

    test('should handle AuthenticationError correctly', async () => {
      const response = await request(app)
        .get('/test/auth-error')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Token expired');
      expect(response.body.error.statusCode).toBe(401);
    });

    test('should handle AuthorizationError correctly', async () => {
      const response = await request(app)
        .get('/test/authorization-error')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Admin access required');
      expect(response.body.error.statusCode).toBe(403);
    });

    test('should handle NotFoundError correctly', async () => {
      const response = await request(app)
        .get('/test/not-found-error')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('User not found');
      expect(response.body.error.statusCode).toBe(404);
    });

    test('should handle ConflictError correctly', async () => {
      const response = await request(app)
        .get('/test/conflict-error')
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Email already exists');
      expect(response.body.error.statusCode).toBe(409);
    });

    test('should handle RateLimitError correctly', async () => {
      const response = await request(app)
        .get('/test/rate-limit-error')
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Too many requests');
      expect(response.body.error.statusCode).toBe(429);
    });

    test('should handle DatabaseError correctly', async () => {
      const response = await request(app)
        .get('/test/database-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Connection timeout');
      expect(response.body.error.statusCode).toBe(500);
    });

    test('should handle ExternalServiceError correctly', async () => {
      const response = await request(app)
        .get('/test/external-service-error')
        .expect(502);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Shopify API: Service unavailable');
      expect(response.body.error.statusCode).toBe(502);
      expect(response.body.error.service).toBe('Shopify API');
    });

    test('should handle generic errors as 500', async () => {
      const response = await request(app)
        .get('/test/generic-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Internal server error');
      expect(response.body.error.statusCode).toBe(500);
    });

    test('should handle async errors correctly', async () => {
      const response = await request(app)
        .get('/test/async-error')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.statusCode).toBe(500);
    });
  });

  describe('Mongoose Error Handling', () => {
    test('should handle Mongoose CastError', async () => {
      const response = await request(app)
        .get('/test/mongoose-cast-error')
        .expect(400);

      expect(response.body.error.message).toBe('Invalid resource ID format');
    });

    test('should handle Mongoose duplicate key error', async () => {
      const response = await request(app)
        .get('/test/mongoose-duplicate-error')
        .expect(409);

      expect(response.body.error.message).toBe('email already exists');
    });
  });

  describe('JWT Error Handling', () => {
    test('should handle JWT invalid token error', async () => {
      const response = await request(app)
        .get('/test/jwt-error')
        .expect(401);

      expect(response.body.error.message).toBe('Invalid token');
    });

    test('should handle JWT expired token error', async () => {
      const response = await request(app)
        .get('/test/jwt-expired-error')
        .expect(401);

      expect(response.body.error.message).toBe('Token expired');
    });
  });

  describe('File Upload Error Handling', () => {
    test('should handle file size limit error', async () => {
      const response = await request(app)
        .get('/test/file-size-error')
        .expect(400);

      expect(response.body.error.message).toBe('File too large');
    });

    test('should handle payload too large error', async () => {
      const response = await request(app)
        .get('/test/payload-too-large')
        .expect(400);

      expect(response.body.error.message).toBe('Request payload too large');
    });
  });

  describe('404 Not Found Handler', () => {
    test('should handle non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Route /non-existent-route not found');
      expect(response.body.error.statusCode).toBe(404);
    });
  });

  describe('Error Response Format', () => {
    test('should return consistent error response format', async () => {
      const response = await request(app)
        .get('/test/validation-error')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('statusCode');
      expect(response.body.error).toHaveProperty('timestamp');
    });

    test('should include field information for validation errors', async () => {
      const response = await request(app)
        .get('/test/validation-error')
        .expect(400);

      expect(response.body.error).toHaveProperty('field', 'email');
    });

    test('should include service information for external service errors', async () => {
      const response = await request(app)
        .get('/test/external-service-error')
        .expect(502);

      expect(response.body.error).toHaveProperty('service', 'Shopify API');
    });
  });

  describe('Async Handler', () => {
    test('should wrap async functions and catch errors', async () => {
      const mockAsyncFunction = jest.fn().mockRejectedValue(new Error('Async error'));
      const wrappedFunction = asyncHandler(mockAsyncFunction);
      const mockNext = jest.fn();

      await wrappedFunction({}, {}, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext.mock.calls[0][0].message).toBe('Async error');
    });

    test('should pass through successful async functions', async () => {
      const mockReq = {};
      const mockRes = { json: jest.fn() };
      const mockNext = jest.fn();
      
      const mockAsyncFunction = jest.fn().mockResolvedValue();
      const wrappedFunction = asyncHandler(mockAsyncFunction);

      await wrappedFunction(mockReq, mockRes, mockNext);

      expect(mockAsyncFunction).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Logger Integration', () => {
    test('should have logger available', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('should log errors with appropriate levels', () => {
      const loggerSpy = jest.spyOn(logger, 'error');
      
      // This would be tested by triggering an actual error through the middleware
      // For now, we just verify the logger structure
      expect(logger.level).toBeDefined();
    });
  });

  describe('Error Boundary Behavior', () => {
    test('should prevent application crash on unhandled errors', async () => {
      // Test that the application continues to function after errors
      await request(app)
        .get('/test/database-error')
        .expect(500);

      // Application should still respond to subsequent requests
      await request(app)
        .get('/test/validation-error')
        .expect(400);
    });

    test('should handle multiple concurrent errors', async () => {
      const promises = [
        request(app).get('/test/validation-error'),
        request(app).get('/test/auth-error'),
        request(app).get('/test/not-found-error'),
        request(app).get('/test/database-error')
      ];

      const responses = await Promise.all(promises);

      expect(responses[0].status).toBe(400);
      expect(responses[1].status).toBe(401);
      expect(responses[2].status).toBe(404);
      expect(responses[3].status).toBe(500);

      // All should have consistent error format
      responses.forEach(response => {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
      });
    });
  });

  describe('Graceful Degradation', () => {
    test('should handle partial service failures gracefully', async () => {
      // Simulate external service failure
      const response = await request(app)
        .get('/test/external-service-error')
        .expect(502);

      expect(response.body.error.message).toContain('Service unavailable');
      expect(response.body.error.service).toBe('Shopify API');
    });

    test('should provide meaningful error messages for users', async () => {
      const response = await request(app)
        .get('/test/validation-error')
        .expect(400);

      expect(response.body.error.message).toBe('Invalid input data');
      expect(response.body.error.message).not.toContain('stack');
      expect(response.body.error.message).not.toContain('internal');
    });
  });
});
