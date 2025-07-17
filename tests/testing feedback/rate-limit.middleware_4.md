
## Problem Analysis

The error indicates that Jest's `jest.mock()` factory function is referencing an out-of-scope variable `RedisStore`. Jest's module factory functions have strict scoping rules to prevent uninitialized mock variables.

## Solution Implementation

// tests/unit/middleware/rate-limit/rate-limit.middleware.test.js

// Mock Redis Store with proper Jest factory pattern
jest.mock('rate-limit-redis', () => {
  const mockRedisStore = jest.fn().mockImplementation(() => ({
    incr: jest.fn(),
    decrement: jest.fn(),
    resetKey: jest.fn(),
    resetAll: jest.fn(),
    shutdown: jest.fn()
  }));
  
  return {
    __esModule: true,
    default: mockRedisStore
  };
});

// Mock logger with proper Jest factory pattern
jest.mock('../../../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation(() => {
    return jest.fn((req, res, next) => next());
  });
});

const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const logger = require('../../../../src/utils/logger');
const rateLimitMiddleware = require('../../../../src/middleware/rate-limit/rate-limit.middleware');

describe('Rate Limit Middleware', () => {
  let app;
  let mockRedisClient;
  let mockRedisStore;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup Express app for testing
    app = express();
    
    // Create mock Redis client
    mockRedisClient = {
      incr: jest.fn(),
      expire: jest.fn(),
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      quit: jest.fn(),
      on: jest.fn(),
      connected: true
    };
    
    // Setup mock Redis store instance
    mockRedisStore = new RedisStore();
    RedisStore.mockReturnValue(mockRedisStore);
    
    // Configure rate limit mock
    rateLimit.mockImplementation((options) => {
      return jest.fn((req, res, next) => {
        // Simulate rate limiting logic
        if (req.rateLimitExceeded) {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded'
          });
        }
        next();
      });
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Middleware Configuration', () => {
    test('should create rate limit middleware with default configuration', () => {
      const middleware = rateLimitMiddleware({
        redisClient: mockRedisClient
      });

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: expect.any(Number),
          max: expect.any(Number),
          store: expect.any(Object),
          standardHeaders: true,
          legacyHeaders: false
        })
      );
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe('function');
    });

    test('should create rate limit middleware with custom configuration', () => {
      const customConfig = {
        windowMs: 60000, // 1 minute
        max: 50,
        message: 'Custom rate limit message',
        standardHeaders: true,
        legacyHeaders: false
      };

      const middleware = rateLimitMiddleware({
        redisClient: mockRedisClient,
        ...customConfig
      });

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 60000,
          max: 50,
          message: 'Custom rate limit message',
          standardHeaders: true,
          legacyHeaders: false
        })
      );
      expect(middleware).toBeDefined();
    });

    test('should initialize Redis store with correct parameters', () => {
      rateLimitMiddleware({
        redisClient: mockRedisClient,
        windowMs: 900000, // 15 minutes
        keyPrefix: 'rl:'
      });

      expect(RedisStore).toHaveBeenCalledWith({
        client: mockRedisClient,
        prefix: 'rl:'
      });
    });
  });

  describe('Rate Limiting Behavior', () => {
    beforeEach(() => {
      const middleware = rateLimitMiddleware({
        redisClient: mockRedisClient,
        windowMs: 60000, // 1 minute
        max: 5
      });
      
      app.use(middleware);
      app.get('/test', (req, res) => {
        res.status(200).json({ message: 'Success' });
      });
    });

    test('should allow requests within rate limit', async () => {
      const response = await request(app)
        .get('/test')
        .expect(200);

      expect(response.body).toEqual({ message: 'Success' });
    });

    test('should block requests exceeding rate limit', async () => {
      // Simulate rate limit exceeded
      rateLimit.mockImplementation(() => {
        return jest.fn((req, res, next) => {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded'
          });
        });
      });

      const middleware = rateLimitMiddleware({
        redisClient: mockRedisClient,
        windowMs: 60000,
        max: 5
      });

      const testApp = express();
      testApp.use(middleware);
      testApp.get('/test', (req, res) => {
        res.status(200).json({ message: 'Success' });
      });

      const response = await request(testApp)
        .get('/test')
        .expect(429);

      expect(response.body).toEqual({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded'
      });
    });
  });

  describe('Redis Store Integration', () => {
    test('should handle Redis store operations correctly', () => {
      const middleware = rateLimitMiddleware({
        redisClient: mockRedisClient,
        windowMs: 60000,
        max: 10
      });

      // Verify Redis store was initialized
      expect(RedisStore).toHaveBeenCalledWith({
        client: mockRedisClient,
        prefix: expect.any(String)
      });

      // Verify store methods are available
      expect(mockRedisStore.incr).toBeDefined();
      expect(mockRedisStore.decrement).toBeDefined();
      expect(mockRedisStore.resetKey).toBeDefined();
      expect(mockRedisStore.resetAll).toBeDefined();
      expect(mockRedisStore.shutdown).toBeDefined();
    });

    test('should handle Redis connection errors gracefully', () => {
      const disconnectedClient = {
        ...mockRedisClient,
        connected: false
      };

      expect(() => {
        rateLimitMiddleware({
          redisClient: disconnectedClient,
          windowMs: 60000,
          max: 10
        });
      }).not.toThrow();

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Redis client not connected')
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle missing Redis client gracefully', () => {
      expect(() => {
        rateLimitMiddleware({
          windowMs: 60000,
          max: 10
        });
      }).not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Redis client is required')
      );
    });

    test('should handle Redis store initialization errors', () => {
      RedisStore.mockImplementation(() => {
        throw new Error('Redis store initialization failed');
      });

      expect(() => {
        rateLimitMiddleware({
          redisClient: mockRedisClient,
          windowMs: 60000,
          max: 10
        });
      }).not.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize Redis store')
      );
    });
  });

  describe('Configuration Validation', () => {
    test('should validate windowMs parameter', () => {
      const middleware = rateLimitMiddleware({
        redisClient: mockRedisClient,
        windowMs: 'invalid',
        max: 10
      });

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: expect.any(Number) // Should fallback to default
        })
      );
    });

    test('should validate max parameter', () => {
      const middleware = rateLimitMiddleware({
        redisClient: mockRedisClient,
        windowMs: 60000,
        max: 'invalid'
      });

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          max: expect.any(Number) // Should fallback to default
        })
      );
    });

    test('should apply default values for missing parameters', () => {
      const middleware = rateLimitMiddleware({
        redisClient: mockRedisClient
      });

      expect(rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({
          windowMs: 900000, // 15 minutes default
          max: 100, // default limit
          standardHeaders: true,
          legacyHeaders: false
        })
      );
    });
  });
});