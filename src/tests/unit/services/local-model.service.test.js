/**
 * Tests for LocalModelService
 */

const path = require('path');
const fs = require('fs').promises;
const localModelService = require('../../../services/local-model.service');
const { logger } = require('../../../utils');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn().mockResolvedValue(undefined),
    rmdir: jest.fn().mockResolvedValue(undefined),
    access: jest.fn()
  }
}));

jest.mock('axios', () => ({
  get: jest.fn(),
  defaults: {
    proxy: null
  }
}));

jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock stream and events
const mockStream = {
  on: jest.fn(),
  pipe: jest.fn().mockReturnThis()
};

jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    promises: {
      mkdir: jest.fn().mockResolvedValue(undefined),
      readdir: jest.fn(),
      stat: jest.fn(),
      unlink: jest.fn().mockResolvedValue(undefined),
      rmdir: jest.fn().mockResolvedValue(undefined),
      access: jest.fn()
    },
    createWriteStream: jest.fn().mockReturnValue(mockStream)
  };
});

describe('LocalModelService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Only use proxy for local dependency installation when needed
    // For tests, we'll use null proxy by default
    localModelService.setProxyConfig(null);
  });

  describe('initialize', () => {
    it('should create models directory if it does not exist', async () => {
      // Arrange
      fs.promises.access.mockRejectedValue(new Error('Directory does not exist'));
      
      // Act
      const result = await localModelService.initialize();
      
      // Assert
      expect(result).toBe(true);
      expect(fs.promises.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('models'),
        { recursive: true }
      );
      expect(logger.info).toHaveBeenCalledWith('Local model service initialized');
    });
    
    it('should handle initialization errors', async () => {
      // Arrange
      fs.promises.access.mockRejectedValue(new Error('Directory does not exist'));
      fs.promises.mkdir.mockRejectedValue(new Error('Failed to create directory'));
      
      // Act
      const result = await localModelService.initialize();
      
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        'Error initializing local model service:',
        expect.any(Error)
      );
    });
  });

  describe('getAvailableModels', () => {
    it('should return list of available models', async () => {
      // Arrange
      const mockFiles = ['model1', 'model2', 'model3'];
      const mockStats = { isDirectory: () => true, size: 1024 * 1024 * 100 };
      
      fs.promises.readdir.mockResolvedValue(mockFiles);
      fs.promises.stat.mockResolvedValue(mockStats);
      
      // Act
      const result = await localModelService.getAvailableModels();
      
      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        id: 'model1',
        name: 'model1',
        size: 100,
        sizeUnit: 'MB'
      });
    });
    
    it('should filter out non-directory items', async () => {
      // Arrange
      const mockFiles = ['model1', 'model2', 'file.txt'];
      const mockDirStats = { isDirectory: () => true, size: 1024 * 1024 * 100 };
      const mockFileStats = { isDirectory: () => false, size: 1024 };
      
      fs.promises.readdir.mockResolvedValue(mockFiles);
      fs.promises.stat.mockImplementation((path) => {
        if (path.includes('file.txt')) {
          return Promise.resolve(mockFileStats);
        }
        return Promise.resolve(mockDirStats);
      });
      
      // Act
      const result = await localModelService.getAvailableModels();
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(m => m.id)).toEqual(['model1', 'model2']);
    });
    
    it('should handle errors when reading models directory', async () => {
      // Arrange
      fs.promises.readdir.mockRejectedValue(new Error('Failed to read directory'));
      
      // Act
      const result = await localModelService.getAvailableModels();
      
      // Assert
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'Error getting available models:',
        expect.any(Error)
      );
    });
  });

  describe('downloadModel', () => {
    it('should download model and return true on success', async () => {
      // Arrange
      const modelId = 'test-model';
      const modelUrl = 'https://example.com/models/test-model.zip';
      
      // Mock axios response
      const axios = require('axios');
      axios.get.mockResolvedValue({
        data: { pipe: jest.fn() },
        headers: { 'content-length': '1024000' }
      });
      
      // Mock events
      mockStream.on.mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
        return mockStream;
      });
      
      // Act
      const result = await localModelService.downloadModel(modelId, modelUrl);
      
      // Assert
      expect(result).toBe(true);
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining(modelId),
        { recursive: true }
      );
      expect(fs.createWriteStream).toHaveBeenCalled();
      expect(axios.get).toHaveBeenCalledWith(
        modelUrl,
        { responseType: 'stream', proxy: { host: '104.129.196.38', port: 10563 } }
      );
      expect(logger.info).toHaveBeenCalledWith(`Model ${modelId} downloaded successfully`);
    });
    
    it('should handle download errors', async () => {
      // Arrange
      const modelId = 'test-model';
      const modelUrl = 'https://example.com/models/test-model.zip';
      
      // Mock axios error
      const axios = require('axios');
      axios.get.mockRejectedValue(new Error('Download failed'));
      
      // Act
      const result = await localModelService.downloadModel(modelId, modelUrl);
      
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        `Error downloading model ${modelId}:`,
        expect.any(Error)
      );
    });
    
    it('should handle stream errors', async () => {
      // Arrange
      const modelId = 'test-model';
      const modelUrl = 'https://example.com/models/test-model.zip';
      
      // Mock axios response
      const axios = require('axios');
      axios.get.mockResolvedValue({
        data: { pipe: jest.fn() },
        headers: { 'content-length': '1024000' }
      });
      
      // Mock stream error
      mockStream.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          callback(new Error('Stream error'));
        }
        return mockStream;
      });
      
      // Act
      const result = await localModelService.downloadModel(modelId, modelUrl);
      
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        `Error saving model ${modelId}:`,
        expect.any(Error)
      );
    });
  });

  describe('deleteModel', () => {
    it('should delete model directory and return true on success', async () => {
      // Arrange
      const modelId = 'test-model';
      
      // Act
      const result = await localModelService.deleteModel(modelId);
      
      // Assert
      expect(result).toBe(true);
      expect(fs.promises.rmdir).toHaveBeenCalledWith(
        expect.stringContaining(modelId),
        { recursive: true }
      );
      expect(logger.info).toHaveBeenCalledWith(`Model ${modelId} deleted successfully`);
    });
    
    it('should handle deletion errors', async () => {
      // Arrange
      const modelId = 'test-model';
      fs.promises.rmdir.mockRejectedValue(new Error('Deletion failed'));
      
      // Act
      const result = await localModelService.deleteModel(modelId);
      
      // Assert
      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        `Error deleting model ${modelId}:`,
        expect.any(Error)
      );
    });
  });

  describe('loadModel', () => {
    it('should load model and return model instance', async () => {
      // Arrange
      const modelId = 'test-model';
      
      // Mock model loading
      global.require = jest.fn().mockReturnValue({
        loadModel: jest.fn().mockResolvedValue({ id: modelId, loaded: true })
      });
      
      // Act
      const result = await localModelService.loadModel(modelId);
      
      // Assert
      expect(result).toEqual({ id: modelId, loaded: true });
      expect(logger.info).toHaveBeenCalledWith(`Model ${modelId} loaded successfully`);
    });
    
    it('should handle loading errors', async () => {
      // Arrange
      const modelId = 'test-model';
      
      // Mock model loading error
      global.require = jest.fn().mockReturnValue({
        loadModel: jest.fn().mockRejectedValue(new Error('Loading failed'))
      });
      
      // Act & Assert
      await expect(localModelService.loadModel(modelId)).rejects.toThrow('Loading failed');
      expect(logger.error).toHaveBeenCalledWith(
        `Error loading model ${modelId}:`,
        expect.any(Error)
      );
    });
  });

  describe('setProxyConfig', () => {
    it('should set proxy configuration for axios', () => {
      // Arrange
      const proxyConfig = {
        host: '104.129.196.38',
        port: 10563
      };
      
      // Act
      localModelService.setProxyConfig(proxyConfig);
      
      // Assert
      const axios = require('axios');
      expect(axios.defaults.proxy).toEqual(proxyConfig);
    });
    
    it('should handle null proxy configuration', () => {
      // Act
      localModelService.setProxyConfig(null);
      
      // Assert
      const axios = require('axios');
      expect(axios.defaults.proxy).toBeNull();
    });
  });
});
