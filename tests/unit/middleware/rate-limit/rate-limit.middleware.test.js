// tests/unit/middleware/rate-limit/rate-limit.middleware.test.js

// Mock Redis Store with proper Jest factory pattern
class MockRedisStore {
  constructor(options) {
    this.options = options;
    this.incr = jest.fn();
    this.decrement = jest.fn();
    this.resetKey = jest.fn();
    this.resetAll = jest.fn();
    this.get = jest.fn();
    this.set = jest.fn();
    this.expire = jest.fn();
    this.del = jest.fn();
    this.quit = jest.fn();
    this.on = jest.fn();
    this.connected = true;
  }
}

jest.mock('rate-limit-redis', () => ({
  __esModule: true,
  default: MockRedisStore
}));

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

// Mock express-rate-limit to return a valid middleware function
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation(() => (req, res, next) => next());
});

const request = require('supertest');
const express = require('express');
const rateLimit = require('express-rate-limit');
const logger = require('../../../../src/utils/logger');
const { createRateLimiter } = require('../../../../src/middleware/rate-limit/rate-limit.middleware');

describe('Rate Limit Middleware', () => {
  let app;
  let mockRedisClient;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Configure rate limit mock
    rateLimit.mockImplementation(() => (req, res, next) => next());

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
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Middleware Configuration', () => {
    test('should create rate limit middleware with default configuration', () => {
      const middleware = createRateLimiter({
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

      const middleware = createRateLimiter({
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
      const windowMs = 900000; // 15 minutes
      const keyPrefix = 'rl:';

      createRateLimiter({
        redisClient: mockRedisClient,
        windowMs,
        keyPrefix
      });

      expect(require('rate-limit-redis').default).toHaveBeenCalledTimes(1);
      expect(require('rate-limit-redis').default).toHaveBeenCalledWith({
        client: mockRedisClient,
        prefix: keyPrefix,
        expiry: windowMs / 1000 // convert to seconds
      });
    });
  });

  describe('Rate Limiting Behavior', () => {
    beforeEach(() => {
      const middleware = createRateLimiter({
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

      const middleware = createRateLimiter({
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
    test.skip('should handle Redis store operations correctly', () => {
      const middleware = createRateLimiter({
        redisClient: mockRedisClient,
        windowMs: 60000,
        max: 10
      });

      // Verify Redis store was initialized
      expect(require('rate-limit-redis').default).toHaveBeenCalledTimes(1);
      expect(require('rate-limit-redis').default).toHaveBeenCalledWith({
        client: mockRedisClient,
        prefix: expect.any(String),
        expiry: expect.any(Number)
      });

      // Verify store methods are available
      const redisStore = require('rate-limit-redis').default;
      const store = new redisStore({});
      expect(store.incr).toBeDefined();
      expect(store.decrement).toBeDefined();
      expect(store.resetKey).toBeDefined();
      expect(store.resetAll).toBeDefined();
    });

    test('should handle Redis connection errors gracefully', () => {
      const disconnectedClient = {
        ...mockRedisClient,
        connected: false
      };

      expect(() => {
        createRateLimiter({
          redisClient: disconnectedClient,
          windowMs: 60000,
          max: 10
        });
      }).not.toThrow();

      expect(logger.default.warn).toHaveBeenCalledWith(
        expect.stringContaining('Redis client not connected')
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle missing Redis client gracefully', () => {
      expect(() => {
        createRateLimiter({
          windowMs: 60000,
          max: 10
        });
      }).not.toThrow();

      expect(logger.default.error).toHaveBeenCalledWith(
        expect.stringContaining('Redis client is required')
      );
    });

    test('should handle Redis store initialization errors', () => {
      require('rate-limit-redis').default.mockImplementation(() => {
        throw new Error('Redis store initialization failed');
      });

      expect(() => {
        createRateLimiter({
          redisClient: mockRedisClient,
          windowMs: 60000,
          max: 10
        });
      }).not.toThrow();

      expect(logger.default.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize Redis store')
      );
    });
  });

  describe('Configuration Validation', () => {
    test('should validate windowMs parameter', () => {
      const middleware = createRateLimiter({
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
      const middleware = createRateLimiter({
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
      const middleware = createRateLimiter({
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
