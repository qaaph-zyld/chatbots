/**
 * Chatbot Service
 * 
 * Main service for managing chatbot operations
 */

const { nlpManager } = require('../bot/nlp');
const { templateManager } = require('../bot/templates');
const { integrationManager } = require('../integrations');
const botService = require('../bot/core');

class ChatbotService {
  constructor() {
    this.initialized = false;
  }
  
  /**
   * Initialize the chatbot service
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    try {
      console.log('Initializing Chatbot Service');
      
      // Initialize NLP manager
      const nlpInitialized = await nlpManager.initialize();
      console.log(`NLP Manager initialized: ${nlpInitialized}`);
      
      // Initialize template manager
      const templatesInitialized = await templateManager.initialize();
      console.log(`Template Manager initialized: ${templatesInitialized}`);
      
      // Initialize integration manager
      const integrationsInitialized = await integrationManager.initialize();
      console.log(`Integration Manager initialized: ${integrationsInitialized}`);
      
      // Initialize bot service
      const botInitialized = await botService.initialize();
      console.log(`Bot Service initialized: ${botInitialized}`);
      
      // Set up message handlers for integrations
      this.setupMessageHandlers();
      
      this.initialized = nlpInitialized && templatesInitialized && 
                         integrationsInitialized && botInitialized;
                         
      return this.initialized;
    } catch (error) {
      console.error('Failed to initialize Chatbot Service:', error);
      this.initialized = false;
      return false;
    }
  }
  
  /**
   * Set up message handlers for integrations
   */
  setupMessageHandlers() {
    // Handle messages from web channel
    integrationManager.onMessage('web', async (message, channelName) => {
      return this.processMessage(message, channelName);
    });
    
    // Add handlers for other channels as needed
  }
  
  /**
   * Process a message from any channel
   * @param {Object} message - Message to process
   * @param {string} channelName - Source channel name
   * @returns {Promise<Object>} - Processing result
   */
  async processMessage(message, channelName) {
    try {
      console.log(`Processing message from ${channelName}:`, message);
      
      const sessionId = message.sessionId || 'unknown';
      const text = message.text;
      
      // Get or create chatbot for this session
      // In a real implementation, this would look up the appropriate chatbot
      // based on the session or channel configuration
      const chatbotId = 'default';
      let chatbot;
      
      try {
        chatbot = botService.getChatbot(chatbotId);
      } catch (error) {
        // Create a default chatbot if not found
        chatbot = await botService.createChatbot({
          id: chatbotId,
          name: 'Default Chatbot',
          description: 'Default chatbot created automatically',
          engine: 'botpress',
          engineConfig: {}
        });
      }
      
      // Process message with NLP
      const nlpResult = await nlpManager.process(text, {
        sessionId,
        language: message.language || 'en'
      });
      
      // Get response from template
      const templateResponse = await templateManager.getResponse(text, {
        context: {
          sessionId,
          nlp: nlpResult,
          user: message.user || {},
          channel: channelName
        }
      });
      
      // Send response back through the same channel
      const response = await integrationManager.sendMessage(
        channelName,
        { text: templateResponse.text },
        { sessionId },
        { metadata: templateResponse.metadata }
      );
      
      return {
        success: true,
        nlp: nlpResult,
        template: templateResponse,
        response
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Try to send error response
      try {
        await integrationManager.sendMessage(
          channelName,
          { text: "I'm sorry, I encountered an error processing your message." },
          { sessionId: message.sessionId || 'unknown' },
          { isError: true }
        );
      } catch (sendError) {
        console.error('Error sending error response:', sendError);
      }
      
      throw error;
    }
  }
  
  /**
   * Create a new chatbot
   * @param {Object} chatbotData - Chatbot data
   * @returns {Promise<Object>} - Created chatbot
   */
  async createChatbot(chatbotData) {
    if (!this.initialized) {
      throw new Error('Chatbot Service is not initialized');
    }
    
    return botService.createChatbot(chatbotData);
  }
  
  /**
   * Get all chatbots
   * @returns {Array<Object>} - Array of chatbots
   */
  getAllChatbots() {
    if (!this.initialized) {
      throw new Error('Chatbot Service is not initialized');
    }
    
    return botService.getAllChatbots();
  }
  
  /**
   * Get chatbot by ID
   * @param {string} id - Chatbot ID
   * @returns {Object} - Chatbot data
   */
  getChatbot(id) {
    if (!this.initialized) {
      throw new Error('Chatbot Service is not initialized');
    }
    
    return botService.getChatbot(id);
  }
  
  /**
   * Delete a chatbot
   * @param {string} id - Chatbot ID
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  async deleteChatbot(id) {
    if (!this.initialized) {
      throw new Error('Chatbot Service is not initialized');
    }
    
    return botService.deleteChatbot(id);
  }
  
  /**
   * Get service status
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      initialized: this.initialized,
      nlp: nlpManager.getStatus(),
      templates: templateManager.getMetadata(),
      integrations: integrationManager.getStatus(),
      bots: botService.getAllChatbots().length
    };
  }
  
  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      console.log('Cleaning up Chatbot Service resources');
      
      await Promise.all([
        nlpManager.cleanup(),
        integrationManager.cleanup()
      ]);
      
      this.initialized = false;
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error cleaning up Chatbot Service:', error);
      throw error;
    }
  }
}

// Create singleton instance
const chatbotService = new ChatbotService();

module.exports = chatbotService;
