/**
 * Analytics Dashboard Service
 * 
 * Provides methods for interacting with the Analytics Dashboard API endpoints
 */

import axios from 'axios';

// Base API URL - can be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
const ANALYTICS_API_PATH = '/api/analytics-dashboard';

/**
 * Analytics Dashboard Service
 * Handles all API calls related to the Analytics Dashboard
 */
class AnalyticsDashboardService {
  /**
   * Get overview metrics and trends
   * @param {Object} params - Query parameters
   * @param {Date} params.startDate - Start date for filtering
   * @param {Date} params.endDate - End date for filtering
   * @param {string} params.period - Period for aggregation (daily, weekly, monthly)
   * @param {string} params.botId - Optional bot ID for filtering
   * @returns {Promise<Object>} - Overview data
   */
  async getOverview(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}${ANALYTICS_API_PATH}/overview`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching overview data:', error);
      throw error;
    }
  }

  /**
   * Get conversation metrics and trends
   * @param {Object} params - Query parameters
   * @param {Date} params.startDate - Start date for filtering
   * @param {Date} params.endDate - End date for filtering
   * @param {string} params.period - Period for aggregation (daily, weekly, monthly)
   * @param {string} params.botId - Optional bot ID for filtering
   * @returns {Promise<Object>} - Conversation data
   */
  async getConversations(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}${ANALYTICS_API_PATH}/conversations`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation data:', error);
      throw error;
    }
  }

  /**
   * Get template usage statistics
   * @param {Object} params - Query parameters
   * @param {Date} params.startDate - Start date for filtering
   * @param {Date} params.endDate - End date for filtering
   * @param {string} params.period - Period for aggregation (daily, weekly, monthly)
   * @param {string} params.botId - Optional bot ID for filtering
   * @returns {Promise<Object>} - Template data
   */
  async getTemplates(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}${ANALYTICS_API_PATH}/templates`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching template data:', error);
      throw error;
    }
  }

  /**
   * Get user engagement metrics
   * @param {Object} params - Query parameters
   * @param {Date} params.startDate - Start date for filtering
   * @param {Date} params.endDate - End date for filtering
   * @param {string} params.period - Period for aggregation (daily, weekly, monthly)
   * @param {string} params.botId - Optional bot ID for filtering
   * @returns {Promise<Object>} - User engagement data
   */
  async getUserEngagement(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}${ANALYTICS_API_PATH}/user-engagement`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user engagement data:', error);
      throw error;
    }
  }

  /**
   * Get response quality metrics
   * @param {Object} params - Query parameters
   * @param {Date} params.startDate - Start date for filtering
   * @param {Date} params.endDate - End date for filtering
   * @param {string} params.period - Period for aggregation (daily, weekly, monthly)
   * @param {string} params.botId - Optional bot ID for filtering
   * @returns {Promise<Object>} - Response quality data
   */
  async getResponseQuality(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}${ANALYTICS_API_PATH}/response-quality`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching response quality data:', error);
      throw error;
    }
  }

  /**
   * Get all analytics data in parallel
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - All analytics data
   */
  async getAllAnalytics(params = {}) {
    try {
      const [overview, conversations, templates, userEngagement, responseQuality] = await Promise.all([
        this.getOverview(params),
        this.getConversations(params),
        this.getTemplates(params),
        this.getUserEngagement(params),
        this.getResponseQuality(params)
      ]);

      return {
        overview,
        conversations,
        templates,
        userEngagement,
        responseQuality
      };
    } catch (error) {
      console.error('Error fetching all analytics data:', error);
      throw error;
    }
  }

  /**
   * Get mock data for testing
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} - Mock data
   */
  async getMockData(endpoint) {
    try {
      // In a real implementation, this would load from static JSON files
      const mockDataMap = {
        'overview': {
          success: true,
          metrics: {
            totalConversations: 1245,
            activeUsers: 876,
            avgResponseTime: 1.8,
            avgUserRating: 4.7
          },
          trends: {
            conversations: [
              { date: '2025-06-01', count: 120 },
              { date: '2025-06-08', count: 145 },
              { date: '2025-06-15', count: 168 },
              { date: '2025-06-22', count: 189 }
            ],
            users: [
              { date: '2025-06-01', count: 85 },
              { date: '2025-06-08', count: 97 },
              { date: '2025-06-15', count: 112 },
              { date: '2025-06-22', count: 128 }
            ]
          }
        },
        'conversations': {
          success: true,
          metrics: {
            totalMessages: 15678,
            avgMessagesPerConversation: 12.6,
            avgConversationDuration: 8.4,
            completionRate: 0.87
          },
          distribution: {
            byHour: [
              { hour: 0, count: 245 },
              { hour: 6, count: 567 },
              { hour: 12, count: 1245 },
              { hour: 18, count: 987 }
            ],
            byDay: [
              { day: 'Monday', count: 1245 },
              { day: 'Tuesday', count: 1345 },
              { day: 'Wednesday', count: 1456 },
              { day: 'Thursday', count: 1567 },
              { day: 'Friday', count: 1432 },
              { day: 'Saturday', count: 876 },
              { day: 'Sunday', count: 765 }
            ]
          }
        },
        'templates': {
          success: true,
          metrics: {
            totalTemplates: 24,
            activeTemplates: 18,
            avgTemplateUsage: 51.9
          },
          topTemplates: [
            { name: 'Customer Support', usage: 456, rating: 4.8 },
            { name: 'Product Information', usage: 345, rating: 4.6 },
            { name: 'Booking Assistant', usage: 289, rating: 4.7 },
            { name: 'FAQ Bot', usage: 267, rating: 4.5 },
            { name: 'Lead Generation', usage: 198, rating: 4.3 }
          ]
        },
        'user-engagement': {
          success: true,
          metrics: {
            newUsers: 245,
            returningUsers: 631,
            avgSessionDuration: 7.8,
            avgSessionsPerUser: 3.2
          },
          retention: {
            day1: 0.68,
            day7: 0.42,
            day30: 0.28
          },
          userSegments: [
            { segment: 'Power Users', count: 156, avgSessions: 8.7 },
            { segment: 'Regular Users', count: 432, avgSessions: 4.2 },
            { segment: 'Occasional Users', count: 543, avgSessions: 1.8 },
            { segment: 'New Users', count: 245, avgSessions: 1.0 }
          ]
        },
        'response-quality': {
          success: true,
          metrics: {
            avgResponseTime: 1.8,
            avgUserRating: 4.7,
            issueResolutionRate: 0.82,
            handoffRate: 0.12
          },
          sentimentDistribution: [
            { sentiment: 'Positive', count: 876, percentage: 0.68 },
            { sentiment: 'Neutral', count: 289, percentage: 0.22 },
            { sentiment: 'Negative', count: 132, percentage: 0.10 }
          ],
          responseTimeDistribution: [
            { range: '0-1s', count: 567, percentage: 0.44 },
            { range: '1-3s', count: 456, percentage: 0.35 },
            { range: '3-5s', count: 178, percentage: 0.14 },
            { range: '5s+', count: 89, percentage: 0.07 }
          ]
        }
      };

      return mockDataMap[endpoint] || { success: false, error: 'Invalid endpoint' };
    } catch (error) {
      console.error('Error fetching mock data:', error);
      throw error;
    }
  }
}

export default new AnalyticsDashboardService();