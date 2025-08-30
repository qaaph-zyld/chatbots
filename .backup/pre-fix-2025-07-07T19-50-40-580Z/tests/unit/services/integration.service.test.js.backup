/**
 * Integration Service Unit Tests
 */

const mongoose = require('mongoose');
const sinon = require('sinon');
const { mockDeep } = require('jest-mock-extended');

// Import the service to test
const integrationService = require('../../../integrations/integration.service');

// Import models and dependencies
const Integration = require('../../../models/integration.model');
const Chatbot = require('../../../models/chatbot.model');
const { logger } = require('../../../utils');

// Import test utilities
require('@tests/utils\mock-factory');

// Mock dependencies
jest.mock('../../../models/integration.model');
jest.mock('../../../models/chatbot.model');
jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Integration Service', () => {
  // Setup before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  // Test creating an integration
  describe('createIntegration', () => {
    it('should create a new integration successfully', async () => {
      // Arrange
      const integrationData = {
        name: 'Test Integration',
        platform: 'web',
        chatbotId: new mongoose.Types.ObjectId(),
        config: {
          webhook: 'https://example.com/webhook',
          apiKey: 'test-api-key'
        }
      };
      
      const savedIntegration = {
        ...integrationData,
        _id: new mongoose.Types.ObjectId(),
        status: 'inactive',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Mock the save method
      Integration.prototype.save = jest.fn().mockResolvedValue(savedIntegration);
      
      // Mock the chatbot findById method
      Chatbot.findById = jest.fn().mockResolvedValue({
        _id: integrationData.chatbotId,
        name: 'Test Chatbot'
      });
      
      // Act
      const result = await integrationService.createIntegration(integrationData);
      
      // Assert
      expect(result).toEqual(savedIntegration);
      expect(Integration.prototype.save).toHaveBeenCalled();
      expect(Chatbot.findById).toHaveBeenCalledWith(integrationData.chatbotId);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Integration created'));
    });
    
    it('should throw an error if chatbot does not exist', async () => {
      // Arrange
      const integrationData = {
        name: 'Test Integration',
        platform: 'web',
        chatbotId: new mongoose.Types.ObjectId(),
        config: {
          webhook: 'https://example.com/webhook',
          apiKey: 'test-api-key'
        }
      };
      
      // Mock the chatbot findById method to return null
      Chatbot.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(integrationService.createIntegration(integrationData))
        .rejects
        .toThrow('Chatbot not found');
      
      expect(Chatbot.findById).toHaveBeenCalledWith(integrationData.chatbotId);
      expect(Integration.prototype.save).not.toHaveBeenCalled();
    });
    
    it('should throw an error if validation fails', async () => {
      // Arrange
      const integrationData = {
        // Missing required fields
        name: 'Test Integration'
      };
      
      // Act & Assert
      await expect(integrationService.createIntegration(integrationData))
        .rejects
        .toThrow('Validation error');
      
      expect(Integration.prototype.save).not.toHaveBeenCalled();
    });
  });
  
  // Test getting integrations by chatbot ID
  describe('getIntegrationsByChatbotId', () => {
    it('should return integrations for a chatbot', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      const integrations = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Web Integration',
          platform: 'web',
          chatbotId,
          status: 'active'
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Slack Integration',
          platform: 'slack',
          chatbotId,
          status: 'inactive'
        }
      ];
      
      // Mock the find method
      Integration.find = jest.fn().mockResolvedValue(integrations);
      
      // Act
      const result = await integrationService.getIntegrationsByChatbotId(chatbotId);
      
      // Assert
      expect(result).toEqual(integrations);
      expect(Integration.find).toHaveBeenCalledWith({ chatbotId });
    });
    
    it('should return an empty array if no integrations found', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      
      // Mock the find method to return empty array
      Integration.find = jest.fn().mockResolvedValue([]);
      
      // Act
      const result = await integrationService.getIntegrationsByChatbotId(chatbotId);
      
      // Assert
      expect(result).toEqual([]);
      expect(Integration.find).toHaveBeenCalledWith({ chatbotId });
    });
  });
  
  // Test activating an integration
  describe('activateIntegration', () => {
    it('should activate an integration successfully', async () => {
      // Arrange
      const integrationId = new mongoose.Types.ObjectId();
      const integration = {
        _id: integrationId,
        name: 'Test Integration',
        platform: 'web',
        chatbotId: new mongoose.Types.ObjectId(),
        status: 'inactive'
      };
      
      // Mock the findById method
      Integration.findById = jest.fn().mockResolvedValue(integration);
      
      // Mock the save method
      integration.save = jest.fn().mockResolvedValue({
        ...integration,
        status: 'active'
      });
      
      // Act
      const result = await integrationService.activateIntegration(integrationId);
      
      // Assert
      expect(result.status).toBe('active');
      expect(Integration.findById).toHaveBeenCalledWith(integrationId);
      expect(integration.save).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Integration activated'));
    });
    
    it('should throw an error if integration does not exist', async () => {
      // Arrange
      const integrationId = new mongoose.Types.ObjectId();
      
      // Mock the findById method to return null
      Integration.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(integrationService.activateIntegration(integrationId))
        .rejects
        .toThrow('Integration not found');
      
      expect(Integration.findById).toHaveBeenCalledWith(integrationId);
    });
  });
  
  // Test processing a message
  describe('processMessage', () => {
    it('should process a message successfully', async () => {
      // Arrange
      const integrationId = new mongoose.Types.ObjectId();
      const chatbotId = new mongoose.Types.ObjectId();
      const message = {
        text: 'Hello, world!',
        userId: 'user123'
      };
      
      const integration = {
        _id: integrationId,
        name: 'Test Integration',
        platform: 'web',
        chatbotId,
        status: 'active'
      };
      
      const chatbot = {
        _id: chatbotId,
        name: 'Test Chatbot',
        status: 'active'
      };
      
      // Mock the findById methods
      Integration.findById = jest.fn().mockResolvedValue(integration);
      Chatbot.findById = jest.fn().mockResolvedValue(chatbot);
      
      // Mock the processMessage method
      const processMessageStub = sinon.stub(integrationService, '_processMessageWithChatbot').resolves({
        text: 'Hello, how can I help you?',
        chatbotId,
        userId: message.userId
      });
      
      // Act
      const result = await integrationService.processMessage(integrationId, message);
      
      // Assert
      expect(result).toEqual({
        text: 'Hello, how can I help you?',
        chatbotId,
        userId: message.userId
      });
      
      expect(Integration.findById).toHaveBeenCalledWith(integrationId);
      expect(Chatbot.findById).toHaveBeenCalledWith(chatbotId);
      expect(processMessageStub).toHaveBeenCalledWith(chatbot, message);
      
      // Restore the stub
      processMessageStub.restore();
    });
    
    it('should throw an error if integration does not exist', async () => {
      // Arrange
      const integrationId = new mongoose.Types.ObjectId();
      const message = {
        text: 'Hello, world!',
        userId: 'user123'
      };
      
      // Mock the findById method to return null
      Integration.findById = jest.fn().mockResolvedValue(null);
      
      // Act & Assert
      await expect(integrationService.processMessage(integrationId, message))
        .rejects
        .toThrow('Integration not found');
      
      expect(Integration.findById).toHaveBeenCalledWith(integrationId);
    });
    
    it('should throw an error if integration is not active', async () => {
      // Arrange
      const integrationId = new mongoose.Types.ObjectId();
      const message = {
        text: 'Hello, world!',
        userId: 'user123'
      };
      
      const integration = {
        _id: integrationId,
        name: 'Test Integration',
        platform: 'web',
        chatbotId: new mongoose.Types.ObjectId(),
        status: 'inactive'
      };
      
      // Mock the findById method
      Integration.findById = jest.fn().mockResolvedValue(integration);
      
      // Act & Assert
      await expect(integrationService.processMessage(integrationId, message))
        .rejects
        .toThrow('Integration is not active');
      
      expect(Integration.findById).toHaveBeenCalledWith(integrationId);
    });
  });
});
