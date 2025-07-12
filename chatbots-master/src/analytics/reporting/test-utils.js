/**
 * Test Utilities
 * 
 * Mock implementations of utilities for testing purposes
 */

// Mock logger
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data) : ''),
  debug: (message, data) => console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data) : ''),
  warn: (message, data) => console.log(`[WARN] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message, data) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data) : '')
};

// Mock UUID generator
const generateUuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

module.exports = {
  logger,
  generateUuid
};
