/**
 * Base Chatbot Engine
 * Abstract base class for all chatbot engines
 */

class BaseChatbotEngine {
  constructor(config = {}) {
    this.config = config;
    this.isInitialized = false;
  }

  /**
   * Initialize the engine
   * @abstract
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Process a message
   * @abstract
   * @param {string} message - User message
   * @param {Object} context - Conversation context
   * @returns {Promise<Object>} Response object
   */
  async processMessage(message, context = {}) {
    throw new Error('processMessage() must be implemented by subclass');
  }

  /**
   * Train the engine with data
   * @abstract
   * @param {Array} trainingData - Training data
   */
  async train(trainingData) {
    throw new Error('train() must be implemented by subclass');
  }

  /**
   * Get engine status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      engine: this.constructor.name,
      config: this.config
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.isInitialized = false;
  }
}

module.exports = BaseChatbotEngine;
