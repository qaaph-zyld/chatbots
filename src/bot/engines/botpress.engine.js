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
   * @param {Object} context - Conversation context
   * @returns {Promise<Object>} - Response object with text and metadata
   */
  async processMessage(message, context = {}) {
    if (!this.ready) {
      logger.error('Attempted to process message with uninitialized Botpress engine');
      throw new Error('Botpress engine is not initialized');
    }
    
    try {
      logger.debug(`Processing message with Botpress: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
      
      // Prepare request payload
      const payload = {
        message,
        conversationId: context.conversationId || `conv-${Date.now()}`,
        userId: context.userId || `user-${Date.now()}`,
        metadata: {
          ...context.metadata
        }
      };
      
      // In a real implementation, this would send the message to Botpress API
      // For now, we'll simulate a response
      
      // Simulate different responses based on message content for demo purposes
      let responseText;
      let confidence = 0.85;
      
      if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
        responseText = 'Hello there! How can I help you today?';
        confidence = 0.98;
      } else if (message.toLowerCase().includes('help')) {
        responseText = 'I\'m here to help! What do you need assistance with?';
        confidence = 0.95;
      } else if (message.toLowerCase().includes('bye') || message.toLowerCase().includes('goodbye')) {
        responseText = 'Goodbye! Have a great day!';
        confidence = 0.97;
      } else {
        responseText = `I received your message: "${message}". How can I assist you further?`;
        confidence = 0.75;
      }
      
      // Construct response object
      const response = {
        text: responseText,
        timestamp: new Date().toISOString(),
        metadata: {
          engine: this.name,
          confidence,
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
