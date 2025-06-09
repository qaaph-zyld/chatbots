/**
 * Usage Controller
 * 
 * Handles API endpoints for usage monitoring and analytics
 */

require('@src/monitoring\usage.service');
require('@src/utils');

/**
 * Get usage statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getUsageStatistics = async (req, res) => {
  try {
    const { chatbotId, userId, platform, startDate, endDate } = req.query;
    
    // Build filter
    const filter = {};
    
    if (chatbotId) filter.chatbotId = chatbotId;
    if (userId) filter.userId = userId;
    if (platform) filter.platform = platform;
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);
    
    // Get statistics
    const statistics = await usageService.getUsageStatistics(filter);
    
    return res.status(200).json({
      status: 'success',
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting usage statistics:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get usage statistics',
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Get active users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getActiveUsers = async (req, res) => {
  try {
    const { chatbotId, platform, startDate, endDate } = req.query;
    
    // Build filter
    const filter = {};
    
    if (chatbotId) filter.chatbotId = chatbotId;
    if (platform) filter.platform = platform;
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);
    
    // Get active users
    const activeUsers = await usageService.getActiveUsers(filter);
    
    return res.status(200).json({
      status: 'success',
      data: activeUsers
    });
  } catch (error) {
    logger.error('Error getting active users:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get active users',
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Get usage by platform
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getUsageByPlatform = async (req, res) => {
  try {
    const { chatbotId, startDate, endDate } = req.query;
    
    // Build filter
    const filter = {};
    
    if (chatbotId) filter.chatbotId = chatbotId;
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);
    
    // Get usage by platform
    const usageByPlatform = await usageService.getUsageByPlatform(filter);
    
    return res.status(200).json({
      status: 'success',
      data: usageByPlatform
    });
  } catch (error) {
    logger.error('Error getting usage by platform:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get usage by platform',
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Get usage by time of day
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getUsageByTimeOfDay = async (req, res) => {
  try {
    const { chatbotId, platform, startDate, endDate } = req.query;
    
    // Build filter
    const filter = {};
    
    if (chatbotId) filter.chatbotId = chatbotId;
    if (platform) filter.platform = platform;
    if (startDate) filter.startDate = new Date(startDate);
    if (endDate) filter.endDate = new Date(endDate);
    
    // Get usage by time of day
    const usageByTimeOfDay = await usageService.getUsageByTimeOfDay(filter);
    
    return res.status(200).json({
      status: 'success',
      data: usageByTimeOfDay
    });
  } catch (error) {
    logger.error('Error getting usage by time of day:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get usage by time of day',
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

/**
 * Track usage (internal use only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.trackUsage = async (req, res) => {
  try {
    const { type, chatbotId, userId, platform, data } = req.body;
    
    // Validate required fields
    if (!type || !chatbotId || !userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Type, chatbotId, and userId are required fields',
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Track usage
    await usageService.trackUsage({
      type,
      chatbotId,
      userId,
      platform,
      ...data
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Usage tracked successfully'
    });
  } catch (error) {
    logger.error('Error tracking usage:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to track usage',
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};
