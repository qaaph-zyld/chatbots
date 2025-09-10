/**
 * Chatbot Controller
 * HTTP request handlers for chatbot endpoints
 */

const ChatbotService = require('./chatbot.service');
const logger = require('../../core/services/logger.service');

class ChatbotController {
  constructor() {
    this.chatbotService = new ChatbotService();
  }

  /**
   * Create a new chatbot
   */
  async createChatbot(req, res) {
    try {
      const chatbot = await this.chatbotService.createChatbot(req.body);
      res.status(201).json({
        success: true,
        data: chatbot
      });
    } catch (error) {
      logger.error('Create chatbot failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get chatbot by ID
   */
  async getChatbot(req, res) {
    try {
      const { id } = req.params;
      const chatbot = this.chatbotService.getChatbot(id);
      
      if (!chatbot) {
        return res.status(404).json({
          success: false,
          error: 'Chatbot not found'
        });
      }

      res.json({
        success: true,
        data: chatbot
      });
    } catch (error) {
      logger.error('Get chatbot failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update chatbot
   */
  async updateChatbot(req, res) {
    try {
      const { id } = req.params;
      const chatbot = await this.chatbotService.updateChatbot(id, req.body);
      
      res.json({
        success: true,
        data: chatbot
      });
    } catch (error) {
      logger.error('Update chatbot failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Delete chatbot
   */
  async deleteChatbot(req, res) {
    try {
      const { id } = req.params;
      await this.chatbotService.deleteChatbot(id);
      
      res.json({
        success: true,
        message: 'Chatbot deleted successfully'
      });
    } catch (error) {
      logger.error('Delete chatbot failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * List chatbots
   */
  async listChatbots(req, res) {
    try {
      const filters = {
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        engine: req.query.engine
      };
      
      const chatbots = this.chatbotService.listChatbots(filters);
      
      res.json({
        success: true,
        data: chatbots,
        count: chatbots.length
      });
    } catch (error) {
      logger.error('List chatbots failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Process message
   */
  async processMessage(req, res) {
    try {
      const { id } = req.params;
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required'
        });
      }

      const response = await this.chatbotService.processMessage(id, message, context);
      
      res.json({
        success: true,
        data: response
      });
    } catch (error) {
      logger.error('Process message failed', { error: error.message });
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = ChatbotController;
