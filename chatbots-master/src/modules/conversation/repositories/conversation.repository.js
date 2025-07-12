/**
 * Conversation Repository
 * 
 * Repository for conversation data access
 */

// Import module alias registration
require('@src/core/module-alias');

// Import models
const Conversation = require('@domain/conversation.model');

/**
 * Conversation Repository
 * Handles data access operations for conversations
 */
class ConversationRepository {
  /**
   * Get paginated conversation history for a user and chatbot
   * @param {string} userId - User ID
   * @param {string} chatbotId - Chatbot ID
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of items per page
   * @returns {Promise<Object>} - Paginated conversations with metadata
   */
  async getConversationHistory(userId, chatbotId, page = 1, limit = 20) {
    try {
      return await Conversation.getPaginatedHistory(userId, chatbotId, page, limit);
    } catch (error) {
      console.error('Error in ConversationRepository.getConversationHistory:', error);
      throw error;
    }
  }
}

module.exports = { ConversationRepository };
