/**
 * Jest Setup
 * 
 * Setup file for Jest tests
 */

// Import required modules
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Make sure Jest globals are available
global.jest = require('jest');
global.beforeAll = global.beforeAll || (() => {});
global.afterAll = global.afterAll || (() => {});
global.beforeEach = global.beforeEach || (() => {});
global.afterEach = global.afterEach || (() => {});
global.describe = global.describe || ((name, fn) => fn());
global.it = global.it || ((name, fn) => fn());
global.expect = global.expect || require('expect');

// Define paths outside of the mock factory
const storageBaseDir = path.join(__dirname, '../../storage');

// Ensure the storage directory exists
const ensureStorageDirs = () => {
  const dirs = [
    storageBaseDir,
    path.join(storageBaseDir, 'temp'),
    path.join(storageBaseDir, 'data'),
    path.join(storageBaseDir, 'cache'),
    path.join(storageBaseDir, 'models')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Call the function to ensure storage directories exist
ensureStorageDirs();

// Mock the config module with inline configuration
const mockConfig = {
  app: {
    env: process.env.NODE_ENV || 'test',
    port: parseInt(process.env.PORT, 10) || 3001,
    baseUrl: process.env.BASE_URL || 'http://localhost:3001',
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 3600
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  database: {
    uri: process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/chatbot-test',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000
    },
    test: {
      dropDatabase: true,
      autoIndex: true
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'chatbot-api',
    audience: process.env.JWT_AUDIENCE || 'chatbot-client'
  },
  security: {
    saltRounds: 10,
    passwordResetTokenExpiry: '1h',
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 3600
    }
  },
  storage: {
    baseDir: path.join(__dirname, '../../storage'),
    tempDir: path.join(__dirname, '../../storage/temp'),
    dataDir: path.join(__dirname, '../../storage/data'),
    cacheDir: path.join(__dirname, '../../storage/cache'),
    modelDir: path.join(__dirname, '../../storage/models'),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'text/plain',
      'application/json'
    ]
  },
  logging: {
    level: process.env.LOG_LEVEL || 'error',
    silent: process.env.NODE_ENV === 'test' || false
  },
  features: {
    registration: process.env.FEATURE_REGISTRATION !== 'false',
    emailVerification: process.env.FEATURE_EMAIL_VERIFICATION === 'true',
    passwordReset: process.env.FEATURE_PASSWORD_RESET !== 'false',
    twoFactorAuth: process.env.FEATURE_2FA === 'true',
    rateLimiting: process.env.FEATURE_RATE_LIMITING !== 'false'
  },
  file: {
    enabled: false,
    path: 'logs/test.log',
    maxSize: '20m',
    maxFiles: '14d'
  },
  console: {
    enabled: true
  }
};

// Mock the config module
jest.mock('../../config', () => mockConfig, { virtual: true });

// Alias for @/config
jest.mock('@/config', () => mockConfig, { virtual: true });

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: {
    on: jest.fn(),
    once: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    readyState: 1
  },
  Schema: jest.fn(),
  model: jest.fn().mockImplementation((name, schema) => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({}),
    findById: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
    findOneAndUpdate: jest.fn().mockResolvedValue({}),
    findByIdAndDelete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({}),
    countDocuments: jest.fn().mockResolvedValue(0)
  })),
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id || '507f1f77bcf86cd799439011')
  }
}));

// Configure mocks in beforeAll to ensure proper scoping
beforeAll(() => {

  // Mock commonly used modules
  jest.mock('mongoose');
  jest.mock('jsonwebtoken');
  jest.mock('bcryptjs');
  jest.mock('winston', () => ({
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      printf: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn()
  },
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    transports: [
      new (jest.fn().mockImplementation(() => ({
        log: jest.fn()
      })))()
    ]
  })
}));
});

// Using manual mock from __mocks__/@models.js
// No need for inline mock here

// Mock the utils/errors module using @/ alias
jest.mock('@/utils/errors', () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  },
  BadRequestError: class BadRequestError extends Error {
    constructor(message = 'Bad Request') {
      super(message);
      this.statusCode = 400;
      this.status = 'fail';
    }
  },
  // Add other error classes as needed
}));

// Ensure mongoose models are cleared before tests
beforeAll(async () => {
  clearModels();
  // Create test directories for storage
  require('');
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
  if (typeof jest !== 'undefined') {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  }
});

// Clean up after tests
afterAll(async () => {
  try {
    await teardownTestDB();
  } catch (error) {
    console.error('Error disconnecting from test database:', error);
    // Don't fail the tests if cleanup fails
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
  
  disconnectTestDB: async () => {
    return await disconnectTestDB();
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

// Helper functions are exposed above in the file

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

// Custom matchers are now in matchers.js and loaded via setupFilesAfterEnv
