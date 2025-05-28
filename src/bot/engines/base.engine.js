/**
 * Base Chatbot Engine
 * 
 * Abstract base class for all chatbot engines
 */

class BaseChatbotEngine {
  /**
   * Constructor
   * @param {Object} config - Engine configuration
   */
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
    this.version = '1.0.0';
    
    if (this.constructor === BaseChatbotEngine) {
      throw new Error('BaseChatbotEngine is an abstract class and cannot be instantiated directly');
    }
  }
  
  /**
   * Initialize the engine
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    throw new Error('Method initialize() must be implemented by subclass');
  }
  
  /**
   * Process a message and generate a response
   * @param {string} message - User message
   * @param {Object} options - Processing options
   * @param {Object} options.context - Conversation context
   * @param {string} options.personalityModifier - Personality modifier string
   * @param {Object} options.knowledgeBase - Knowledge base data if available
   * @returns {Promise<Object>} - Response data
   */
  async processMessage(message, options = {}) {
    throw new Error('Method processMessage() must be implemented by subclass');
  }
  
  /**
   * Train the engine with new data
   * @param {Array} trainingData - Training data
   * @returns {Promise<Object>} - Training results
   */
  async train(trainingData) {
    throw new Error('Method train() must be implemented by subclass');
  }
  
  /**
   * Get engine status
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      name: this.name,
      version: this.version,
      ready: false
    };
  }
  
  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    // Default implementation does nothing
    return Promise.resolve();
  }
}

module.exports = BaseChatbotEngine;
