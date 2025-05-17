/**
 * Logger Middleware
 * 
 * Express middleware for request logging
 */

const { logger } = require('../utils');

/**
 * Request logging middleware
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;
  
  // Log request start
  logger.info(`${method} ${originalUrl} - Request received`, {
    method,
    url: originalUrl,
    ip,
    userAgent: req.get('user-agent')
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // Determine log level based on status code
    const logLevel = statusCode >= 500 ? 'error' : 
                    statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`${method} ${originalUrl} - ${statusCode} - ${duration}ms`, {
      method,
      url: originalUrl,
      statusCode,
      duration,
      ip
    });
  });
  
  next();
}

module.exports = requestLogger;
