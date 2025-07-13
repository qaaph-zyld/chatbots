/**
 * Logger Middleware
 * Logs incoming requests and outgoing responses
 */

const { createLogger, format, transports } = require('winston');

// Create a logger instance
const logger = createLogger({
  level: 'info',  
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'chatbot-service' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs to `combined.log`
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// If we're not in production then log to the `console`
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

/**
 * Middleware function to log requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log the request
  logger.info({
    message: 'Request received',
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    body: req.body,
    headers: req.headers
  });

  // Hook into the response finish event to log the response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      message: 'Response sent',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });
  });

  next();
};

module.exports = { requestLogger, logger };
