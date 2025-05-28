/**
 * Botpress Engine Implementation
 * 
 * Integration with Botpress open-source chatbot platform
 */

const BaseChatbotEngine = require('./base.engine');
const { logger } = require('../../utils');
const axios = require('axios');

class BotpressEngine extends BaseChatbotEngine {
  /**
   * Constructor
   * @param {Object} config - Engine configuration
   */
  constructor(config = {}) {
    super(config);
    this.name = 'botpress';
    this.version = '1.0.0';
    this.ready = false;
    this.client = null;
    
    // Default configuration with fallbacks
    this.config = {
      apiUrl: config.apiUrl || process.env.BOTPRESS_API_URL || 'http://localhost:3000',
      apiKey: config.apiKey || process.env.BOTPRESS_API_KEY,
      botId: config.botId || process.env.BOTPRESS_BOT_ID,
      timeout: config.timeout || 10000,
      ...config
    };
  }
  
  /**
   * Initialize the engine
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    try {
      // Validate required configuration
      if (!this.config.apiUrl) {
        throw new Error('Botpress API URL is required');
      }
      
      if (!this.config.botId) {
        throw new Error('Botpress Bot ID is required');
      }
      
      logger.info(`Initializing Botpress engine for bot ${this.config.botId}`);
      
      // Initialize axios client with default configuration
      this.client = axios.create({
        baseURL: this.config.apiUrl,
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'X-BP-Auth-Token': this.config.apiKey })
        }
      });
      
      // Verify connection by making a test request
      try {
        // In a real implementation, we would verify the connection
        // For now, we'll simulate a successful connection
        
        logger.debug('Botpress engine initialized successfully');
        this.ready = true;
        return true;
      } catch (connectionError) {
        logger.error('Failed to connect to Botpress API:', connectionError.message);
        this.ready = false;
        return false;
      }
    } catch (error) {
      logger.error('Failed to initialize Botpress engine:', error.message);
      this.ready = false;
      return false;
    }
  }
  
  /**
   * Process a message
   * @param {string} message - User message
   * @param {Object} options - Processing options
   * @param {Object} options.context - Conversation context
   * @param {string} options.personalityModifier - Personality modifier text
   * @returns {Promise<Object>} - Response object with text and metadata
   */
  async processMessage(message, options = {}) {
    if (!this.ready) {
      logger.error('Attempted to process message with uninitialized Botpress engine');
      throw new Error('Botpress engine is not initialized');
    }
    
    try {
      const context = options.context || {};
      const personalityModifier = options.personalityModifier || '';
      const knowledgeBase = options.knowledgeBase || null;
      
      logger.debug(`Processing message with Botpress: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
      if (personalityModifier) {
        logger.debug('Using personality modifier with Botpress engine');
      }
      
      if (knowledgeBase) {
        logger.debug(`Using knowledge base with ${knowledgeBase.count} relevant items`);
      }
      
      // Prepare request payload
      const payload = {
        message,
        conversationId: context.conversationId || `conv-${Date.now()}`,
        userId: context.userId || `user-${Date.now()}`,
        metadata: {
          ...context.metadata
        }
      };
      
      // If personality modifier is provided, include it in the payload
      if (personalityModifier) {
        payload.personalityModifier = personalityModifier;
      }
      
      // In a real implementation, this would send the message to Botpress API
      // For now, we'll simulate a response that takes personality into account
      
      // Simulate different responses based on message content for demo purposes
      let responseText;
      let confidence = 0.85;
      let usedKnowledge = false;
      
      // Check for personality traits to adjust response style
      const isInformal = personalityModifier.includes('Use casual, informal language');
      const isFormal = personalityModifier.includes('Use formal, professional language');
      const isHumorous = personalityModifier.includes('Use humor frequently') || personalityModifier.includes('Include occasional humor');
      const isEmpathetic = personalityModifier.includes('Show strong empathy');
      
      // Check if we have relevant knowledge to use
      if (knowledgeBase && knowledgeBase.items && knowledgeBase.items.length > 0) {
        // Find the most relevant knowledge item
        const mostRelevantItem = knowledgeBase.items[0];
        
        // Use the knowledge to generate a response
        if (isInformal) {
          responseText = `Based on what I know: ${mostRelevantItem.content.substring(0, 150)}${mostRelevantItem.content.length > 150 ? '...' : ''}`;
        } else if (isFormal) {
          responseText = `According to my knowledge base: ${mostRelevantItem.content.substring(0, 150)}${mostRelevantItem.content.length > 150 ? '...' : ''}`;
        } else {
          responseText = `Here's what I found: ${mostRelevantItem.content.substring(0, 150)}${mostRelevantItem.content.length > 150 ? '...' : ''}`;
        }
        
        confidence = 0.92; // Higher confidence with knowledge
        usedKnowledge = true;
      }
      
      // Only generate a standard response if we haven't used knowledge base
      if (!usedKnowledge) {
        if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
          if (isInformal) {
            responseText = 'Hey there! What can I do for you today?';
          } else if (isFormal) {
            responseText = 'Good day. How may I be of assistance to you?';
          } else {
            responseText = 'Hello there! How can I help you today?';
          }
          confidence = 0.98;
        } else if (message.toLowerCase().includes('help')) {
          if (isEmpathetic) {
            responseText = 'I understand you need assistance. I\'m here for you - tell me what\'s troubling you and I\'ll do my best to help.';
          } else {
            responseText = 'I\'m here to help! What do you need assistance with?';
          }
          confidence = 0.95;
        } else if (message.toLowerCase().includes('bye') || message.toLowerCase().includes('goodbye')) {
          if (isHumorous) {
            responseText = 'See you later, alligator! Have a fantastic day!';
          } else if (isFormal) {
            responseText = 'Farewell. I appreciate your time today.';
          } else {
            responseText = 'Goodbye! Have a great day!';
          }
          confidence = 0.97;
        } else {
          if (isInformal) {
            responseText = `Got your message: "${message}". What else can I help with?`;
          } else if (isFormal) {
            responseText = `I have received your message stating: "${message}". How may I further assist you?`;
          } else {
            responseText = `I received your message: "${message}". How can I assist you further?`;
          }
          confidence = 0.75;
        }
      }
      
