/**
 * Analytics Controller
 * 
 * API endpoints for analytics, insights, and learning
 */

const { analyticsService, insightsService, learningService } = require('../../analytics');
const { logger } = require('../../utils');

/**
 * Get analytics for a chatbot
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAnalytics = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { period = 'all', date } = req.query;
    
    const analytics = await analyticsService.getAnalytics(
      chatbotId, 
      period, 
      date ? new Date(date) : new Date()
    );
    
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting analytics:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get analytics for all chatbots
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getAllAnalytics = async (req, res) => {
  try {
    const { period = 'all', date } = req.query;
    
    const analytics = await analyticsService.getAllAnalytics(
      period, 
      date ? new Date(date) : new Date()
    );
    
    res.json(analytics);
  } catch (error) {
    logger.error('Error getting all analytics:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Track response rating
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const trackResponseRating = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { conversationId, rating } = req.body;
    
    if (!conversationId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await analyticsService.trackResponseRating(chatbotId, conversationId, rating);
    
    // Add learning from feedback if positive rating
    if (rating === 'positive' && req.body.query && req.body.response) {
      await learningService.addLearningFromFeedback({
        chatbotId,
        type: 'query_response',
        query: req.body.query,
        response: req.body.response,
        conversationId,
        userId: req.body.userId,
        rating,
        comment: req.body.comment
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking response rating:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get insights for a chatbot
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getInsights = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { period = 'monthly' } = req.query;
    
    const insights = await insightsService.generateInsights(chatbotId, period);
    
    res.json(insights);
  } catch (error) {
    logger.error('Error getting insights:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Compare analytics between periods
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const compareAnalytics = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { period = 'monthly', currentDate, previousDate } = req.query;
    
    const comparison = await insightsService.compareAnalytics(
      chatbotId,
      period,
      currentDate ? new Date(currentDate) : new Date(),
      previousDate ? new Date(previousDate) : null
    );
    
    res.json(comparison);
  } catch (error) {
    logger.error('Error comparing analytics:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get learning items for a chatbot
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getLearningItems = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { type, source, status } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (source) filters.source = source;
    if (status) filters.status = status;
    
    const learningItems = await learningService.getLearningItems(chatbotId, filters);
    
    res.json(learningItems);
  } catch (error) {
    logger.error('Error getting learning items:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add manual learning item
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const addManualLearning = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { type, query, response, intent, entity, pattern } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const learningItem = await learningService.addManualLearning({
      chatbotId,
      type,
      query,
      response,
      intent,
      entity,
      pattern
    });
    
    res.status(201).json(learningItem);
  } catch (error) {
    logger.error('Error adding manual learning:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update learning item status
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateLearningStatus = async (req, res) => {
  try {
    const { learningId } = req.params;
    const { status } = req.body;
    
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const learningItem = await learningService.updateLearningStatus(learningId, status);
    
    res.json(learningItem);
  } catch (error) {
    logger.error('Error updating learning status:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate learning from analytics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const generateLearning = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    
    const learningItems = await learningService.generateLearningFromAnalytics(chatbotId);
    
    res.json(learningItems);
  } catch (error) {
    logger.error('Error generating learning:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Apply learning to chatbot
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const applyLearning = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    
    const results = await learningService.applyLearning(chatbotId);
    
    res.json(results);
  } catch (error) {
    logger.error('Error applying learning:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAnalytics,
  getAllAnalytics,
  trackResponseRating,
  getInsights,
  compareAnalytics,
  getLearningItems,
  addManualLearning,
  updateLearningStatus,
  generateLearning,
  applyLearning
};
