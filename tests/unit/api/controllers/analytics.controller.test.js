/**
 * Unit tests for analytics controller
 */

const httpMocks = require('node-mocks-http');

const fs = require('fs');
const path = require('path');

describe('Analytics Controller', () => {
  // Add beforeAll hook to log test start
  beforeAll(() => {
    console.log('ANALYTICS_CONTROLLER_TEST_STARTED: Beginning test execution');
  });
  
  // Add afterAll hook to log test completion status
  afterAll(() => {
    console.log('ANALYTICS_CONTROLLER_TEST_COMPLETED: All tests finished execution');
  });
  let analyticsController;
  let analyticsServiceMock;
  let conversationAnalyticsServiceMock;
  let feedbackServiceMock;
  let learningServiceMock;
  let loggerMock;
  
  beforeEach(() => {
    // Create mocks
    analyticsServiceMock = {
      getAnalytics: jest.fn(),
      getAllAnalytics: jest.fn(),
      trackResponseRating: jest.fn(),
      getInsights: jest.fn(),
      compareAnalytics: jest.fn()
    };
    
    conversationAnalyticsServiceMock = {
      getDashboard: jest.fn(),
      getInsights: jest.fn(),
      trackMessage: jest.fn(),
      getHistory: jest.fn()
    };
    
    feedbackServiceMock = {
      submitFeedback: jest.fn(),
      getFeedback: jest.fn(),
      getFeedbackStats: jest.fn()
    };
    
    learningServiceMock = {
      getLearningItems: jest.fn(),
      addManualLearning: jest.fn(),
      updateLearningStatus: jest.fn(),
      generateLearning: jest.fn(),
      applyLearning: jest.fn(),
      createLearningJob: jest.fn(),
      getLearningJobs: jest.fn(),
      getLearningJob: jest.fn(),
      createFineTuningJob: jest.fn(),
      getFineTuningJobs: jest.fn(),
      getFineTuningJob: jest.fn()
    };
    
    loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    };
    
    // Mock dependencies - using mockReturnValue pattern to avoid scoping issues
    jest.mock('../../../../src/analytics', () => ({
      analyticsService: {
        getAnalytics: jest.fn(),
        getAllAnalytics: jest.fn(),
        trackResponseRating: jest.fn(),
        getInsights: jest.fn(),
        compareAnalytics: jest.fn()
      }
    }));
    
    jest.mock('../../../../src/analytics/conversation', () => ({
      conversationAnalyticsService: {
        getDashboard: jest.fn(),
        getInsights: jest.fn(),
        trackMessage: jest.fn(),
        getHistory: jest.fn()
      }
    }));
    
    jest.mock('../../../../src/analytics/conversation/feedback.service', () => ({
      feedbackService: {
        submitFeedback: jest.fn(),
        getFeedback: jest.fn(),
        getFeedbackStats: jest.fn()
      }
    }));
    
    jest.mock('../../../../src/analytics/learning', () => ({
      learningService: {
        getLearningItems: jest.fn(),
        addManualLearning: jest.fn(),
        updateLearningStatus: jest.fn(),
        generateLearning: jest.fn(),
        applyLearning: jest.fn(),
        createLearningJob: jest.fn(),
        getLearningJobs: jest.fn(),
        getLearningJob: jest.fn(),
        createFineTuningJob: jest.fn(),
        getFineTuningJobs: jest.fn(),
        getFineTuningJob: jest.fn()
      }
    }));
    
    jest.mock('../../../../src/utils', () => ({
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
      }
    }));
    
    // After mocking, get references to the mocked services
    const { analyticsService } = require('../../../../src/analytics');
    const { conversationAnalyticsService } = require('../../../../src/analytics/conversation');
    const { feedbackService } = require('../../../../src/analytics/conversation/feedback.service');
    const { learningService } = require('../../../../src/analytics/learning');
    const { logger } = require('../../../../src/utils');
    
    // Assign these references to our mock variables for test assertions
    analyticsServiceMock = analyticsService;
    conversationAnalyticsServiceMock = conversationAnalyticsService;
    feedbackServiceMock = feedbackService;
    learningServiceMock = learningService;
    loggerMock = logger;
    
    // Load the controller module
    analyticsController = require('../../../../src/api/controllers/analytics.controller');
  });
  
  describe('getAnalytics', () => {
    it('should return analytics for a chatbot with 200 status code', async () => {
      // Arrange
      const mockAnalytics = {
        totalConversations: 120,
        averageRating: 4.5,
        totalMessages: 1450,
        userSatisfaction: 92,
        topQueries: [
          { query: 'How to reset password', count: 45 },
          { query: 'Subscription options', count: 32 }
        ]
      };
      
      const req = httpMocks.createRequest({
        params: {
          chatbotId: 'bot123'
        },
        query: {
          period: 'month',
          date: '2025-06-01'
        }
      });
      
      const res = httpMocks.createResponse();
      
      analyticsServiceMock.getAnalytics.mockResolvedValue(mockAnalytics);
      
      // Act
      await analyticsController.getAnalytics(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData).toEqual(mockAnalytics);
      
      expect(analyticsServiceMock.getAnalytics).toHaveBeenCalledWith(
        'bot123',
        'month',
        expect.any(Date)
      );
    });
    
    it('should use default period and current date when not provided', async () => {
      // Arrange
      const mockAnalytics = {
        totalConversations: 500,
        averageRating: 4.2
      };
      
      const req = httpMocks.createRequest({
        params: {
          chatbotId: 'bot123'
        },
        query: {}
      });
      
      const res = httpMocks.createResponse();
      
      analyticsServiceMock.getAnalytics.mockResolvedValue(mockAnalytics);
      
      // Act
      await analyticsController.getAnalytics(req, res);
      
      // Assert
      expect(analyticsServiceMock.getAnalytics).toHaveBeenCalledWith(
        'bot123',
        'all',
        expect.any(Date)
      );
    });
    
    it('should handle errors with 500 status code', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        params: {
          chatbotId: 'bot123'
        }
      });
      
      const res = httpMocks.createResponse();
      
      const error = new Error('Analytics service error');
      analyticsServiceMock.getAnalytics.mockRejectedValue(error);
      
      // Act
      await analyticsController.getAnalytics(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(500);
      expect(responseData).toEqual({ error: 'Analytics service error' });
      expect(loggerMock.error).toHaveBeenCalledWith('Error getting analytics:', 'Analytics service error');
    });
  });
  
  describe('getAllAnalytics', () => {
    it('should return analytics for all chatbots with 200 status code', async () => {
      // Arrange
      const mockAnalytics = {
        totalChatbots: 5,
        totalConversations: 1200,
        averageRating: 4.3,
        chatbotPerformance: [
          { id: 'bot1', name: 'Support Bot', conversations: 450, rating: 4.7 },
          { id: 'bot2', name: 'Sales Bot', conversations: 320, rating: 4.1 }
        ]
      };
      
      const req = httpMocks.createRequest({
        query: {
          period: 'week',
          date: '2025-07-01'
        }
      });
      
      const res = httpMocks.createResponse();
      
      analyticsServiceMock.getAllAnalytics.mockResolvedValue(mockAnalytics);
      
      // Act
      await analyticsController.getAllAnalytics(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData).toEqual(mockAnalytics);
      
      expect(analyticsServiceMock.getAllAnalytics).toHaveBeenCalledWith(
        'week',
        expect.any(Date)
      );
    });
    
    it('should handle errors with 500 status code', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        query: {}
      });
      
      const res = httpMocks.createResponse();
      
      const error = new Error('Database connection error');
      analyticsServiceMock.getAllAnalytics.mockRejectedValue(error);
      
      // Act
      await analyticsController.getAllAnalytics(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(500);
      expect(responseData).toEqual({ error: 'Database connection error' });
    });
  });
  
  describe('trackResponseRating', () => {
    it('should track response rating and return success with 200 status code', async () => {
      // Arrange
      const ratingData = {
        conversationId: 'conv123',
        messageId: 'msg456',
        rating: 5,
        feedback: 'Very helpful response'
      };
      
      const req = httpMocks.createRequest({
        body: ratingData
      });
      
      const res = httpMocks.createResponse();
      
      analyticsServiceMock.trackResponseRating.mockResolvedValue({ success: true });
      
      // Act
      await analyticsController.trackResponseRating(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData).toEqual({ success: true });
      
      expect(analyticsServiceMock.trackResponseRating).toHaveBeenCalledWith(
        req.params.chatbotId,
        ratingData.conversationId,
        ratingData.rating
      );
    });
    
    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        body: {
          // Missing required fields
          rating: 4
        }
      });
      
      const res = httpMocks.createResponse();
      
      // Act
      await analyticsController.trackResponseRating(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
      expect(responseData.error).toBeDefined();
    });
    
    it('should handle errors with 500 status code', async () => {
      // Arrange
      const ratingData = {
        conversationId: 'conv123',
        messageId: 'msg456',
        rating: 5
      };
      
      const req = httpMocks.createRequest({
        body: ratingData
      });
      
      const res = httpMocks.createResponse();
      
      const error = new Error('Rating tracking error');
      analyticsServiceMock.trackResponseRating.mockRejectedValue(error);
      
      // Act
      await analyticsController.trackResponseRating(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(500);
      expect(responseData.error).toBeDefined();
    });
  });
  
  describe('getInsights', () => {
    it('should return insights for a chatbot with 200 status code', async () => {
      // Arrange
      const mockInsights = {
        topQueries: [
          { query: 'How to reset password', count: 45 },
          { query: 'Subscription options', count: 32 }
        ],
        commonIssues: [
          { issue: 'Login problems', count: 28 },
          { issue: 'Payment failures', count: 15 }
        ],
        userSentiment: {
          positive: 75,
          neutral: 15,
          negative: 10
        },
        recommendations: [
          'Improve password reset flow',
          'Add more payment options'
        ]
      };
      
      const req = httpMocks.createRequest({
        params: {
          chatbotId: 'bot123'
        },
        query: {
          period: 'month'
        }
      });
      
      const res = httpMocks.createResponse();
      
      analyticsServiceMock.getInsights.mockResolvedValue(mockInsights);
      
      // Act
      await analyticsController.getInsights(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData).toEqual(mockInsights);
      
      expect(analyticsServiceMock.getInsights).toHaveBeenCalledWith(
        'bot123',
        'month',
        expect.any(Date)
      );
    });
    
    it('should handle errors with 500 status code', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        params: {
          chatbotId: 'bot123'
        }
      });
      
      const res = httpMocks.createResponse();
      
      const error = new Error('Insights service error');
      analyticsServiceMock.getInsights.mockRejectedValue(error);
      
      // Act
      await analyticsController.getInsights(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(500);
      expect(responseData.error).toBeDefined();
    });
  });
  
  describe('submitFeedback', () => {
    it('should submit feedback and return success with 201 status code', async () => {
      // Arrange
      const feedbackData = {
        chatbotId: 'bot123',
        conversationId: 'conv456',
        messageId: 'msg789',
        userId: 'user123',
        rating: 5,
        comment: 'Very helpful chatbot'
      };
      
      // Use a fixed ISO string date for consistent comparison
      const createdDate = '2025-07-06T14:00:00.000Z';
      const createdFeedback = {
        id: 'feedback789',
        ...feedbackData,
        createdAt: createdDate
      };
      
      const req = httpMocks.createRequest({
        body: feedbackData
      });
      
      const res = httpMocks.createResponse();
      
      feedbackServiceMock.submitFeedback.mockResolvedValue(createdFeedback);
      
      // Act
      await analyticsController.submitFeedback(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(createdFeedback);
      
      // Verify the function was called once with parameters that include our feedbackData
      expect(feedbackServiceMock.submitFeedback).toHaveBeenCalled();
      const callArgs = feedbackServiceMock.submitFeedback.mock.calls[0][0];
      console.log('FEEDBACK TEST - Expected:', JSON.stringify(feedbackData));
      console.log('FEEDBACK TEST - Received:', JSON.stringify(callArgs));
      // Use a more flexible comparison approach
      Object.keys(feedbackData).forEach(key => {
        expect(callArgs[key]).toEqual(feedbackData[key]);
      });
    });
    
    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        body: {
          // Missing required fields
          feedback: 'Great service'
        }
      });
      
      const res = httpMocks.createResponse();
      
      // Act
      await analyticsController.submitFeedback(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });
    
    it('should handle errors with 500 status code', async () => {
      // Arrange
      const feedbackData = {
        chatbotId: 'bot123',
        conversationId: 'conv456',
        messageId: 'msg789',
        userId: 'user123',
        rating: 5,
        feedback: 'Very helpful chatbot'
      };
      
      const req = httpMocks.createRequest({
        body: feedbackData
      });
      
      const res = httpMocks.createResponse();
      
      const error = new Error('Feedback submission error');
      feedbackServiceMock.submitFeedback.mockRejectedValue(error);
      
      // Act
      await analyticsController.submitFeedback(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBeDefined();
    });
  });
  
  describe('getLearningItems', () => {
    it('should return learning items for a chatbot with 200 status code', async () => {
      // Arrange
      const currentDate = new Date();
      const mockLearningItems = [
        {
          id: 'learn1',
          chatbotId: 'bot123',
          type: 'feedback',
          content: 'Users are asking about new pricing plans',
          status: 'pending',
          createdAt: currentDate,
          updatedAt: currentDate
        },
        {
          id: 'learn2',
          chatbotId: 'bot123',
          type: 'conversation',
          content: 'Improve responses about account deletion',
          status: 'applied',
          createdAt: currentDate,
          updatedAt: null
        }
      ];
      
      const req = httpMocks.createRequest({
        params: {
          chatbotId: 'bot123'
        },
        query: {
          status: 'all',
          limit: '10',
          offset: '0'
        }
      });
      
      const res = httpMocks.createResponse();
      
      learningServiceMock.getLearningItems.mockResolvedValue(mockLearningItems);
      
      // Act
      await analyticsController.getLearningItems(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveLength(2);
      expect(responseData.data[0].id).toBe('learn1');
      expect(responseData.data[1].id).toBe('learn2');
      
      // Verify date serialization
      expect(responseData.data[0].createdAt).toBe(currentDate.toISOString());
      expect(responseData.data[0].updatedAt).toBe(currentDate.toISOString());
      expect(responseData.data[1].updatedAt).toBeNull();
      
      // Verify service was called with correct parameters
      expect(learningServiceMock.getLearningItems).toHaveBeenCalledWith(
        'bot123',
        expect.objectContaining({
          limit: 10,
          offset: 0
        })
      );
    });
    
    it('should return 400 for invalid limit parameter', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        params: {
          chatbotId: 'bot123'
        },
        query: {
          limit: 'invalid',
          offset: '0'
        }
      });
      
      const res = httpMocks.createResponse();
      
      // Act
      await analyticsController.getLearningItems(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid limit parameter');
      expect(learningServiceMock.getLearningItems).not.toHaveBeenCalled();
    });
    
    it('should return 400 for invalid offset parameter', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        params: {
          chatbotId: 'bot123'
        },
        query: {
          limit: '10',
          offset: 'invalid'
        }
      });
      
      const res = httpMocks.createResponse();
      
      // Act
      await analyticsController.getLearningItems(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Invalid offset parameter');
      expect(learningServiceMock.getLearningItems).not.toHaveBeenCalled();
    });
    
    it('should handle service errors with 500 status code', async () => {
      // Arrange
      const req = httpMocks.createRequest({
        params: {
          chatbotId: 'bot123'
        },
        query: {
          limit: '10',
          offset: '0'
        }
      });
      
      const res = httpMocks.createResponse();
      
      const error = new Error('Learning service error');
      learningServiceMock.getLearningItems.mockRejectedValue(error);
      
      // Act
      await analyticsController.getLearningItems(req, res);
      const responseData = JSON.parse(res._getData());
      
      // Assert
      expect(res._getStatusCode()).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toContain('Internal server error');
    });
  });
  
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});
