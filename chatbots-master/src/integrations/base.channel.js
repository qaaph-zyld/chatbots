/**
 * Base Integration Channel
 * 
 * Abstract base class for all integration channels
 */

class BaseChannel {
  /**
   * Constructor
   * @param {Object} config - Channel configuration
   */
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
    this.type = 'base';
    this.version = '1.0.0';
    this.ready = false;
    
    if (this.constructor === BaseChannel) {
      throw new Error('BaseChannel is an abstract class and cannot be instantiated directly');
    }
  }
  
  /**
   * Initialize the channel
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    throw new Error('Method initialize() must be implemented by subclass');
  }
  
  /**
   * Send a message through the channel
   * @param {Object} message - Message to send
   * @param {Object} recipient - Recipient information
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Send result
   */
  async sendMessage(message, recipient, options = {}) {
    throw new Error('Method sendMessage() must be implemented by subclass');
  }
  
  /**
   * Register a message handler
   * @param {Function} handler - Message handler function
   * @returns {BaseChannel} - This instance for chaining
   */
  onMessage(handler) {
    throw new Error('Method onMessage() must be implemented by subclass');
  }
  
  /**
   * Get channel status
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      name: this.name,
      type: this.type,
      version: this.version,
      ready: this.ready
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
  
  /**
   * Validate channel configuration
   * @param {Object} config - Channel configuration to validate
   * @returns {boolean} - True if configuration is valid
   */
  validateConfig(config) {
    // Base implementation just checks if config is an object
    return config && typeof config === 'object';
  }
}

module.exports = BaseChannel;
