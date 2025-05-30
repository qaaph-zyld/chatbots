/**
 * Conversation Tracking Service
 * 
 * This service provides capabilities for tracking conversations and collecting
 * data for analytics purposes. It stores conversation history, user interactions,
 * and metadata to enable insights generation and analytics.
 */

const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../utils');
const { StorageService } = require('../../storage/storage.service');

/**
 * Conversation Tracking Service class
 */
class ConversationTrackingService {
  /**
   * Initialize the conversation tracking service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      storageCollection: 'conversation_analytics',
      maxHistorySize: parseInt(process.env.MAX_CONVERSATION_HISTORY || '100'),
      trackingEnabled: process.env.TRACKING_ENABLED === 'true' || true,
      anonymizeUserData: process.env.ANONYMIZE_USER_DATA === 'true' || false,
      ...options
    };

    // Initialize storage
    this.storage = new StorageService({
      collection: this.options.storageCollection
    });

    logger.info('Conversation Tracking Service initialized with options:', {
      trackingEnabled: this.options.trackingEnabled,
      anonymizeUserData: this.options.anonymizeUserData,
      maxHistorySize: this.options.maxHistorySize
    });
  }

  /**
   * Track a conversation message
   * @param {Object} message - Message to track
   * @returns {Promise<Object>} - Tracking result
   */
  async trackMessage(message) {
    if (!this.options.trackingEnabled) {
      return { tracked: false, reason: 'Tracking disabled' };
    }

    try {
      // Validate message
      if (!message || !message.conversationId) {
        throw new Error('Invalid message: conversationId is required');
      }

      // Process message for tracking
      const trackingData = this._processMessageForTracking(message);

      // Get existing conversation or create new one
      let conversation = await this.storage.findOne({ conversationId: trackingData.conversationId });
      
      if (!conversation) {
        conversation = {
          conversationId: trackingData.conversationId,
          userId: trackingData.userId,
          botId: trackingData.botId,
          startedAt: trackingData.timestamp,
          updatedAt: trackingData.timestamp,
          messages: [],
          messageCount: 0,
          metrics: {
            userMessageCount: 0,
            botMessageCount: 0,
            averageResponseTime: 0,
            totalResponseTime: 0,
            averageUserMessageLength: 0,
            averageBotMessageLength: 0
          },
          metadata: trackingData.metadata || {}
        };
      }

      // Update conversation
      conversation.updatedAt = trackingData.timestamp;
      conversation.messageCount++;
      
      // Update metrics
      this._updateConversationMetrics(conversation, trackingData);
      
      // Add message to history (limiting size)
      conversation.messages.push(trackingData);
      if (conversation.messages.length > this.options.maxHistorySize) {
        conversation.messages = conversation.messages.slice(-this.options.maxHistorySize);
      }

      // Save conversation
      await this.storage.upsert({ conversationId: conversation.conversationId }, conversation);

      return { tracked: true, conversationId: conversation.conversationId };
    } catch (error) {
      logger.error('Error tracking message:', error.message);
      return { tracked: false, error: error.message };
    }
  }

  /**
   * Process a message for tracking
   * @param {Object} message - Message to process
   * @returns {Object} - Processed message
   * @private
   */
  _processMessageForTracking(message) {
    // Create a copy of the message to avoid modifying the original
    const trackingData = { ...message };

    // Add tracking ID and timestamp if not present
    trackingData.trackingId = trackingData.trackingId || uuidv4();
    trackingData.timestamp = trackingData.timestamp || new Date().toISOString();

    // Anonymize user data if enabled
    if (this.options.anonymizeUserData && trackingData.userId) {
      trackingData.userId = this._anonymizeUserId(trackingData.userId);
    }

    // Remove sensitive information
    delete trackingData.sensitiveData;
    delete trackingData.authToken;
    delete trackingData.password;

    return trackingData;
  }

