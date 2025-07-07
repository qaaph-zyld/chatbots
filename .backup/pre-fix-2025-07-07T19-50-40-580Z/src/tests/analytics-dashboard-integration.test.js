/**
 * Analytics Dashboard Integration Tests
 * 
 * Tests the integration between frontend components and backend API
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AnalyticsDashboardService from '../frontend/services/analytics-dashboard.service';

// Mock data for testing
const mockOverviewData = {
  metrics: {
    totalConversations: 1250,
    totalMessages: 8750,
    activeUsers: 120,
    userSatisfaction: 4.2,
    avgMessagesPerConversation: 7
  },
  trends: [
    { date: '2025-06-01', conversations: 42, messages: 294, users: 18 },
    { date: '2025-06-02', conversations: 38, messages: 266, users: 15 }
  ]
};

const mockConversationsData = {
  metrics: {
    totalConversations: 1250,
    avgConversationLength: 8.5,
    avgConversationDuration: 4.2,
    completionRate: 0.78
  },
  hourlyDistribution: [
    { hour: 9, count: 85 },
    { hour: 10, count: 92 }
  ],
  topConversationTopics: [
    { topic: 'Account Issues', count: 245, percentage: 0.28 },
    { topic: 'Product Information', count: 187, percentage: 0.21 }
  ]
};

const mockTemplatesData = {
  metrics: {
    totalTemplates: 24,
    activeTemplates: 18,
    avgTemplateUsage: 42.5
  },
  topTemplates: [
    { name: 'Customer Support', usage: 387, rating: 4.7 },
    { name: 'Product FAQ', usage: 245, rating: 4.5 }
  ]
};

const mockUserEngagementData = {
  metrics: {
    newUsers: 85,
    returningUsers: 320,
    avgSessionDuration: 6.8,
    avgSessionsPerUser: 3.2
  },
  retention: {
    day1: 0.72,
    day7: 0.45,
    day30: 0.28
  },
  userSegments: [
    { segment: 'New Users', count: 85, avgSessions: 1.8 },
    { segment: 'Casual Users', count: 142, avgSessions: 2.5 }
  ]
};

const mockResponseQualityData = {
  metrics: {
    avgResponseTime: 2.4,
    avgUserRating: 4.3,
    issueResolutionRate: 0.85,
    handoffRate: 0.12
  },
  sentimentDistribution: [
    { sentiment: 'Positive', count: 420, percentage: 0.60 },
    { sentiment: 'Neutral', count: 210, percentage: 0.30 }
  ],
  responseTimeDistribution: [
    { range: '< 1s', count: 280, percentage: 0.40 },
    { range: '1-3s', count: 245, percentage: 0.35 }
  ]
};

describe('Analytics Dashboard Integration Tests', () => {
  let mock;
  
  beforeEach(() => {
    // Create a new instance of axios-mock-adapter
    mock = new MockAdapter(axios);
  });
  
  afterEach(() => {
    // Reset the mock
    mock.reset();
  });
  
  afterAll(() => {
    // Restore axios
    mock.restore();
  });
  
  describe('AnalyticsDashboardService', () => {
    // Test parameters
    const startDate = '2025-06-01';
    const endDate = '2025-06-30';
    
    test('getOverview should fetch and return overview data', async () => {
      // Setup mock response
      mock.onGet('/api/analytics-dashboard/overview').reply(200, {
        success: true,
        data: mockOverviewData
      });
      
      // Call the service
      const result = await AnalyticsDashboardService.getOverview(startDate, endDate);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOverviewData);
      expect(mock.history.get[0].params).toEqual({ startDate, endDate });
    });
    
    test('getConversations should fetch and return conversations data', async () => {
      // Setup mock response
      mock.onGet('/api/analytics-dashboard/conversations').reply(200, {
        success: true,
        data: mockConversationsData
      });
      
      // Call the service
      const result = await AnalyticsDashboardService.getConversations(startDate, endDate);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConversationsData);
      expect(mock.history.get[0].params).toEqual({ startDate, endDate });
    });
    
    test('getTemplates should fetch and return templates data', async () => {
      // Setup mock response
      mock.onGet('/api/analytics-dashboard/templates').reply(200, {
        success: true,
        data: mockTemplatesData
      });
      
      // Call the service
      const result = await AnalyticsDashboardService.getTemplates(startDate, endDate);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTemplatesData);
      expect(mock.history.get[0].params).toEqual({ startDate, endDate });
    });
    
    test('getUserEngagement should fetch and return user engagement data', async () => {
      // Setup mock response
      mock.onGet('/api/analytics-dashboard/user-engagement').reply(200, {
        success: true,
        data: mockUserEngagementData
      });
      
      // Call the service
      const result = await AnalyticsDashboardService.getUserEngagement(startDate, endDate);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserEngagementData);
      expect(mock.history.get[0].params).toEqual({ startDate, endDate });
    });
    
    test('getResponseQuality should fetch and return response quality data', async () => {
      // Setup mock response
      mock.onGet('/api/analytics-dashboard/response-quality').reply(200, {
        success: true,
        data: mockResponseQualityData
      });
      
      // Call the service
      const result = await AnalyticsDashboardService.getResponseQuality(startDate, endDate);
      
      // Assertions
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponseQualityData);
      expect(mock.history.get[0].params).toEqual({ startDate, endDate });
    });
    
    test('should handle API errors gracefully', async () => {
      // Setup mock response for error
      mock.onGet('/api/analytics-dashboard/overview').reply(500, {
        success: false,
        error: 'Internal server error'
      });
      
      // Call the service
      const result = await AnalyticsDashboardService.getOverview(startDate, endDate);
      
      // Assertions
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
    
    test('should handle network errors gracefully', async () => {
      // Setup mock to simulate network error
      mock.onGet('/api/analytics-dashboard/overview').networkError();
      
      // Call the service
      const result = await AnalyticsDashboardService.getOverview(startDate, endDate);
      
      // Assertions
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});