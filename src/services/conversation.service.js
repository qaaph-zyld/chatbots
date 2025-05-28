/**
 * Conversation Service
 * 
 * Handles conversation state management operations
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Conversation = require('../database/schemas/conversation.schema');
const { logger } = require('../utils');

class ConversationService {
  /**
   * Create a new conversation
   * @param {string} chatbotId - ID of the chatbot
   * @param {string} userId - ID of the user (optional)
   * @param {Object} initialContext - Initial conversation context
   * @returns {Promise<Object>} - Created conversation
   */
  async createConversation(chatbotId, userId = 'anonymous', initialContext = {}) {
    try {
      logger.debug(`Creating new conversation for chatbot ${chatbotId} and user ${userId}`);
      
      const sessionId = uuidv4();
      
      const conversation = new Conversation({
        chatbotId,
        sessionId,
        userId,
        context: initialContext,
        messages: [],
        startedAt: new Date(),
        lastMessageAt: new Date(),
        isActive: true,
        metadata: {}
      });
      
      await conversation.save();
      
      logger.info(`Created new conversation: ${conversation._id} (session: ${sessionId})`);
      
      return conversation;
    } catch (error) {
      logger.error('Error creating conversation:', error.message);
      throw error;
    }
  }
  
  /**
   * Get conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Conversation object
   */
  async getConversationById(conversationId) {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        logger.warn(`Conversation not found: ${conversationId}`);
        return null;
      }
      
      return conversation;
    } catch (error) {
      logger.error(`Error fetching conversation ${conversationId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get conversation by session ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Conversation object
   */
  async getConversationBySessionId(sessionId) {
    try {
      const conversation = await Conversation.findOne({ sessionId });
      
      if (!conversation) {
        logger.warn(`Conversation not found for session: ${sessionId}`);
        return null;
      }
      
      return conversation;
    } catch (error) {
      logger.error(`Error fetching conversation for session ${sessionId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get active conversations for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {number} limit - Maximum number of conversations to return
   * @returns {Promise<Array>} - Array of conversation objects
   */
  async getActiveConversations(chatbotId, limit = 100) {
    try {
      const conversations = await Conversation.find({ 
        chatbotId, 
        isActive: true 
      })
      .sort({ lastMessageAt: -1 })
      .limit(limit);
      
      return conversations;
    } catch (error) {
      logger.error(`Error fetching active conversations for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Add message to conversation
   * @param {string} conversationId - Conversation ID
   * @param {string} text - Message text
   * @param {string} sender - Message sender ('user' or 'bot')
   * @param {Object} metadata - Message metadata
   * @returns {Promise<Object>} - Updated conversation
   */
  async addMessage(conversationId, text, sender, metadata = {}) {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        logger.warn(`Cannot add message: Conversation not found: ${conversationId}`);
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
      await conversation.addMessage(text, sender, metadata);
      
      logger.debug(`Added ${sender} message to conversation ${conversationId}`);
      
      return conversation;
    } catch (error) {
      logger.error(`Error adding message to conversation ${conversationId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Update conversation context
   * @param {string} conversationId - Conversation ID
   * @param {Object} contextUpdate - Context data to update
   * @param {boolean} merge - Whether to merge with existing context or replace
   * @returns {Promise<Object>} - Updated conversation
   */
  async updateContext(conversationId, contextUpdate, merge = true) {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        logger.warn(`Cannot update context: Conversation not found: ${conversationId}`);
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
      // Update context based on merge preference
      if (merge) {
        conversation.context = {
          ...conversation.context,
          ...contextUpdate
        };
      } else {
        conversation.context = contextUpdate;
      }
      
      await conversation.save();
      
      logger.debug(`Updated context for conversation ${conversationId}`);
      
      return conversation;
    } catch (error) {
      logger.error(`Error updating context for conversation ${conversationId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * End conversation (mark as inactive)
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Updated conversation
   */
  async endConversation(conversationId) {
    try {
      const conversation = await Conversation.findById(conversationId);
      
      if (!conversation) {
        logger.warn(`Cannot end conversation: Conversation not found: ${conversationId}`);
        throw new Error(`Conversation not found: ${conversationId}`);
      }
      
      conversation.isActive = false;
      await conversation.save();
      
      logger.info(`Ended conversation ${conversationId}`);
      
      return conversation;
    } catch (error) {
      logger.error(`Error ending conversation ${conversationId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Delete conversation
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  async deleteConversation(conversationId) {
    try {
      const result = await Conversation.deleteOne({ _id: conversationId });
      
      if (result.deletedCount === 0) {
        logger.warn(`Cannot delete conversation: Conversation not found: ${conversationId}`);
        return false;
      }
      
      logger.info(`Deleted conversation ${conversationId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting conversation ${conversationId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get conversation history
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {number} limit - Maximum number of conversations to return
   * @returns {Promise<Array>} - Array of conversation objects
   */
  async getConversationHistory(chatbotId, userId, limit = 10) {
    try {
      const conversations = await Conversation.find({ 
        chatbotId, 
        userId 
      })
      .sort({ startedAt: -1 })
      .limit(limit);
      
      return conversations;
    } catch (error) {
      logger.error(`Error fetching conversation history for chatbot ${chatbotId} and user ${userId}:`, error.message);
      throw error;
    }
  }
}

// Create singleton instance
const conversationService = new ConversationService();

module.exports = conversationService;
