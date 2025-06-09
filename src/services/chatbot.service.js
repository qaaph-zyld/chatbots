/**
 * Chatbot Service
 * 
 * Main service for managing chatbot operations
 */

require('@src/bot\nlp');
require('@src/bot\templates');
require('@src/integrations');
require('@src/bot\engines');
require('@src/personality');
require('@src/utils');
require('@src/config');

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
      logger.info('Initializing Chatbot Service');
      
      // Initialize engines with default configuration
      const defaultEngine = config.chatbot.defaultEngine;
      logger.debug(`Initializing default engine: ${defaultEngine}`);
      
      try {
        // Pre-initialize the default engine to ensure it's ready for use
        const engine = engineFactory.getEngine(defaultEngine, {});
        const engineInitialized = await engine.initialize();
        logger.info(`Default engine ${defaultEngine} initialized: ${engineInitialized}`);
        
        if (!engineInitialized) {
          logger.error(`Failed to initialize default engine ${defaultEngine}`);
          return false;
        }
      } catch (engineError) {
        logger.error(`Error initializing default engine: ${engineError.message}`);
        return false;
      }
      
      // Initialize NLP manager
      const nlpInitialized = await nlpManager.initialize();
      logger.info(`NLP Manager initialized: ${nlpInitialized}`);
      
      // Initialize template manager
      const templatesInitialized = await templateManager.initialize();
      logger.info(`Template Manager initialized: ${templatesInitialized}`);
      
      // Initialize integration manager
      const integrationsInitialized = await integrationManager.initialize();
      logger.info(`Integration Manager initialized: ${integrationsInitialized}`);
      
      // Set up message handlers for integrations
      this.setupMessageHandlers();
      
      this.initialized = nlpInitialized && templatesInitialized && integrationsInitialized;
      
      if (this.initialized) {
        logger.info('Chatbot Service initialized successfully');
      } else {
        logger.error('Chatbot Service initialization failed');
      }
                         
      return this.initialized;
    } catch (error) {
      logger.error('Failed to initialize Chatbot Service:', error.message);
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
    if (!this.initialized) {
      logger.error('Attempted to process message with uninitialized Chatbot Service');
      throw new Error('Chatbot Service is not initialized');
    }
    
    try {
      logger.info(`Processing message from ${channelName}: ${message.text?.substring(0, 50)}${message.text?.length > 50 ? '...' : ''}`);
      
      const sessionId = message.sessionId || `session-${Date.now()}`;
      const text = message.text;
      
      if (!text || typeof text !== 'string') {
        logger.warn('Invalid message text received');
        throw new Error('Invalid message text');
      }
      
      // Get or create engine instance for processing
      const engineType = message.engineType || config.chatbot.defaultEngine;
      let engine;
      
      try {
        logger.debug(`Using engine type: ${engineType}`);
        engine = engineFactory.getEngine(engineType, {});
        
        if (!engine.ready) {
          logger.debug(`Engine ${engineType} not ready, initializing...`);
          await engine.initialize();
        }
      } catch (error) {
        logger.error(`Error getting engine instance: ${error.message}`);
        throw new Error(`Failed to get engine: ${error.message}`);
      }
      
      // Process message with NLP for intent recognition
      const nlpResult = await nlpManager.process(text, {
        sessionId,
        language: message.language || 'en'
      });
      
      logger.debug(`NLP result for message: ${JSON.stringify(nlpResult)}`);
      
      // Process message with engine
      const engineResponse = await engine.processMessage(text, {
        sessionId,
        userId: message.userId || `user-${sessionId}`,
        language: message.language || 'en',
        nlp: nlpResult,
        metadata: message.metadata || {}
      });
      
      logger.debug(`Engine response: ${engineResponse.text}`);
      
      // Get response from template if needed
      // If the engine provides a complete response, we can skip the template
      let responseText = engineResponse.text;
      let responseMetadata = engineResponse.metadata || {};
      
      if (engineResponse.useTemplate !== false) {
        const templateResponse = await templateManager.getResponse(text, {
          context: {
            sessionId,
            nlp: nlpResult,
            engineResponse,
            user: message.user || {},
            channel: channelName
          }
        });
        
        responseText = templateResponse.text || responseText;
        responseMetadata = { ...responseMetadata, ...templateResponse.metadata };
      }
      
      // Apply personality modifiers if available
      let finalResponseText = responseText;
      
      if (message.chatbotId) {
        try {
          // Get personality ID from message or use default
          const personalityId = message.personalityId || null;
          
          // Apply personality modifiers
          finalResponseText = await personalityMessageProcessor.processMessage(
            message.chatbotId,
            personalityId,
            responseText,
            { skipToneStyle: message.skipToneStyle }
          );
          
          logger.debug(`Applied personality modifiers to response: ${finalResponseText.substring(0, 50)}${finalResponseText.length > 50 ? '...' : ''}`);
        } catch (personalityError) {
          logger.error(`Error applying personality modifiers: ${personalityError.message}`);
          // Continue with original response if personality processing fails
          finalResponseText = responseText;
        }
      }
      
      // Send response back through the same channel
      const response = await integrationManager.sendMessage(
        channelName,
        { text: finalResponseText },
        { sessionId },
        { metadata: responseMetadata }
      );
      
      logger.info(`Response sent to ${channelName}: ${finalResponseText.substring(0, 50)}${finalResponseText.length > 50 ? '...' : ''}`);
      
      return {
        success: true,
        nlp: nlpResult,
        engine: engineResponse,
        response
      };
    } catch (error) {
      logger.error(`Error processing message: ${error.message}`);
      
      // Try to send error response
      try {
        await integrationManager.sendMessage(
          channelName,
          { text: "I'm sorry, I encountered an error processing your message." },
          { sessionId: message.sessionId || `session-${Date.now()}` },
          { isError: true }
        );
      } catch (sendError) {
        logger.error(`Error sending error response: ${sendError.message}`);
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
      logger.error('Attempted to create chatbot with uninitialized service');
      throw new Error('Chatbot Service is not initialized');
    }
    
    try {
      logger.info(`Creating new chatbot: ${chatbotData.name}`);
      
      // Validate required fields
      if (!chatbotData.name) {
        throw new Error('Chatbot name is required');
      }
      
      // Set default engine if not provided
      const engineType = chatbotData.engine || config.chatbot.defaultEngine;
      
      // Verify that the engine type is valid
      if (!engineFactory.getAvailableEngineTypes().includes(engineType)) {
        logger.error(`Invalid engine type: ${engineType}`);
        throw new Error(`Invalid engine type: ${engineType}`);
      }
      
      // Create a unique ID if not provided
      const chatbotId = chatbotData.id || `chatbot-${Date.now()}`;
      
      // Create the chatbot object
      const chatbot = {
        id: chatbotId,
        name: chatbotData.name,
        description: chatbotData.description || '',
        engine: engineType,
        engineConfig: chatbotData.engineConfig || {},
        owner: chatbotData.owner || 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      };
      
      // Initialize the engine for this chatbot
      const engine = engineFactory.getEngine(engineType, chatbot.engineConfig);
      const engineInitialized = await engine.initialize();
      
      if (!engineInitialized) {
        logger.error(`Failed to initialize engine for chatbot ${chatbotId}`);
        throw new Error(`Failed to initialize engine for chatbot ${chatbotId}`);
      }
      
      logger.info(`Chatbot ${chatbotId} created successfully with engine ${engineType}`);
      
      // In a real implementation, we would store the chatbot in the database
      // For now, we'll just return the chatbot object
      return chatbot;
    } catch (error) {
      logger.error(`Error creating chatbot: ${error.message}`);
      throw error;
    }
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
   * Get available engine types
   * @returns {Array<string>} - Array of available engine types
   */
  getAvailableEngineTypes() {
    return engineFactory.getAvailableEngineTypes();
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
