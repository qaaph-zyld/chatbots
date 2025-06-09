/**
 * Analytics Controller
 * 
 * API endpoints for analytics, insights, and learning
 */

require('@src/analytics');
require('@src/analytics\conversation');
require('@src/analytics\conversation\feedback.service');
require('@src/analytics\learning');
require('@src/utils');

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

/**
 * Get conversation analytics dashboard
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getConversationDashboard = async (req, res) => {
  try {
    const { timeRange, botId, userId, useCache, metrics } = req.query;
    
    const options = {
      timeRange: timeRange ? parseInt(timeRange) : undefined,
      botId,
      userId,
      useCache: useCache === 'false' ? false : true,
      metrics: metrics ? metrics.split(',') : undefined
    };
    
    const dashboard = await conversationDashboardService.generateDashboard(options);
    
    res.json(dashboard);
  } catch (error) {
    logger.error('Error getting conversation dashboard:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get conversation insights
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getConversationInsights = async (req, res) => {
  try {
    const { timeRange, botId, userId, useCache, insightTypes } = req.query;
    
    const options = {
      timeRange: timeRange ? parseInt(timeRange) : undefined,
      botId,
      userId,
      useCache: useCache === 'false' ? false : true,
      insightTypes: insightTypes ? insightTypes.split(',') : undefined
    };
    
    const insights = await conversationInsightsService.generateInsights(options);
    
    res.json(insights);
  } catch (error) {
    logger.error('Error getting conversation insights:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Track conversation message
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const trackConversationMessage = async (req, res) => {
  try {
    const result = await conversationTrackingService.trackMessage(req.body);
    
    res.json(result);
  } catch (error) {
    logger.error('Error tracking conversation message:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get conversation history
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await conversationTrackingService.getConversation(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (error) {
    logger.error('Error getting conversation history:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Submit feedback for a chatbot response
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const submitFeedback = async (req, res) => {
  try {
    const {
      chatbotId,
      conversationId,
      messageId,
      userId,
      rating,
      comment,
      tags,
      query,
      response,
      intent,
      entities,
      context,
      metadata
    } = req.body;
    
    if (!chatbotId || !conversationId || !messageId || !userId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const feedback = await feedbackService.submitFeedback({
      chatbotId,
      conversationId,
      messageId,
      userId,
      rating,
      comment,
      tags,
      query,
      response,
      intent,
      entities,
      context,
      metadata
    });
    
    res.json(feedback);
  } catch (error) {
    logger.error('Error submitting feedback:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get feedback for a chatbot
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getFeedback = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const filters = req.query;
    
    const feedback = await feedbackService.getFeedback(chatbotId, filters);
    
    res.json(feedback);
  } catch (error) {
    logger.error('Error getting feedback:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get feedback statistics for a chatbot
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getFeedbackStats = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const filters = req.query;
    
    const stats = await feedbackService.getFeedbackStats(chatbotId, filters);
    
    res.json(stats);
  } catch (error) {
    logger.error('Error getting feedback stats:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a continuous learning job
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createLearningJob = async (req, res) => {
  try {
    const { chatbotId, type, config } = req.body;
    
    if (!chatbotId || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const job = await continuousLearning.createLearningJob({
      chatbotId,
      type,
      config
    });
    
    res.json(job);
  } catch (error) {
    logger.error('Error creating learning job:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get learning jobs for a chatbot
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getLearningJobs = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const filters = req.query;
    
    const jobs = await continuousLearning.getLearningJobs(chatbotId, filters);
    
    res.json(jobs);
  } catch (error) {
    logger.error('Error getting learning jobs:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a learning job by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getLearningJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await continuousLearning.getLearningJob(jobId);
    
    res.json(job);
  } catch (error) {
    logger.error('Error getting learning job:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a model fine-tuning job
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createFineTuningJob = async (req, res) => {
  try {
    const { chatbotId, modelType, baseModelPath, config } = req.body;
    
    if (!chatbotId || !modelType || !baseModelPath) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const job = await fineTuning.createFineTuningJob({
      chatbotId,
      modelType,
      baseModelPath,
      config
    });
    
    res.json(job);
  } catch (error) {
    logger.error('Error creating fine-tuning job:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get fine-tuning jobs for a chatbot
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getFineTuningJobs = async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const filters = req.query;
    
    const jobs = await fineTuning.getFineTuningJobs(chatbotId, filters);
    
    res.json(jobs);
  } catch (error) {
    logger.error('Error getting fine-tuning jobs:', error.message);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a fine-tuning job by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getFineTuningJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = await fineTuning.getFineTuningJob(jobId);
    
    res.json(job);
  } catch (error) {
    logger.error('Error getting fine-tuning job:', error.message);
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
  applyLearning,
  getConversationDashboard,
  getConversationInsights,
  trackConversationMessage,
  getConversationHistory,
  submitFeedback,
  getFeedback,
  getFeedbackStats,
  createLearningJob,
  getLearningJobs,
  getLearningJob,
  createFineTuningJob,
  getFineTuningJobs,
  getFineTuningJob
};
