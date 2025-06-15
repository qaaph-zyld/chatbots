/**
 * Test Utilities
 * 
 * Common utilities for test setup and execution
 */

// Create a simple logger for tests
const logger = {
  debug: (message, meta = {}) => console.log(`[DEBUG] ${message}`, meta),
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
  error: (message, meta = {}) => console.error(`[ERROR] ${message}`, meta)
};

// Make logger globally available for test setup files
global.logger = logger;

// Export utility functions that may be needed by test setup
module.exports = {
  // Placeholder for any utility functions that might be required
  // This empty module allows tests to import it without errors
  
  // Helper for test timeouts
  getTestTimeout: () => process.env.TEST_TIMEOUT || 5000,
  
  // Helper for test environment detection
  isTestEnvironment: () => process.env.NODE_ENV === 'test',
  
  // Mock data helper
  createMockData: (type) => {
    return {
      id: `mock-${type}-${Date.now()}`,
      type: type,
      createdAt: new Date().toISOString()
    };
  }
};
