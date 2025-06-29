/**
 * Analytics Dashboard Service
 * 
 * Provides methods to interact with the Analytics Dashboard API endpoints
 */

import axios from 'axios';

const API_BASE_URL = '/api/analytics-dashboard';

/**
 * Analytics Dashboard Service
 */
class AnalyticsDashboardService {
  /**
   * Get overview metrics and trends
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Promise<Object>} Overview data
   */
  static async getOverview(startDate, endDate) {
    try {
      const response = await axios.get(`${API_BASE_URL}/overview`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching overview data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch overview data'
      };
    }
  }

  /**
   * Get conversation metrics and distributions
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Promise<Object>} Conversation data
   */
  static async getConversations(startDate, endDate) {
    try {
      const response = await axios.get(`${API_BASE_URL}/conversations`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch conversation data'
      };
    }
  }

  /**
   * Get template usage statistics
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Promise<Object>} Template data
   */
  static async getTemplates(startDate, endDate) {
    try {
      const response = await axios.get(`${API_BASE_URL}/templates`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching template data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch template data'
      };
    }
  }

  /**
   * Get user engagement metrics
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Promise<Object>} User engagement data
   */
  static async getUserEngagement(startDate, endDate) {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-engagement`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user engagement data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch user engagement data'
      };
    }
  }

  /**
   * Get response quality metrics
   * @param {string} startDate - Start date in ISO format
   * @param {string} endDate - End date in ISO format
   * @returns {Promise<Object>} Response quality data
   */
  static async getResponseQuality(startDate, endDate) {
    try {
      const response = await axios.get(`${API_BASE_URL}/response-quality`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching response quality data:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch response quality data'
      };
    }
  }
}

export default AnalyticsDashboardService;