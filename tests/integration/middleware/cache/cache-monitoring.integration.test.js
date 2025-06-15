/**
 * Cache Monitoring Integration Tests
 * 
 * Tests for the cache monitoring system integrated with middleware
 */

// Import dependencies
const express = require('express');
const request = require('supertest');
const { createCacheMiddleware } = require('@middleware/cache/cache.middleware');
const { initMonitoring, getMetrics } = require('@middleware/cache/cache-monitor');
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

describe('Cache Monitoring Integration', () => {
  let app;
  let redisClient;
  let monitor;
  
  beforeEach(() => {
    // Create Express app
    app = express();
    
    // Get Redis client mock
    redisClient = getRedisClient();
    
    // Initialize monitoring
    monitor = initMonitoring({
      enabled: true,
      sampleRate: 1.0,
      logLevel: 'debug'
    });
    
    // Reset metrics
    monitor.resetMetrics();
    
    // Reset mocks
    jest.clearAllMocks();
  });
  
  test('should record cache hits and misses', async () => {
    // Create cache middleware with monitoring
    const cacheMiddleware = createCacheMiddleware(redisClient, {
      ttl: 60,
      prefix: 'test',
      enabled: true,
      monitoring: true
    });
    
    // Create test route
    app.get('/test', cacheMiddleware, (req, res) => {
      res.json({ message: 'Test response' });
    });
    
    // First request - should be a cache miss
    redisClient.get.mockResolvedValueOnce(null);
    
    await request(app)
      .get('/test')
      .expect(200)
      .expect({ message: 'Test response' });
    
    // Check that Redis get was called
    expect(redisClient.get).toHaveBeenCalled();
    
    // Check that Redis setex was called to store the response
    expect(redisClient.setex).toHaveBeenCalled();
    
    // Second request - should be a cache hit
    redisClient.get.mockResolvedValueOnce(JSON.stringify({
      status: 200,
      body: { message: 'Test response' }
    }));
    
    await request(app)
      .get('/test')
      .expect(200)
      .expect({ message: 'Test response' });
    
    // Get metrics
    const metrics = getMetrics();
    
    // Check metrics
    expect(metrics.resources.test).toBeDefined();
    expect(metrics.resources.test.hits).toBe(1);
    expect(metrics.resources.test.misses).toBe(1);
    expect(metrics.resources.test.hitRate).toBe(0.5);
    
    expect(metrics.overall.hits).toBe(1);
    expect(metrics.overall.misses).toBe(1);
    expect(metrics.overall.hitRate).toBe(0.5);
  });
  
  test('should not record metrics when monitoring is disabled', async () => {
    // Create cache middleware without monitoring
    const cacheMiddleware = createCacheMiddleware(redisClient, {
      ttl: 60,
      prefix: 'test',
      enabled: true,
      monitoring: false
    });
    
    // Create test route
    app.get('/test', cacheMiddleware, (req, res) => {
      res.json({ message: 'Test response' });
    });
    
    // First request - should be a cache miss
    redisClient.get.mockResolvedValueOnce(null);
    
    await request(app)
      .get('/test')
      .expect(200)
      .expect({ message: 'Test response' });
    
    // Second request - should be a cache hit
    redisClient.get.mockResolvedValueOnce(JSON.stringify({
      status: 200,
      body: { message: 'Test response' }
    }));
    
    await request(app)
      .get('/test')
      .expect(200)
      .expect({ message: 'Test response' });
    
    // Get metrics - should be empty
    const metrics = getMetrics();
    
    // Check metrics
    expect(Object.keys(metrics.resources).length).toBe(0);
    expect(metrics.overall.hits).toBe(0);
    expect(metrics.overall.misses).toBe(0);
  });
  
  test('should expose metrics endpoint', async () => {
    // Create Express app with metrics endpoint
    const app = express();
    
    // Create router for metrics endpoint
    const router = express.Router();
    
    // Add metrics endpoint
    router.get('/', (req, res) => {
      res.json({
        success: true,
        metrics: getMetrics()
      });
    });
    
    // Mount router
    app.use('/api/metrics/cache', router);
    
    // Record some hits and misses
    monitor.recordHit('test', 'key1', 10, 100);
    monitor.recordMiss('test', 'key2');
    
    // Request metrics
    const response = await request(app)
      .get('/api/metrics/cache')
      .expect(200);
    
    // Check response
    expect(response.body.success).toBe(true);
    expect(response.body.metrics).toBeDefined();
    expect(response.body.metrics.resources.test).toBeDefined();
    expect(response.body.metrics.resources.test.hits).toBe(1);
    expect(response.body.metrics.resources.test.misses).toBe(1);
    expect(response.body.metrics.resources.test.hitRate).toBe(0.5);
  });
  
  test('should record metrics for different resource types', async () => {
    // Create cache middleware for different resources
    const sentimentCacheMiddleware = createCacheMiddleware(redisClient, {
      ttl: 60,
      prefix: 'sentiment',
      enabled: true,
      monitoring: true
    });
    
    const conversationCacheMiddleware = createCacheMiddleware(redisClient, {
      ttl: 60,
      prefix: 'conversation',
      enabled: true,
      monitoring: true
    });
    
    // Create test routes
    app.get('/api/sentiment', sentimentCacheMiddleware, (req, res) => {
      res.json({ sentiment: 'positive' });
    });
    
    app.get('/api/conversation', conversationCacheMiddleware, (req, res) => {
      res.json({ messages: [] });
    });
    
    // Sentiment request - cache miss
    redisClient.get.mockResolvedValueOnce(null);
    
    await request(app)
      .get('/api/sentiment')
      .expect(200);
    
    // Conversation request - cache miss
    redisClient.get.mockResolvedValueOnce(null);
    
    await request(app)
      .get('/api/conversation')
      .expect(200);
    
    // Sentiment request - cache hit
    redisClient.get.mockResolvedValueOnce(JSON.stringify({
      status: 200,
      body: { sentiment: 'positive' }
    }));
    
    await request(app)
      .get('/api/sentiment')
      .expect(200);
    
    // Get metrics
    const metrics = getMetrics();
    
    // Check metrics
    expect(metrics.resources.sentiment).toBeDefined();
    expect(metrics.resources.sentiment.hits).toBe(1);
    expect(metrics.resources.sentiment.misses).toBe(1);
    
    expect(metrics.resources.conversation).toBeDefined();
    expect(metrics.resources.conversation.hits).toBe(0);
    expect(metrics.resources.conversation.misses).toBe(1);
    
    expect(metrics.overall.hits).toBe(1);
    expect(metrics.overall.misses).toBe(2);
    expect(metrics.overall.hitRate).toBeCloseTo(0.33, 2);
  });
});
