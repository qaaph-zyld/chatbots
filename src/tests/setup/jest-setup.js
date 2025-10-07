/**
 * Jest Setup
 * 
 * Setup file for Jest tests
 */

// Use the correct path alias
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Import test setup utilities
const { connectTestDB, disconnectTestDB, clearDatabase } = require('./mongoose-test-setup');
require('@tests/setup/mongoose-model-helper');

// Mock configuration to prevent undefined errors
jest.mock('../../config', () => {
  return require('./test-config');
});

// Define clearModels function
function clearModels() {
  try {
    // Clear mongoose models for tests
    if (mongoose && mongoose.models) {
      Object.keys(mongoose.models).forEach(key => {
        delete mongoose.models[key];
      });
    }
    if (mongoose && mongoose.modelSchemas) {
      Object.keys(mongoose.modelSchemas).forEach(key => {
        delete mongoose.modelSchemas[key];
      });
    }
  } catch (error) {
    console.warn('Error clearing models:', error.message);
  }
}

// Expose clearModels globally
global.clearModels = clearModels;

// Ensure mongoose models are cleared before tests
beforeAll(async () => {
  clearModels();
  // Create test directories for storage
  const testConfig = require('@src/tests/setup/test-config');
  const dirs = [
    testConfig.storage.baseDir,
    testConfig.storage.tempDir,
    testConfig.storage.dataDir,
    testConfig.storage.cacheDir,
    testConfig.storage.modelDir,
    testConfig.stt.modelPath,
    testConfig.tts.modelPath,
    testConfig.recognition.modelPath,
    testConfig.nlp.modelPath,
    testConfig.chatbot.modelPath
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
});

// Clear Mongoose models and mocks before each test
beforeEach(() => {
  clearModels();
  jest.clearAllMocks();
  jest.restoreAllMocks();
  
  // Mock timers to prevent hanging tests due to setTimeout/setInterval
  jest.useFakeTimers('modern');
});

// Reset timers after each test
afterEach(() => {
  // Run any pending timers and clear them
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Clean up after tests
afterAll(async () => {
  try {
    await disconnectTestDB();
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
  }
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/chatbots-test';

// No proxy configuration needed for tests

// Increase test timeout for slower tests
jest.setTimeout(60000);

// Global test utilities
global.testUtils = {
  // Generate a random ID for testing
  generateId: () => new mongoose.Types.ObjectId().toString(),
  
  // Create a mock request object
  mockRequest: (data = {}) => {
    const req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      cookies: {},
      user: { _id: new mongoose.Types.ObjectId().toString(), role: 'user' },
      ...data
    };
    return req;
  },
  
  // Create a mock response object
  mockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    return res;
  },
  
  // Create a mock next function
  mockNext: () => jest.fn(),
  
  // Load test fixtures
  loadFixture: (fixtureName) => {
    const fixturePath = path.join(__dirname, '../fixtures', `${fixtureName}.json`);
    return require(fixturePath);
  },
  
  // Connect to test database (for integration tests)
  connectTestDB: async () => {
    return await connectTestDB();
  },
  
  // Create a mock model
  createMockModel: (modelName, schema = {}) => {
    const mockModel = function(data) {
      this.data = { ...data };
      this.save = jest.fn().mockResolvedValue(this.data);
    };
    
    mockModel.find = jest.fn().mockResolvedValue([]);
    mockModel.findOne = jest.fn().mockResolvedValue(null);
    mockModel.findById = jest.fn().mockResolvedValue(null);
    mockModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
    mockModel.findByIdAndDelete = jest.fn().mockResolvedValue(null);
    mockModel.create = jest.fn().mockImplementation(data => {
      const instance = new mockModel(data);
      instance._id = new mongoose.Types.ObjectId().toString();
      return Promise.resolve(instance);
    });
    
    return mockModel;
  }
};

// Define safeCompileModel function before exposing it
function safeCompileModel(modelName, schema, options = {}) {
  try {
    // Mock implementation for tests
    const mockModel = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => {
        const instance = { ...data, _id: new mongoose.Types.ObjectId().toString() };
        return Promise.resolve(instance);
      }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      countDocuments: jest.fn().mockResolvedValue(0)
    };
    
    // Add save method to instances
    mockModel.create = jest.fn().mockImplementation((data) => {
      const instance = { 
        ...data, 
        _id: new mongoose.Types.ObjectId().toString(),
        save: jest.fn().mockResolvedValue(instance)
      };
      return Promise.resolve(instance);
    });
    
    return mockModel;
  } catch (error) {
    console.warn(`Failed to compile model ${modelName}:`, error.message);
    // Return a basic mock model
    const mockModel = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => {
        const instance = { ...data, _id: new mongoose.Types.ObjectId().toString() };
        return Promise.resolve(instance);
      }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      countDocuments: jest.fn().mockResolvedValue(0)
    };
    
    mockModel.create = jest.fn().mockImplementation((data) => {
      const instance = { 
        ...data, 
        _id: new mongoose.Types.ObjectId().toString(),
        save: jest.fn().mockResolvedValue(instance)
      };
      instance._id = new mongoose.Types.ObjectId().toString();
      return Promise.resolve(instance);
    });
    
    return mockModel;
  }
}

// Expose helper functions globally for tests
global.safeCompileModel = safeCompileModel;

// Mock common modules that cause issues in tests
jest.mock('../../utils/model-manager', () => {
  return {
    ensureDirectories: jest.fn(),
    getAvailableModels: jest.fn().mockReturnValue([]),
    getInstalledModels: jest.fn().mockResolvedValue([]),
    downloadModel: jest.fn().mockResolvedValue({ success: true }),
    deleteModel: jest.fn().mockResolvedValue({ success: true }),
    getModelStatus: jest.fn().mockResolvedValue({
      stt: { installed: [], available: [] },
      tts: { installed: [], available: [] }
    })
  };
});

jest.mock('../../utils/audio-processor', () => {
  return {
    initialize: jest.fn().mockResolvedValue(true),
    processAudio: jest.fn().mockResolvedValue({ success: true, data: Buffer.from('test') }),
    detectVoiceActivity: jest.fn().mockResolvedValue({ hasVoice: true }),
    getAudioInfo: jest.fn().mockResolvedValue({ 
      duration: 5.0, 
      sampleRate: 16000, 
      channels: 1 
    })
  };
});

jest.mock('../../utils/language-detector', () => {
  return {
    initialize: jest.fn().mockResolvedValue(true),
    detectLanguage: jest.fn().mockResolvedValue({ language: 'en', confidence: 0.95 }),
    getSupportedLanguages: jest.fn().mockReturnValue(['en', 'fr', 'es', 'de']),
    isLanguageSupported: jest.fn().mockReturnValue(true),
    getBestLocale: jest.fn().mockReturnValue('en-US')
  };
});

// Suppress console output during tests
global.console = {
  ...console,
  // Comment out to see logs during test debugging
  log: jest.fn(),
  info: jest.fn(),
  // Keep warnings and errors visible for debugging
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
