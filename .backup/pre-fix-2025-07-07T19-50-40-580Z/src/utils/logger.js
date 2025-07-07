/**
 * Logger Utility
 * 
 * Provides consistent logging functionality throughout the application
 */

// Get current log level from config or default to INFO
const config = require('@src/config');

// Define log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLevel = config.logging?.level 
  ? LOG_LEVELS[config.logging.level.toUpperCase()] 
  : LOG_LEVELS.INFO;

/**
 * Format a log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 * @returns {string} - Formatted log message
 */
function formatLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    return `${formattedMessage}\n${JSON.stringify(data, null, 2)}`;
  }
  
  return formattedMessage;
}

/**
 * Log an error message
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or additional data
 */
function error(message, error = null) {
  if (currentLevel >= LOG_LEVELS.ERROR) {
    if (error instanceof Error) {
      console.error(formatLog('ERROR', message, {
        name: error.name,
        message: error.message,
        stack: error.stack
      }));
    } else {
      console.error(formatLog('ERROR', message, error));
    }
  }
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 * @param {Object} data - Additional data
 */
function warn(message, data = null) {
  if (currentLevel >= LOG_LEVELS.WARN) {
    console.warn(formatLog('WARN', message, data));
  }
}

/**
 * Log an info message
 * @param {string} message - Info message
 * @param {Object} data - Additional data
 */
function info(message, data = null) {
  if (currentLevel >= LOG_LEVELS.INFO) {
    console.info(formatLog('INFO', message, data));
  }
}

/**
 * Log a debug message
 * @param {string} message - Debug message
 * @param {Object} data - Additional data
 */
function debug(message, data = null) {
  if (currentLevel >= LOG_LEVELS.DEBUG) {
    console.debug(formatLog('DEBUG', message, data));
  }
}

module.exports = {
  error,
  warn,
  info,
  debug,
  LOG_LEVELS
};
