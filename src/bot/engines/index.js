/**
 * Chatbot Engine Factory
 * 
 * Factory for creating and managing chatbot engine instances
 */

const BotpressEngine = require('./botpress.engine');
const HuggingFaceEngine = require('./huggingface.engine');

// Map of engine types to their implementations
const engineTypes = {
  botpress: BotpressEngine,
  huggingface: HuggingFaceEngine,
};

/**
 * Create a new chatbot engine instance
 * @param {string} type - Engine type
 * @param {Object} config - Engine configuration
 * @returns {BaseChatbotEngine} - Engine instance
 */
function createEngine(type, config = {}) {
  const EngineClass = engineTypes[type.toLowerCase()];
  
  if (!EngineClass) {
    throw new Error(`Unknown engine type: ${type}`);
  }
  
  return new EngineClass(config);
}

/**
 * Get available engine types
 * @returns {Array<string>} - Array of available engine types
 */
function getAvailableEngines() {
  return Object.keys(engineTypes);
}

module.exports = {
  createEngine,
  getAvailableEngines,
  // Export engine classes for direct use if needed
  BotpressEngine,
  HuggingFaceEngine,
};
