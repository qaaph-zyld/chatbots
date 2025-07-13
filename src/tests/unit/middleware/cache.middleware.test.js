/**
 * Cache Middleware Tests
 */

// Mock dependencies
jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../../config/cache.config', () => ({
  getConfig: jest.fn().mockReturnValue({
    enabled: true,
    ttl: 3600,
    prefix: 'test',
    monitoring: true,
    warming: true,
    adaptiveTTL: true
  })
}));

jest.mock('../../../middleware/cache/cache-monitor', () => ({
  initMonitoring: jest.fn(),
  recordHit: jest.fn(),
  recordMiss: jest.fn()
}));

jest.mock('../../../middleware/cache/cache-warmer', () => ({
  initWarming: jest.fn(),
  trackAccess: jest.fn()
}));

jest.mock('../../../middleware/cache/adaptive-ttl', () => ({
  calculateAdaptiveTTL: jest.fn().mockResolvedValue(7200),
  trackResourceAccess: jest.fn().mockResolvedValue(true)
}));

// Import the module under test
const { createCacheMiddleware, generateCacheKey, clearCache } = require('../../../middleware/cache/cache.middleware');

describe('Cache Middleware', () => {
  let req, res, next, redisClient;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request and response objects
    req = {
      path: '/api/test',
      method: 'GET',
      headers: {},
      query: {},
      params: {},
      body: { test: 'data' },
      user: { _id: 'user123' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      statusCode: 200
    };
    
    next = jest.fn();
    
    // Mock Redis client with implementation
    redisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      setex: jest.fn().mockResolvedValue('OK'),
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(0),
      on: jest.fn()
    };
  });

  describe('generateCacheKey', () => {
    it('should generate a consistent cache key from request data', () => {
      const key1 = generateCacheKey(req, 'prefix');
      const key2 = generateCacheKey(req, 'prefix');
      
      expect(key1).toBe(key2);
      expect(key1).toMatch(/^prefix:/);
    });

    it('should generate different keys for different requests', () => {
      const key1 = generateCacheKey(req, 'prefix');
      
      const modifiedReq = { ...req, path: '/api/different' };
      const key2 = generateCacheKey(modifiedReq, 'prefix');
      
      expect(key1).not.toBe(key2);
    });

    it('should handle anonymous users', () => {
      const anonymousReq = { ...req, user: null };
      const key = generateCacheKey(anonymousReq, 'prefix');
      
      expect(key).toMatch(/^prefix:/);
    });
  });

  describe('createCacheMiddleware', () => {
    it('should pass through if caching is disabled', async () => {
      // Reset the Redis client mock before this test
      redisClient.get = jest.fn().mockResolvedValue(null);
      
      // Override the mock to return disabled config
      // Include all required properties to prevent defaults from being used
      require('../../../config/cache.config').getConfig.mockReturnValueOnce({
        enabled: false,
        prefix: 'test',
        ttl: 3600,
        monitoring: false,
        warming: false,
        adaptiveTTL: false
      });
      
      const middleware = createCacheMiddleware(redisClient);
      await middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(redisClient.get).not.toHaveBeenCalled();
    });

    it('should return cached response if available', async () => {
      // Mock cached data
      const cachedData = { status: 200, body: { data: 'cached response' } };
      
      // Override the config mock to ensure consistent prefix
      require('../../../config/cache.config').getConfig.mockReturnValueOnce({
        enabled: true,
        prefix: 'cache', // Match the default prefix in the middleware
        ttl: 3600,
        monitoring: false,
        warming: false,
        adaptiveTTL: false
      });
      
      // Explicitly set up the mock implementation before creating middleware
      redisClient.get = jest.fn().mockImplementation(() => {
        return Promise.resolve(JSON.stringify(cachedData));
      });
      
      // Generate the expected cache key for verification with the correct prefix
      const expectedCacheKey = generateCacheKey(req, 'cache');
      
      const middleware = createCacheMiddleware(redisClient);
      await middleware(req, res, next);
      
      // Verify Redis get was called with the correct key
      expect(redisClient.get).toHaveBeenCalledWith(expectedCacheKey);
      
      // Verify response was sent with cached data
      expect(res.status).toHaveBeenCalledWith(cachedData.status);
      expect(res.json).toHaveBeenCalledWith(cachedData.body);
      
      // Verify next was not called (since we returned early with cached response)
      expect(next).not.toHaveBeenCalled();
    });

    it('should cache response on the way out if not in cache', async () => {
      // Mock cache miss
      redisClient.get = jest.fn().mockImplementation(() => Promise.resolve(null));
      redisClient.setex = jest.fn().mockImplementation(() => Promise.resolve('OK'));
      
      // Store original json method reference
      const originalJson = res.json;
      
      // Apply middleware
      const middleware = createCacheMiddleware(redisClient);
      await middleware(req, res, next);
      
      // Verify next was called to continue to route handler
      expect(next).toHaveBeenCalled();
      
      // Verify json method was modified - check that it's not the same reference
      expect(typeof res.json).toBe('function');
      expect(res.json).not.toBe(originalJson);
      
      // Simulate route handler sending response
      const responseData = { data: 'fresh response' };
      res.statusCode = 200;
      
      // Call the overridden json method
      res.json(responseData);
      
      // Verify response was cached with setex
      expect(redisClient.setex).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Mock Redis error
      redisClient.get.mockRejectedValueOnce(new Error('Redis error'));
      
      const middleware = createCacheMiddleware(redisClient);
      await middleware(req, res, next);
      
      // Should continue to the route handler despite error
      expect(next).toHaveBeenCalled();
    });
  });

  describe('clearCache', () => {
    it('should clear cache keys matching a pattern', async () => {
      // Mock Redis keys and del
      redisClient.keys.mockResolvedValueOnce(['key1', 'key2']);
      redisClient.del.mockResolvedValueOnce(2);
      
      const result = await clearCache(redisClient, 'test:*');
      
      expect(redisClient.keys).toHaveBeenCalledWith('test:*');
      expect(redisClient.del).toHaveBeenCalledWith(['key1', 'key2']);
      expect(result).toBe(2);
    });

    it('should handle empty results', async () => {
      // Mock no keys found
      redisClient.keys.mockResolvedValueOnce([]);
      
      const result = await clearCache(redisClient, 'test:*');
      
      expect(redisClient.keys).toHaveBeenCalledWith('test:*');
      expect(redisClient.del).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      // Mock Redis error
      redisClient.keys.mockRejectedValueOnce(new Error('Redis error'));
      
      await expect(clearCache(redisClient, 'test:*')).rejects.toThrow('Redis error');
    });
  });
});
