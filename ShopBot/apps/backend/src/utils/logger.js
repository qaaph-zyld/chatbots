const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    // Ensure logs directory exists
    const logsDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  shouldLog(level) {
    return this.logLevels[level] <= this.logLevels[this.logLevel];
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
  }

  writeToFile(level, message) {
    const logFile = path.join(__dirname, '../../logs', `${level}.log`);
    fs.appendFileSync(logFile, message + '\n');
  }

  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message, meta);
      console.error(formatted);
      this.writeToFile('error', formatted);
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, meta);
      console.warn(formatted);
      this.writeToFile('warn', formatted);
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, meta);
      console.info(formatted);
      this.writeToFile('info', formatted);
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, meta);
      console.debug(formatted);
      this.writeToFile('debug', formatted);
    }
  }
}

module.exports = new Logger();
