/**
 * Topic Service Unit Tests
 */

const mongoose = require('mongoose');
const sinon = require('sinon');
const { mockDeep } = require('jest-mock-extended');

// Import the service to test
const topicService = require('../../../services/topic.service');

// Import models and dependencies
const Topic = require('../../../models/topic.model');
const TopicReference = require('../../../models/topic-reference.model');
const { logger } = require('../../../utils');

// Import test utilities
const { createMockModel } = require('../../utils/mock-factory');

// Mock dependencies
jest.mock('../../../models/topic.model');
jest.mock('../../../models/topic-reference.model');
jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Topic Service', () => {
  // Setup before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  // Test creating a topic
  describe('createTopic', () => {
    it('should create a topic successfully', async () => {
      // Arrange
      const topicData = {
        chatbotId: new mongoose.Types.ObjectId(),
        name: 'Test Topic',
        description: 'A test topic',
        keywords: ['test', 'topic', 'example'],
        parentTopicId: null
      };
      
      const savedTopic = {
        ...topicData,
        _id: new mongoose.Types.ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      Topic.prototype.save = jest.fn().mockResolvedValue(savedTopic);
      
      // Act
      const result = await topicService.createTopic(topicData);
      
      // Assert
      expect(Topic.prototype.save).toHaveBeenCalled();
      expect(result).toEqual(savedTopic);
      expect(logger.info).toHaveBeenCalledWith(`Topic created: ${savedTopic._id}`);
    });
    
    it('should handle errors when creating a topic', async () => {
      // Arrange
      const topicData = {
        chatbotId: new mongoose.Types.ObjectId(),
        name: 'Test Topic',
        description: 'A test topic'
      };
      
      const error = new Error('Database error');
      Topic.prototype.save = jest.fn().mockRejectedValue(error);
      
      // Act & Assert
      await expect(topicService.createTopic(topicData)).rejects.toThrow(error);
      expect(logger.error).toHaveBeenCalledWith(`Error creating topic: ${error.message}`, error);
    });
  });
  
  // Test getting topics by chatbot
  describe('getTopicsByChatbot', () => {
    it('should get all topics for a chatbot', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      
      const mockTopics = [
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          name: 'Topic 1',
          description: 'First topic',
          keywords: ['first', 'one']
        },
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          name: 'Topic 2',
          description: 'Second topic',
          keywords: ['second', 'two']
        }
      ];
      
      Topic.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockTopics)
        })
      });
      
      // Act
      const result = await topicService.getTopicsByChatbot(chatbotId);
      
      // Assert
      expect(Topic.find).toHaveBeenCalledWith({ chatbotId });
      expect(result).toEqual(mockTopics);
    });
  });
  
  // Test detecting topics in a message
  describe('detectTopics', () => {
    it('should detect topics in a message', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      const message = "I'm interested in artificial intelligence and machine learning";
      
      const mockTopics = [
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          name: 'Artificial Intelligence',
          keywords: ['ai', 'artificial intelligence', 'machine learning']
        },
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          name: 'Technology',
          keywords: ['tech', 'technology', 'computer']
        }
      ];
      
      Topic.find = jest.fn().mockResolvedValue(mockTopics);
      
      // Mock the topic detection algorithm
      const mockDetectedTopics = [
        {
          topicId: mockTopics[0]._id,
          confidence: 0.85,
          name: 'Artificial Intelligence'
        }
      ];
      
      // Mock the internal detection method
      const originalDetectTopicsInText = topicService._detectTopicsInText;
      topicService._detectTopicsInText = jest.fn().mockReturnValue(mockDetectedTopics);
      
      // Act
      const result = await topicService.detectTopics(chatbotId, message);
      
      // Assert
      expect(Topic.find).toHaveBeenCalledWith({ chatbotId });
      expect(topicService._detectTopicsInText).toHaveBeenCalledWith(message, mockTopics);
      expect(result).toEqual(mockDetectedTopics);
      
      // Restore the original method
      topicService._detectTopicsInText = originalDetectTopicsInText;
    });
  });
  
  // Test adding topic reference
  describe('addTopicReference', () => {
    it('should add a reference to a topic in a conversation', async () => {
      // Arrange
      const referenceData = {
        chatbotId: new mongoose.Types.ObjectId(),
        userId: 'user123',
        topicId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        messageId: new mongoose.Types.ObjectId(),
        confidence: 0.9
      };
      
      const savedReference = {
        ...referenceData,
        _id: new mongoose.Types.ObjectId(),
        timestamp: new Date()
      };
      
      TopicReference.prototype.save = jest.fn().mockResolvedValue(savedReference);
      
      // Act
      const result = await topicService.addTopicReference(referenceData);
      
      // Assert
      expect(TopicReference.prototype.save).toHaveBeenCalled();
      expect(result).toEqual(savedReference);
    });
  });
});
