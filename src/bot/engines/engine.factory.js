/**
 * Chatbot Engine Factory
 * 
 * Factory pattern implementation for creating and managing chatbot engines
 */

require('@src/utils');
require('@src/config');
require('@src/bot\engines\botpress.engine');
require('@src/bot\engines\huggingface.engine');

class ChatbotEngineFactory {
  constructor() {
    this.engines = {};
    this.engineClasses = {
      'botpress': BotpressEngine,
      'huggingface': HuggingFaceEngine
    };
    
    // Register enabled engines from config
    this.enabledEngines = config.chatbot.enabledEngines || ['botpress', 'huggingface'];
  }
  
  /**
   * Get an engine instance by type
   * @param {string} engineType - Type of engine to get
   * @param {Object} engineConfig - Configuration for the engine
   * @returns {BaseChatbotEngine} - Engine instance
   */
  getEngine(engineType, engineConfig = {}) {
    // Check if engine is enabled
    if (!this.enabledEngines.includes(engineType)) {
      logger.error(`Engine type ${engineType} is not enabled`);
      throw new Error(`Engine type ${engineType} is not enabled`);
    }
    
    // Check if engine class exists
    if (!this.engineClasses[engineType]) {
      logger.error(`Unknown engine type: ${engineType}`);
      throw new Error(`Unknown engine type: ${engineType}`);
    }
    
    // Create unique engine ID
    const engineId = `${engineType}-${Date.now()}`;
    
    // Create engine instance
    try {
      const EngineClass = this.engineClasses[engineType];
      const engine = new EngineClass(engineConfig);
      
      // Store engine instance
      this.engines[engineId] = engine;
      
      return engine;
    } catch (error) {
      logger.error(`Error creating engine instance: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Register a new engine class
   * @param {string} engineType - Type name for the engine
   * @param {Class} EngineClass - Engine class to register
   */
  registerEngineClass(engineType, EngineClass) {
    if (this.engineClasses[engineType]) {
      logger.warn(`Overriding existing engine type: ${engineType}`);
    }
    
    this.engineClasses[engineType] = EngineClass;
    logger.info(`Registered engine class: ${engineType}`);
  }
  
  /**
   * Get all available engine types
   * @returns {Array<string>} - List of available engine types
   */
  getAvailableEngineTypes() {
    return Object.keys(this.engineClasses).filter(type => this.enabledEngines.includes(type));
  }
  
  /**
   * Clean up all engine instances
   * @returns {Promise<void>}
   */
  async cleanupEngines() {
    const engineIds = Object.keys(this.engines);
    
    for (const engineId of engineIds) {
      try {
        await this.engines[engineId].cleanup();
        delete this.engines[engineId];
      } catch (error) {
        logger.error(`Error cleaning up engine ${engineId}: ${error.message}`);
      }
    }
    
    logger.info(`Cleaned up ${engineIds.length} engine instances`);
  }
}

// Create singleton instance
const engineFactory = new ChatbotEngineFactory();

module.exports = engineFactory;
