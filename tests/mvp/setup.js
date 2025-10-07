/**
 * Minimal Test Setup for MVP
 */

// Simple test utilities
global.testUtils = {
  createMockRequest: (body = {}) => ({
    body,
    headers: {},
    method: 'POST'
  }),
  
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      writeHead: jest.fn(),
      end: jest.fn()
    };
    return res;
  }
};

// Console override for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: originalConsole.error,
  warn: originalConsole.warn
};
