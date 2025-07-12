/**
 * Rate Limiting Middleware Integration Tests
 * 
 * Tests for the rate limiting middleware in an Express application
 */

// Register module aliases before any other imports
require('@src/core/module-alias');

// Import dependencies
const express = require('express');
const request = require('supertest');
const { createRateLimiter } = require('@middleware/rate-limit/rate-limit.middleware');

describe('Rate Limiting Middleware Integration', () => {
  let app;
  
  beforeEach(() => {
    // Create a new Express app for each test
    app = express();
    
    // Add JSON parsing middleware
    app.use(express.json());
  });
  
  it('should allow requests within the rate limit', async () => {
    // Arrange
    const rateLimiter = createRateLimiter({
      windowMs: 1000, // 1 second
      max: 5 // 5 requests per second
    });
    
    // Apply rate limiter to a test endpoint
    app.get('/test', rateLimiter, (req, res) => {
      res.status(200).json({ success: true });
    });
    
    // Act & Assert
    // Send 5 requests (within the limit)
    for (let i = 0; i < 5; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    }
  });
  
  it('should block requests that exceed the rate limit', async () => {
    // Arrange
    const rateLimiter = createRateLimiter({
      windowMs: 1000, // 1 second
      max: 3 // 3 requests per second
    });
    
    // Apply rate limiter to a test endpoint
    app.get('/test', rateLimiter, (req, res) => {
      res.status(200).json({ success: true });
    });
    
    // Act & Assert
    // Send 3 requests (within the limit)
    for (let i = 0; i < 3; i++) {
      const response = await request(app).get('/test');
      expect(response.status).toBe(200);
    }
    
    // Send 1 more request (exceeding the limit)
    const response = await request(app).get('/test');
    expect(response.status).toBe(429); // Too Many Requests
    expect(response.body).toHaveProperty('message');
  });
  
  it('should apply different rate limits to different endpoints', async () => {
    // Arrange
    const apiLimiter = createRateLimiter({
      windowMs: 1000, // 1 second
      max: 5 // 5 requests per second
    });
    
    const authLimiter = createRateLimiter({
      windowMs: 1000, // 1 second
      max: 2 // 2 requests per second
    });
    
    // Apply rate limiters to different endpoints
    app.get('/api', apiLimiter, (req, res) => {
      res.status(200).json({ success: true });
    });
    
    app.get('/auth', authLimiter, (req, res) => {
      res.status(200).json({ success: true });
    });
    
    // Act & Assert
    // Send 5 requests to /api (within the limit)
    for (let i = 0; i < 5; i++) {
      const response = await request(app).get('/api');
      expect(response.status).toBe(200);
    }
    
    // Send 1 more request to /api (exceeding the limit)
    const apiResponse = await request(app).get('/api');
    expect(apiResponse.status).toBe(429);
    
    // Send 2 requests to /auth (within the limit)
    for (let i = 0; i < 2; i++) {
      const response = await request(app).get('/auth');
      expect(response.status).toBe(200);
    }
    
    // Send 1 more request to /auth (exceeding the limit)
    const authResponse = await request(app).get('/auth');
    expect(authResponse.status).toBe(429);
  });
  
  it('should include rate limit headers in the response', async () => {
    // Arrange
    const rateLimiter = createRateLimiter({
      windowMs: 1000, // 1 second
      max: 5, // 5 requests per second
      standardHeaders: true // Return rate limit info in the `RateLimit-*` headers
    });
    
    // Apply rate limiter to a test endpoint
    app.get('/test', rateLimiter, (req, res) => {
      res.status(200).json({ success: true });
    });
    
    // Act
    const response = await request(app).get('/test');
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.headers).toHaveProperty('ratelimit-limit');
    expect(response.headers).toHaveProperty('ratelimit-remaining');
    expect(response.headers).toHaveProperty('ratelimit-reset');
    
    // Check header values
    expect(parseInt(response.headers['ratelimit-limit'])).toBe(5);
    expect(parseInt(response.headers['ratelimit-remaining'])).toBe(4);
  });
});
