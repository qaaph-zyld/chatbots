/**
 * Sentiment Analysis API Integration Tests
 * 
 * Tests for the sentiment analysis API endpoints
 */

// Register module aliases before any other imports
require('@src/core/module-alias');

// Import test setup utilities
const { connectTestDB, disconnectTestDB, clearDatabase } = require('@tests/unit/setup/mongoose-test-setup');
const request = require('supertest');
const mongoose = require('mongoose');
const { UserModel } = require('@domain/user.model');
const app = require('@core/server').app;

describe('Sentiment Analysis API', () => {
  let testUser;
  let authToken;
  
  // Connect to the test database before all tests
  beforeAll(async () => {
    await connectTestDB();
  });
  
  // Disconnect from the test database after all tests
  afterAll(async () => {
    await disconnectTestDB();
  });
  
  // Clear the database before each test
  beforeEach(async () => {
    await clearDatabase();
    
    // Create a test user
    testUser = new UserModel({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123'
    });
    await testUser.save();
    
    // Get auth token for the test user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'hashedpassword123'
      });
    
    authToken = loginResponse.body.token;
  });
  
  describe('POST /api/sentiment/analyze', () => {
    it('should analyze sentiment of a message', async () => {
      // Arrange
      const payload = {
        text: 'I am very happy with the service'
      };
      
      // Act
      const response = await request(app)
        .post('/api/sentiment/analyze')
        .send(payload)
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('sentiment');
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('language');
      expect(response.body.text).toBe(payload.text);
    });
    
    it('should return 400 if text is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/sentiment/analyze')
        .send({})
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('text is required');
    });
    
    it('should return 401 if not authenticated', async () => {
      // Arrange
      const payload = {
        text: 'I am very happy with the service'
      };
      
      // Act
      const response = await request(app)
        .post('/api/sentiment/analyze')
        .send(payload);
      
      // Assert
      expect(response.status).toBe(401);
    });
  });
  
  describe('POST /api/sentiment/analyze-batch', () => {
    it('should analyze sentiment of multiple messages', async () => {
      // Arrange
      const payload = {
        texts: [
          'I am very happy with the service',
          'This is a regular message',
          'I am very disappointed with the service'
        ]
      };
      
      // Act
      const response = await request(app)
        .post('/api/sentiment/analyze-batch')
        .send(payload)
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      
      response.body.forEach((result, index) => {
        expect(result).toHaveProperty('sentiment');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('language');
        expect(result.text).toBe(payload.texts[index]);
      });
    });
    
    it('should return 400 if texts array is missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/sentiment/analyze-batch')
        .send({})
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('texts array is required');
    });
    
    it('should return 400 if texts is not an array', async () => {
      // Act
      const response = await request(app)
        .post('/api/sentiment/analyze-batch')
        .send({ texts: 'not an array' })
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('texts must be an array');
    });
    
    it('should return 401 if not authenticated', async () => {
      // Arrange
      const payload = {
        texts: ['I am very happy with the service']
      };
      
      // Act
      const response = await request(app)
        .post('/api/sentiment/analyze-batch')
        .send(payload);
      
      // Assert
      expect(response.status).toBe(401);
    });
  });
});
