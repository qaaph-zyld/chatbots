/**
 * Logger Service
 * Centralized logging service for the application
 */

const winston = require('winston');
const path = require('path');

class LoggerService {
  constructor() {
    this.logger = null;
    this.initialize();
  }

  initialize() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { service: 'chatbot-platform' },
      transports: [
        new winston.transports.File({ 
          filename: path.join('logs', 'error.log'), 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: path.join('logs', 'combined.log') 
        })
      ]
    });

    // Add console transport in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  log(level, message, meta = {}) {
    this.logger.log(level, message, meta);
  }
}

// Export singleton instance
module.exports = new LoggerService();
