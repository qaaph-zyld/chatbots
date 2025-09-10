/**
 * Authentication Middleware
 * JWT-based authentication for API endpoints
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('./error.middleware');
const logger = require('../../core/services/logger.service');
const config = require('../../core/services/config.service');

/**
 * Verify JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    // Verify token
    const jwtSecret = config.get('jwt.secret') || process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT secret not configured');
      return next(new AppError('Server configuration error', 500));
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    
    logger.debug('User authenticated', { userId: decoded.id });
    next();
  } catch (error) {
    logger.error('Authentication failed', { error: error.message });
    
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    
    next(new AppError('Authentication failed', 401));
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Access denied. Authentication required.', 401));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', { 
        userId: req.user.id, 
        userRole: req.user.role, 
        requiredRoles: roles 
      });
      return next(new AppError('Access denied. Insufficient permissions.', 403));
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const jwtSecret = config.get('jwt.secret') || process.env.JWT_SECRET;
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