  /**
   * Update conversation metrics
   * @param {Object} conversation - Conversation to update
   * @param {Object} message - New message
   * @private
   */
  _updateConversationMetrics(conversation, message) {
    const metrics = conversation.metrics;
    
    // Update message counts
    if (message.isUserMessage) {
      metrics.userMessageCount++;
      
      // Update average user message length
      const totalUserMessageLength = (metrics.averageUserMessageLength * (metrics.userMessageCount - 1)) + 
        (message.text ? message.text.length : 0);
      metrics.averageUserMessageLength = totalUserMessageLength / metrics.userMessageCount;
    } else {
      metrics.botMessageCount++;
      
      // Update average bot message length
      const totalBotMessageLength = (metrics.averageBotMessageLength * (metrics.botMessageCount - 1)) + 
        (message.text ? message.text.length : 0);
      metrics.averageBotMessageLength = totalBotMessageLength / metrics.botMessageCount;
      
      // Update response time if this is a bot response to a user message
      if (message.responseToMessageId && conversation.messages.length > 0) {
        const userMessage = conversation.messages.find(m => m.messageId === message.responseToMessageId);
        if (userMessage) {
          const responseTime = new Date(message.timestamp) - new Date(userMessage.timestamp);
          metrics.totalResponseTime += responseTime;
          metrics.averageResponseTime = metrics.totalResponseTime / metrics.botMessageCount;
        }
      }
    }
  }

  /**
   * Anonymize a user ID
   * @param {string} userId - User ID to anonymize
   * @returns {string} - Anonymized user ID
   * @private
   */
  _anonymizeUserId(userId) {
    // Simple anonymization using a hash function
    // In a real implementation, this would use a more secure method
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(userId).digest('hex');
  }

  /**
   * Get conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Conversation data
   */
  async getConversation(conversationId) {
    try {
      return await this.storage.findOne({ conversationId });
    } catch (error) {
      logger.error('Error getting conversation:', error.message);
      throw error;
    }
  }

  /**
   * Get conversations by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Conversations
   */
  async getConversationsByUser(userId, options = {}) {
    try {
      // Anonymize user ID if enabled
      const queryUserId = this.options.anonymizeUserData ? this._anonymizeUserId(userId) : userId;
      
      return await this.storage.find({ userId: queryUserId }, options);
    } catch (error) {
      logger.error('Error getting conversations by user:', error.message);
      throw error;
    }
  }

  /**
   * Get conversations by bot ID
   * @param {string} botId - Bot ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Conversations
   */
  async getConversationsByBot(botId, options = {}) {
    try {
      return await this.storage.find({ botId }, options);
    } catch (error) {
      logger.error('Error getting conversations by bot:', error.message);
      throw error;
    }
  }

  /**
   * Get conversations by time range
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Conversations
   */
  async getConversationsByTimeRange(startTime, endTime, options = {}) {
    try {
      const startIso = startTime.toISOString();
      const endIso = endTime.toISOString();
      
      return await this.storage.find({
        startedAt: { $gte: startIso },
        updatedAt: { $lte: endIso }
      }, options);
    } catch (error) {
      logger.error('Error getting conversations by time range:', error.message);
      throw error;
    }
  }

  /**
   * Delete conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<boolean>} - Whether deletion was successful
   */
  async deleteConversation(conversationId) {
    try {
      await this.storage.delete({ conversationId });
      return true;
    } catch (error) {
      logger.error('Error deleting conversation:', error.message);
      return false;
    }
  }

  /**
   * Get conversation statistics
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Object>} - Conversation statistics
   */
  async getConversationStatistics(filter = {}) {
    try {
      const conversations = await this.storage.find(filter);
      
      if (!conversations || conversations.length === 0) {
        return {
          totalConversations: 0,
          averageMessageCount: 0,
          averageResponseTime: 0,
          averageConversationLength: 0
        };
      }
      
      // Calculate statistics
      const totalConversations = conversations.length;
      let totalMessages = 0;
      let totalResponseTime = 0;
      let totalConversationLength = 0;
      
      conversations.forEach(conversation => {
        totalMessages += conversation.messageCount || 0;
        totalResponseTime += (conversation.metrics?.totalResponseTime || 0);
        
        if (conversation.startedAt && conversation.updatedAt) {
          const conversationLength = new Date(conversation.updatedAt) - new Date(conversation.startedAt);
          totalConversationLength += conversationLength;
        }
      });
      
      return {
        totalConversations,
        averageMessageCount: totalMessages / totalConversations,
        averageResponseTime: totalResponseTime / totalConversations,
        averageConversationLength: totalConversationLength / totalConversations
      };
    } catch (error) {
      logger.error('Error getting conversation statistics:', error.message);
      throw error;
    }
  }
}

// Create and export service instance
const conversationTrackingService = new ConversationTrackingService();

module.exports = {
  ConversationTrackingService,
  conversationTrackingService
};
