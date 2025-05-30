/**
 * Chatbot Conversation Flow Integration Test
 * 
 * Tests the complete flow of a user interacting with a chatbot,
 * from creation to conversation to analytics
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../../app');
const User = require('../../models/user.model');
const Chatbot = require('../../models/chatbot.model');
const Conversation = require('../../models/conversation.model');
const Analytics = require('../../models/analytics.model');

describe('Chatbot Conversation Flow', () => {
  let mongoServer;
  let testUser;
  let authToken;
  let testChatbot;
  let conversationId;
  
  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to in-memory database
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Create test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz12345678901234567890', // Hashed 'password123'
      role: 'user'
    });
    
    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.token;
  });
  
  afterAll(async () => {
    // Disconnect and stop MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  beforeEach(async () => {
    // Clear collections before each test
    await Chatbot.deleteMany({});
    await Conversation.deleteMany({});
    await Analytics.deleteMany({});
  });
  
  it('should complete a full chatbot conversation flow', async () => {
    // Step 1: Create a new chatbot
    const chatbotData = {
      name: 'Customer Support Bot',
      description: 'A bot for customer support',
      type: 'customer-support',
      engine: 'botpress',
      engineConfig: {
        apiKey: 'test-key',
        model: 'test-model'
      },
      personality: {
        tone: 'friendly',
        style: 'conversational'
      }
    };
    
    const createResponse = await request(app)
      .post('/api/chatbots')
      .set('Authorization', `Bearer ${authToken}`)
      .send(chatbotData);
    
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.success).toBe(true);
    expect(createResponse.body.data).toHaveProperty('id');
    
    testChatbot = createResponse.body.data;
    
    // Step 2: Configure the chatbot with custom settings
    const personalitySettings = {
      tone: 'professional',
      style: 'helpful',
      knowledge: 'technical'
    };
    
    const configResponse = await request(app)
      .put(`/api/chatbots/${testChatbot.id}/personality`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(personalitySettings);
    
    expect(configResponse.status).toBe(200);
    expect(configResponse.body.data.personality).toMatchObject(personalitySettings);
    
    // Step 3: Start a conversation with the chatbot
    const initialMessage = {
      message: 'Hello, I need help with my order',
      conversationId: null // New conversation
    };
    
    // Mock the chatbot service response
    jest.spyOn(require('../../services/chatbot.service'), 'sendMessage')
      .mockImplementation((chatbotId, message, options) => {
        return Promise.resolve({
          text: 'Hello! I\'d be happy to help with your order. Could you provide your order number?',
          conversationId: options.conversationId || new mongoose.Types.ObjectId().toString(),
          timestamp: new Date()
        });
      });
    
    const messageResponse = await request(app)
      .post(`/api/chatbots/${testChatbot.id}/message`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(initialMessage);
    
    expect(messageResponse.status).toBe(200);
    expect(messageResponse.body.success).toBe(true);
    expect(messageResponse.body.data).toHaveProperty('text');
    expect(messageResponse.body.data).toHaveProperty('conversationId');
    
    conversationId = messageResponse.body.data.conversationId;
    
    // Step 4: Continue the conversation
    const followupMessage = {
      message: 'My order number is ORD-12345',
      conversationId: conversationId
    };
    
    const followupResponse = await request(app)
      .post(`/api/chatbots/${testChatbot.id}/message`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(followupMessage);
    
    expect(followupResponse.status).toBe(200);
    expect(followupResponse.body.success).toBe(true);
    
    // Step 5: Retrieve conversation history
    const historyResponse = await request(app)
      .get(`/api/chatbots/${testChatbot.id}/conversations/${conversationId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body.success).toBe(true);
    expect(historyResponse.body.data).toHaveProperty('messages');
    expect(historyResponse.body.data.messages.length).toBeGreaterThanOrEqual(2);
    
    // Step 6: End the conversation
    const endMessage = {
      message: 'Thank you for your help!',
      conversationId: conversationId
    };
    
    const endResponse = await request(app)
      .post(`/api/chatbots/${testChatbot.id}/message`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(endMessage);
    
    expect(endResponse.status).toBe(200);
    
    // Step 7: Mark conversation as completed
    const completeResponse = await request(app)
      .put(`/api/chatbots/${testChatbot.id}/conversations/${conversationId}/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'completed' });
    
    expect(completeResponse.status).toBe(200);
    expect(completeResponse.body.data.status).toBe('completed');
    
    // Step 8: Add feedback to the conversation
    const feedbackData = {
      rating: 5,
      comment: 'Very helpful chatbot!'
    };
    
    const feedbackResponse = await request(app)
      .post(`/api/chatbots/${testChatbot.id}/conversations/${conversationId}/feedback`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(feedbackData);
    
    expect(feedbackResponse.status).toBe(200);
    expect(feedbackResponse.body.data.feedback).toHaveProperty('rating', 5);
    expect(feedbackResponse.body.data.feedback).toHaveProperty('comment', 'Very helpful chatbot!');
    
    // Step 9: Generate analytics report
    // Mock the analytics service
    jest.spyOn(require('../../services/analytics.service'), 'generateReport')
      .mockImplementation((chatbotId, period, startDate, endDate) => {
        return Promise.resolve({
          chatbotId,
          period,
          startDate,
          endDate,
          summary: {
            conversations: { total: 1, completed: 1 },
            messages: { total: 3, user: 2, bot: 1 },
            users: { total: 1, new: 1, returning: 0 },
            feedback: { averageRating: 5.0, totalRatings: 1 }
          },
          trends: {
            conversations: [{ date: new Date(), count: 1 }],
            messages: [{ date: new Date(), count: 3 }],
            users: [{ date: new Date(), count: 1 }]
          }
        });
      });
    
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const analyticsResponse = await request(app)
      .get(`/api/analytics/chatbots/${testChatbot.id}/report`)
      .query({
        period: 'daily',
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      })
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.body.success).toBe(true);
    expect(analyticsResponse.body.data).toHaveProperty('summary');
    expect(analyticsResponse.body.data.summary).toHaveProperty('conversations');
    expect(analyticsResponse.body.data.summary).toHaveProperty('messages');
    expect(analyticsResponse.body.data.summary).toHaveProperty('feedback');
    
    // Restore original implementations
    jest.restoreAllMocks();
  });
  
  it('should handle error scenarios gracefully', async () => {
    // Create a test chatbot first
    const chatbot = await Chatbot.create({
      name: 'Error Test Bot',
      description: 'A bot for testing error handling',
      ownerId: testUser._id,
      type: 'customer-support',
      engine: 'botpress',
      isActive: true
    });
    
    // Test scenario: Sending message to inactive chatbot
    await Chatbot.findByIdAndUpdate(chatbot._id, { isActive: false });
    
    const messageResponse = await request(app)
      .post(`/api/chatbots/${chatbot._id}/message`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ message: 'Hello' });
    
    expect(messageResponse.status).toBe(400);
    expect(messageResponse.body.success).toBe(false);
    expect(messageResponse.body).toHaveProperty('error');
    expect(messageResponse.body.error).toContain('inactive');
    
    // Test scenario: Accessing non-existent conversation
    const nonExistentId = new mongoose.Types.ObjectId();
    
    const historyResponse = await request(app)
      .get(`/api/chatbots/${chatbot._id}/conversations/${nonExistentId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(historyResponse.status).toBe(404);
    expect(historyResponse.body.success).toBe(false);
    expect(historyResponse.body).toHaveProperty('error');
    expect(historyResponse.body.error).toContain('not found');
    
    // Test scenario: Unauthorized access to another user's chatbot
    const anotherUser = await User.create({
      username: 'anotheruser',
      email: 'another@example.com',
      password: '$2b$10$abcdefghijklmnopqrstuvwxyz12345678901234567890',
      role: 'user'
    });
    
    const anotherChatbot = await Chatbot.create({
      name: 'Another User Bot',
      description: 'A bot owned by another user',
      ownerId: anotherUser._id,
      type: 'customer-support',
      engine: 'botpress',
      isActive: true
    });
    
    const unauthorizedResponse = await request(app)
      .put(`/api/chatbots/${anotherChatbot._id}/personality`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ tone: 'friendly' });
    
    expect(unauthorizedResponse.status).toBe(403);
    expect(unauthorizedResponse.body.success).toBe(false);
    expect(unauthorizedResponse.body).toHaveProperty('error');
    expect(unauthorizedResponse.body.error).toContain('permission');
  });
});
