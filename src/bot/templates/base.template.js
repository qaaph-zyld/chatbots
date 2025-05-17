/**
 * Base Conversation Template
 * 
 * Abstract base class for all conversation templates
 */

class BaseTemplate {
  /**
   * Constructor
   * @param {Object} config - Template configuration
   */
  constructor(config = {}) {
    this.config = config;
    this.name = config.name || 'base';
    this.description = config.description || 'Base conversation template';
    this.version = config.version || '1.0.0';
    
    if (this.constructor === BaseTemplate) {
      throw new Error('BaseTemplate is an abstract class and cannot be instantiated directly');
    }
  }
  
  /**
   * Initialize the template
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    throw new Error('Method initialize() must be implemented by subclass');
  }
  
  /**
   * Get next response based on user input and conversation context
   * @param {string} input - User input
   * @param {Object} context - Conversation context
   * @returns {Promise<Object>} - Response object
   */
  async getResponse(input, context = {}) {
    throw new Error('Method getResponse() must be implemented by subclass');
  }
  
  /**
   * Get template metadata
   * @returns {Object} - Template metadata
   */
  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      version: this.version,
      config: {
        ...this.config,
        // Remove any sensitive information
        apiKey: this.config.apiKey ? '***' : undefined
      }
    };
  }
  
  /**
   * Validate template configuration
   * @param {Object} config - Template configuration to validate
   * @returns {boolean} - True if configuration is valid
   */
  validateConfig(config) {
    // Base implementation just checks if config is an object
    return config && typeof config === 'object';
  }
}

module.exports = BaseTemplate;
