/**
 * Unit tests for chatbot controller
 */

const httpMocks = require('node-mocks-http');

// Mock dependencies before variable definitions
jest.mock('../../../../src/services/chatbot.service', () => ({
  getAllChatbots: jest.fn().mockReturnValue([
    { id: '1', name: 'Test Bot 1' },
    { id: '2', name: 'Test Bot 2' }
  ]),
  getChatbotById: jest.fn(),
  createChatbot: jest.fn(),
  updateChatbot: jest.fn(),
  deleteChatbot: jest.fn(),
  processMessage: jest.fn(),
  getConversationHistory: jest.fn(),
  getAvailableEngineTypes: jest.fn().mockReturnValue(['gpt-3.5', 'gpt-4', 'custom'])
}));

jest.mock('../../../../src/utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Chatbot Controller', () => {
  let chatbotController;
  let chatbotServiceMock;
  let loggerMock;
  let ValidationError;
  
  beforeEach(() => {
    // Get the mocked services
    chatbotServiceMock = require('../../../../src/services/chatbot.service');
    const utilsModule = require('../../../../src/utils');
    
    loggerMock = utilsModule.logger;
    
    ValidationError = class ValidationError extends Error {
      constructor(message) {
        super(message);
        this.name = 'ValidationError';
      }
    };
    
    jest.mock('../../../../src/utils/errors', () => ({
      ValidationError: class ValidationError extends Error {
        constructor(message) {
          super(message);
          this.name = 'ValidationError';
        }
      }
    }));
    
    // Load the controller module
    chatbotController = require('../../../../src/api/controllers/chatbot.controller');
  });
  
  describe('getAllChatbots', () => {
    it('should return all chatbots with 200 status code', async () => {
      // Arrange
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      // Act
      await chatbotController.getAllChatbots(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.count).toBe(2);
      expect(responseData.data).toHaveLength(2);
      expect(responseData.data[0].id).toBe('1');
      expect(responseData.data[1].id).toBe('2');
      expect(chatbotServiceMock.getAllChatbots).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      const next = jest.fn();
      const error = new Error('Test error');
      
      chatbotServiceMock.getAllChatbots.mockImplementation(() => {
        throw error;
      });
      
      // Act
      await chatbotController.getAllChatbots(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('createChatbot', () => {
    it('should create a chatbot and return 201 status code', async () => {
      // Arrange
      const newChatbot = {
        id: '3',
        name: 'New Bot',
        description: 'A new test bot',
        engine: 'gpt-3.5',
        engineConfig: { temperature: 0.7 }
      };
      
      const req = httpMocks.createRequest({
        body: {
          name: 'New Bot',
          description: 'A new test bot',
          engine: 'gpt-3.5',
          engineConfig: { temperature: 0.7 }
        },
        user: { id: 'user123' }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      chatbotServiceMock.createChatbot.mockResolvedValue(newChatbot);
      
      // Act
      await chatbotController.createChatbot(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(newChatbot);
      expect(chatbotServiceMock.createChatbot).toHaveBeenCalledTimes(1);
      expect(chatbotServiceMock.createChatbot).toHaveBeenCalledWith({
        name: 'New Bot',
        description: 'A new test bot',
        engine: 'gpt-3.5',
        engineConfig: { temperature: 0.7 },
        owner: 'user123'
      });
    });
    
    it('should return 400 status code when name is missing', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        body: {
          description: 'A new test bot',
          engine: 'gpt-3.5'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      // Act
      await chatbotController.createChatbot(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Validation Error');
      expect(responseData.message).toBe('Name is required');
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should return 400 status code when engine is invalid', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        body: {
          name: 'New Bot',
          description: 'A new test bot',
          engine: 'invalid-engine'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      // Act
      await chatbotController.createChatbot(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Validation Error');
      expect(responseData.message).toContain('Invalid engine type');
      expect(next).not.toHaveBeenCalled();
    });
    
    it('should handle unexpected errors and pass to next middleware', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        body: {
          name: 'New Bot',
          description: 'A new test bot',
          engine: 'gpt-3.5'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      const error = new Error('Database error');
      
      chatbotServiceMock.createChatbot.mockRejectedValue(error);
      
      // Act
      await chatbotController.createChatbot(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getChatbotById', () => {
    it('should return a chatbot by ID with 200 status code', async () => {
      // Arrange
      const chatbot = { id: '1', name: 'Test Bot 1' };
      const req = httpMocks.createRequest({
        params: { id: '1' }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      chatbotServiceMock.getChatbotById.mockResolvedValue(chatbot);
      
      // Act
      await chatbotController.getChatbotById(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(chatbot);
      expect(chatbotServiceMock.getChatbotById).toHaveBeenCalledTimes(1);
      expect(chatbotServiceMock.getChatbotById).toHaveBeenCalledWith('1');
    });
    
    it('should return 404 status code when chatbot is not found', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        params: { id: 'nonexistent' }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      chatbotServiceMock.getChatbotById.mockResolvedValue(null);
      
      // Act
      await chatbotController.getChatbotById(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Not Found');
      expect(responseData.message).toContain('Chatbot with ID nonexistent not found');
    });
    
    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        params: { id: '1' }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      const error = new Error('Database error');
      
      chatbotServiceMock.getChatbotById.mockRejectedValue(error);
      
      // Act
      await chatbotController.getChatbotById(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
    });
    
    afterEach(() => {
      jest.resetModules();
      jest.clearAllMocks();
    });
  });
});
