/**
 * Cache Middleware Unit Tests
 * 
 * Tests for the caching middleware functionality
 */

// Register module aliases before any other imports
require('@src/core/module-alias');

// Import dependencies
const { createCacheMiddleware, generateCacheKey, clearCache } = require('@middleware/cache/cache.middleware');

// Mock Redis client
const mockRedisClient = {
  get: jest.fn(),
  setex: jest.fn().mockResolvedValue(true),
  keys: jest.fn(),
  del: jest.fn()
};

// Mock logger
jest.mock('@core/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Cache Middleware', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock request
    mockRequest = {
      method: 'GET',
      path: '/api/test',
      body: { test: 'data' },
      params: { id: '123' },
      query: { filter: 'active' },
      user: { _id: 'user123' },
      headers: {}
    };
    
    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      statusCode: 200
    };
    
    nextFunction = jest.fn();
  });
  
  describe('generateCacheKey', () => {
    it('should generate a consistent cache key from request data', () => {
      // Act
      const key1 = generateCacheKey(mockRequest, 'test');
      const key2 = generateCacheKey(mockRequest, 'test');
      
      // Assert
      expect(key1).toBeDefined();
      expect(key1).toBe(key2);
      expect(key1).toContain('test:');
    });
    
    it('should generate different keys for different requests', () => {
      // Arrange
      const request1 = { ...mockRequest };
      const request2 = { 
        ...mockRequest,
        body: { test: 'different data' }
      };
      
      // Act
      const key1 = generateCacheKey(request1, 'test');
      const key2 = generateCacheKey(request2, 'test');
      
      // Assert
      expect(key1).not.toBe(key2);
    });
    
    it('should handle anonymous users', () => {
      // Arrange
      const request = { ...mockRequest, user: null };
      
      // Act
      const key = generateCacheKey(request, 'test');
      
      // Assert
      expect(key).toBeDefined();
      expect(key).toContain('test:');
    });
  });
  
  describe('createCacheMiddleware', () => {
    it('should skip caching for non-GET/POST requests', async () => {
      // Arrange
      const cacheMiddleware = createCacheMiddleware(mockRedisClient);
      mockRequest.method = 'DELETE';
      
      // Act
      await cacheMiddleware(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });
    
    it('should skip caching when disabled', async () => {
      // Arrange
      const cacheMiddleware = createCacheMiddleware(mockRedisClient, { enabled: false });
      
      // Act
      await cacheMiddleware(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });
    
    it('should skip caching when bypass header is present', async () => {
      // Arrange
      const cacheMiddleware = createCacheMiddleware(mockRedisClient, { bypassHeader: 'X-Skip-Cache' });
      mockRequest.headers['x-skip-cache'] = 'true';
      
      // Act
      await cacheMiddleware(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });
    
    it('should skip caching when bypass query parameter is present', async () => {
      // Arrange
      const cacheMiddleware = createCacheMiddleware(mockRedisClient, { bypassQuery: 'skipCache' });
      mockRequest.query.skipCache = 'true';
      
      // Act
      await cacheMiddleware(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });
    
    it('should return cached response when available', async () => {
      // Arrange
      const cacheMiddleware = createCacheMiddleware(mockRedisClient);
      const cachedResponse = {
        status: 200,
        body: { success: true, data: 'cached data' }
      };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedResponse));
      
      // Act
      await cacheMiddleware(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(mockRedisClient.get).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ success: true, data: 'cached data' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
    
    it('should proceed to next middleware when cache miss', async () => {
      // Arrange
      const cacheMiddleware = createCacheMiddleware(mockRedisClient);
      mockRedisClient.get.mockResolvedValue(null);
      
      // Act
      await cacheMiddleware(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(mockRedisClient.get).toHaveBeenCalled();
      expect(nextFunction).toHaveBeenCalled();
    });
    
    it('should cache successful responses', async () => {
      // Arrange
      const cacheMiddleware = createCacheMiddleware(mockRedisClient, { ttl: 60 });
      mockRedisClient.get.mockResolvedValue(null);
      
      // Act
      await cacheMiddleware(mockRequest, mockResponse, nextFunction);
      
      // Call the modified res.json method
      const responseBody = { success: true, data: 'test data' };
      mockResponse.json(responseBody);
      
      // Assert
      expect(mockRedisClient.setex).toHaveBeenCalled();
      const [cacheKey, ttl, cachedData] = mockRedisClient.setex.mock.calls[0];
      expect(cacheKey).toBeDefined();
      expect(ttl).toBe(60);
      expect(JSON.parse(cachedData)).toEqual({
        status: 200,
        body: responseBody
      });
    });
    
    it('should not cache error responses', async () => {
      // Arrange
      const cacheMiddleware = createCacheMiddleware(mockRedisClient);
      mockRedisClient.get.mockResolvedValue(null);
      mockResponse.statusCode = 500;
      
      // Act
      await cacheMiddleware(mockRequest, mockResponse, nextFunction);
      
      // Call the modified res.json method
      const responseBody = { success: false, message: 'Server error' };
      mockResponse.json(responseBody);
      
      // Assert
      expect(mockRedisClient.setex).not.toHaveBeenCalled();
    });
    
    it('should handle Redis errors gracefully', async () => {
      // Arrange
      const cacheMiddleware = createCacheMiddleware(mockRedisClient);
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection error'));
      
      // Act
      await cacheMiddleware(mockRequest, mockResponse, nextFunction);
      
      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });
  });
  
  describe('clearCache', () => {
    it('should clear cache entries matching pattern', async () => {
      // Arrange
      mockRedisClient.keys.mockResolvedValue(['cache:1', 'cache:2', 'cache:3']);
      mockRedisClient.del.mockResolvedValue(3);
      
      // Act
      const result = await clearCache(mockRedisClient, 'cache:*');
      
      // Assert
      expect(mockRedisClient.keys).toHaveBeenCalledWith('cache:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(['cache:1', 'cache:2', 'cache:3']);
      expect(result).toBe(3);
    });
    
    it('should handle empty results', async () => {
      // Arrange
      mockRedisClient.keys.mockResolvedValue([]);
      
      // Act
      const result = await clearCache(mockRedisClient, 'cache:*');
      
      // Assert
      expect(mockRedisClient.keys).toHaveBeenCalledWith('cache:*');
      expect(mockRedisClient.del).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
    
    it('should handle Redis errors', async () => {
      // Arrange
      mockRedisClient.keys.mockRejectedValue(new Error('Redis error'));
      
      // Act & Assert
      await expect(clearCache(mockRedisClient, 'cache:*')).rejects.toThrow('Redis error');
    });
  });
});
