/**
 * Logger Service Tests
 */

const LoggerService = require('../../../../src_new/core/services/logger.service');

describe('LoggerService', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('initialization', () => {
    it('should initialize logger service', () => {
      expect(LoggerService).toBeDefined();
      expect(LoggerService.logger).toBeDefined();
    });
  });

  describe('logging methods', () => {
    it('should have info method', () => {
      expect(typeof LoggerService.info).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof LoggerService.error).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof LoggerService.warn).toBe('function');
    });

    it('should have debug method', () => {
      expect(typeof LoggerService.debug).toBe('function');
    });

    it('should log messages without throwing', () => {
      expect(() => {
        LoggerService.info('Test message');
        LoggerService.error('Test error');
        LoggerService.warn('Test warning');
        LoggerService.debug('Test debug');
      }).not.toThrow();
    });
  });
});