      // Add humor if personality calls for it and we haven't already added it
      if (isHumorous && !responseText.includes('alligator') && Math.random() > 0.7) {
        const humorousAdditions = [
          " That's what I'm here for - saving the day one message at a time!",
          " Just don't ask me to do your taxes... I'm terrible with numbers!",
          " I'm all virtual ears!"
        ];
        responseText += humorousAdditions[Math.floor(Math.random() * humorousAdditions.length)];
      }
      
      // Construct response object
      const response = {
        text: responseText,
        timestamp: new Date().toISOString(),
        metadata: {
          engine: this.name,
          confidence,
          personality: personalityModifier ? true : false,
          knowledgeBase: usedKnowledge ? {
            used: true,
            source: knowledgeBase.items[0].source
          } : null,
          context: { 
            ...context,
            lastMessage: message
          }
        }
      };
      
      logger.debug(`Botpress engine response: ${response.text}`);
      return response;
    } catch (error) {
      logger.error('Error processing message with Botpress:', error.message);
      throw error;
    }
  }
  
  /**
   * Train the engine with new data
   * @param {Array} trainingData - Training data
   * @returns {Promise<Object>} - Training results
   */
  async train(trainingData) {
    if (!this.ready) {
      logger.error('Attempted to train uninitialized Botpress engine');
      throw new Error('Botpress engine is not initialized');
    }
    
    try {
      if (!Array.isArray(trainingData) || trainingData.length === 0) {
        logger.warn('Empty or invalid training data provided to Botpress engine');
        return {
          success: false,
          timestamp: new Date().toISOString(),
          error: 'Empty or invalid training data'
        };
      }
      
      logger.info(`Training Botpress engine with ${trainingData.length} samples`);
      
      // In a real implementation, this would send the training data to Botpress
      // For now, we'll simulate a successful training operation
      
      // Simulate processing time based on data size
      const processingTime = Math.min(500 + trainingData.length * 10, 5000);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // Calculate simulated metrics
      const accuracy = 0.75 + Math.random() * 0.2; // Random accuracy between 0.75 and 0.95
      
      logger.info(`Botpress engine training completed with ${accuracy.toFixed(2)} accuracy`);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        metrics: {
          samples: trainingData.length,
          accuracy,
          processingTimeMs: processingTime
        }
      };
    } catch (error) {
      logger.error('Error training Botpress engine:', error.message);
      throw error;
    }
  }
  
  /**
   * Get engine status
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      ready: this.ready,
      config: {
        ...this.config,
        // Remove sensitive information
        apiKey: this.config.apiKey ? '***' : undefined
      }
    };
  }
  
  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    try {
      logger.debug('Cleaning up Botpress engine resources');
      
      // Cancel any pending requests
      if (this.client && typeof this.client.cancelToken === 'function') {
        this.client.cancelToken('Engine cleanup');
      }
      
      this.ready = false;
      this.client = null;
      
      logger.info('Botpress engine resources cleaned up successfully');
      return Promise.resolve();
    } catch (error) {
      logger.error('Error cleaning up Botpress engine:', error.message);
      throw error;
    }
  }
}

module.exports = BotpressEngine;
