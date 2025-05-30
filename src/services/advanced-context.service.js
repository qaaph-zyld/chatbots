/**
 * Advanced Context Service
 * 
 * This service integrates entity tracking, topic detection, and preference learning
 * to provide comprehensive context awareness across conversations.
 */

const entityTrackingService = require('./entity-tracking.service');
const topicDetectionService = require('./topic-detection.service');
const preferenceLearningService = require('./preference-learning.service');
const { logger } = require('../utils');
const axios = require('axios');

// Configure axios with proxy
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

class AdvancedContextService {
  /**
   * Process a message to extract context information
   * @param {String} message - User message
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {String} conversationId - Conversation ID
   * @returns {Promise<Object>} - Extracted context
   */
  async processMessage(message, userId, chatbotId, conversationId) {
    try {
      logger.info(`Processing message for context: ${conversationId}`);
      
      // Process message in parallel for efficiency
      const [
        detectedTopics,
        inferredPreferences
      ] = await Promise.all([
        topicDetectionService.detectTopics(message, userId, chatbotId, conversationId),
        preferenceLearningService.inferPreferencesFromMessage(message, userId, chatbotId, conversationId)
      ]);
      
      // Entity extraction would typically be done here as well
      // For this implementation, we assume entities are tracked separately
      
      return {
        topics: detectedTopics,
        preferences: inferredPreferences
      };
    } catch (error) {
      logger.error('Error processing message for context:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive context for a conversation
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Comprehensive context
   */
  async getConversationContext(conversationId, userId, chatbotId) {
    try {
      // Get context from all services in parallel
      const [
        entities,
        topics,
        preferences
      ] = await Promise.all([
        entityTrackingService.getConversationEntities(conversationId, userId, chatbotId),
        topicDetectionService.getConversationTopics(conversationId, userId, chatbotId),
        preferenceLearningService.getUserPreferences(userId, chatbotId)
      ]);
      
      return {
        entities,
        topics,
        preferences,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error getting conversation context:', error);
      throw error;
    }
  }

  /**
   * Get cross-conversation context for a user
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Cross-conversation context
   */
  async getCrossConversationContext(userId, chatbotId) {
    try {
      // Get context from all services in parallel
      const [
        entities,
        topicHistory,
        preferences
      ] = await Promise.all([
        entityTrackingService.getUserEntities(userId, chatbotId),
        topicDetectionService.getUserTopicHistory(userId, chatbotId),
        preferenceLearningService.getUserPreferences(userId, chatbotId)
      ]);
      
      return {
        entities,
        topicHistory,
        preferences,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error getting cross-conversation context:', error);
      throw error;
    }
  }

  /**
   * Apply context to generate personalized responses
   * @param {Array} responseOptions - Response options
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {String} conversationId - Conversation ID
   * @returns {Promise<Object>} - Personalized response
   */
  async applyContextToResponses(responseOptions, userId, chatbotId, conversationId) {
    try {
      // Apply user preferences to responses
      const personalizedResponses = await preferenceLearningService.applyPreferencesToResponses(
        responseOptions, 
        userId, 
        chatbotId
      );
      
      // Get current context
      const context = await this.getConversationContext(conversationId, userId, chatbotId);
      
      // Return personalized response with context
      return {
        ...personalizedResponses,
        appliedContext: {
          topicCount: context.topics.length,
          entityCount: context.entities.length,
          preferenceCount: context.preferences.length
        }
      };
    } catch (error) {
      logger.error('Error applying context to responses:', error);
      throw error;
    }
  }

  /**
   * Reset all context for a user
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Reset results
   */
  async resetUserContext(userId, chatbotId) {
    try {
      // Get all entities for deletion
      const entities = await entityTrackingService.getUserEntities(userId, chatbotId);
      
      // Delete each entity (which also deletes relations and references)
      const entityDeletionPromises = entities.map(entity => 
        entityTrackingService.deleteEntity(entity._id, userId, chatbotId)
      );
      
      // Get all topics for deletion
      const topicHistory = await topicDetectionService.getUserTopicHistory(userId, chatbotId);
      
      // Delete each topic (which also deletes references)
      const topicDeletionPromises = topicHistory.map(topic => 
        topicDetectionService.deleteTopic(topic._id, userId, chatbotId)
      );
      
      // Reset preferences
      const preferencesReset = preferenceLearningService.resetUserPreferences(userId, chatbotId);
      
      // Wait for all deletions to complete
      const [
        entityResults,
        topicResults,
        preferencesDeleted
      ] = await Promise.all([
        Promise.all(entityDeletionPromises),
        Promise.all(topicDeletionPromises),
        preferencesReset
      ]);
      
      return {
        entitiesDeleted: entityResults.length,
        topicsDeleted: topicResults.length,
        preferencesDeleted,
        success: true
      };
    } catch (error) {
      logger.error('Error resetting user context:', error);
      throw error;
    }
  }
}

module.exports = new AdvancedContextService();
