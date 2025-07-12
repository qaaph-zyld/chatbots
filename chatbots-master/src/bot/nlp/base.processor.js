/**
 * Base NLP Processor
 * 
 * Abstract base class for all NLP processors
 */

class BaseNLPProcessor {
  /**
   * Constructor
   * @param {Object} config - Processor configuration
   */
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
    this.version = '1.0.0';
    
    if (this.constructor === BaseNLPProcessor) {
      throw new Error('BaseNLPProcessor is an abstract class and cannot be instantiated directly');
    }
  }
  
  /**
   * Initialize the processor
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    throw new Error('Method initialize() must be implemented by subclass');
  }
  
  /**
   * Process text to extract intents and entities
   * @param {string} text - Text to process
   * @param {Object} context - Processing context
   * @returns {Promise<Object>} - Processing results with intents and entities
   */
  async process(text, context = {}) {
    throw new Error('Method process() must be implemented by subclass');
  }
  
  /**
   * Train the processor with new data
   * @param {Array} trainingData - Training data
   * @returns {Promise<Object>} - Training results
   */
  async train(trainingData) {
    throw new Error('Method train() must be implemented by subclass');
  }
  
  /**
   * Get processor status
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

module.exports = BaseNLPProcessor;
