/**
 * Unit tests for MongoDB configuration
 */

const path = require('path');
const fs = require('fs');

describe('MongoDB Configuration', () => {
  let mongodbConfig;
  let fsMock;
  let processMock;
  let dynamicImportMock;
  let mongoMemoryServerMock;
  
  beforeEach(() => {
    // Mock fs module
    fsMock = {
      existsSync: jest.fn(),
      readFileSync: jest.fn(),
      writeFileSync: jest.fn(),
      mkdirSync: jest.fn()
    };
    
    // Mock process.env
    const originalEnv = process.env;
    processMock = {
      env: { ...originalEnv }
    };
    
    // Mock MongoDB Memory Server
    mongoMemoryServerMock = {
      MongoMemoryServer: jest.fn().mockImplementation(() => ({
        start: jest.fn().mockResolvedValue(),
        getUri: jest.fn().mockResolvedValue('mongodb://localhost:27017/test-memory-db'),
        stop: jest.fn().mockResolvedValue()
      }))
    };
    
    // Mock dynamic import function
    dynamicImportMock = jest.fn().mockResolvedValue(mongoMemoryServerMock);
    
    // Mock dependencies
    jest.mock('fs', () => fsMock);
    jest.mock('path', () => ({
      ...jest.requireActual('path'),
      join: jest.fn().mockImplementation((...args) => args.join('/'))
    }));
    
    // Load the module with mocked dependencies
    jest.mock('../../../src/config/mongodb', () => {
      const originalModule = jest.requireActual('../../../src/config/mongodb');
      return {
        ...originalModule,
        dynamicImport: dynamicImportMock
      };
    });
    
    // Reset module cache to ensure fresh module load with mocks
    jest.resetModules();
    
    // Load the module under test
    mongodbConfig = require('../../../src/config/mongodb');
  });
  
  describe('getMongoConfig', () => {
    it('should return default MongoDB configuration when no overrides', () => {
      // Arrange
      const expectedUri = 'mongodb://localhost:27017/chatbots';
      jest.spyOn(mongodbConfig, 'getMongoUri').mockReturnValue(expectedUri);
      
      // Act
      const config = mongodbConfig.getMongoConfig();
      
      // Assert
      expect(config).toHaveProperty('uri', expectedUri);
      expect(config).toHaveProperty('options');
      expect(config.options).toHaveProperty('useNewUrlParser', true);
      expect(config.options).toHaveProperty('useUnifiedTopology', true);
    });
    
    it('should apply URI override when provided', () => {
      // Arrange
      const overrideUri = 'mongodb://override:27017/custom-db';
      
      // Act
      const config = mongodbConfig.getMongoConfig({ uri: overrideUri });
      
      // Assert
      expect(config).toHaveProperty('uri', overrideUri);
    });
    
    it('should apply options override when provided', () => {
      // Arrange
      const overrideOptions = {
        connectTimeoutMS: 5000,
        socketTimeoutMS: 45000
      };
      
      // Act
      const config = mongodbConfig.getMongoConfig({ options: overrideOptions });
      
      // Assert
      expect(config.options).toHaveProperty('connectTimeoutMS', 5000);
      expect(config.options).toHaveProperty('socketTimeoutMS', 45000);
      expect(config.options).toHaveProperty('useNewUrlParser', true); // Default option preserved
    });
    
    it('should apply retry configuration when provided', () => {
      // Arrange
      const overrideRetry = {
        attempts: 5,
        delay: 1000
      };
      
      // Act
      const config = mongodbConfig.getMongoConfig({ retry: overrideRetry });
      
      // Assert
      expect(config).toHaveProperty('retry');
      expect(config.retry).toHaveProperty('attempts', 5);
      expect(config.retry).toHaveProperty('delay', 1000);
    });
  });
  
  describe('getMongoUri', () => {
    it('should return URI from environment variable when available', () => {
      // Arrange
      process.env.MONGODB_URI = 'mongodb://env-var:27017/env-db';
      
      // Act
      const uri = mongodbConfig.getMongoUri();
      
      // Assert
      expect(uri).toBe('mongodb://env-var:27017/env-db');
      
      // Cleanup
      delete process.env.MONGODB_URI;
    });
    
    it('should return URI from cached file when available and no env var', () => {
      // Arrange
      delete process.env.MONGODB_URI;
      fsMock.existsSync.mockReturnValue(true);
      fsMock.readFileSync.mockReturnValue('mongodb://cached:27017/cached-db');
      
      // Act
      const uri = mongodbConfig.getMongoUri();
      
      // Assert
      expect(uri).toBe('mongodb://cached:27017/cached-db');
      expect(fsMock.existsSync).toHaveBeenCalled();
      expect(fsMock.readFileSync).toHaveBeenCalled();
    });
    
    it('should return default URI when no env var or cached file', () => {
      // Arrange
      delete process.env.MONGODB_URI;
      fsMock.existsSync.mockReturnValue(false);
      
      // Act
      const uri = mongodbConfig.getMongoUri();
      
      // Assert
      expect(uri).toBe('mongodb://localhost:27017/chatbots');
    });
    
    it('should return test URI when in test environment', () => {
      // Arrange
      process.env.NODE_ENV = 'test';
      process.env.MONGODB_TEST_URI = 'mongodb://test:27017/test-db';
      
      // Act
      const uri = mongodbConfig.getMongoUri();
      
      // Assert
      expect(uri).toBe('mongodb://test:27017/test-db');
      
      // Cleanup
      delete process.env.NODE_ENV;
      delete process.env.MONGODB_TEST_URI;
    });
  });
  
  describe('saveSuccessfulUri', () => {
    it('should save URI to cache file', () => {
      // Arrange
      const uri = 'mongodb://success:27017/success-db';
      fsMock.existsSync.mockReturnValue(false);
      
      // Act
      mongodbConfig.saveSuccessfulUri(uri);
      
      // Assert
      expect(fsMock.mkdirSync).toHaveBeenCalled();
      expect(fsMock.writeFileSync).toHaveBeenCalled();
      expect(fsMock.writeFileSync.mock.calls[0][1]).toBe(uri);
    });
    
    it('should not create directory if it already exists', () => {
      // Arrange
      const uri = 'mongodb://success:27017/success-db';
      fsMock.existsSync.mockReturnValue(true);
      
      // Act
      mongodbConfig.saveSuccessfulUri(uri);
      
      // Assert
      expect(fsMock.mkdirSync).not.toHaveBeenCalled();
      expect(fsMock.writeFileSync).toHaveBeenCalled();
    });
    
    it('should handle errors gracefully', () => {
      // Arrange
      const uri = 'mongodb://success:27017/success-db';
      fsMock.writeFileSync.mockImplementation(() => {
        throw new Error('Write error');
      });
      
      // Act & Assert
      expect(() => {
        mongodbConfig.saveSuccessfulUri(uri);
      }).not.toThrow();
    });
  });
  
  describe('Memory Server Functions', () => {
    it('should initialize memory server when available', async () => {
      // Arrange
      dynamicImportMock.mockResolvedValue(mongoMemoryServerMock);
      
      // Act
      const uri = await mongodbConfig.initMemoryServer();
      
      // Assert
      expect(dynamicImportMock).toHaveBeenCalledWith('mongodb-memory-server');
      expect(uri).toBe('mongodb://localhost:27017/test-memory-db');
    });
    
    it('should handle memory server not available', async () => {
      // Arrange
      dynamicImportMock.mockRejectedValue(new Error('Module not found'));
      
      // Act & Assert
      await expect(mongodbConfig.initMemoryServer()).rejects.toThrow();
    });
    
    it('should stop memory server if running', async () => {
      // Arrange
      const mockServer = {
        stop: jest.fn().mockResolvedValue()
      };
      
      // Mock the mongoMemoryServer property
      Object.defineProperty(mongodbConfig, 'mongoMemoryServer', {
        get: jest.fn().mockReturnValue(mockServer),
        set: jest.fn()
      });
      
      // Act
      await mongodbConfig.stopMemoryServer();
      
      // Assert
      expect(mockServer.stop).toHaveBeenCalled();
    });
    
    it('should check if memory server is available', async () => {
      // Arrange
      dynamicImportMock.mockResolvedValue(mongoMemoryServerMock);
      
      // Act
      const isAvailable = await mongodbConfig.isMemoryServerAvailable();
      
      // Assert
      expect(isAvailable).toBe(true);
      expect(dynamicImportMock).toHaveBeenCalledWith('mongodb-memory-server');
    });
    
    it('should handle memory server not available check', async () => {
      // Arrange
      dynamicImportMock.mockRejectedValue(new Error('Module not found'));
      
      // Act
      const isAvailable = await mongodbConfig.isMemoryServerAvailable();
      
      // Assert
      expect(isAvailable).toBe(false);
    });
    
    it('should get test URI from memory server when available', async () => {
      // Arrange
      jest.spyOn(mongodbConfig, 'isMemoryServerAvailable').mockResolvedValue(true);
      jest.spyOn(mongodbConfig, 'initMemoryServer').mockResolvedValue('mongodb://memory:27017/memory-db');
      
      // Act
      const uri = await mongodbConfig.getTestUri();
      
      // Assert
      expect(uri).toBe('mongodb://memory:27017/memory-db');
    });
    
    it('should fall back to test URI when memory server not available', async () => {
      // Arrange
      jest.spyOn(mongodbConfig, 'isMemoryServerAvailable').mockResolvedValue(false);
      process.env.MONGODB_TEST_URI = 'mongodb://test-fallback:27017/test-db';
      
      // Act
      const uri = await mongodbConfig.getTestUri();
      
      // Assert
      expect(uri).toBe('mongodb://test-fallback:27017/test-db');
      
      // Cleanup
      delete process.env.MONGODB_TEST_URI;
    });
  });
  
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });
});
