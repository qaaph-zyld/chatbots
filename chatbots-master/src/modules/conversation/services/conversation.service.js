/**
 * Conversation Service
 * 
 * Service for conversation-related business logic
 */

// Import module alias registration
require('@src/core/module-alias');

/**
 * Conversation Service
 * Handles business logic for conversations
 */
class ConversationService {
  /**
   * Constructor
   * @param {ConversationRepository} conversationRepository - Repository for conversation data access
   */
  constructor(conversationRepository) {
    this.conversationRepository = conversationRepository;
  }

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
      return await this.conversationRepository.getConversationHistory(userId, chatbotId, page, limit);
    } catch (error) {
      console.error('Error in ConversationService.getConversationHistory:', error);
      throw error;
    }
  }
}

module.exports = { ConversationService };
