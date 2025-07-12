/**
 * Config Service Tests
 */

const config = require('../../../config');
const logger = require('../../../utils/logger');

// Mock dependencies
jest.mock('../../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('Config Module', () => {
  it('should have server configuration', () => {
    expect(config).toHaveProperty('server');
    expect(config.server).toHaveProperty('port');
    expect(config.server).toHaveProperty('host');
  });

  it('should have database configuration', () => {
    expect(config).toHaveProperty('database');
    expect(config.database).toHaveProperty('uri');
    expect(config.database).toHaveProperty('options');
    expect(config.database.options).toHaveProperty('useNewUrlParser');
    expect(config.database.options).toHaveProperty('useUnifiedTopology');
  });

  it('should have authentication configuration', () => {
    expect(config).toHaveProperty('auth');
    expect(config.auth).toHaveProperty('jwtSecret');
    expect(config.auth).toHaveProperty('jwtExpiresIn');
    expect(config.auth).toHaveProperty('saltRounds');
  });

  it('should have logging configuration', () => {
    expect(config).toHaveProperty('logging');
    expect(config.logging).toHaveProperty('level');
    expect(config.logging).toHaveProperty('file');
    expect(config.logging).toHaveProperty('maxSize');
    expect(config.logging).toHaveProperty('maxFiles');
  });

  it('should have API configuration', () => {
    expect(config).toHaveProperty('api');
    expect(config.api).toHaveProperty('rateLimit');
    expect(config.api.rateLimit).toHaveProperty('windowMs');
    expect(config.api.rateLimit).toHaveProperty('max');
  });

  it('should have NLP configuration', () => {
    expect(config).toHaveProperty('nlp');
    expect(config.nlp).toHaveProperty('defaultLanguage');
    expect(config.nlp).toHaveProperty('modelPath');
  });

  it('should have voice configuration', () => {
    expect(config).toHaveProperty('voice');
    expect(config.voice).toHaveProperty('sttModelPath');
    expect(config.voice).toHaveProperty('ttsModelPath');
  });

  it('should use environment variables when available', () => {
    // Save original env vars
    const originalEnv = { ...process.env };
    
    try {
      // Set test env vars
      process.env.PORT = '4000';
      process.env.HOST = 'test-host';
      process.env.MONGODB_URI = 'mongodb://test-host:27017/test-db';
      process.env.JWT_SECRET = 'test-secret';
      process.env.LOG_LEVEL = 'DEBUG';
      
      // Reload config (this may not work as expected if config is cached)
      jest.resetModules();
      const freshConfig = require('../../../config');
      
      // Test that env vars are used
      expect(freshConfig.server.port).toBe('4000');
      expect(freshConfig.server.host).toBe('test-host');
      expect(freshConfig.database.uri).toBe('mongodb://test-host:27017/test-db');
      expect(freshConfig.auth.jwtSecret).toBe('test-secret');
      expect(freshConfig.logging.level).toBe('DEBUG');
    } finally {
      // Restore original env vars
      process.env = originalEnv;
    }
  });
});
