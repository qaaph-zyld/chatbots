/**
 * Scaling Middleware
 * 
 * Middleware to track requests and response times for the scaling service
 */

const scalingService = require('./scaling.service');
const { logger } = require('../utils');

/**
 * Middleware to track requests and response times
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {void}
 */
const trackRequest = (req, res, next) => {
  // Skip tracking for certain routes
  if (req.path.startsWith('/health') || req.path.startsWith('/metrics')) {
    return next();
  }
  
  // Track request
  scalingService.trackRequest();
  
  // Record start time
  req.startTime = Date.now();
  
  // Track response time on response finish
  res.on('finish', () => {
    const responseTime = Date.now() - req.startTime;
    scalingService.trackResponseTime(responseTime);
    
    // Log response time for debugging
    logger.debug(`${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`);
  });
  
  next();
};

module.exports = {
  trackRequest
};
