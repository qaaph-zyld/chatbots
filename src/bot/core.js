/**
 * Chatbot Core Service
 * 
 * Central service for managing chatbot instances and processing messages
 */

const { createEngine, getAvailableEngines } = require('./engines');
const config = require('../config');

class ChatbotService {
  constructor() {
    this.chatbots = new Map();
    this.availableEngines = getAvailableEngines();
  }
  
  /**
   * Initialize the chatbot service
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    try {
      console.log('Initializing Chatbot Service');
      return true;
    } catch (error) {
      console.error('Failed to initialize Chatbot Service:', error);
      return false;
    }
  }
  
  /**
   * Create a new chatbot instance
   * @param {Object} chatbotConfig - Chatbot configuration
   * @returns {Promise<Object>} - Chatbot instance data
   */
  async createChatbot(chatbotConfig) {
    try {
      const { id, name, description, engine, engineConfig } = chatbotConfig;
      
      if (!id || !name || !engine) {
        throw new Error('Missing required chatbot configuration: id, name, engine');
      }
      
      if (!this.availableEngines.includes(engine.toLowerCase())) {
        throw new Error(`Unsupported engine type: ${engine}. Available engines: ${this.availableEngines.join(', ')}`);
      }
      
      // Create engine instance
      const engineInstance = createEngine(engine, engineConfig || {});
      
      // Initialize engine
      await engineInstance.initialize();
      
      // Create chatbot data
      const chatbot = {
        id,
        name,
        description: description || '',
        engine,
        engineInstance,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      // Store chatbot instance
      this.chatbots.set(id, chatbot);
      
      return {
        id: chatbot.id,
        name: chatbot.name,
        description: chatbot.description,
        engine: chatbot.engine,
        status: chatbot.status,
        createdAt: chatbot.createdAt
      };
    } catch (error) {
      console.error('Error creating chatbot:', error);
      throw error;
    }
  }
  
  /**
   * Get chatbot by ID
   * @param {string} id - Chatbot ID
   * @returns {Object} - Chatbot data
   */
  getChatbot(id) {
    const chatbot = this.chatbots.get(id);
    
    if (!chatbot) {
      throw new Error(`Chatbot with ID ${id} not found`);
    }
    
    return {
      id: chatbot.id,
      name: chatbot.name,
      description: chatbot.description,
      engine: chatbot.engine,
      status: chatbot.status,
      createdAt: chatbot.createdAt
    };
  }
  
  /**
   * Get all chatbots
   * @returns {Array<Object>} - Array of chatbot data
   */
  getAllChatbots() {
    return Array.from(this.chatbots.values()).map(chatbot => ({
      id: chatbot.id,
      name: chatbot.name,
      description: chatbot.description,
      engine: chatbot.engine,
      status: chatbot.status,
      createdAt: chatbot.createdAt
    }));
  }
  
  /**
   * Process a message with a specific chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {string} message - User message
   * @param {Object} context - Conversation context
   * @returns {Promise<Object>} - Response data
   */
  async processMessage(chatbotId, message, context = {}) {
    const chatbot = this.chatbots.get(chatbotId);
    
    if (!chatbot) {
      throw new Error(`Chatbot with ID ${chatbotId} not found`);
    }
    
    try {
      // Process message with the chatbot's engine
      const response = await chatbot.engineInstance.processMessage(message, context);
      
      return {
        chatbotId,
        message,
        response: response.text,
        timestamp: response.timestamp || new Date().toISOString(),
        metadata: response.metadata || {}
      };
    } catch (error) {
      console.error(`Error processing message for chatbot ${chatbotId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a chatbot instance
   * @param {string} id - Chatbot ID
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  async deleteChatbot(id) {
    const chatbot = this.chatbots.get(id);
    
    if (!chatbot) {
      throw new Error(`Chatbot with ID ${id} not found`);
    }
    
    try {
      // Clean up engine resources
      await chatbot.engineInstance.cleanup();
      
      // Remove chatbot from map
      this.chatbots.delete(id);
      
      return true;
    } catch (error) {
      console.error(`Error deleting chatbot ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get available engine types
   * @returns {Array<string>} - Array of available engine types
   */
  getAvailableEngines() {
    return this.availableEngines;
  }
}

// Create singleton instance
const chatbotService = new ChatbotService();

module.exports = chatbotService;
