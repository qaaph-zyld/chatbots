/**
 * Authentication Middleware
 * 
 * Express middleware for authentication and authorization
 */

const { errors } = require('../utils');
const config = require('../config');

/**
 * Authenticate API requests using API key
 */
function apiKeyAuth(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    
    // Check if API key is required
    if (!config.auth.apiKeyRequired) {
      // If API key is not required, set a default user and continue
      req.user = { id: 'anonymous', role: 'guest' };
      return next();
    }
    
    // Check if API key is provided
    if (!apiKey) {
      throw new errors.UnauthorizedError('API key is required');
    }
    
    // In a real implementation, this would validate the API key against a database
    // For now, just check against the config
    if (apiKey !== config.auth.apiKey) {
      throw new errors.UnauthorizedError('Invalid API key');
    }
    
    // Set user information on the request object
    req.user = {
      id: 'api',
      role: 'api'
    };
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user has required role
 * @param {string|Array<string>} roles - Required role(s)
 * @returns {Function} - Express middleware
 */
function checkRole(roles) {
  // Convert single role to array
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      // Check if user exists
      if (!req.user) {
        throw new errors.UnauthorizedError('Authentication required');
      }
      
      // Check if user has required role
      if (!requiredRoles.includes(req.user.role)) {
        throw new errors.ForbiddenError('Insufficient permissions');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  apiKeyAuth,
  checkRole
};
