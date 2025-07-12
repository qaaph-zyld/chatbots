/**
 * Chatbot Controller Tests
 */

const chatbotController = require('../../../api/controllers/chatbot.controller');
const chatbotService = require('../../../services/chatbot.service');
const { ValidationError } = require('../../../utils/errors');
const { logger } = require('../../../utils');

// Mock dependencies
jest.mock('../../../services/chatbot.service');
jest.mock('../../../utils', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('Chatbot Controller', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock request, response, and next function
    req = {
      params: {},
      query: {},
      body: {},
      user: { _id: 'user123', role: 'user' }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });

  describe('getAllChatbots', () => {
    it('should return all chatbots', async () => {
      // Arrange
      const mockChatbots = [
        { id: 'bot1', name: 'Bot 1', description: 'Test bot 1' },
        { id: 'bot2', name: 'Bot 2', description: 'Test bot 2' }
      ];
      
      chatbotService.getAllChatbots = jest.fn().mockReturnValue(mockChatbots);
      
      // Act
      await chatbotController.getAllChatbots(req, res, next);
      
      // Assert
      expect(chatbotService.getAllChatbots).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockChatbots
      });
      expect(logger.info).toHaveBeenCalledWith('Retrieved 2 chatbots');
    });

    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      const error = new Error('Test error');
      chatbotService.getAllChatbots = jest.fn().mockImplementation(() => {
        throw error;
      });
      
      // Act
      await chatbotController.getAllChatbots(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
      expect(logger.error).toHaveBeenCalledWith('Error fetching chatbots:', 'Test error');
    });
  });

  describe('createChatbot', () => {
    it('should create a new chatbot and return success response', async () => {
      // Arrange
      const chatbotData = {
        name: 'New Bot',
        description: 'A new test bot',
        engine: 'botpress',
        engineConfig: { apiKey: 'test-key' }
      };
      
      req.body = chatbotData;
      
      const createdChatbot = {
        id: 'new-bot-id',
        ...chatbotData,
        createdAt: new Date().toISOString()
      };
      
      chatbotService.createChatbot = jest.fn().mockResolvedValue(createdChatbot);
      
      // Act
      await chatbotController.createChatbot(req, res, next);
      
      // Assert
      expect(chatbotService.createChatbot).toHaveBeenCalledWith(chatbotData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: createdChatbot
      });
    });

    it('should validate required fields', async () => {
      // Arrange
      req.body = {
        description: 'Missing name field'
      };
      
      // Act
      await chatbotController.createChatbot(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Validation error'),
        expect.any(String)
      );
    });
  });

  describe('getChatbotById', () => {
    it('should return chatbot by ID', async () => {
      // Arrange
      const chatbotId = 'bot123';
      req.params.id = chatbotId;
      
      const mockChatbot = {
        id: chatbotId,
        name: 'Test Bot',
        description: 'A test bot'
      };
      
      chatbotService.getChatbotById = jest.fn().mockResolvedValue(mockChatbot);
      
      // Act
      await chatbotController.getChatbotById(req, res, next);
      
      // Assert
      expect(chatbotService.getChatbotById).toHaveBeenCalledWith(chatbotId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockChatbot
      });
    });

    it('should handle not found chatbot', async () => {
      // Arrange
      req.params.id = 'nonexistent-id';
      chatbotService.getChatbotById = jest.fn().mockResolvedValue(null);
      
      // Act
      await chatbotController.getChatbotById(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Chatbot not found'
      });
    });
  });

  describe('updateChatbot', () => {
    it('should update chatbot and return success response', async () => {
      // Arrange
      const chatbotId = 'bot123';
      req.params.id = chatbotId;
      
      const updateData = {
        name: 'Updated Bot',
        description: 'Updated description'
      };
      
      req.body = updateData;
      
      const updatedChatbot = {
        id: chatbotId,
        ...updateData,
        engine: 'botpress',
        updatedAt: new Date().toISOString()
      };
      
      chatbotService.updateChatbot = jest.fn().mockResolvedValue(updatedChatbot);
      
      // Act
      await chatbotController.updateChatbot(req, res, next);
      
      // Assert
      expect(chatbotService.updateChatbot).toHaveBeenCalledWith(chatbotId, updateData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedChatbot
      });
    });

    it('should handle not found chatbot during update', async () => {
      // Arrange
      req.params.id = 'nonexistent-id';
      req.body = { name: 'Updated Name' };
      
      chatbotService.updateChatbot = jest.fn().mockResolvedValue(null);
      
      // Act
      await chatbotController.updateChatbot(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Chatbot not found'
      });
    });
  });

  describe('deleteChatbot', () => {
    it('should delete chatbot and return success response', async () => {
      // Arrange
      const chatbotId = 'bot123';
      req.params.id = chatbotId;
      
      chatbotService.deleteChatbot = jest.fn().mockResolvedValue(true);
      
      // Act
      await chatbotController.deleteChatbot(req, res, next);
      
      // Assert
      expect(chatbotService.deleteChatbot).toHaveBeenCalledWith(chatbotId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Chatbot deleted successfully'
      });
    });

    it('should handle not found chatbot during deletion', async () => {
      // Arrange
      req.params.id = 'nonexistent-id';
      chatbotService.deleteChatbot = jest.fn().mockResolvedValue(false);
      
      // Act
      await chatbotController.deleteChatbot(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Chatbot not found'
      });
    });
  });

  describe('sendMessage', () => {
    it('should process message and return response', async () => {
      // Arrange
      const chatbotId = 'bot123';
      const message = 'Hello, bot!';
      const conversationId = 'conv456';
      
      req.params.id = chatbotId;
      req.body = {
        message,
        conversationId
      };
      
      const mockResponse = {
        text: 'Hello, human! How can I help you?',
        conversationId,
        timestamp: new Date().toISOString()
      };
      
      chatbotService.sendMessage = jest.fn().mockResolvedValue(mockResponse);
      
      // Act
      await chatbotController.sendMessage(req, res, next);
      
      // Assert
      expect(chatbotService.sendMessage).toHaveBeenCalledWith(
        chatbotId,
        message,
        expect.objectContaining({
          conversationId
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResponse
      });
    });

    it('should handle missing message in request', async () => {
      // Arrange
      req.params.id = 'bot123';
      req.body = {}; // No message provided
      
      // Act
      await chatbotController.sendMessage(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Validation error'),
        expect.any(String)
      );
    });
  });

  describe('getConversationHistory', () => {
    it('should return conversation history', async () => {
      // Arrange
      const chatbotId = 'bot123';
      const conversationId = 'conv456';
      
      req.params.id = chatbotId;
      req.params.conversationId = conversationId;
      
      const mockHistory = {
        id: conversationId,
        chatbotId,
        messages: [
          { role: 'user', content: 'Hello', timestamp: '2025-01-01T12:00:00.000Z' },
          { role: 'bot', content: 'Hi there!', timestamp: '2025-01-01T12:00:01.000Z' }
        ]
      };
      
      chatbotService.getConversationHistory = jest.fn().mockResolvedValue(mockHistory);
      
      // Act
      await chatbotController.getConversationHistory(req, res, next);
      
      // Assert
      expect(chatbotService.getConversationHistory).toHaveBeenCalledWith(chatbotId, conversationId);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory
      });
    });

    it('should handle not found conversation', async () => {
      // Arrange
      req.params.id = 'bot123';
      req.params.conversationId = 'nonexistent-id';
      
      chatbotService.getConversationHistory = jest.fn().mockResolvedValue(null);
      
      // Act
      await chatbotController.getConversationHistory(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conversation not found'
      });
    });
  });
});
