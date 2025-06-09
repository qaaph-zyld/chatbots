/**
 * Bot Engine Factory Tests
 */

// Mock dependencies before importing the engine factory
jest.mock('../../../utils', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../config', () => ({
  chatbot: {
    enabledEngines: ['botpress', 'huggingface']
  }
}));

// Mock the engine implementations
jest.mock('../../../bot/engines/botpress.engine', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    processMessage: jest.fn().mockResolvedValue({ text: 'Botpress response' }),
    getInfo: jest.fn().mockReturnValue({ name: 'Botpress', version: '1.0.0' })
  }));
});

jest.mock('../../../bot/engines/huggingface.engine', () => {
  return jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(true),
    processMessage: jest.fn().mockResolvedValue({ text: 'HuggingFace response' }),
    getInfo: jest.fn().mockReturnValue({ name: 'HuggingFace', version: '1.0.0' })
  }));
});

// Import the engine factory after mocks
require('@src/bot\engines\engine.factory');
require('@src/bot\engines\botpress.engine');
require('@src/bot\engines\huggingface.engine');
require('@src/utils');
require('@src/config');

describe('Chatbot Engine Factory', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset engine factory state
    engineFactory.engines = {};
  });

  describe('getEngine', () => {
    it('should create and return a Botpress engine instance', () => {
      // Arrange
      const engineType = 'botpress';
      const engineConfig = { apiKey: 'test-key' };

      // Act
      const engine = engineFactory.getEngine(engineType, engineConfig);

      // Assert
      expect(engine).toBeDefined();
      expect(BotpressEngine).toHaveBeenCalledWith(engineConfig);
      expect(engineFactory.engines[Object.keys(engineFactory.engines)[0]]).toBe(engine);
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Created engine instance'),
        expect.any(Object)
      );
    });

    it('should create and return a HuggingFace engine instance', () => {
      // Arrange
      const engineType = 'huggingface';
      const engineConfig = { model: 'gpt2' };

      // Act
      const engine = engineFactory.getEngine(engineType, engineConfig);

      // Assert
      expect(engine).toBeDefined();
      expect(HuggingFaceEngine).toHaveBeenCalledWith(engineConfig);
      expect(engineFactory.engines[Object.keys(engineFactory.engines)[0]]).toBe(engine);
    });

    it('should throw an error for unknown engine type', () => {
      // Arrange
      const engineType = 'unknown';

      // Act & Assert
      expect(() => engineFactory.getEngine(engineType)).toThrow('Unknown engine type: unknown');
      expect(logger.error).toHaveBeenCalledWith('Unknown engine type: unknown');
    });

    it('should throw an error for disabled engine type', () => {
      // Arrange
      const engineType = 'disabled';
      engineFactory.enabledEngines = ['botpress']; // Only botpress is enabled

      // Act & Assert
      expect(() => engineFactory.getEngine(engineType)).toThrow('Engine type disabled is not enabled');
      expect(logger.error).toHaveBeenCalledWith('Engine type disabled is not enabled');
      
      // Restore enabled engines
      engineFactory.enabledEngines = config.chatbot.enabledEngines;
    });

    it('should reuse existing engine instance if available', () => {
      // Arrange
      const engineType = 'botpress';
      const engineConfig = { apiKey: 'test-key' };
      
      // Create first instance
      const firstEngine = engineFactory.getEngine(engineType, engineConfig);
      
      // Clear constructor mock to track new calls
      BotpressEngine.mockClear();
      
      // Act - request same engine type again
      const secondEngine = engineFactory.getEngine(engineType, engineConfig);
      
      // Assert
      expect(secondEngine).toBe(firstEngine);
      expect(BotpressEngine).not.toHaveBeenCalled(); // Constructor not called again
    });
  });

  describe('registerEngine', () => {
    it('should register a custom engine class', () => {
      // Arrange
      const CustomEngine = jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        processMessage: jest.fn().mockResolvedValue({ text: 'Custom response' })
      }));
      
      // Act
      engineFactory.registerEngine('custom', CustomEngine);
      engineFactory.enabledEngines.push('custom');
      
      // Create an instance
      const engine = engineFactory.getEngine('custom');
      
      // Assert
      expect(engine).toBeDefined();
      expect(CustomEngine).toHaveBeenCalled();
    });
  });

  describe('removeEngine', () => {
    it('should remove an engine instance', () => {
      // Arrange
      const engineType = 'botpress';
      const engine = engineFactory.getEngine(engineType);
      const engineId = Object.keys(engineFactory.engines)[0];
      
      // Act
      engineFactory.removeEngine(engineId);
      
      // Assert
      expect(engineFactory.engines[engineId]).toBeUndefined();
    });

    it('should handle removing non-existent engine gracefully', () => {
      // Act & Assert
      expect(() => engineFactory.removeEngine('non-existent')).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Engine not found'),
        expect.any(Object)
      );
    });
  });

  describe('getAllEngines', () => {
    it('should return all engine instances', () => {
      // Arrange
      const botpressEngine = engineFactory.getEngine('botpress');
      const huggingfaceEngine = engineFactory.getEngine('huggingface');
      
      // Act
      const engines = engineFactory.getAllEngines();
      
      // Assert
      expect(Object.values(engines)).toContain(botpressEngine);
      expect(Object.values(engines)).toContain(huggingfaceEngine);
    });
  });
});
