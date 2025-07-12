/**
 * Cache Warming Integration Tests
 * 
 * Tests for the cache warming system integrated with middleware
 */

// Import dependencies
const express = require('express');
const request = require('supertest');
const { createCacheMiddleware } = require('@middleware/cache/cache.middleware');
const { initWarming, warmCache } = require('@middleware/cache/cache-warmer');
const { getRedisClient } = require('@core/redis-client');

// Mock Redis client
jest.mock('@core/redis-client', () => {
  const mockRedisClient = {
    get: jest.fn(),
    setex: jest.fn().mockResolvedValue('OK'),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(0)
  };
  
  return {
    getRedisClient: jest.fn().mockReturnValue(mockRedisClient)
  };
});

// Mock logger
jest.mock('@core/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Cache Warming Integration', () => {
  let app;
  let redisClient;
  let warmer;
  
  beforeEach(() => {
    // Create Express app
    app = express();
    
    // Get Redis client mock
    redisClient = getRedisClient();
    
    // Initialize warming
    warmer = initWarming(redisClient, {
      enabled: true,
      interval: 1000,
      maxItems: 5,
      minHits: 2
    });
    
    // Reset tracker
    warmer.resetTracker();
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  test('should track resource access and warm cache', async () => {
    // Create cache middleware with warming
    const cacheMiddleware = createCacheMiddleware(redisClient, {
      ttl: 60,
      prefix: 'test',
      enabled: true,
      warming: true
    });
    
    // Create test route
    app.get('/test/:id', cacheMiddleware, (req, res) => {
      res.json({ id: req.params.id, message: 'Test response' });
    });
    
    // Make multiple requests to the same resource to trigger warming
    redisClient.get.mockResolvedValue(null); // Always cache miss for this test
    
    // First request
    await request(app)
      .get('/test/123')
      .expect(200)
      .expect({ id: '123', message: 'Test response' });
    
    // Second request
    await request(app)
      .get('/test/123')
      .expect(200)
      .expect({ id: '123', message: 'Test response' });
    
    // Third request
    await request(app)
      .get('/test/123')
      .expect(200)
      .expect({ id: '123', message: 'Test response' });
    
    // Different resource
    await request(app)
      .get('/test/456')
      .expect(200)
      .expect({ id: '456', message: 'Test response' });
    
    // Trigger cache warming
    const result = await warmer.warmCache();
    
    // Check result
    expect(result.total).toBeGreaterThan(0); // At least one resource should be warmed
    expect(result.warmed).toBeGreaterThan(0);
    
    // Check that Redis setex was called during warming
    expect(redisClient.setex).toHaveBeenCalledTimes(4); // 3 original requests + 1 warming
  });
  
  test('should not track resources when warming is disabled', async () => {
    // Create cache middleware without warming
    const cacheMiddleware = createCacheMiddleware(redisClient, {
      ttl: 60,
      prefix: 'test',
      enabled: true,
      warming: false
    });
    
    // Create test route
    app.get('/test/:id', cacheMiddleware, (req, res) => {
      res.json({ id: req.params.id, message: 'Test response' });
    });
    
    // Make multiple requests
    redisClient.get.mockResolvedValue(null); // Always cache miss for this test
    
    // First request
    await request(app)
      .get('/test/123')
      .expect(200);
    
    // Second request
    await request(app)
      .get('/test/123')
      .expect(200);
    
    // Trigger cache warming
    const result = await warmer.warmCache();
    
    // Check result - should be empty because warming is disabled in middleware
    expect(result.total).toBe(0);
    expect(result.warmed).toBe(0);
    
    // Check that Redis setex was not called for warming
    expect(redisClient.setex).toHaveBeenCalledTimes(2); // Only for the original requests
  });
  
  test('should expose warming endpoint', async () => {
    // Create Express app with warming endpoint
    const app = express();
    
    // Mock authenticated user middleware
    const mockAuthMiddleware = (req, res, next) => {
      req.user = { isAdmin: true };
      next();
    };
    
    // Create router for warming endpoint
    const router = express.Router();
    
    // Add warming endpoint
    router.post('/warm', mockAuthMiddleware, (req, res) => {
      warmer.warmCache()
        .then(result => {
          res.json({
            success: true,
            message: `Cache warming completed: ${result.warmed}/${result.total} resources warmed`,
            result
          });
        })
        .catch(error => {
          res.status(500).json({
            success: false,
            message: `Error warming cache: ${error.message}`
          });
        });
    });
    
    // Mount router
    app.use('/api/cache', router);
    
    // Track some resources
    const fetchFunction = jest.fn().mockResolvedValue({ data: 'test' });
    warmer.trackAccess('test', 'key1', fetchFunction);
    warmer.trackAccess('test', 'key1', fetchFunction);
    warmer.trackAccess('test', 'key2', fetchFunction);
    warmer.trackAccess('test', 'key2', fetchFunction);
    
    // Request warming
    const response = await request(app)
      .post('/api/cache/warm')
      .expect(200);
    
    // Check response
    expect(response.body.success).toBe(true);
    expect(response.body.result).toBeDefined();
    expect(response.body.result.total).toBe(2);
    expect(response.body.result.warmed).toBe(2);
    
    // Check that Redis setex was called
    expect(redisClient.setex).toHaveBeenCalledTimes(2);
  });
  
  test('should warm different resource types', async () => {
    // Create cache middleware for different resources
    const sentimentCacheMiddleware = createCacheMiddleware(redisClient, {
      ttl: 60,
      prefix: 'sentiment',
      enabled: true,
      warming: true
    });
    
    const conversationCacheMiddleware = createCacheMiddleware(redisClient, {
      ttl: 60,
      prefix: 'conversation',
      enabled: true,
      warming: true
    });
    
    // Create test routes
    app.get('/api/sentiment/:id', sentimentCacheMiddleware, (req, res) => {
      res.json({ id: req.params.id, sentiment: 'positive' });
    });
    
    app.get('/api/conversation/:id', conversationCacheMiddleware, (req, res) => {
      res.json({ id: req.params.id, messages: [] });
    });
    
    // Make multiple requests to different resources
    redisClient.get.mockResolvedValue(null); // Always cache miss for this test
    
    // Sentiment requests
    await request(app)
      .get('/api/sentiment/123')
      .expect(200);
    
    await request(app)
      .get('/api/sentiment/123')
      .expect(200);
    
    await request(app)
      .get('/api/sentiment/123')
      .expect(200);
    
    // Conversation requests
    await request(app)
      .get('/api/conversation/456')
      .expect(200);
    
    await request(app)
      .get('/api/conversation/456')
      .expect(200);
    
    // Trigger cache warming
    const result = await warmer.warmCache();
    
    // Check result
    expect(result.total).toBe(2); // Both resources should be warmed
    expect(result.warmed).toBe(2);
    
    // Check that Redis setex was called with correct prefixes
    const setexCalls = redisClient.setex.mock.calls;
    
    // Find warming calls (after the original requests)
    const warmingCalls = setexCalls.slice(5); // 5 original requests
    
    expect(warmingCalls.length).toBe(2);
    expect(warmingCalls.some(call => call[0].startsWith('sentiment:'))).toBe(true);
    expect(warmingCalls.some(call => call[0].startsWith('conversation:'))).toBe(true);
  });
});
