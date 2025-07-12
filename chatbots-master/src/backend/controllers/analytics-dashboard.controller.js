/**
 * Analytics Dashboard Controller
 * 
 * Handles requests for analytics data and metrics
 */

const AnalyticsService = require('../services/analytics.service');
const logger = require('../utils/logger');

/**
 * Get overview metrics and trends
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getOverview = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    // Get analytics data from service
    const data = await AnalyticsService.getOverviewMetrics(userId, startDate, endDate);
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error(`Error fetching overview analytics: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch overview analytics'
    });
  }
};

/**
 * Get conversation metrics and distributions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getConversations = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    // Get conversation analytics from service
    const data = await AnalyticsService.getConversationMetrics(userId, startDate, endDate);
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error(`Error fetching conversation analytics: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation analytics'
    });
  }
};

/**
 * Get template usage statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTemplates = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    // Get template analytics from service
    const data = await AnalyticsService.getTemplateMetrics(userId, startDate, endDate);
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error(`Error fetching template analytics: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch template analytics'
    });
  }
};

/**
 * Get user engagement metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUserEngagement = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    // Get user engagement analytics from service
    const data = await AnalyticsService.getUserEngagementMetrics(userId, startDate, endDate);
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error(`Error fetching user engagement analytics: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user engagement analytics'
    });
  }
};

/**
 * Get response quality metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getResponseQuality = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    
    // Get response quality analytics from service
    const data = await AnalyticsService.getResponseQualityMetrics(userId, startDate, endDate);
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error(`Error fetching response quality analytics: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch response quality analytics'
    });
  }
};