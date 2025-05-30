/**
 * Model Manager Tests
 * 
 * Tests for the model manager utility.
 */

const path = require('path');
const fs = require('fs');
const modelManager = require('../../src/utils/model-manager');

// Mock data for testing
const mockModelRegistry = {
  stt: {
    deepspeech: {
      models: [
        {
          name: 'Test DeepSpeech Model',
          version: '1.0',
          language: 'en-US',
          url: 'https://example.com/test-model.pbmm',
          size: 1000,
          sha256: 'abcdef1234567890',
          type: 'file',
          path: 'test-model.pbmm'
        }
      ]
    }
  }
};

// Mock functions
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    existsSync: jest.fn().mockImplementation(path => {
      if (path.includes('test-model.pbmm')) {
        return false; // Model doesn't exist initially
      }
      return originalFs.existsSync(path);
    }),
    promises: {
      ...originalFs.promises,
      writeFile: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue(Buffer.from('test')),
      unlink: jest.fn().mockResolvedValue(undefined)
    }
  };
});

jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({ data: Buffer.from('test') }),
  default: jest.fn().mockImplementation(() => Promise.resolve({
    data: {
      pipe: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'data') {
          callback(Buffer.from('test'));
        }
        return { on: jest.fn() };
      })
    }
  }))
}));

describe('Model Manager', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Replace model registry with mock data
    modelManager.modelRegistry = mockModelRegistry;
  });
  
  describe('Directory Management', () => {
    test('should ensure directories exist', () => {
      modelManager.ensureDirectories();
      expect(fs.existsSync).toHaveBeenCalled();
    });
  });
  
  describe('Model Information', () => {
    test('should get available models', () => {
      const models = modelManager.getAvailableModels('stt', 'deepspeech');
      
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('name');
      expect(models[0]).toHaveProperty('version');
      expect(models[0]).toHaveProperty('language');
    });
    
    test('should get available models for all engines', () => {
      const models = modelManager.getAvailableModels('stt');
      
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0]).toHaveProperty('engine');
    });
    
    test('should handle invalid model type', () => {
      const models = modelManager.getAvailableModels('invalid');
      
      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(0);
    });
  });
  
  describe('Model Installation', () => {
    test('should check if model is installed', async () => {
      const modelPath = path.join('/test', 'test-model.pbmm');
      const model = {
        type: 'file',
        path: 'test-model.pbmm'
      };
      
      const isInstalled = await modelManager.isModelInstalled(modelPath, model);
      
      expect(isInstalled).toBe(false);
      expect(fs.existsSync).toHaveBeenCalledWith(modelPath);
    });
    
    test('should get model path', () => {
      const model = {
        path: 'test-model.pbmm'
      };
      
      const modelPath = modelManager.getModelPath('stt', model);
      
      expect(modelPath).toBeDefined();
      expect(typeof modelPath).toBe('string');
      expect(modelPath).toContain('test-model.pbmm');
    });
    
    test('should throw error for invalid model type', () => {
      const model = {
        path: 'test-model.pbmm'
      };
      
      expect(() => {
        modelManager.getModelPath('invalid', model);
      }).toThrow();
    });
  });
  
  describe('Model Status', () => {
    test('should get model status', async () => {
      // Mock getInstalledModels to return empty arrays
      modelManager.getInstalledModels = jest.fn().mockImplementation(type => {
        return Promise.resolve([]);
      });
      
      const status = await modelManager.getModelStatus();
      
      expect(status).toBeDefined();
      expect(status).toHaveProperty('stt');
      expect(status).toHaveProperty('tts');
      expect(status).toHaveProperty('recognition');
      
      expect(status.stt).toHaveProperty('installed');
      expect(status.stt).toHaveProperty('available');
      expect(status.stt).toHaveProperty('defaultEngine');
      
      expect(Array.isArray(status.stt.installed)).toBe(true);
      expect(Array.isArray(status.stt.available)).toBe(true);
    });
  });
});
