/**
 * Analytics Service Unit Tests
 */

const mongoose = require('mongoose');
const sinon = require('sinon');
const { mockDeep } = require('jest-mock-extended');

// Import the service to test
const analyticsService = require('../../../analytics/analytics.service');

// Import models and dependencies
const Analytics = require('../../../models/analytics.model');
const Conversation = require('../../../models/conversation.model');
const { logger } = require('../../../utils');

// Import test utilities
const { createMockModel } = require('../../utils/mock-factory');

// Mock dependencies
jest.mock('../../../models/analytics.model');
jest.mock('../../../models/conversation.model');
jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Analytics Service', () => {
  // Setup before each test
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  // Test tracking a message
  describe('trackMessage', () => {
    it('should track a user message successfully', async () => {
      // Arrange
      const message = {
        chatbotId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        userId: 'user123',
        text: 'Hello, world!',
        type: 'text',
        direction: 'incoming',
        timestamp: new Date()
      };
      
      // Mock the findOneAndUpdate method
      Analytics.findOneAndUpdate = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        chatbotId: message.chatbotId,
        period: 'daily',
        date: new Date(),
        metrics: {
          totalMessages: 10,
          userMessages: 6,
          botMessages: 4,
          averageResponseTime: 250
        }
      });
      
      // Act
      await analyticsService.trackMessage(message);
      
      // Assert
      expect(Analytics.findOneAndUpdate).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Message tracked'));
    });
    
    it('should track a bot message and calculate response time', async () => {
      // Arrange
      const botMessage = {
        chatbotId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        userId: 'user123',
        text: 'How can I help you?',
        type: 'text',
        direction: 'outgoing',
        timestamp: new Date()
      };
      
      const userMessage = {
        chatbotId: botMessage.chatbotId,
        conversationId: botMessage.conversationId,
        userId: botMessage.userId,
        text: 'Hello',
        type: 'text',
        direction: 'incoming',
        timestamp: new Date(Date.now() - 500) // 500ms earlier
      };
      
      // Mock the findOneAndUpdate method
      Analytics.findOneAndUpdate = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        chatbotId: botMessage.chatbotId,
        period: 'daily',
        date: new Date(),
        metrics: {
          totalMessages: 10,
          userMessages: 5,
          botMessages: 5,
          averageResponseTime: 300
        }
      });
      
      // Mock the findOne method to return the last user message
      Conversation.findOne = jest.fn().mockResolvedValue(userMessage);
      
      // Act
      await analyticsService.trackMessage(botMessage);
      
      // Assert
      expect(Analytics.findOneAndUpdate).toHaveBeenCalled();
      expect(Conversation.findOne).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining('Message tracked'));
    });
    
    it('should handle errors gracefully', async () => {
      // Arrange
      const message = {
        chatbotId: new mongoose.Types.ObjectId(),
        conversationId: new mongoose.Types.ObjectId(),
        userId: 'user123',
        text: 'Hello, world!',
        type: 'text',
        direction: 'incoming',
        timestamp: new Date()
      };
      
      // Mock the findOneAndUpdate method to throw an error
      const error = new Error('Database error');
      Analytics.findOneAndUpdate = jest.fn().mockRejectedValue(error);
      
      // Act
      await analyticsService.trackMessage(message);
      
      // Assert
      expect(Analytics.findOneAndUpdate).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error tracking message'), error);
    });
  });
  
  // Test getting analytics
  describe('getAnalytics', () => {
    it('should get analytics for a chatbot by period', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      const period = 'daily';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-07');
      
      const analyticsData = [
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          period,
          date: new Date('2023-01-01'),
          metrics: {
            totalMessages: 100,
            userMessages: 50,
            botMessages: 50,
            averageResponseTime: 300
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          period,
          date: new Date('2023-01-02'),
          metrics: {
            totalMessages: 120,
            userMessages: 60,
            botMessages: 60,
            averageResponseTime: 250
          }
        }
      ];
      
      // Mock the find method
      Analytics.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(analyticsData)
      });
      
      // Act
      const result = await analyticsService.getAnalytics(chatbotId, period, startDate, endDate);
      
      // Assert
      expect(result).toEqual(analyticsData);
      expect(Analytics.find).toHaveBeenCalledWith({
        chatbotId,
        period,
        date: { $gte: startDate, $lte: endDate }
      });
    });
    
    it('should get all-time analytics for a chatbot', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      
      const analyticsData = {
        _id: new mongoose.Types.ObjectId(),
        chatbotId,
        period: 'all',
        metrics: {
          totalMessages: 1000,
          userMessages: 500,
          botMessages: 500,
          averageResponseTime: 275
        }
      };
      
      // Mock the findOne method
      Analytics.findOne = jest.fn().mockResolvedValue(analyticsData);
      
      // Act
      const result = await analyticsService.getAllTimeAnalytics(chatbotId);
      
      // Assert
      expect(result).toEqual(analyticsData);
      expect(Analytics.findOne).toHaveBeenCalledWith({
        chatbotId,
        period: 'all'
      });
    });
    
    it('should return null if no analytics found', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      
      // Mock the findOne method to return null
      Analytics.findOne = jest.fn().mockResolvedValue(null);
      
      // Act
      const result = await analyticsService.getAllTimeAnalytics(chatbotId);
      
      // Assert
      expect(result).toBeNull();
      expect(Analytics.findOne).toHaveBeenCalledWith({
        chatbotId,
        period: 'all'
      });
    });
  });
  
  // Test generating reports
  describe('generateReport', () => {
    it('should generate a comprehensive report for a specific period', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const period = 'daily';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');
      
      // Mock analytics data
      const mockAnalyticsData = [
        {
          chatbotId,
          period: 'daily',
          date: new Date('2025-01-01'),
          metrics: {
            conversations: { total: 100, new: 80, completed: 75 },
            messages: { total: 500, user: 250, bot: 250 },
            users: { total: 50, new: 20, returning: 30 },
            engagement: { averageConversationLength: 5, averageResponseTime: 1.2 }
          }
        },
        {
          chatbotId,
          period: 'daily',
          date: new Date('2025-01-02'),
          metrics: {
            conversations: { total: 120, new: 90, completed: 85 },
            messages: { total: 600, user: 300, bot: 300 },
            users: { total: 60, new: 25, returning: 35 },
            engagement: { averageConversationLength: 5.2, averageResponseTime: 1.1 }
          }
        }
      ];
      
      // Mock the Analytics.findByDateRange method
      Analytics.findByDateRange = jest.fn().mockResolvedValue(mockAnalyticsData);
      
      // Act
      const report = await analyticsService.generateReport(chatbotId, period, startDate, endDate);
      
      // Assert
      expect(Analytics.findByDateRange).toHaveBeenCalledWith(chatbotId, startDate, endDate, period);
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.conversations.total).toBe(220); // 100 + 120
      expect(report.summary.messages.total).toBe(1100); // 500 + 600
      expect(report.summary.users.total).toBe(60); // Max of 50 and 60
      expect(report.trends).toBeDefined();
      expect(report.trends.conversations).toHaveLength(2);
      expect(report.trends.messages).toHaveLength(2);
      expect(report.period).toBe(period);
      expect(report.startDate).toEqual(startDate);
      expect(report.endDate).toEqual(endDate);
      expect(logger.debug).toHaveBeenCalledWith('Analytics report generated', expect.any(Object));
    });
    
    it('should handle empty analytics data', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const period = 'weekly';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');
      
      // Mock empty analytics data
      Analytics.findByDateRange = jest.fn().mockResolvedValue([]);
      
      // Act
      const report = await analyticsService.generateReport(chatbotId, period, startDate, endDate);
      
      // Assert
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.conversations.total).toBe(0);
      expect(report.summary.messages.total).toBe(0);
      expect(report.trends).toBeDefined();
      expect(report.trends.conversations).toHaveLength(0);
      expect(report.period).toBe(period);
    });
    
    it('should handle errors when generating report', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId().toString();
      const period = 'monthly';
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      
      // Mock error
      const testError = new Error('Database error');
      Analytics.findByDateRange = jest.fn().mockRejectedValue(testError);
      
      // Act & Assert
      await expect(analyticsService.generateReport(chatbotId, period, startDate, endDate))
        .rejects.toThrow(testError);
      expect(logger.error).toHaveBeenCalledWith('Error generating analytics report', expect.any(Object));
    });
    
    it('should generate report with performance metrics', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      
      const analyticsData = [
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          period,
          date: new Date('2023-01-01'),
          metrics: {
            totalMessages: 1000,
            userMessages: 500,
            botMessages: 500,
            averageResponseTime: 300,
            uniqueUsers: 100
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          chatbotId,
          period,
          date: new Date('2023-02-01'),
          metrics: {
            totalMessages: 1200,
            userMessages: 600,
            botMessages: 600,
            averageResponseTime: 250,
            uniqueUsers: 120
          }
        }
      ];
      
      // Mock the find method
      Analytics.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(analyticsData)
      });
      
      // Act
      const report = await analyticsService.generateReport(chatbotId, period, startDate, endDate);
      
      // Assert
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalMessages).toBe(2200);
      expect(report.summary.averageResponseTime).toBe(275);
      expect(report.data).toEqual(analyticsData);
      expect(Analytics.find).toHaveBeenCalled();
    });
    
    it('should handle empty analytics data', async () => {
      // Arrange
      const chatbotId = new mongoose.Types.ObjectId();
      const period = 'monthly';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      
      // Mock the find method to return empty array
      Analytics.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      });
      
      // Act
      const report = await analyticsService.generateReport(chatbotId, period, startDate, endDate);
      
      // Assert
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalMessages).toBe(0);
      expect(report.summary.averageResponseTime).toBe(0);
      expect(report.data).toEqual([]);
      expect(Analytics.find).toHaveBeenCalled();
    });
  });
});
