/**
 * Intent Classification Service Tests
 */

const path = require('path');
const fs = require('fs').promises;

// Mock dependencies before importing the service
jest.mock('@tensorflow/tfjs-node', () => ({
  loadLayersModel: jest.fn().mockResolvedValue({
    predict: jest.fn().mockReturnValue({
      dataSync: jest.fn().mockReturnValue(new Float32Array([0.1, 0.2, 0.8, 0.3])),
      dispose: jest.fn()
    }),
    dispose: jest.fn()
  }),
  tensor: jest.fn().mockReturnValue({
    expandDims: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  }),
  dispose: jest.fn()
}), { virtual: true });

jest.mock('../../utils', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../storage', () => ({
  localStorageService: {
    storeFile: jest.fn().mockResolvedValue({ path: '/mock/path/model.json' }),
    retrieveFile: jest.fn().mockResolvedValue({ 
      data: Buffer.from(JSON.stringify({ intents: ['greeting', 'farewell', 'help', 'cancel'] })),
      info: { path: '/mock/path/tokenizer.json' }
    })
  }
}));

jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');
  return {
    ...originalModule,
    promises: {
      access: jest.fn().mockResolvedValue(undefined),
      mkdir: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockImplementation((path) => {
        if (path.includes('tokenizer')) {
          return Promise.resolve(JSON.stringify({
            vocabulary: { hello: 1, hi: 2, hey: 3, goodbye: 4, bye: 5, help: 6, cancel: 7 },
            intents: ['greeting', 'farewell', 'help', 'cancel']
          }));
        } else if (path.includes('rules')) {
          return Promise.resolve(JSON.stringify({
            rules: [
              { pattern: '\\b(hello|hi|hey)\\b', intent: 'greeting', confidence: 0.9 },
              { pattern: '\\b(goodbye|bye)\\b', intent: 'farewell', confidence: 0.9 },
              { pattern: '\\bhelp\\b', intent: 'help', confidence: 0.8 },
              { pattern: '\\bcancel\\b', intent: 'cancel', confidence: 0.8 }
            ]
          }));
        }
        return Promise.resolve('{}');
      }),
      writeFile: jest.fn().mockResolvedValue(undefined),
      stat: jest.fn().mockResolvedValue({ isDirectory: () => true })
    }
  };
});

// Import the service after mocks
const intentService = require('../../../../nlp/intent/intent.service');
const tf = require('@tensorflow/tfjs-node');
const { logger } = require('../../../../utils');
const { localStorageService } = require('../../../../storage');

