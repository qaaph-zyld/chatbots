/**
 * Base Chatbot Engine Tests
 */

// Import the base engine
require('@src/bot\engines\base.engine');

describe('Base Chatbot Engine', () => {
  describe('Constructor', () => {
    it('should throw an error when instantiated directly', () => {
      // Act & Assert
      expect(() => new BaseChatbotEngine()).toThrow(
        'BaseChatbotEngine is an abstract class and cannot be instantiated directly'
      );
    });

    it('should allow subclasses to be instantiated', () => {
      // Arrange
      class TestEngine extends BaseChatbotEngine {
        async initialize() { return true; }
        async processMessage() { return { text: 'Test response' }; }
        async train() { return { success: true }; }
      }

      // Act & Assert
      expect(() => new TestEngine()).not.toThrow();
    });

    it('should store config in instance', () => {
      // Arrange
      class TestEngine extends BaseChatbotEngine {
        async initialize() { return true; }
        async processMessage() { return { text: 'Test response' }; }
        async train() { return { success: true }; }
      }
      
      const config = { apiKey: 'test-key', model: 'test-model' };
      
      // Act
      const engine = new TestEngine(config);
      
      // Assert
      expect(engine.config).toBe(config);
    });
  });

  describe('Abstract methods', () => {
    it('should throw error when initialize() is not implemented', async () => {
      // Arrange
      class TestEngine extends BaseChatbotEngine {
        // No initialize implementation
        async processMessage() { return { text: 'Test response' }; }
        async train() { return { success: true }; }
      }
      
      const engine = new TestEngine();
      
      // Act & Assert
      await expect(engine.initialize()).rejects.toThrow(
        'Method initialize() must be implemented by subclass'
      );
    });

    it('should throw error when processMessage() is not implemented', async () => {
      // Arrange
      class TestEngine extends BaseChatbotEngine {
        async initialize() { return true; }
        // No processMessage implementation
        async train() { return { success: true }; }
      }
      
      const engine = new TestEngine();
      
      // Act & Assert
      await expect(engine.processMessage('Hello')).rejects.toThrow(
        'Method processMessage() must be implemented by subclass'
      );
    });

    it('should throw error when train() is not implemented', async () => {
      // Arrange
      class TestEngine extends BaseChatbotEngine {
        async initialize() { return true; }
        async processMessage() { return { text: 'Test response' }; }
        // No train implementation
      }
      
      const engine = new TestEngine();
      
      // Act & Assert
      await expect(engine.train([])).rejects.toThrow(
        'Method train() must be implemented by subclass'
      );
    });
  });

  describe('Properly implemented subclass', () => {
    // Create a fully implemented subclass for testing
    class FullTestEngine extends BaseChatbotEngine {
      constructor(config) {
        super(config);
        this.name = 'test-engine';
        this.version = '1.0.0';
        this.initialized = false;
      }
      
      async initialize() {
        this.initialized = true;
        return true;
      }
      
      async processMessage(message, options = {}) {
        if (!this.initialized) {
          throw new Error('Engine not initialized');
        }
        
        return {
          text: `Response to: ${message}`,
          options: options,
          engine: this.name,
          version: this.version
        };
      }
      
      async train(trainingData) {
        return {
          success: true,
          dataPoints: trainingData.length,
          engine: this.name
        };
      }
      
      getInfo() {
        return {
          name: this.name,
          version: this.version,
          initialized: this.initialized,
          config: this.config
        };
      }
    }
    
    let engine;
    
    beforeEach(() => {
      engine = new FullTestEngine({ apiKey: 'test-key' });
    });
    
    it('should initialize successfully', async () => {
      // Act
      const result = await engine.initialize();
      
      // Assert
      expect(result).toBe(true);
      expect(engine.initialized).toBe(true);
    });
    
    it('should process messages and return responses', async () => {
      // Arrange
      await engine.initialize();
      const message = 'Hello, bot!';
      const options = {
        context: { user: 'test-user' },
        personalityModifier: 'friendly'
      };
      
      // Act
      const response = await engine.processMessage(message, options);
      
      // Assert
      expect(response).toEqual({
        text: 'Response to: Hello, bot!',
        options: options,
        engine: 'test-engine',
        version: '1.0.0'
      });
    });
    
    it('should throw error if processing message before initialization', async () => {
      // Act & Assert
      await expect(engine.processMessage('Hello')).rejects.toThrow(
        'Engine not initialized'
      );
    });
    
    it('should train with provided data', async () => {
      // Arrange
      const trainingData = [
        { input: 'Hello', output: 'Hi there' },
        { input: 'How are you?', output: 'I am fine' }
      ];
      
      // Act
      const result = await engine.train(trainingData);
      
      // Assert
      expect(result).toEqual({
        success: true,
        dataPoints: 2,
        engine: 'test-engine'
      });
    });
    
    it('should provide engine info', () => {
      // Act
      const info = engine.getInfo();
      
      // Assert
      expect(info).toEqual({
        name: 'test-engine',
        version: '1.0.0',
        initialized: false,
        config: { apiKey: 'test-key' }
      });
    });
  });
});
