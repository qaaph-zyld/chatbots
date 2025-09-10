/**
 * Chatbot Service
 * Core business logic for chatbot management
 */

const logger = require('../../core/services/logger.service');
const config = require('../../core/services/config.service');
const BaseChatbotEngine = require('../../core/engine/base-engine');

class ChatbotService {
  constructor() {
    this.chatbots = new Map();
    this.engines = new Map();
  }

  /**
   * Create a new chatbot
   * @param {Object} chatbotData - Chatbot configuration
   * @returns {Promise<Object>} Created chatbot
   */
  async createChatbot(chatbotData) {
    try {
      const chatbot = {
        id: this.generateId(),
        name: chatbotData.name,
        description: chatbotData.description || '',
        engine: chatbotData.engine || 'default',
        settings: chatbotData.settings || {},
        isActive: chatbotData.isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate engine exists
      if (!this.engines.has(chatbot.engine)) {
        throw new Error(`Engine '${chatbot.engine}' not found`);
      }

      this.chatbots.set(chatbot.id, chatbot);
      logger.info('Chatbot created', { chatbotId: chatbot.id, name: chatbot.name });

      return chatbot;
    } catch (error) {
      logger.error('Failed to create chatbot', { error: error.message, chatbotData });
      throw error;
    }
  }

  /**
   * Get chatbot by ID
   * @param {string} chatbotId - Chatbot ID
   * @returns {Object|null} Chatbot or null if not found
   */
  getChatbot(chatbotId) {
    return this.chatbots.get(chatbotId) || null;
  }

  /**
   * Update chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated chatbot
   */
  async updateChatbot(chatbotId, updates) {
    try {
      const chatbot = this.chatbots.get(chatbotId);
      if (!chatbot) {
        throw new Error(`Chatbot with ID '${chatbotId}' not found`);
      }

      const updatedChatbot = {
        ...chatbot,
        ...updates,
        updatedAt: new Date()
      };

      this.chatbots.set(chatbotId, updatedChatbot);
      logger.info('Chatbot updated', { chatbotId, updates });

      return updatedChatbot;
    } catch (error) {
      logger.error('Failed to update chatbot', { error: error.message, chatbotId, updates });
      throw error;
    }
  }

  /**
   * Delete chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteChatbot(chatbotId) {
    try {
      const chatbot = this.chatbots.get(chatbotId);
      if (!chatbot) {
        throw new Error(`Chatbot with ID '${chatbotId}' not found`);
      }

      this.chatbots.delete(chatbotId);
      logger.info('Chatbot deleted', { chatbotId });

      return true;
    } catch (error) {
      logger.error('Failed to delete chatbot', { error: error.message, chatbotId });
      throw error;
    }
  }

  /**
   * List all chatbots
   * @param {Object} filters - Optional filters
   * @returns {Array} Array of chatbots
   */
  listChatbots(filters = {}) {
    let chatbots = Array.from(this.chatbots.values());

    if (filters.isActive !== undefined) {
      chatbots = chatbots.filter(bot => bot.isActive === filters.isActive);
    }

    if (filters.engine) {
      chatbots = chatbots.filter(bot => bot.engine === filters.engine);
    }

    return chatbots;
  }

  /**
   * Register a chatbot engine
   * @param {string} name - Engine name
   * @param {BaseChatbotEngine} engine - Engine instance
   */
  registerEngine(name, engine) {
    if (!(engine instanceof BaseChatbotEngine)) {
      throw new Error('Engine must extend BaseChatbotEngine');
    }

    this.engines.set(name, engine);
    logger.info('Engine registered', { engineName: name });
  }

  /**
   * Get engine by name
   * @param {string} name - Engine name
   * @returns {BaseChatbotEngine|null} Engine instance or null
   */
  getEngine(name) {
    return this.engines.get(name) || null;
  }

  /**
   * Process message with chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {string} message - User message
   * @param {Object} context - Conversation context
   * @returns {Promise<Object>} Bot response
   */
  async processMessage(chatbotId, message, context = {}) {
    try {
      const chatbot = this.getChatbot(chatbotId);
      if (!chatbot) {
        throw new Error(`Chatbot with ID '${chatbotId}' not found`);
      }

      if (!chatbot.isActive) {
        throw new Error(`Chatbot '${chatbot.name}' is not active`);
      }

      const engine = this.getEngine(chatbot.engine);
      if (!engine) {
        throw new Error(`Engine '${chatbot.engine}' not found`);
      }

      const response = await engine.processMessage(message, {
        ...context,
        chatbotId,
        chatbotSettings: chatbot.settings
      });

      logger.info('Message processed', { chatbotId, messageLength: message.length });

      return response;
    } catch (error) {
      logger.error('Failed to process message', { 
        error: error.message, 
        chatbotId, 
        messageLength: message?.length 
      });
      throw error;
    }
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `chatbot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = ChatbotService;
