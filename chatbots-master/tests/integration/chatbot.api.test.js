/**
 * Chatbot API Integration Tests
 * 
 * Tests for the chatbot API endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index');
const chatbotService = require('../../services/chatbot.service');
const conversationService = require('../../services/conversation.service');

// Mock the chatbot service to avoid external dependencies
jest.mock('../../services/chatbot.service', () => ({
  initialize: jest.fn().mockResolvedValue(true),
  createChatbot: jest.fn(),
  getAllChatbots: jest.fn(),
  getChatbot: jest.fn(),
  processMessage: jest.fn(),
  deleteChatbot: jest.fn(),
  getAvailableEngines: jest.fn().mockReturnValue(['botpress', 'huggingface'])
}));

// Mock logger to prevent console output during tests
jest.mock('../../utils', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('Chatbot API', () => {
  let mongoServer;
  let testChatbotId;
  let testConversationId;
  let testSessionId;
  
  // Set up in-memory MongoDB server before tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Create a test chatbot ID
    testChatbotId = new mongoose.Types.ObjectId().toString();
    
    // Mock chatbot service methods
    chatbotService.getChatbot.mockImplementation((id) => {
      if (id === testChatbotId) {
        return {
          id: testChatbotId,
          name: 'Test Chatbot',
          description: 'A test chatbot',
          engine: 'botpress',
          status: 'active',
          createdAt: new Date().toISOString()
        };
      }
      throw new Error(`Chatbot with ID ${id} not found`);
    });
    
    chatbotService.processMessage.mockImplementation((chatbotId, message, options) => {
      return Promise.resolve({
        chatbotId,
        conversationId: options.conversationId || new mongoose.Types.ObjectId().toString(),
        sessionId: options.sessionId || 'test-session-id',
        message,
        response: `Response to: ${message}`,
        timestamp: new Date().toISOString(),
        metadata: { source: 'test' }
      });
    });
  });
  
  // Clean up after tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  describe('POST /api/chatbots/:id/conversation', () => {
    it('should process a message and return a response', async () => {
      const response = await request(app)
        .post(`/api/chatbots/${testChatbotId}/conversation`)
        .send({
          message: 'Hello, chatbot!',
          userId: 'test-user'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Hello, chatbot!');
      expect(response.body.response).toBeDefined();
      expect(response.body.conversationId).toBeDefined();
      expect(response.body.sessionId).toBeDefined();
      
      // Save for later tests
      testConversationId = response.body.conversationId;
      testSessionId = response.body.sessionId;
    });
    
    it('should continue an existing conversation', async () => {
      const response = await request(app)
        .post(`/api/chatbots/${testChatbotId}/conversation`)
        .send({
          message: 'How are you?',
          conversationId: testConversationId
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.conversationId).toBe(testConversationId);
    });
    
    it('should require a message', async () => {
      const response = await request(app)
        .post(`/api/chatbots/${testChatbotId}/conversation`)
        .send({
          userId: 'test-user'
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });
  
  describe('GET /api/chatbots/:id/conversation/history', () => {
    it('should retrieve conversation history by conversation ID', async () => {
      // Mock the conversation service for this test
      jest.spyOn(conversationService, 'getConversationById').mockImplementation((id) => {
        if (id === testConversationId) {
          return Promise.resolve({
            _id: testConversationId,
            chatbotId: testChatbotId,
            sessionId: testSessionId,
            messages: [
              { text: 'Hello, chatbot!', sender: 'user', timestamp: new Date() },
              { text: 'Response to: Hello, chatbot!', sender: 'bot', timestamp: new Date() },
              { text: 'How are you?', sender: 'user', timestamp: new Date() },
              { text: 'Response to: How are you?', sender: 'bot', timestamp: new Date() }
            ],
            context: { topic: 'greeting' },
            startedAt: new Date(),
            lastMessageAt: new Date()
          });
        }
        return Promise.resolve(null);
      });
      
      const response = await request(app)
        .get(`/api/chatbots/${testChatbotId}/conversation/history`)
        .query({ conversationId: testConversationId })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testConversationId);
      expect(response.body.data.messages).toHaveLength(4);
      
      // Clean up mock
      conversationService.getConversationById.mockRestore();
    });
    
    it('should retrieve conversation history by session ID', async () => {
      // Mock the conversation service for this test
      jest.spyOn(conversationService, 'getConversationBySessionId').mockImplementation((sessionId) => {
        if (sessionId === testSessionId) {
          return Promise.resolve({
            _id: testConversationId,
            chatbotId: testChatbotId,
            sessionId: testSessionId,
            messages: [
              { text: 'Hello, chatbot!', sender: 'user', timestamp: new Date() },
              { text: 'Response to: Hello, chatbot!', sender: 'bot', timestamp: new Date() }
            ],
            context: { topic: 'greeting' },
            startedAt: new Date(),
            lastMessageAt: new Date()
          });
        }
        return Promise.resolve(null);
      });
      
      const response = await request(app)
        .get(`/api/chatbots/${testChatbotId}/conversation/history`)
        .query({ sessionId: testSessionId })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe(testSessionId);
      
      // Clean up mock
      conversationService.getConversationBySessionId.mockRestore();
    });
    
    it('should require either conversationId or sessionId', async () => {
      const response = await request(app)
        .get(`/api/chatbots/${testChatbotId}/conversation/history`)
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });
  });
});