describe('Intent Classification Service', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset service state
    intentService.models = {};
    intentService.tokenizers = {};
    intentService.customIntents = {};
    intentService.initialized = false;
  });

  describe('initialize', () => {
    it('should initialize the service with default configuration', async () => {
      // Act
      const result = await intentService.initialize();
      
      // Assert
      expect(result).toBe(true);
      expect(intentService.initialized).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Intent classification service initialized', expect.any(Object));
    });

    it('should initialize with custom configuration', async () => {
      // Arrange
      const customConfig = {
        defaultModel: 'rules',
        confidenceThreshold: 0.5,
        enabledModels: ['rules']
      };
      
      // Act
      const result = await intentService.initialize(customConfig);
      
      // Assert
      expect(result).toBe(true);
      expect(intentService.config.defaultModel).toBe('rules');
      expect(intentService.config.confidenceThreshold).toBe(0.5);
      expect(intentService.config.enabledModels).toEqual(['rules']);
    });

    it('should handle initialization errors gracefully', async () => {
      // Arrange
      fs.access.mockRejectedValue(new Error('Directory not found'));
      fs.mkdir.mockRejectedValue(new Error('Cannot create directory'));
      
      // Act
      const result = await intentService.initialize();
      
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Failed to initialize intent classification service', expect.any(Object));
    });
  });

  describe('classifyIntent', () => {
    beforeEach(async () => {
      // Initialize the service before each test
      await intentService.initialize();
      
      // Mock the loadModel method
      intentService.loadModel = jest.fn().mockResolvedValue(true);
      
      // Set up rule-based classification
      intentService.classifyWithRules = jest.fn().mockImplementation((text) => {
        if (text.includes('hello') || text.includes('hi')) {
          return { intent: 'greeting', confidence: 0.9, method: 'rules' };
        } else if (text.includes('goodbye') || text.includes('bye')) {
          return { intent: 'farewell', confidence: 0.9, method: 'rules' };
        } else if (text.includes('help')) {
          return { intent: 'help', confidence: 0.8, method: 'rules' };
        } else if (text.includes('cancel')) {
          return { intent: 'cancel', confidence: 0.8, method: 'rules' };
        }
        return { intent: 'unknown', confidence: 0.3, method: 'rules' };
      });
      
      // Set up model-based classification
      intentService.classifyWithModel = jest.fn().mockImplementation((text, modelName) => {
        if (text.includes('hello') || text.includes('hi')) {
          return { intent: 'greeting', confidence: 0.85, method: modelName };
        } else if (text.includes('goodbye') || text.includes('bye')) {
          return { intent: 'farewell', confidence: 0.82, method: modelName };
        } else if (text.includes('help')) {
          return { intent: 'help', confidence: 0.75, method: modelName };
        } else if (text.includes('cancel')) {
          return { intent: 'cancel', confidence: 0.78, method: modelName };
        }
        return { intent: 'unknown', confidence: 0.25, method: modelName };
      });
    });

    it('should classify intent using the default model', async () => {
      // Arrange
      const text = 'hello there';
      
      // Act
      const result = await intentService.classifyIntent(text);
      
      // Assert
      expect(result).toEqual({
        intent: 'greeting',
        confidence: 0.85,
        method: 'universal-sentence-encoder'
      });
      expect(intentService.classifyWithModel).toHaveBeenCalledWith(
        text,
        'universal-sentence-encoder'
      );
    });

    it('should classify intent using a specified model', async () => {
      // Arrange
      const text = 'goodbye for now';
      const options = { model: 'rules' };
      
      // Act
      const result = await intentService.classifyIntent(text, options);
      
      // Assert
      expect(result).toEqual({
        intent: 'farewell',
        confidence: 0.9,
        method: 'rules'
      });
      expect(intentService.classifyWithRules).toHaveBeenCalledWith(text);
    });

    it('should fallback to rules when model classification confidence is low', async () => {
      // Arrange
      const text = 'I need some assistance';
      
      // Mock low confidence for model classification
      intentService.classifyWithModel.mockResolvedValueOnce({
        intent: 'unknown',
        confidence: 0.3,
        method: 'universal-sentence-encoder'
      });
      
      // Mock higher confidence for rules classification
      intentService.classifyWithRules.mockResolvedValueOnce({
        intent: 'help',
        confidence: 0.75,
        method: 'rules'
      });
      
      // Act
      const result = await intentService.classifyIntent(text);
      
      // Assert
      expect(result).toEqual({
        intent: 'help',
        confidence: 0.75,
        method: 'rules'
      });
    });

    it('should return unknown intent when confidence is below threshold', async () => {
      // Arrange
      const text = 'something completely random';
      
      // Mock low confidence for both methods
      intentService.classifyWithModel.mockResolvedValueOnce({
        intent: 'unknown',
        confidence: 0.2,
        method: 'universal-sentence-encoder'
      });
      
      intentService.classifyWithRules.mockResolvedValueOnce({
        intent: 'unknown',
        confidence: 0.3,
        method: 'rules'
      });
      
      // Act
      const result = await intentService.classifyIntent(text);
      
      // Assert
      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBeLessThan(intentService.config.confidenceThreshold);
    });
  });

  describe('addCustomIntent', () => {
    beforeEach(async () => {
      // Initialize the service before each test
      await intentService.initialize();
    });

    it('should add a new custom intent with examples', async () => {
      // Arrange
      const intentName = 'product_inquiry';
      const examples = [
        'What products do you offer?',
        'Tell me about your products',
        'Do you have any new products?'
      ];
      
      // Act
      const result = await intentService.addCustomIntent(intentName, examples);
      
      // Assert
      expect(result).toBe(true);
      expect(intentService.customIntents[intentName]).toBeDefined();
      expect(intentService.customIntents[intentName].examples).toEqual(examples);
      expect(logger.info).toHaveBeenCalledWith('Custom intent added', expect.any(Object));
    });

    it('should update an existing custom intent', async () => {
      // Arrange
      const intentName = 'product_inquiry';
      const initialExamples = ['What products do you offer?'];
      const newExamples = ['Tell me about your products'];
      
      // Add initial intent
      await intentService.addCustomIntent(intentName, initialExamples);
      
      // Clear mocks
      jest.clearAllMocks();
      
      // Act
      const result = await intentService.addCustomIntent(intentName, newExamples);
      
      // Assert
      expect(result).toBe(true);
      expect(intentService.customIntents[intentName].examples).toEqual([...initialExamples, ...newExamples]);
      expect(logger.info).toHaveBeenCalledWith('Custom intent updated', expect.any(Object));
    });

    it('should limit the number of examples per intent', async () => {
      // Arrange
      const intentName = 'product_inquiry';
      const examples = Array(100).fill().map((_, i) => `Example ${i}`);
      
      // Act
      const result = await intentService.addCustomIntent(intentName, examples);
      
      // Assert
      expect(result).toBe(true);
      expect(intentService.customIntents[intentName].examples.length).toBe(intentService.config.maxExamplesPerIntent);
      expect(logger.warn).toHaveBeenCalledWith('Limiting examples for intent', expect.any(Object));
    });
  });

  describe('removeCustomIntent', () => {
    beforeEach(async () => {
      // Initialize the service before each test
      await intentService.initialize();
      
      // Add a custom intent
      await intentService.addCustomIntent('test_intent', ['This is a test']);
    });

    it('should remove an existing custom intent', async () => {
      // Act
      const result = await intentService.removeCustomIntent('test_intent');
      
      // Assert
      expect(result).toBe(true);
      expect(intentService.customIntents['test_intent']).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith('Custom intent removed', expect.any(Object));
    });

    it('should return false when trying to remove a non-existent intent', async () => {
      // Act
      const result = await intentService.removeCustomIntent('non_existent_intent');
      
      // Assert
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith('Intent not found', expect.any(Object));
    });
  });

  describe('getAvailableIntents', () => {
    beforeEach(async () => {
      // Initialize the service before each test
      await intentService.initialize();
      
      // Add some custom intents
      await intentService.addCustomIntent('product_inquiry', ['What products do you offer?']);
      await intentService.addCustomIntent('order_status', ['Where is my order?']);
    });

    it('should return all available intents', async () => {
      // Act
      const result = await intentService.getAvailableIntents();
      
      // Assert
      expect(result).toContain('greeting');
      expect(result).toContain('farewell');
      expect(result).toContain('help');
      expect(result).toContain('cancel');
      expect(result).toContain('product_inquiry');
      expect(result).toContain('order_status');
    });
  });

  describe('classifyWithRules', () => {
    beforeEach(async () => {
      // Initialize the service before each test
      await intentService.initialize();
    });

    it('should classify text using rule-based patterns', async () => {
      // Arrange
      const text = 'hello, how are you?';
      
      // Act
      const result = await intentService.classifyWithRules(text);
      
      // Assert
      expect(result.intent).toBe('greeting');
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.method).toBe('rules');
    });

    it('should return unknown intent when no rules match', async () => {
      // Arrange
      const text = 'something completely random';
      
      // Act
      const result = await intentService.classifyWithRules(text);
      
      // Assert
      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.method).toBe('rules');
    });
  });

  describe('saveModel', () => {
    beforeEach(async () => {
      // Initialize the service before each test
      await intentService.initialize();
    });

    it('should save a model to storage', async () => {
      // Arrange
      const modelName = 'test-model';
      const modelData = { weights: [1, 2, 3] };
      
      // Act
      const result = await intentService.saveModel(modelName, modelData);
      
      // Assert
      expect(result).toBe(true);
      expect(localStorageService.storeFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        `${modelName}.json`,
        expect.any(Object)
      );
      expect(logger.info).toHaveBeenCalledWith('Model saved', expect.any(Object));
    });

    it('should handle errors when saving a model', async () => {
      // Arrange
      const modelName = 'test-model';
      const modelData = { weights: [1, 2, 3] };
      
      // Mock error
      localStorageService.storeFile.mockRejectedValueOnce(new Error('Storage error'));
      
      // Act
      const result = await intentService.saveModel(modelName, modelData);
      
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Error saving model', expect.any(Object));
    });
  });
});
