/**
 * Template Manager
 * 
 * Manages conversation templates and provides a unified interface
 */

const SimpleTemplate = require('./simple.template');

// Map of template types to their implementations
const templateTypes = {
  simple: SimpleTemplate
};

/**
 * Create a new template instance
 * @param {string} type - Template type
 * @param {Object} config - Template configuration
 * @returns {BaseTemplate} - Template instance
 */
function createTemplate(type, config = {}) {
  const TemplateClass = templateTypes[type.toLowerCase()];
  
  if (!TemplateClass) {
    throw new Error(`Unknown template type: ${type}`);
  }
  
  return new TemplateClass(config);
}

/**
 * Get available template types
 * @returns {Array<string>} - Array of available template types
 */
function getAvailableTemplates() {
  return Object.keys(templateTypes);
}

class TemplateManager {
  constructor() {
    this.templates = new Map();
    this.defaultTemplate = null;
  }
  
  /**
   * Register a template
   * @param {string} name - Template name
   * @param {BaseTemplate} template - Template instance
   * @param {boolean} isDefault - Whether this is the default template
   * @returns {TemplateManager} - This instance for chaining
   */
  registerTemplate(name, template, isDefault = false) {
    this.templates.set(name, template);
    
    if (isDefault || !this.defaultTemplate) {
      this.defaultTemplate = name;
    }
    
    return this;
  }
  
  /**
   * Initialize all templates
   * @returns {Promise<boolean>} - True if all templates were initialized successfully
   */
  async initialize() {
    try {
      const initPromises = Array.from(this.templates.entries()).map(
        async ([name, template]) => {
          const success = await template.initialize();
          console.log(`Initialized template '${name}': ${success ? 'success' : 'failed'}`);
          return { name, success };
        }
      );
      
      const results = await Promise.all(initPromises);
      const allSucceeded = results.every(result => result.success);
      
      return allSucceeded;
    } catch (error) {
      console.error('Error initializing templates:', error);
      return false;
    }
  }
  
  /**
   * Get response from the specified template or the default
   * @param {string} input - User input
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Response object
   */
  async getResponse(input, options = {}) {
    const templateName = options.template || this.defaultTemplate;
    
    if (!templateName || !this.templates.has(templateName)) {
      throw new Error(`Template '${templateName}' not found`);
    }
    
    const template = this.templates.get(templateName);
    return template.getResponse(input, options.context || {});
  }
  
  /**
   * Get the metadata of all templates
   * @returns {Object} - Metadata of all templates
   */
  getMetadata() {
    const metadata = {};
    
    this.templates.forEach((template, name) => {
      metadata[name] = template.getMetadata();
    });
    
    return {
      templates: metadata,
      defaultTemplate: this.defaultTemplate
    };
  }
}

// Create singleton instance
const templateManager = new TemplateManager();

// Register default templates
const simpleTemplate = createTemplate('simple', {
  intents: {
    greeting: {
      responses: [
        "Hello! How can I help you today?",
        "Hi there! What can I do for you?",
        "Greetings! How may I assist you?"
      ]
    },
    farewell: {
      responses: [
        "Goodbye! Have a great day!",
        "Bye! Feel free to come back if you have more questions.",
        "See you later! Thanks for chatting."
      ]
    },
    thanks: {
      responses: [
        "You're welcome!",
        "Happy to help!",
        "Anytime! Is there anything else you need?"
      ]
    },
    help: {
      responses: [
        "I can help you with information, answer questions, or just chat. What would you like to know?",
        "I'm here to assist you. Just let me know what you need help with.",
        "I can provide information on various topics. What are you interested in?"
      ]
    }
  },
  fallback: {
    responses: [
      "I'm not sure I understand. Could you rephrase that?",
      "I didn't quite catch that. Can you say it differently?",
      "I'm still learning and didn't understand your request."
    ]
  }
});

templateManager.registerTemplate('simple', simpleTemplate, true);

module.exports = {
  templateManager,
  createTemplate,
  getAvailableTemplates,
  // Export template classes for direct use if needed
  SimpleTemplate
};
