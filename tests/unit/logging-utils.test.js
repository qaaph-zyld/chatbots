/**
 * Logging Utilities Unit Tests
 */

describe('Logging Utilities', () => {
  test('should handle log level filtering', () => {
    const LogLevel = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };

    const logger = {
      level: LogLevel.INFO,
      logs: [],
      
      log: function(level, message) {
        if (level <= this.level) {
          this.logs.push({ level, message, timestamp: Date.now() });
        }
      },
      
      error: function(message) { this.log(LogLevel.ERROR, message); },
      warn: function(message) { this.log(LogLevel.WARN, message); },
      info: function(message) { this.log(LogLevel.INFO, message); },
      debug: function(message) { this.log(LogLevel.DEBUG, message); }
    };

    logger.error('Error message');
    logger.warn('Warning message');
    logger.info('Info message');
    logger.debug('Debug message');

    expect(logger.logs).toHaveLength(3);
    expect(logger.logs.find(log => log.level === LogLevel.DEBUG)).toBeUndefined();
  });

  test('should handle log formatting', () => {
    const formatLog = (level, message, meta = {}) => {
      const timestamp = new Date().toISOString();
      const levelName = ['ERROR', 'WARN', 'INFO', 'DEBUG'][level];
      const metaString = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
      
      return `[${timestamp}] ${levelName}: ${message} ${metaString}`.trim();
    };

    const formatted = formatLog(2, 'Test message', { userId: 123 });
    expect(formatted).toContain('INFO: Test message');
    expect(formatted).toContain('"userId":123');
  });

  test('should handle log rotation simulation', () => {
    const rotatingLogger = {
      logs: [],
      maxLogs: 5,
      
      log: function(message) {
        this.logs.push({ message, timestamp: Date.now() });
        
        if (this.logs.length > this.maxLogs) {
          this.logs.shift(); // Remove oldest log
        }
      },
      
      getLogs: function() {
        return this.logs;
      }
    };

    for (let i = 1; i <= 7; i++) {
      rotatingLogger.log(`Message ${i}`);
    }

    const logs = rotatingLogger.getLogs();
    expect(logs).toHaveLength(5);
    expect(logs[0].message).toBe('Message 3');
    expect(logs[4].message).toBe('Message 7');
  });

  test('should handle structured logging', () => {
    const structuredLogger = {
      log: function(level, message, context = {}) {
        return {
          timestamp: new Date().toISOString(),
          level,
          message,
          context,
          service: 'test-service',
          version: '1.0.0'
        };
      }
    };

    const logEntry = structuredLogger.log('info', 'User action', {
      userId: 123,
      action: 'login',
      ip: '192.168.1.1'
    });

    expect(logEntry.level).toBe('info');
    expect(logEntry.message).toBe('User action');
    expect(logEntry.context.userId).toBe(123);
    expect(logEntry.service).toBe('test-service');
  });

  test('should handle log aggregation', () => {
    const logAggregator = {
      counts: {},
      
      aggregate: function(logs) {
        this.counts = {};
        
        logs.forEach(log => {
          const key = log.level;
          this.counts[key] = (this.counts[key] || 0) + 1;
        });
        
        return this.counts;
      },
      
      getTopErrors: function(logs, limit = 5) {
        const errorCounts = {};
        
        logs.filter(log => log.level === 'error')
            .forEach(log => {
              errorCounts[log.message] = (errorCounts[log.message] || 0) + 1;
            });
            
        return Object.entries(errorCounts)
                     .sort(([,a], [,b]) => b - a)
                     .slice(0, limit);
      }
    };

    const logs = [
      { level: 'info', message: 'Info 1' },
      { level: 'error', message: 'Error A' },
      { level: 'error', message: 'Error A' },
      { level: 'warn', message: 'Warning' },
      { level: 'error', message: 'Error B' }
    ];

    const counts = logAggregator.aggregate(logs);
    expect(counts.error).toBe(3);
    expect(counts.info).toBe(1);

    const topErrors = logAggregator.getTopErrors(logs);
    expect(topErrors[0]).toEqual(['Error A', 2]);
  });
});
