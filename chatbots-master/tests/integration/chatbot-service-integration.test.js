/**
 * Chatbot Service Integration Tests
 * 
 * Tests the interaction between chatbot controller and service
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../../app');
const Chatbot = require('../../models/chatbot.model');
const Conversation = require('../../models/conversation.model');
const { storageService } = require('../../storage/storage.service');

// Mock storage service
jest.mock('../../storage/storage.service', () => ({
  storageService: {
    initialize: jest.fn().mockResolvedValue(true),
    storeFile: jest.fn().mockResolvedValue({
      id: 'test-file-id',
      path: '/test/path/file.json'
    }),
    retrieveFile: jest.fn().mockResolvedValue({
      data: Buffer.from('test file content'),
      info: { id: 'test-file-id' }
    })
  }
}));

describe('Chatbot Service Integration', () => {
  let mongoServer;
  let testUser;
  let testChatbot;
  let authToken;
  
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
    testUser = await mongoose.model('User').create({
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
    
    // Create test chatbot
    testChatbot = await Chatbot.create({
      name: 'Test Chatbot',
      description: 'A chatbot for integration testing',
      ownerId: testUser._id,
      type: 'customer-support',
      engine: 'botpress',
      engineConfig: {
        apiKey: 'test-key',
        model: 'test-model'
      },
      personality: {
        tone: 'friendly',
        style: 'conversational'
      },
      isActive: true
    });
  });
  
  describe('Chatbot CRUD Operations', () => {
    it('should create a new chatbot', async () => {
      // Arrange
      const newChatbotData = {
        name: 'New Test Chatbot',
        description: 'Another chatbot for testing',
        type: 'sales',
        engine: 'huggingface',
        engineConfig: {
          model: 'gpt2'
        }
      };
      
      // Act
      const response = await request(app)
        .post('/api/chatbots')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newChatbotData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', newChatbotData.name);
      expect(response.body.data).toHaveProperty('ownerId', testUser._id.toString());
      
      // Verify chatbot was created in database
      const chatbotInDb = await Chatbot.findById(response.body.data.id);
      expect(chatbotInDb).toBeTruthy();
      expect(chatbotInDb.name).toBe(newChatbotData.name);
    });
    
    it('should get a chatbot by ID', async () => {
      // Act
      const response = await request(app)
        .get(`/api/chatbots/${testChatbot._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', testChatbot.name);
      expect(response.body.data).toHaveProperty('description', testChatbot.description);
    });
    
    it('should update a chatbot', async () => {
      // Arrange
      const updateData = {
        name: 'Updated Chatbot Name',
        description: 'Updated description'
      };
      
      // Act
      const response = await request(app)
        .put(`/api/chatbots/${testChatbot._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name', updateData.name);
      expect(response.body.data).toHaveProperty('description', updateData.description);
      
      // Verify chatbot was updated in database
      const chatbotInDb = await Chatbot.findById(testChatbot._id);
      expect(chatbotInDb.name).toBe(updateData.name);
      expect(chatbotInDb.description).toBe(updateData.description);
    });
    
    it('should delete a chatbot', async () => {
      // Act
      const response = await request(app)
        .delete(`/api/chatbots/${testChatbot._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify chatbot was deleted from database
      const chatbotInDb = await Chatbot.findById(testChatbot._id);
      expect(chatbotInDb).toBeNull();
    });
  });
  
  describe('Conversation Management', () => {
    it('should send a message to chatbot and get a response', async () => {
      // Arrange
      const message = {
        message: 'Hello, chatbot!',
        conversationId: null // New conversation
      };
      
      // Mock the chatbot service response
      jest.spyOn(require('../../services/chatbot.service'), 'sendMessage')
        .mockResolvedValueOnce({
          text: 'Hello! How can I help you today?',
          conversationId: new mongoose.Types.ObjectId().toString(),
          timestamp: new Date()
        });
      
      // Act
      const response = await request(app)
        .post(`/api/chatbots/${testChatbot._id}/message`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(message);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('text');
      expect(response.body.data).toHaveProperty('conversationId');
      expect(response.body.data.text).toBe('Hello! How can I help you today?');
      
      // Restore original implementation
      jest.restoreAllMocks();
    });
    
    it('should retrieve conversation history', async () => {
      // Arrange
      // Create a test conversation
      const conversation = await Conversation.create({
        chatbotId: testChatbot._id,
        userId: testUser._id,
        sessionId: 'test-session',
        messages: [
          {
            sender: 'user',
            content: 'Hello',
            contentType: 'text',
            timestamp: new Date('2025-01-01T10:00:00Z')
          },
          {
            sender: 'bot',
            content: 'Hi there!',
            contentType: 'text',
            timestamp: new Date('2025-01-01T10:00:05Z')
          }
        ]
      });
      
      // Act
      const response = await request(app)
        .get(`/api/chatbots/${testChatbot._id}/conversations/${conversation._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('messages');
      expect(response.body.data.messages).toHaveLength(2);
      expect(response.body.data.messages[0].content).toBe('Hello');
      expect(response.body.data.messages[1].content).toBe('Hi there!');
    });
  });
  
  describe('Chatbot Configuration', () => {
    it('should update chatbot personality settings', async () => {
      // Arrange
      const personalitySettings = {
        tone: 'professional',
        style: 'formal',
        knowledge: 'technical'
      };
      
      // Act
      const response = await request(app)
        .put(`/api/chatbots/${testChatbot._id}/personality`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(personalitySettings);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('personality');
      expect(response.body.data.personality).toMatchObject(personalitySettings);
      
      // Verify chatbot was updated in database
      const chatbotInDb = await Chatbot.findById(testChatbot._id);
      expect(chatbotInDb.personality).toMatchObject(personalitySettings);
    });
    
    it('should update chatbot engine configuration', async () => {
      // Arrange
      const engineConfig = {
        apiKey: 'new-test-key',
        model: 'new-test-model',
        temperature: 0.7
      };
      
      // Act
      const response = await request(app)
        .put(`/api/chatbots/${testChatbot._id}/engine-config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(engineConfig);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('engineConfig');
      expect(response.body.data.engineConfig).toMatchObject(engineConfig);
      
      // Verify chatbot was updated in database
      const chatbotInDb = await Chatbot.findById(testChatbot._id);
      expect(chatbotInDb.engineConfig).toMatchObject(engineConfig);
    });
  });
});
