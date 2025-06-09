/**
 * NLP Manager
 * 
 * Manages NLP processors and provides a unified interface
 */

require('@src/bot\nlp\processors\huggingface.processor');
require('@src/bot\nlp\processors\basic.processor');

// Map of processor types to their implementations
const processorTypes = {
  huggingface: HuggingFaceProcessor,
  basic: BasicProcessor
};

/**
 * Create a new NLP processor instance
 * @param {string} type - Processor type
 * @param {Object} config - Processor configuration
 * @returns {BaseNLPProcessor} - Processor instance
 */
function createProcessor(type, config = {}) {
  const ProcessorClass = processorTypes[type.toLowerCase()];
  
  if (!ProcessorClass) {
    throw new Error(`Unknown NLP processor type: ${type}`);
  }
  
  return new ProcessorClass(config);
}

/**
 * Get available processor types
 * @returns {Array<string>} - Array of available processor types
 */
function getAvailableProcessors() {
  return Object.keys(processorTypes);
}

class NLPManager {
  constructor() {
    this.processors = new Map();
    this.defaultProcessor = null;
  }
  
  /**
   * Register a processor
   * @param {string} name - Processor name
   * @param {BaseNLPProcessor} processor - Processor instance
   * @param {boolean} isDefault - Whether this is the default processor
   * @returns {NLPManager} - This instance for chaining
   */
  registerProcessor(name, processor, isDefault = false) {
    this.processors.set(name, processor);
    
    if (isDefault || !this.defaultProcessor) {
      this.defaultProcessor = name;
    }
    
    return this;
  }
  
  /**
   * Initialize all processors
   * @returns {Promise<boolean>} - True if all processors were initialized successfully
   */
  async initialize() {
    try {
      const initPromises = Array.from(this.processors.entries()).map(
        async ([name, processor]) => {
          const success = await processor.initialize();
          console.log(`Initialized NLP processor '${name}': ${success ? 'success' : 'failed'}`);
          return { name, success };
        }
      );
      
      const results = await Promise.all(initPromises);
      const allSucceeded = results.every(result => result.success);
      
      return allSucceeded;
    } catch (error) {
      console.error('Error initializing NLP processors:', error);
      return false;
    }
  }
  
  /**
   * Process text using the specified processor or the default
   * @param {string} text - Text to process
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing results
   */
  async process(text, options = {}) {
    const processorName = options.processor || this.defaultProcessor;
    
    if (!processorName || !this.processors.has(processorName)) {
      throw new Error(`NLP processor '${processorName}' not found`);
    }
    
    const processor = this.processors.get(processorName);
    return processor.process(text, options.context || {});
  }
  
  /**
   * Get the status of all processors
   * @returns {Object} - Status of all processors
   */
  getStatus() {
    const status = {};
    
    this.processors.forEach((processor, name) => {
      status[name] = processor.getStatus();
    });
    
    return {
      processors: status,
      defaultProcessor: this.defaultProcessor
    };
  }
  
  /**
   * Clean up all processors
   * @returns {Promise<void>}
   */
  async cleanup() {
    const cleanupPromises = Array.from(this.processors.values()).map(
      processor => processor.cleanup()
    );
    
    await Promise.all(cleanupPromises);
    this.processors.clear();
    this.defaultProcessor = null;
  }
}

// Create singleton instance
const nlpManager = new NLPManager();

// Register default processors
const basicProcessor = createProcessor('basic');
nlpManager.registerProcessor('basic', basicProcessor, true);

module.exports = {
  nlpManager,
  createProcessor,
  getAvailableProcessors,
  // Export processor classes for direct use if needed
  HuggingFaceProcessor,
  BasicProcessor
};
