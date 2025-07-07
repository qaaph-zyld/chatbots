/**
 * Unit tests for conversation controller
 */

// Mock dependencies - these must be at the top level, before imports
jest.mock('../../../../src/models/conversation.model', () => ({
  Conversation: {
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn()
  }
}));

jest.mock('../../../../src/models/chatbot.model', () => ({
  Chatbot: {
    findById: jest.fn().mockReturnThis(),
    exec: jest.fn()
  }
}));

jest.mock('../../../../src/utils/errors', () => ({
  NotFoundError: jest.fn(message => ({
    name: 'NotFoundError',
    message,
    statusCode: 404
  })),
  BadRequestError: jest.fn(message => ({
    name: 'BadRequestError',
    message,
    statusCode: 400
  })),
  UnauthorizedError: jest.fn(message => ({
    name: 'UnauthorizedError',
    message,
    statusCode: 401
  }))
}));

jest.mock('../../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn()
}));

const httpMocks = require('node-mocks-http');
const { Conversation } = require('../../../../src/models/conversation.model');
const { Chatbot } = require('../../../../src/models/chatbot.model');
const errors = require('../../../../src/utils/errors');
const logger = require('../../../../src/utils/logger');

describe('Conversation Controller', () => {
  let conversationController;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Load the controller module
    conversationController = require('../../../../src/api/external/v1/controllers/conversation.controller');
  });
  
  describe('getAllConversations', () => {
    it('should return all conversations with 200 status code', async () => {
      // Arrange
      const mockConversations = [
        { 
          id: '1', 
          chatbotId: 'bot1', 
          title: 'Conversation 1', 
          lastMessage: 'Hello', 
          createdAt: new Date(), 
          updatedAt: new Date() 
        },
        { 
          id: '2', 
          chatbotId: 'bot2', 
          title: 'Conversation 2', 
          lastMessage: 'Hi there', 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }
      ];
      
      const req = httpMocks.createRequest({
        query: {
          limit: 20,
          page: 1
        },
        apiKey: {
          userId: 'user123'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      conversationModelMock.select.mockResolvedValue(mockConversations);
      conversationModelMock.countDocuments.mockResolvedValue(2);
      
      // Act
      await conversationController.getAllConversations(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.count).toBe(2);
      expect(responseData.total).toBe(2);
      expect(responseData.page).toBe(1);
      expect(responseData.data).toEqual(mockConversations);
      
      expect(conversationModelMock.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(conversationModelMock.sort).toHaveBeenCalledWith({ updatedAt: -1 });
      expect(conversationModelMock.skip).toHaveBeenCalledWith(0);
      expect(conversationModelMock.limit).toHaveBeenCalledWith(20);
      expect(conversationModelMock.select).toHaveBeenCalledWith('id chatbotId title lastMessage createdAt updatedAt');
    });
    
    it('should filter conversations by chatbotId when provided', async () => {
      // Arrange
      const mockConversations = [
        { 
          id: '1', 
          chatbotId: 'bot1', 
          title: 'Conversation 1', 
          lastMessage: 'Hello', 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }
      ];
      
      const req = httpMocks.createRequest({
        query: {
          chatbotId: 'bot1',
          limit: 20,
          page: 1
        },
        apiKey: {
          userId: 'user123'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      conversationModelMock.select.mockResolvedValue(mockConversations);
      conversationModelMock.countDocuments.mockResolvedValue(1);
      
      // Act
      await conversationController.getAllConversations(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.count).toBe(1);
      expect(conversationModelMock.find).toHaveBeenCalledWith({ 
        userId: 'user123',
        chatbotId: 'bot1'
      });
    });
    
    it('should handle pagination correctly', async () => {
      // Arrange
      const mockConversations = [
        { 
          id: '3', 
          chatbotId: 'bot1', 
          title: 'Conversation 3', 
          lastMessage: 'Page 2', 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }
      ];
      
      const req = httpMocks.createRequest({
        query: {
          limit: 10,
          page: 2
        },
        apiKey: {
          userId: 'user123'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      conversationModelMock.select.mockResolvedValue(mockConversations);
      conversationModelMock.countDocuments.mockResolvedValue(15);
      
      // Act
      await conversationController.getAllConversations(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.page).toBe(2);
      expect(conversationModelMock.skip).toHaveBeenCalledWith(10);
      expect(conversationModelMock.limit).toHaveBeenCalledWith(10);
    });
    
    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        query: {},
        apiKey: {
          userId: 'user123'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      const error = new Error('Database error');
      
      conversationModelMock.find.mockImplementation(() => {
        throw error;
      });
      
      // Act
      await conversationController.getAllConversations(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  describe('createConversation', () => {
    it('should create a conversation and return 201 status code', async () => {
      // Arrange
      const newConversation = {
        id: '5',
        chatbotId: 'bot3',
        userId: 'user123',
        title: 'New Conversation',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockChatbot = {
        id: 'bot3',
        name: 'Test Bot',
        active: true
      };
      
      const req = httpMocks.createRequest({
        body: {
          chatbotId: 'bot3',
          title: 'New Conversation'
        },
        apiKey: {
          userId: 'user123'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      chatbotModelMock.exec.mockResolvedValue(mockChatbot);
      conversationModelMock.create.mockResolvedValue(newConversation);
      
      // Act
      await conversationController.createConversation(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(newConversation);
      
      expect(chatbotModelMock.findById).toHaveBeenCalledWith('bot3');
      expect(conversationModelMock.create).toHaveBeenCalledWith({
        chatbotId: 'bot3',
        userId: 'user123',
        title: 'New Conversation',
        messages: []
      });
    });
    
    it('should return 404 when chatbot does not exist', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        body: {
          chatbotId: 'nonexistent',
          title: 'New Conversation'
        },
        apiKey: {
          userId: 'user123'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      chatbotModelMock.exec.mockResolvedValue(null);
      
      // Act
      await conversationController.createConversation(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(apiErrorMock.NotFoundError).toHaveBeenCalledWith('Chatbot not found');
    });
    
    it('should return 400 when chatbotId is missing', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        body: {
          title: 'New Conversation'
        },
        apiKey: {
          userId: 'user123'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      // Act
      await conversationController.createConversation(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(apiErrorMock.BadRequestError).toHaveBeenCalledWith('chatbotId is required');
    });
  });
  
  describe('getConversationById', () => {
    it('should return a conversation by ID with 200 status code', async () => {
      // Arrange
      const mockConversation = {
        id: '5',
        chatbotId: 'bot3',
        userId: 'user123',
        title: 'Test Conversation',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const req = httpMocks.createRequest({
        params: { id: '5' },
        apiKey: {
          userId: 'user123'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      conversationModelMock.exec.mockResolvedValue(mockConversation);
      
      // Act
      await conversationController.getConversationById(req, res, next);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockConversation);
      
      expect(conversationModelMock.findOne).toHaveBeenCalledWith({
        _id: '5',
        userId: 'user123'
      });
    });
    
    it('should return 404 when conversation does not exist', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        params: { id: 'nonexistent' },
        apiKey: {
          userId: 'user123'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      
      conversationModelMock.exec.mockResolvedValue(null);
      
      // Act
      await conversationController.getConversationById(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(apiErrorMock.NotFoundError).toHaveBeenCalledWith('Conversation not found');
    });
    
    it('should handle errors and pass to next middleware', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        params: { id: '5' },
        apiKey: {
          userId: 'user123'
        }
      });
      
      const res = httpMocks.createResponse();
      const next = jest.fn();
      const error = new Error('Database error');
      
      conversationModelMock.findOne.mockImplementation(() => {
        throw error;
      });
      
      // Act
      await conversationController.getConversationById(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });
  
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});
