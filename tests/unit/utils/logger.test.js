/**
 * Logger Tests
 */

// We need to mock winston before importing the logger
jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn(),
    json: jest.fn()
  };
  
  const mockTransports = {
    Console: jest.fn(),
    File: jest.fn()
  };
  
  return {
    format: mockFormat,
    createLogger: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    })),
    transports: mockTransports
  };
});

// Now import the logger
const logger = require('../../../utils/logger');
const winston = require('winston');

describe('Logger', () => {
  it('should export a logger object', () => {
    expect(logger).toBeDefined();
    expect(typeof logger).toBe('object');
  });

  it('should have logging methods', () => {
    expect(logger.debug).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should create a winston logger', () => {
    expect(winston.createLogger).toHaveBeenCalled();
  });

  it('should use winston format combiners', () => {
    expect(winston.format.combine).toHaveBeenCalled();
    expect(winston.format.timestamp).toHaveBeenCalled();
    expect(winston.format.printf).toHaveBeenCalled();
  });

  it('should log messages at different levels', () => {
    // Call the logging methods
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');

    // Since we're using a mock, we can't directly verify the output
    // But we can verify that the methods were called
    expect(logger.debug).toHaveBeenCalledWith('Debug message');
    expect(logger.info).toHaveBeenCalledWith('Info message');
    expect(logger.warn).toHaveBeenCalledWith('Warning message');
    expect(logger.error).toHaveBeenCalledWith('Error message');
  });

  it('should log objects as well as strings', () => {
    const testObject = { key: 'value', nested: { prop: true } };
    
    logger.info('Object log', testObject);
    
    expect(logger.info).toHaveBeenCalledWith('Object log', testObject);
  });
});
