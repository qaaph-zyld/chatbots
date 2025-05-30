/**
 * Feedback Collection Service
 * 
 * Collects and processes user feedback on chatbot responses to enable
 * continuous learning and improvement of the chatbot.
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../utils');
const learningService = require('../learning.service');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

// Define feedback schema
const FeedbackSchema = new mongoose.Schema({
  feedbackId: {
    type: String,
    default: () => uuidv4(),
    unique: true
  },
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  conversationId: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  rating: {
    type: String,
    enum: ['positive', 'negative', 'neutral'],
    required: true
  },
  comment: {
    type: String
  },
  tags: [{
    type: String
  }],
  query: {
    type: String
  },
  response: {
    type: String
  },
  intent: {
    type: String
  },
  entities: [{
    type: {
      type: String
    },
    value: {
      type: String
    }
  }],
  context: {
    type: Object
  },
  metadata: {
    type: Object
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create model
const Feedback = mongoose.model('Feedback', FeedbackSchema);

/**
 * Feedback Collection Service class
 */
class FeedbackService {
  /**
   * Constructor
   */
  constructor() {
    this.proxyConfig = process.env.HTTP_PROXY || 'http://104.129.196.38:10563';
    this.httpClient = axios.create({
      httpAgent: new HttpsProxyAgent(this.proxyConfig),
      httpsAgent: new HttpsProxyAgent(this.proxyConfig)
    });
    
    logger.info('Feedback Collection Service initialized');
  }
  
  /**
   * Submit feedback for a chatbot response
   * @param {Object} data - Feedback data
   * @returns {Promise<Object>} - Created feedback item
   */
  async submitFeedback(data) {
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
      } = data;
      
      // Create feedback item
      const feedback = new Feedback({
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
      
      await feedback.save();
      logger.info(`Feedback submitted for chatbot ${chatbotId}, message ${messageId}`);
      
      // If rating is provided, create learning item
      if (rating && query && response) {
        await this.createLearningItem(feedback);
      }
      
      return feedback.toObject();
    } catch (error) {
      logger.error('Error submitting feedback:', error.message);
      throw error;
    }
  }
  
  /**
   * Create learning item from feedback
   * @param {Object} feedback - Feedback object
   * @returns {Promise<Object>} - Created learning item
   * @private
   */
  async createLearningItem(feedback) {
    try {
      // Only create learning items for positive or negative feedback
      if (feedback.rating === 'neutral') {
        return null;
      }
      
      const learningData = {
        chatbotId: feedback.chatbotId,
        type: 'query_response',
        query: feedback.query,
        response: feedback.response,
        intent: feedback.intent,
        entity: feedback.entities && feedback.entities.length > 0 ? feedback.entities[0] : null,
        conversationId: feedback.conversationId,
        userId: feedback.userId,
        rating: feedback.rating,
        comment: feedback.comment
      };
      
      const learningItem = await learningService.addLearningFromFeedback(learningData);
      logger.info(`Created learning item from feedback for chatbot ${feedback.chatbotId}`);
      
      return learningItem;
    } catch (error) {
      logger.error('Error creating learning item from feedback:', error.message);
      return null;
    }
  }
  
  /**
   * Get feedback for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array<Object>>} - Feedback items
   */
  async getFeedback(chatbotId, filters = {}) {
    try {
      const query = { chatbotId, ...filters };
      
      const feedback = await Feedback.find(query)
        .sort({ createdAt: -1 })
        .limit(100);
      
      return feedback.map(item => item.toObject());
    } catch (error) {
      logger.error(`Error getting feedback for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get feedback statistics for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Feedback statistics
   */
  async getFeedbackStats(chatbotId, filters = {}) {
    try {
      const query = { chatbotId, ...filters };
      
      const [total, positive, negative, neutral] = await Promise.all([
        Feedback.countDocuments(query),
        Feedback.countDocuments({ ...query, rating: 'positive' }),
        Feedback.countDocuments({ ...query, rating: 'negative' }),
        Feedback.countDocuments({ ...query, rating: 'neutral' })
      ]);
      
      // Calculate percentages
      const positivePercentage = total > 0 ? (positive / total * 100).toFixed(2) : 0;
      const negativePercentage = total > 0 ? (negative / total * 100).toFixed(2) : 0;
      const neutralPercentage = total > 0 ? (neutral / total * 100).toFixed(2) : 0;
      
      // Get most common tags
      const tagResults = await Feedback.aggregate([
        { $match: query },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      const commonTags = tagResults.map(tag => ({
        tag: tag._id,
        count: tag.count
      }));
      
      return {
        total,
        ratings: {
          positive,
          negative,
          neutral,
          positivePercentage,
          negativePercentage,
          neutralPercentage
        },
        commonTags
      };
    } catch (error) {
      logger.error(`Error getting feedback stats for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Delete feedback
   * @param {string} feedbackId - Feedback ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteFeedback(feedbackId) {
    try {
      const result = await Feedback.deleteOne({ feedbackId });
      
      if (result.deletedCount === 0) {
        throw new Error(`Feedback not found: ${feedbackId}`);
      }
      
      logger.info(`Deleted feedback ${feedbackId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting feedback ${feedbackId}:`, error.message);
      throw error;
    }
  }
}

// Create singleton instance
const feedbackService = new FeedbackService();

module.exports = feedbackService;
