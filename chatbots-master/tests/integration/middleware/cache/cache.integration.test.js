/**
 * Cache Middleware Integration Tests
 * 
 * Tests for the caching middleware integration with sentiment analysis endpoints
 */

// Register module aliases before any other imports
require('@src/core/module-alias');

// Import dependencies
const request = require('supertest');
const express = require('express');
const { createCacheMiddleware, clearCache } = require('@middleware/cache/cache.middleware');
const { getRedisClient } = require('@core/redis-client');

// Mock Redis client for testing
jest.mock('@core/redis-client', () => {
  const redis = require('redis-mock');
  const client = redis.createClient();
  
  return {
    getRedisClient: jest.fn(() => client)
  };
});

// Mock authentication middleware
jest.mock('@middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: 'test-user-id', isAdmin: req.headers['x-admin'] === 'true' };
    next();
  }
}));

// Mock sentiment controller
const mockSentimentController = {
  analyzeSentiment: (req, res) => {
    // Simulate processing delay
    setTimeout(() => {
      res.json({
        success: true,
        sentiment: {
          text: req.body.text,
          score: Math.random() * 2 - 1, // Random score between -1 and 1
          magnitude: Math.random(),
          classification: Math.random() > 0.5 ? 'positive' : 'negative'
        }
      });
    }, 10);
  },
  
  analyzeBatchSentiment: (req, res) => {
    // Simulate processing delay
    setTimeout(() => {
      const results = req.body.texts.map(text => ({
        text,
        score: Math.random() * 2 - 1,
        magnitude: Math.random(),
        classification: Math.random() > 0.5 ? 'positive' : 'negative'
      }));
      
      res.json({
        success: true,
        results
      });
    }, 20);
  }
};

