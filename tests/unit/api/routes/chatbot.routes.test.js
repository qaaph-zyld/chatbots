/**
 * Unit tests for chatbot routes
 */

const request = require('supertest');
const express = require('express');

// Mock modules with inline factory functions - BEFORE imports
jest.mock('../../../../src/api/controllers/chatbot.controller', () => ({
  chatbotController: {
    createChatbot: jest.fn(),
    getChatbots: jest.fn(),
    getChatbotById: jest.fn(),
    updateChatbot: jest.fn(),
    deleteChatbot: jest.fn(),
    trainChatbot: jest.fn(),
    testChatbot: jest.fn(),
    processMessage: jest.fn(),
    getConversationHistory: jest.fn()
  }
}));

jest.mock('../../../../src/middleware', () => ({
  authenticate: jest.fn((req, res, next) => next()),
  validateRequest: jest.fn((req, res, next) => next()),
  authorize: jest.fn((req, res, next) => next()),
  checkRole: jest.fn(() => (req, res, next) => next())
}));

// Import after mocking
const chatbotRoutes = require('../../../../src/api/routes/chatbot.routes');
const { chatbotController } = require('../../../../src/api/controllers/chatbot.controller');
const { authenticate, validateRequest, authorize, checkRole } = require('../../../../src/middleware');

describe('Chatbot Routes', () => {
  let app;

  beforeEach(() => {
    // Setup Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/chatbots', chatbotRoutes);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/chatbots', () => {
    it('should create a new chatbot', async () => {
      const mockChatbot = {
        id: 1,
        name: 'Test Bot',
        description: 'Test Description',
        userId: 1
      };

      chatbotController.createChatbot.mockResolvedValue(mockChatbot);

      const response = await request(app)
        .post('/api/chatbots')
        .send({
          name: 'Test Bot',
          description: 'Test Description'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockChatbot);
      expect(chatbotController.createChatbot).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { name: 'Test Bot', description: 'Test Description' }
        }),
        expect.any(Object)
      );
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.status = 400;
      
      chatbotController.createChatbot.mockRejectedValue(validationError);

      const response = await request(app)
        .post('/api/chatbots')
        .send({
          name: '', // Invalid empty name
          description: 'Test Description'
        });

      expect(response.status).toBe(400);
      expect(chatbotController.createChatbot).toHaveBeenCalled();
    });
  });

  describe('GET /api/chatbots', () => {
    it('should retrieve all chatbots', async () => {
      const mockChatbots = [
        { id: 1, name: 'Bot 1', description: 'Description 1' },
        { id: 2, name: 'Bot 2', description: 'Description 2' }
      ];

      chatbotController.getChatbots.mockResolvedValue(mockChatbots);

      const response = await request(app)
        .get('/api/chatbots');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockChatbots);
      expect(chatbotController.getChatbots).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle empty results', async () => {
      chatbotController.getChatbots.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/chatbots');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/chatbots/:id', () => {
    it('should retrieve a specific chatbot', async () => {
      const mockChatbot = {
        id: 1,
        name: 'Test Bot',
        description: 'Test Description'
      };

      chatbotController.getChatbotById.mockResolvedValue(mockChatbot);

      const response = await request(app)
        .get('/api/chatbots/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockChatbot);
      expect(chatbotController.getChatbotById).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' }
        }),
        expect.any(Object)
      );
    });

    it('should handle not found errors', async () => {
      const notFoundError = new Error('Chatbot not found');
      notFoundError.status = 404;
      
      chatbotController.getChatbotById.mockRejectedValue(notFoundError);

      const response = await request(app)
        .get('/api/chatbots/999');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/chatbots/:id', () => {
    it('should update a chatbot', async () => {
      const mockUpdatedChatbot = {
        id: 1,
        name: 'Updated Bot',
        description: 'Updated Description'
      };

      chatbotController.updateChatbot.mockResolvedValue(mockUpdatedChatbot);

      const response = await request(app)
        .put('/api/chatbots/1')
        .send({
          name: 'Updated Bot',
          description: 'Updated Description'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdatedChatbot);
      expect(chatbotController.updateChatbot).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          body: { name: 'Updated Bot', description: 'Updated Description' }
        }),
        expect.any(Object)
      );
    });
  });

  describe('DELETE /api/chatbots/:id', () => {
    it('should delete a chatbot', async () => {
      chatbotController.deleteChatbot.mockResolvedValue({ message: 'Deleted successfully' });

      const response = await request(app)
        .delete('/api/chatbots/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Deleted successfully' });
      expect(chatbotController.deleteChatbot).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' }
        }),
        expect.any(Object)
      );
    });
  });

  describe('POST /api/chatbots/:id/train', () => {
    it('should train a chatbot', async () => {
      const mockTrainingResult = {
        id: 1,
        status: 'training',
        message: 'Training started'
      };

      chatbotController.trainChatbot.mockResolvedValue(mockTrainingResult);

      const response = await request(app)
        .post('/api/chatbots/1/train')
        .send({
          trainingData: 'Sample training data'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTrainingResult);
      expect(chatbotController.trainChatbot).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          body: { trainingData: 'Sample training data' }
        }),
        expect.any(Object)
      );
    });
  });

  describe('POST /api/chatbots/:id/test', () => {
    it('should test a chatbot', async () => {
      const mockTestResult = {
        response: 'Test response from chatbot',
        confidence: 0.95
      };

      chatbotController.testChatbot.mockResolvedValue(mockTestResult);

      const response = await request(app)
        .post('/api/chatbots/1/test')
        .send({
          message: 'Test message'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockTestResult);
      expect(chatbotController.testChatbot).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '1' },
          body: { message: 'Test message' }
        }),
        expect.any(Object)
      );
    });
  });

  describe('Middleware Integration', () => {
    it('should call authentication middleware', async () => {
      chatbotController.getChatbots.mockResolvedValue([]);

      await request(app)
        .get('/api/chatbots');

      expect(authenticate).toHaveBeenCalled();
    });

    it('should call validation middleware for POST requests', async () => {
      chatbotController.createChatbot.mockResolvedValue({});

      await request(app)
        .post('/api/chatbots')
        .send({ name: 'Test', description: 'Test' });

      expect(validateRequest).toHaveBeenCalled();
    });

    it('should call authorization middleware for protected routes', async () => {
      chatbotController.deleteChatbot.mockResolvedValue({});

      await request(app)
        .delete('/api/chatbots/1');

      expect(authorize).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    jest.resetModules();
  });
});
