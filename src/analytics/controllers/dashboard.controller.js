/**
 * Analytics Dashboard Controller
 * 
 * Handles API endpoints for analytics dashboard data
 */

const analyticsService = require('../services/analytics.service');
const logger = require('../../utils/logger');

/**
 * Get summary analytics data for the dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { timeframe = '7d' } = req.query;
    
    // Get dashboard summary data
    const summaryData = await analyticsService.getDashboardSummary(tenantId, timeframe);
    
    res.status(200).json({
      success: true,
      data: summaryData
    });
  } catch (error) {
    logger.error('Error fetching dashboard summary', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: error.message
    });
  }
};

/**
 * Get usage analytics data for the dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUsageAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { timeframe = '30d', interval = 'day' } = req.query;
    
    // Get usage analytics data
    const usageData = await analyticsService.getUsageAnalytics(tenantId, timeframe, interval);
    
    res.status(200).json({
      success: true,
      data: usageData
    });
  } catch (error) {
    logger.error('Error fetching usage analytics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage analytics',
      error: error.message
    });
  }
};

/**
 * Get user analytics data for the dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { timeframe = '30d', interval = 'day' } = req.query;
    
    // Get user analytics data
    const userData = await analyticsService.getUserAnalytics(tenantId, timeframe, interval);
    
    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    logger.error('Error fetching user analytics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
      error: error.message
    });
  }
};

/**
 * Get conversation analytics data for the dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getConversationAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { timeframe = '30d', interval = 'day' } = req.query;
    
    // Get conversation analytics data
    const conversationData = await analyticsService.getConversationAnalytics(tenantId, timeframe, interval);
    
    res.status(200).json({
      success: true,
      data: conversationData
    });
  } catch (error) {
    logger.error('Error fetching conversation analytics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation analytics',
      error: error.message
    });
  }
};

/**
 * Get template usage analytics data for the dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTemplateAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { timeframe = '30d' } = req.query;
    
    // Get template analytics data
    const templateData = await analyticsService.getTemplateAnalytics(tenantId, timeframe);
    
    res.status(200).json({
      success: true,
      data: templateData
    });
  } catch (error) {
    logger.error('Error fetching template analytics', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch template analytics',
      error: error.message
    });
  }
};
