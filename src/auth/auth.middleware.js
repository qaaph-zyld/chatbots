/**
 * Authentication Middleware
 * 
 * Provides middleware functions for authenticating requests and checking user roles.
 */

const authService = require('@src/auth/auth.service');
const logger = require('@src/utils/logger');

/**
 * Authenticate JWT token from request header
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.authenticateToken = async (req, res, next) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      req.user = null;
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check for proper Bearer format
    if (!authHeader.startsWith('Bearer ')) {
      req.user = null;
      return res.status(401).json({ error: 'Invalid authorization format' });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      req.user = null;
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // Verify token
      const decoded = await authService.verifyToken(token);
      
      if (!decoded || !decoded.userId) {
        req.user = null;
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Get user by ID using the userId from the decoded token
      const user = await authService.getUserById(decoded.userId);
      
      // Check if user exists
      if (!user) {
        req.user = null;
        return res.status(401).json({ error: 'User not found' });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      req.user = null;
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    req.user = null;
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Check if user has required role
 * @param {string|Array} roles - Required role(s)
 * @returns {Function} - Express middleware
 */
exports.requireRole = exports.hasRole = (roles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Handle malformed user objects
      if (!req.user.role) {
        logger.warn('Role check failed for malformed user object', {
          userId: req.user._id || req.user.id,
          userObject: req.user
        });
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Convert single role to array for consistent handling
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      // Check if user has required role
      if (!requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      logger.error('Role middleware error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Alias for backward compatibility
exports.hasRole = exports.requireRole;

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
// Export both requireRole and hasRole for backward compatibility
exports.requireRole = exports.hasRole = (roles) => {
  return (req, res, next) => {
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    // Convert to array if string
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    // Check if user has role property
    if (!req.user.role && !req.user.roles) {
      logger.warn('Role check failed for malformed user object', { user: req.user });
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }
    
    // Check role
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Alias for backward compatibility
exports.hasRole = exports.requireRole;

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
