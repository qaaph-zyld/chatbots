/**
 * App Tests
 */

// Mock dependencies before importing app
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    listen: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };
  return jest.fn(() => mockApp);
});

jest.mock('cors', () => jest.fn());
jest.mock('helmet', () => jest.fn());
jest.mock('morgan', () => jest.fn());
jest.mock('http', () => ({
  createServer: jest.fn(() => ({
    listen: jest.fn((port, cb) => {
      if (cb) cb();
      return { on: jest.fn() };
    })
  }))
}));

jest.mock('../../../database/db.connection', () => ({
  connectDB: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../../api/routes', () => 'apiRoutes');
jest.mock('../../../api/swagger', () => 'swaggerRoutes');
jest.mock('../../../training', () => ({
  trainingRoutes: 'trainingRoutes'
}));
jest.mock('../../../bot/core', () => 'chatbotService');
jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));
jest.mock('../../../utils/pluginLoader', () => ({
  pluginLoader: {
    loadPlugins: jest.fn().mockResolvedValue([])
  }
}));
jest.mock('../../../integrations/integration.manager', () => ({
  getRouter: jest.fn().mockReturnValue('integrationRoutes')
}));
jest.mock('../../../monitoring/usage.service', () => 'usageMonitoringService');
jest.mock('../../../scaling/scaling.service', () => 'scalingService');
jest.mock('../../../scaling/scaling.middleware', () => ({
  trackRequest: jest.fn()
}));
jest.mock('../../../config', () => ({
  server: {
    port: 3000,
    host: 'localhost'
  }
}));

// Import app after mocks
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('../../../database/db.connection');
const { logger } = require('../../../utils');
const { pluginLoader } = require('../../../utils/pluginLoader');
const { trackRequest } = require('../../../scaling/scaling.middleware');
const app = require('../../../app');

describe('App', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Middleware Setup', () => {
    it('should set up middleware correctly', () => {
      // Get the mock express app
      const mockApp = express();
      
      // Check middleware setup
      expect(mockApp.use).toHaveBeenCalledWith(helmet());
      expect(mockApp.use).toHaveBeenCalledWith(cors());
      expect(mockApp.use).toHaveBeenCalledWith(morgan('combined'));
      expect(mockApp.use).toHaveBeenCalledWith(express.json());
      expect(mockApp.use).toHaveBeenCalledWith(express.urlencoded({ extended: true }));
      expect(mockApp.use).toHaveBeenCalledWith(trackRequest);
    });

    it('should set up routes correctly', () => {
      // Get the mock express app
      const mockApp = express();
      
      // Check route setup
      expect(mockApp.use).toHaveBeenCalledWith('/api', 'apiRoutes');
      expect(mockApp.use).toHaveBeenCalledWith('/api/training', 'trainingRoutes');
      expect(mockApp.use).toHaveBeenCalledWith('swaggerRoutes');
      expect(mockApp.use).toHaveBeenCalledWith('/integrations', 'integrationRoutes');
      expect(mockApp.use).toHaveBeenCalledWith(express.static('public'));
    });
  });

  describe('Server Initialization', () => {
    it('should create an HTTP server', () => {
      expect(http.createServer).toHaveBeenCalled();
    });

    it('should connect to the database', async () => {
      // Import the initialization function
      const { initializeApp } = require('../../../app');
      
      // Call the initialization function
      await initializeApp();
      
      // Check that connectDB was called
      expect(connectDB).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Connected to database');
    });

    it('should load plugins', async () => {
      // Import the initialization function
      const { initializeApp } = require('../../../app');
      
      // Call the initialization function
      await initializeApp();
      
      // Check that loadPlugins was called
      expect(pluginLoader.loadPlugins).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Plugins loaded', { count: 0 });
    });

    it('should handle initialization errors', async () => {
      // Import the initialization function
      const { initializeApp } = require('../../../app');
      
      // Mock connectDB to throw an error
      connectDB.mockRejectedValueOnce(new Error('Database connection error'));
      
      // Call the initialization function and catch the error
      await expect(initializeApp()).rejects.toThrow('Database connection error');
      
      // Check that the error was logged
      expect(logger.error).toHaveBeenCalledWith('Database connection error:', expect.any(Object));
    });
  });
});