describe('Cache Middleware Integration Tests', () => {
  let app;
  let redisClient;
  
  beforeAll(() => {
    redisClient = getRedisClient();
  });
  
  beforeEach(() => {
    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    
    // Create sentiment routes with caching middleware
    const router = express.Router();
    const sentimentCache = createCacheMiddleware(redisClient, {
      ttl: 60,
      prefix: 'test-sentiment',
      enabled: true
    });
    
    // Define routes
    router.post('/analyze', sentimentCache, mockSentimentController.analyzeSentiment);
    router.post('/analyze-batch', sentimentCache, mockSentimentController.analyzeBatchSentiment);
    router.delete('/cache', (req, res) => {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized: Admin access required'
        });
      }
      
      clearCache(redisClient, 'test-sentiment:*')
        .then(count => {
          res.json({
            success: true,
            message: `Successfully cleared ${count} cached sentiment results`
          });
        })
        .catch(error => {
          res.status(500).json({
            success: false,
            message: `Error clearing cache: ${error.message}`
          });
        });
    });
    
    // Mount router
    app.use('/api/sentiment', router);
  });
  
  afterEach(async () => {
    // Clear cache after each test
    await clearCache(redisClient, 'test-sentiment:*');
  });
  
  it('should cache sentiment analysis results', async () => {
    // First request should miss cache
    const firstResponse = await request(app)
      .post('/api/sentiment/analyze')
      .send({ text: 'This is a test message' });
    
    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.success).toBe(true);
    
    const firstSentiment = firstResponse.body.sentiment;
    
    // Second request with same data should hit cache
    const secondResponse = await request(app)
      .post('/api/sentiment/analyze')
      .send({ text: 'This is a test message' });
    
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.success).toBe(true);
    
    // Cached response should be identical to first response
    expect(secondResponse.body.sentiment).toEqual(firstSentiment);
  });
  
  it('should cache batch sentiment analysis results', async () => {
    const texts = ['Message one', 'Message two', 'Message three'];
    
    // First request should miss cache
    const firstResponse = await request(app)
      .post('/api/sentiment/analyze-batch')
      .send({ texts });
    
    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.success).toBe(true);
    expect(firstResponse.body.results.length).toBe(3);
    
    const firstResults = firstResponse.body.results;
    
    // Second request with same data should hit cache
    const secondResponse = await request(app)
      .post('/api/sentiment/analyze-batch')
      .send({ texts });
    
    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.success).toBe(true);
    
    // Cached response should be identical to first response
    expect(secondResponse.body.results).toEqual(firstResults);
  });
  
  it('should bypass cache when header is present', async () => {
    // First request
    const firstResponse = await request(app)
      .post('/api/sentiment/analyze')
      .send({ text: 'Cache bypass test' });
    
    expect(firstResponse.status).toBe(200);
    const firstSentiment = firstResponse.body.sentiment;
    
    // Second request with bypass header
    const secondResponse = await request(app)
      .post('/api/sentiment/analyze')
      .set('X-Bypass-Cache', 'true')
      .send({ text: 'Cache bypass test' });
    
    expect(secondResponse.status).toBe(200);
    
    // Response should be different (new random values)
    expect(secondResponse.body.sentiment).not.toEqual(firstSentiment);
  });
  
  it('should bypass cache when query parameter is present', async () => {
    // First request
    const firstResponse = await request(app)
      .post('/api/sentiment/analyze')
      .send({ text: 'Query bypass test' });
    
    expect(firstResponse.status).toBe(200);
    const firstSentiment = firstResponse.body.sentiment;
    
    // Second request with bypass query parameter
    const secondResponse = await request(app)
      .post('/api/sentiment/analyze?_nocache=true')
      .send({ text: 'Query bypass test' });
    
    expect(secondResponse.status).toBe(200);
    
    // Response should be different (new random values)
    expect(secondResponse.body.sentiment).not.toEqual(firstSentiment);
  });
  
  it('should clear cache when admin requests it', async () => {
    // Make a request to cache some data
    await request(app)
      .post('/api/sentiment/analyze')
      .send({ text: 'Cache clearing test' });
    
    // Clear cache as admin
    const clearResponse = await request(app)
      .delete('/api/sentiment/cache')
      .set('X-Admin', 'true');
    
    expect(clearResponse.status).toBe(200);
    expect(clearResponse.body.success).toBe(true);
    expect(clearResponse.body.message).toContain('Successfully cleared');
    
    // Make same request again, should be a cache miss
    const newResponse = await request(app)
      .post('/api/sentiment/analyze')
      .send({ text: 'Cache clearing test' });
    
    // Should get a new response (can't directly test cache miss)
    expect(newResponse.status).toBe(200);
  });
  
  it('should prevent non-admins from clearing cache', async () => {
    // Try to clear cache as non-admin
    const clearResponse = await request(app)
      .delete('/api/sentiment/cache')
      .set('X-Admin', 'false');
    
    expect(clearResponse.status).toBe(403);
    expect(clearResponse.body.success).toBe(false);
    expect(clearResponse.body.message).toContain('Unauthorized');
  });
  
  it('should generate different cache keys for different users', async () => {
    const text = 'User-specific cache test';
    
    // Create a custom app with user-specific middleware
    const userApp = express();
    userApp.use(express.json());
    userApp.use((req, res, next) => {
      req.user = { _id: req.headers['x-user-id'] };
      next();
    });
    
    const router = express.Router();
    const sentimentCache = createCacheMiddleware(redisClient, {
      ttl: 60,
      prefix: 'test-sentiment',
      enabled: true
    });
    
    router.post('/analyze', sentimentCache, mockSentimentController.analyzeSentiment);
    userApp.use('/api/sentiment', router);
    
    // First user request
    const user1Response = await request(userApp)
      .post('/api/sentiment/analyze')
      .set('X-User-ID', 'user1')
      .send({ text });
    
    expect(user1Response.status).toBe(200);
    const user1Sentiment = user1Response.body.sentiment;
    
    // Second user request with same text
    const user2Response = await request(userApp)
      .post('/api/sentiment/analyze')
      .set('X-User-ID', 'user2')
      .send({ text });
    
    expect(user2Response.status).toBe(200);
    const user2Sentiment = user2Response.body.sentiment;
    
    // Should get different responses for different users
    expect(user2Sentiment).not.toEqual(user1Sentiment);
    
    // Same user should get cached response
    const user1RepeatResponse = await request(userApp)
      .post('/api/sentiment/analyze')
      .set('X-User-ID', 'user1')
      .send({ text });
    
    expect(user1RepeatResponse.body.sentiment).toEqual(user1Sentiment);
  });
});
