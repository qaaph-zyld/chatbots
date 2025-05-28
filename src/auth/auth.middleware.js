/**
 * Authentication Middleware
 * 
 * Middleware for protecting API routes
 */

const authService = require('./auth.service');
const { logger } = require('../utils');

/**
 * Authenticate JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token is required'
      });
    }
    
    // Verify token
    const decoded = await authService.verifyToken(token);
    
    // Add user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

/**
 * Authenticate API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.authenticateApiKey = async (req, res, next) => {
  try {
    // Get API key from header or query
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }
    
    // Verify API key
    const user = await authService.verifyApiKey(apiKey);
    
    // Add user to request
    req.user = user;
    
    next();
  } catch (error) {
    logger.error('API key authentication error:', error.message);
    
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }
};

/**
 * Check if user has required permission
 * @param {string} permission - Required permission
 * @returns {Function} - Express middleware
 */
exports.hasPermission = (permission) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Check permission
    if (!authService.hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied'
      });
    }
    
    next();
  };
};

/**
 * Check if user has required role
 * @param {string|Array} roles - Required role(s)
 * @returns {Function} - Express middleware
 */
exports.hasRole = (roles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Convert to array if string
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check role
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Role permission denied'
      });
    }
    
    next();
  };
};

/**
 * Rate limiting middleware
 * @param {number} maxRequests - Maximum requests per time window
 * @param {number} timeWindow - Time window in milliseconds
 * @returns {Function} - Express middleware
 */
exports.rateLimit = (maxRequests = 100, timeWindow = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    // Get client IP
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Get current time
    const now = Date.now();
    
    // Get client requests
    const clientRequests = requests.get(clientIp) || [];
    
    // Remove old requests
    const recentRequests = clientRequests.filter(time => time > now - timeWindow);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      logger.warn(`Rate limit exceeded for IP ${clientIp}`);
      
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(clientIp, recentRequests);
    
    next();
  };
};
