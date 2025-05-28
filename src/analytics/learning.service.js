/**
 * Learning Service
 * 
 * Enables chatbots to learn from past conversations and improve responses
 */

const mongoose = require('mongoose');
const analyticsService = require('./analytics.service');
const { logger } = require('../utils');

// Define learning schema
const LearningSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  type: {
    type: String,
    enum: ['query_response', 'intent_pattern', 'entity_pattern', 'fallback_response'],
    required: true
  },
  source: {
    type: String,
    enum: ['user_feedback', 'analytics', 'manual'],
    required: true
  },
  data: {
    query: String,
    response: String,
    intent: String,
    entity: {
      type: String,
      value: String
    },
    pattern: String,
    confidence: Number
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  metadata: {
    conversationId: String,
    userId: String,
    timestamp: Date,
    feedback: {
      rating: String,
      comment: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create model
const Learning = mongoose.model('Learning', LearningSchema);

/**
 * Learning Service class
 */
class LearningService {
  /**
   * Constructor
   */
  constructor() {
    this.learningThreshold = 3; // Minimum occurrences to consider learning
    this.confidenceThreshold = 0.7; // Minimum confidence to auto-approve learning
    
    logger.info('Learning Service initialized');
  }
  
  /**
   * Add a learning item from user feedback
   * @param {Object} data - Learning data
   * @returns {Promise<Object>} - Created learning item
   */
  async addLearningFromFeedback(data) {
    try {
      const { chatbotId, type, query, response, intent, entity, pattern, conversationId, userId, rating, comment } = data;
      
      // Create learning item
      const learningItem = new Learning({
        chatbotId,
        type,
        source: 'user_feedback',
        data: {
          query,
          response,
          intent,
          entity,
          pattern,
          confidence: 0.9 // High confidence for user feedback
        },
        status: rating === 'positive' ? 'approved' : 'pending',
        metadata: {
          conversationId,
          userId,
          timestamp: new Date(),
          feedback: {
            rating,
            comment
          }
        }
      });
      
      await learningItem.save();
      logger.info(`Added learning item from user feedback for chatbot ${chatbotId}`);
      
      return learningItem.toObject();
    } catch (error) {
      logger.error('Error adding learning item from feedback:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate learning items from analytics
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array<Object>>} - Generated learning items
   */
  async generateLearningFromAnalytics(chatbotId) {
    try {
      // Get analytics data
      const analytics = await analyticsService.getAnalytics(chatbotId, 'all');
      
      const learningItems = [];
      
      // Learn from failed queries
      if (analytics.topFailedQueries && analytics.topFailedQueries.length > 0) {
        for (const failedQuery of analytics.topFailedQueries) {
          if (failedQuery.count >= this.learningThreshold) {
            // Create learning item for fallback response
            const learningItem = new Learning({
              chatbotId,
              type: 'fallback_response',
              source: 'analytics',
              data: {
                query: failedQuery.query,
                confidence: Math.min(failedQuery.count / 10, 0.9)
              },
              status: 'pending'
            });
            
            await learningItem.save();
            learningItems.push(learningItem.toObject());
          }
        }
      }
      
      // Learn from top intents
      if (analytics.intentAnalysis) {
        const intents = Object.entries(analytics.intentAnalysis)
          .map(([intent, count]) => ({ intent, count }))
          .sort((a, b) => b.count - a.count);
        
        for (const intentData of intents) {
          if (intentData.count >= this.learningThreshold * 2) {
            // Create learning item for intent pattern
            const learningItem = new Learning({
              chatbotId,
              type: 'intent_pattern',
              source: 'analytics',
              data: {
                intent: intentData.intent,
                confidence: Math.min(intentData.count / 20, 0.9)
              },
              status: intentData.count >= this.learningThreshold * 5 ? 'approved' : 'pending'
            });
            
            await learningItem.save();
            learningItems.push(learningItem.toObject());
          }
        }
      }
      
      logger.info(`Generated ${learningItems.length} learning items from analytics for chatbot ${chatbotId}`);
      
      return learningItems;
    } catch (error) {
      logger.error(`Error generating learning from analytics for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Add a manual learning item
   * @param {Object} data - Learning data
   * @returns {Promise<Object>} - Created learning item
   */
  async addManualLearning(data) {
    try {
      const { chatbotId, type, query, response, intent, entity, pattern } = data;
      
      // Create learning item
      const learningItem = new Learning({
        chatbotId,
        type,
        source: 'manual',
        data: {
          query,
          response,
          intent,
          entity,
          pattern,
          confidence: 1.0 // Maximum confidence for manual entries
        },
        status: 'approved' // Auto-approve manual entries
      });
      
      await learningItem.save();
      logger.info(`Added manual learning item for chatbot ${chatbotId}`);
      
      return learningItem.toObject();
    } catch (error) {
      logger.error('Error adding manual learning item:', error.message);
      throw error;
    }
  }
  
  /**
   * Get learning items for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array<Object>>} - Learning items
   */
  async getLearningItems(chatbotId, filters = {}) {
    try {
      const query = { chatbotId, ...filters };
      
      const learningItems = await Learning.find(query)
        .sort({ createdAt: -1 })
        .limit(100);
      
      return learningItems.map(item => item.toObject());
    } catch (error) {
      logger.error(`Error getting learning items for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Update learning item status
   * @param {string} learningId - Learning item ID
   * @param {string} status - New status (approved, rejected)
   * @returns {Promise<Object>} - Updated learning item
   */
  async updateLearningStatus(learningId, status) {
    try {
      const learningItem = await Learning.findById(learningId);
      
      if (!learningItem) {
        throw new Error(`Learning item not found: ${learningId}`);
      }
      
      learningItem.status = status;
      learningItem.updatedAt = new Date();
      
      await learningItem.save();
      logger.info(`Updated learning item ${learningId} status to ${status}`);
      
      return learningItem.toObject();
    } catch (error) {
      logger.error(`Error updating learning item ${learningId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Apply approved learning items to a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Application results
   */
  async applyLearning(chatbotId) {
    try {
      // Get approved learning items
      const learningItems = await Learning.find({
        chatbotId,
        status: 'approved'
      });
      
      if (learningItems.length === 0) {
        return { applied: 0, message: 'No approved learning items to apply' };
      }
      
      // Group by type
      const groupedItems = {
        query_response: [],
        intent_pattern: [],
        entity_pattern: [],
        fallback_response: []
      };
      
      for (const item of learningItems) {
        groupedItems[item.type].push(item);
      }
      
      // Apply learning items
      const results = {
        query_response: await this.applyQueryResponseLearning(chatbotId, groupedItems.query_response),
        intent_pattern: await this.applyIntentPatternLearning(chatbotId, groupedItems.intent_pattern),
        entity_pattern: await this.applyEntityPatternLearning(chatbotId, groupedItems.entity_pattern),
        fallback_response: await this.applyFallbackResponseLearning(chatbotId, groupedItems.fallback_response)
      };
      
      const totalApplied = Object.values(results).reduce((sum, result) => sum + result.applied, 0);
      
      logger.info(`Applied ${totalApplied} learning items for chatbot ${chatbotId}`);
      
      return {
        applied: totalApplied,
        results
      };
    } catch (error) {
      logger.error(`Error applying learning for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Apply query-response learning items
   * @param {string} chatbotId - Chatbot ID
   * @param {Array<Object>} items - Learning items
   * @returns {Promise<Object>} - Application results
   * @private
   */
  async applyQueryResponseLearning(chatbotId, items) {
    try {
      if (items.length === 0) {
        return { applied: 0, message: 'No query-response items to apply' };
      }
      
      // Get knowledge base service
      const knowledgeBaseService = require('../services/knowledgeBase.service');
      
      // Find or create a learning knowledge base
      let knowledgeBase = await knowledgeBaseService.getKnowledgeBaseByName(chatbotId, 'Learned Responses');
      
      if (!knowledgeBase) {
        knowledgeBase = await knowledgeBaseService.createKnowledgeBase({
          chatbotId,
          name: 'Learned Responses',
          description: 'Automatically learned responses from user interactions',
          source: 'learning'
        });
      }
      
      // Add items to knowledge base
      let applied = 0;
      
      for (const item of items) {
        if (item.data.query && item.data.response) {
          await knowledgeBaseService.addKnowledgeItem(knowledgeBase._id, {
            question: item.data.query,
            answer: item.data.response,
            metadata: {
              source: item.source,
              confidence: item.data.confidence,
              learningId: item._id
            }
          });
          
          applied++;
        }
      }
      
      return { applied, message: `Added ${applied} items to knowledge base` };
    } catch (error) {
      logger.error(`Error applying query-response learning for chatbot ${chatbotId}:`, error.message);
      return { applied: 0, error: error.message };
    }
  }
  
  /**
   * Apply intent pattern learning items
   * @param {string} chatbotId - Chatbot ID
   * @param {Array<Object>} items - Learning items
   * @returns {Promise<Object>} - Application results
   * @private
   */
  async applyIntentPatternLearning(chatbotId, items) {
    try {
      if (items.length === 0) {
        return { applied: 0, message: 'No intent pattern items to apply' };
      }
      
      // Get training service
      const trainingService = require('../services/training.service');
      
      // Find or create a learning dataset
      let dataset = await trainingService.getDatasetByName(chatbotId, 'Learned Intents');
      
      if (!dataset) {
        dataset = await trainingService.createDataset({
          chatbotId,
          name: 'Learned Intents',
          description: 'Automatically learned intent patterns',
          type: 'intent'
        });
      }
      
      // Add items to dataset
      let applied = 0;
      
      for (const item of items) {
        if (item.data.intent && (item.data.query || item.data.pattern)) {
          await trainingService.addExample(dataset._id, {
            text: item.data.query || item.data.pattern,
            intent: item.data.intent,
            metadata: {
              source: item.source,
              confidence: item.data.confidence,
              learningId: item._id
            }
          });
          
          applied++;
        }
      }
      
      return { applied, message: `Added ${applied} examples to intent dataset` };
    } catch (error) {
      logger.error(`Error applying intent pattern learning for chatbot ${chatbotId}:`, error.message);
      return { applied: 0, error: error.message };
    }
  }
  
  /**
   * Apply entity pattern learning items
   * @param {string} chatbotId - Chatbot ID
   * @param {Array<Object>} items - Learning items
   * @returns {Promise<Object>} - Application results
   * @private
   */
  async applyEntityPatternLearning(chatbotId, items) {
    try {
      if (items.length === 0) {
        return { applied: 0, message: 'No entity pattern items to apply' };
      }
      
      // Get training service
      const trainingService = require('../services/training.service');
      
      // Find or create a learning dataset
      let dataset = await trainingService.getDatasetByName(chatbotId, 'Learned Entities');
      
      if (!dataset) {
        dataset = await trainingService.createDataset({
          chatbotId,
          name: 'Learned Entities',
          description: 'Automatically learned entity patterns',
          type: 'entity'
        });
      }
      
      // Add items to dataset
      let applied = 0;
      
      for (const item of items) {
        if (item.data.entity && item.data.entity.type && item.data.entity.value && (item.data.query || item.data.pattern)) {
          await trainingService.addExample(dataset._id, {
            text: item.data.query || item.data.pattern,
            entities: [{
              type: item.data.entity.type,
              value: item.data.entity.value,
              start: item.data.query ? item.data.query.indexOf(item.data.entity.value) : 0,
              end: item.data.query ? item.data.query.indexOf(item.data.entity.value) + item.data.entity.value.length : 0
            }],
            metadata: {
              source: item.source,
              confidence: item.data.confidence,
              learningId: item._id
            }
          });
          
          applied++;
        }
      }
      
      return { applied, message: `Added ${applied} examples to entity dataset` };
    } catch (error) {
      logger.error(`Error applying entity pattern learning for chatbot ${chatbotId}:`, error.message);
      return { applied: 0, error: error.message };
    }
  }
  
  /**
   * Apply fallback response learning items
   * @param {string} chatbotId - Chatbot ID
   * @param {Array<Object>} items - Learning items
   * @returns {Promise<Object>} - Application results
   * @private
   */
  async applyFallbackResponseLearning(chatbotId, items) {
    try {
      if (items.length === 0) {
        return { applied: 0, message: 'No fallback response items to apply' };
      }
      
      // Get knowledge base service
      const knowledgeBaseService = require('../services/knowledgeBase.service');
      
      // Find or create a learning knowledge base
      let knowledgeBase = await knowledgeBaseService.getKnowledgeBaseByName(chatbotId, 'Learned Fallbacks');
      
      if (!knowledgeBase) {
        knowledgeBase = await knowledgeBaseService.createKnowledgeBase({
          chatbotId,
          name: 'Learned Fallbacks',
          description: 'Automatically learned fallback responses',
          source: 'learning'
        });
      }
      
      // Add items to knowledge base
      let applied = 0;
      
      for (const item of items) {
        if (item.data.query) {
          await knowledgeBaseService.addKnowledgeItem(knowledgeBase._id, {
            question: item.data.query,
            answer: 'I need to learn more about this topic. Could you provide more information?',
            metadata: {
              source: item.source,
              confidence: item.data.confidence,
              learningId: item._id,
              needsResponse: true
            }
          });
          
          applied++;
        }
      }
      
      return { applied, message: `Added ${applied} fallback items to knowledge base` };
    } catch (error) {
      logger.error(`Error applying fallback response learning for chatbot ${chatbotId}:`, error.message);
      return { applied: 0, error: error.message };
    }
  }
}

// Create singleton instance
const learningService = new LearningService();

module.exports = learningService;
