/**
 * Conversation API Integration Tests
 * 
 * Tests for the conversation history pagination API endpoint
 */

// Register module aliases before any other imports
require('@src/core/module-alias');

// Import test setup utilities
const { connectTestDB, disconnectTestDB, clearDatabase } = require('@tests/unit/setup/mongoose-test-setup');
const request = require('supertest');
const mongoose = require('mongoose');
const { ConversationModel } = require('@domain/conversation.model');
const { UserModel } = require('@domain/user.model');
const { ChatbotModel } = require('@domain/chatbot.model');
const app = require('@core/server').app;

describe('Conversation API', () => {
  let testUser;
  let testChatbot;
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
    
    // Create a test chatbot
    testChatbot = new ChatbotModel({
      name: 'Test Chatbot',
      description: 'A test chatbot',
      owner: testUser._id
    });
    await testChatbot.save();
    
    // Create test conversations
    const conversations = [];
    for (let i = 1; i <= 25; i++) {
      conversations.push({
        userId: testUser._id,
        chatbotId: testChatbot._id,
        messages: [
          { 
            content: `Message ${i}`, 
            sender: i % 2 === 0 ? 'user' : 'bot',
            timestamp: new Date(Date.now() - (i * 60000)) // Staggered timestamps
          }
        ],
        createdAt: new Date(Date.now() - (i * 60000)),
        updatedAt: new Date(Date.now() - (i * 60000))
      });
    }
    
    await ConversationModel.insertMany(conversations);
    
    // Get auth token for the test user
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'hashedpassword123'
      });
    
    authToken = loginResponse.body.token;
  });
  
  describe('GET /api/conversations', () => {
    it('should return paginated conversation history', async () => {
      // Act
      const response = await request(app)
        .get('/api/conversations')
        .query({
          chatbotId: testChatbot._id.toString(),
          page: 1,
          limit: 10
        })
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.conversations).toHaveLength(10);
      expect(response.body.pagination).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        pages: 3
      });
    });
    
    it('should return the second page of conversation history', async () => {
      // Act
      const response = await request(app)
        .get('/api/conversations')
        .query({
          chatbotId: testChatbot._id.toString(),
          page: 2,
          limit: 10
        })
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.conversations).toHaveLength(10);
      expect(response.body.pagination).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        pages: 3
      });
    });
    
    it('should return the last page with fewer items', async () => {
      // Act
      const response = await request(app)
        .get('/api/conversations')
        .query({
          chatbotId: testChatbot._id.toString(),
          page: 3,
          limit: 10
        })
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.conversations).toHaveLength(5);
      expect(response.body.pagination).toEqual({
        total: 25,
        page: 3,
        limit: 10,
        pages: 3
      });
    });
    
    it('should return 401 if not authenticated', async () => {
      // Act
      const response = await request(app)
        .get('/api/conversations')
        .query({
          chatbotId: testChatbot._id.toString(),
          page: 1,
          limit: 10
        });
      
      // Assert
      expect(response.status).toBe(401);
    });
    
    it('should return 400 if chatbotId is missing', async () => {
      // Act
      const response = await request(app)
        .get('/api/conversations')
        .query({
          page: 1,
          limit: 10
        })
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(400);
    });
  });
});
