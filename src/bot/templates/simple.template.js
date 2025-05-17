/**
 * Simple Conversation Template
 * 
 * Basic template for simple intent-based conversations
 */

const BaseTemplate = require('./base.template');

class SimpleTemplate extends BaseTemplate {
  /**
   * Constructor
   * @param {Object} config - Template configuration
   */
  constructor(config = {}) {
    super(config);
    this.name = config.name || 'simple';
    this.description = config.description || 'Simple intent-based conversation template';
    this.version = config.version || '1.0.0';
    this.intents = {};
    this.fallback = {
      responses: [
        "I'm not sure I understand. Could you rephrase that?",
        "I didn't quite catch that. Can you say it differently?",
        "I'm still learning and didn't understand your request."
      ]
    };
  }
  
  /**
   * Initialize the template
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    try {
      console.log('Initializing Simple Template with config:', this.config);
      
      // Load intents from config
      this.intents = this.config.intents || {};
      
      // Load fallback responses from config
      if (this.config.fallback && Array.isArray(this.config.fallback.responses)) {
        this.fallback.responses = this.config.fallback.responses;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Simple Template:', error);
      return false;
    }
  }
  
  /**
   * Get next response based on user input and conversation context
   * @param {string} input - User input
   * @param {Object} context - Conversation context
   * @returns {Promise<Object>} - Response object
   */
  async getResponse(input, context = {}) {
    try {
      // Get NLP processing results from context
      const nlp = context.nlp || { intents: [{ name: 'fallback', confidence: 1.0 }] };
      
      // Get the top intent
      const topIntent = nlp.intents[0] || { name: 'fallback', confidence: 1.0 };
      
      // Get responses for the intent
      const intentConfig = this.intents[topIntent.name] || this.fallback;
      
      // Select a random response from the available responses
      const responses = intentConfig.responses || this.fallback.responses;
      const randomIndex = Math.floor(Math.random() * responses.length);
      const responseTemplate = responses[randomIndex];
      
      // Process template variables
      const response = this.processTemplateVariables(responseTemplate, context);
      
      return {
        text: response,
        intent: topIntent.name,
        confidence: topIntent.confidence,
        metadata: {
          template: this.name,
          templateVersion: this.version
        }
      };
    } catch (error) {
      console.error('Error getting response from Simple Template:', error);
      
      // Return fallback response in case of error
      const fallbackResponse = this.fallback.responses[0];
      
      return {
        text: fallbackResponse,
        intent: 'error',
        confidence: 1.0,
        metadata: {
          template: this.name,
          templateVersion: this.version,
          error: error.message
        }
      };
    }
  }
  
  /**
   * Process template variables in a response
   * @param {string} template - Response template with variables
   * @param {Object} context - Conversation context
   * @returns {string} - Processed response
   */
  processTemplateVariables(template, context) {
    // Replace variables in the format {{variable}} with values from context
    return template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const path = variable.trim().split('.');
      let value = context;
      
      // Navigate the context object using the path
      for (const key of path) {
        value = value && value[key];
        if (value === undefined) break;
      }
      
      // Return the value or the original placeholder if not found
      return value !== undefined ? value : match;
    });
  }
  
  /**
   * Validate template configuration
   * @param {Object} config - Template configuration to validate
   * @returns {boolean} - True if configuration is valid
   */
  validateConfig(config) {
    // Check if config is an object
    if (!super.validateConfig(config)) {
      return false;
    }
    
    // Check if intents is an object
    if (config.intents && typeof config.intents !== 'object') {
      return false;
    }
    
    // Check if fallback is properly configured
    if (config.fallback) {
      if (!Array.isArray(config.fallback.responses) || config.fallback.responses.length === 0) {
        return false;
      }
    }
    
    return true;
  }
}

module.exports = SimpleTemplate;
