/**
 * Rate Limiting Middleware Unit Tests
 * 
 * Tests for the rate limiting middleware functionality
 */

// Register module aliases before any other imports
require('@src/core/module-alias');

// Import dependencies
const { createRateLimiter, configureRateLimits } = require('@middleware/rate-limit/rate-limit.middleware');
const redis = require('redis');

// Mock redis
jest.mock('redis', () => {
  const mockClient = {
    incr: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn(),
    on: jest.fn()
  };
  return {
    createClient: jest.fn().mockReturnValue(mockClient)
  };
});

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation((options) => {
    return (req, res, next) => {
      // Store the options for testing
      req.rateLimitOptions = options;
      next();
    };
  });
});

describe('Rate Limiting Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock request and response
    mockRequest = {
      ip: '127.0.0.1',
      path: '/api/test',
      user: { _id: 'user123' }
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    nextFunction = jest.fn();
  });
  
  describe('createRateLimiter', () => {
    it('should create a rate limiter with default options', () => {
      // Act
      const limiter = createRateLimiter();
      limiter(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.rateLimitOptions).toBeDefined();
      expect(mockRequest.rateLimitOptions.windowMs).toBe(15 * 60 * 1000); // 15 minutes
      expect(mockRequest.rateLimitOptions.max).toBe(100);
    });
    
    it('should create a rate limiter with custom options', () => {
      // Arrange
      const options = {
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50,
        message: 'Too many requests'
      };
      
      // Act
      const limiter = createRateLimiter(options);
      limiter(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.rateLimitOptions).toBeDefined();
      expect(mockRequest.rateLimitOptions.windowMs).toBe(5 * 60 * 1000);
      expect(mockRequest.rateLimitOptions.max).toBe(50);
      expect(mockRequest.rateLimitOptions.message).toBe('Too many requests');
    });
    
    it('should use keyGenerator function if provided', () => {
      // Arrange
      const keyGenerator = (req) => req.user._id;
      const options = {
        keyGenerator
      };
      
      // Act
      const limiter = createRateLimiter(options);
      limiter(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.rateLimitOptions.keyGenerator).toBe(keyGenerator);
    });
  });
  
  describe('configureRateLimits', () => {
    it('should configure different rate limits for different endpoints', () => {
      // Arrange
      const config = {
        api: {
          windowMs: 15 * 60 * 1000,
          max: 100
        },
        auth: {
          windowMs: 5 * 60 * 1000,
          max: 5
        }
      };
      
      // Act
      const limiters = configureRateLimits(config);
      
      // Assert
      expect(limiters).toBeDefined();
      expect(limiters.api).toBeDefined();
      expect(limiters.auth).toBeDefined();
      
      // Test api limiter
      limiters.api(mockRequest, mockResponse, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.rateLimitOptions.windowMs).toBe(15 * 60 * 1000);
      expect(mockRequest.rateLimitOptions.max).toBe(100);
      
      // Reset for next test
      jest.clearAllMocks();
      mockRequest = {
        ip: '127.0.0.1',
        path: '/api/auth/login',
        user: { _id: 'user123' }
      };
      
      // Test auth limiter
      limiters.auth(mockRequest, mockResponse, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.rateLimitOptions.windowMs).toBe(5 * 60 * 1000);
      expect(mockRequest.rateLimitOptions.max).toBe(5);
    });
    
    it('should use Redis store if redisClient is provided', () => {
      // Arrange
      const redisClient = redis.createClient();
      const config = {
        api: {
          windowMs: 15 * 60 * 1000,
          max: 100,
          redisClient
        }
      };
      
      // Act
      const limiters = configureRateLimits(config);
      limiters.api(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(redis.createClient).toHaveBeenCalled();
      expect(mockRequest.rateLimitOptions.store).toBeDefined();
    });
  });
});
