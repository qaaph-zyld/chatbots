/**
 * Chatbot Engine Index
 * 
 * Exports all engine-related modules and provides factory functionality
 */

const BaseChatbotEngine = require('./base.engine');
const BotpressEngine = require('./botpress.engine');
const HuggingFaceEngine = require('./huggingface.engine');
const engineFactory = require('./engine.factory');

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
  engineFactory,
  // Export engine classes for direct use if needed
  BaseChatbotEngine,
  BotpressEngine,
  HuggingFaceEngine,
};
