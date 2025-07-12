/**
 * Mock Utilities
 * 
 * This module provides mock implementations of common utilities
 * for testing purposes.
 */

/**
 * Mock logger implementation
 */
const logger = {
  /**
   * Log an informational message
   * @param {string} message - The message to log
   * @param {Object} data - Optional data to include with the log
   */
  info: (message, data) => {
    console.log(`[INFO] ${message}`, data ? JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : '') : '');
  },
  
  /**
   * Log a warning message
   * @param {string} message - The message to log
   * @param {Object} data - Optional data to include with the log
   */
  warn: (message, data) => {
    console.log(`[WARN] ${message}`, data ? JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : '') : '');
  },
  
  /**
   * Log an error message
   * @param {string} message - The message to log
   * @param {Object|Error} error - Optional error to include with the log
   */
  error: (message, error) => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${message}`, error.message);
    } else {
      console.error(`[ERROR] ${message}`, error ? JSON.stringify(error).substring(0, 100) + (JSON.stringify(error).length > 100 ? '...' : '') : '');
    }
  },
  
  /**
   * Log a debug message
   * @param {string} message - The message to log
   * @param {Object} data - Optional data to include with the log
   */
  debug: (message, data) => {
    console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data).substring(0, 100) + (JSON.stringify(data).length > 100 ? '...' : '') : '');
  }
};

/**
 * Generate a UUID
 * @returns {string} - A UUID
 */
function generateUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = {
  logger,
  generateUuid
};
