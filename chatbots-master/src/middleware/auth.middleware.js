/**
 * Authentication Middleware
 * Handles API key authentication and role-based access control
 */

const { ApiKey } = require('../models');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * Middleware to validate API key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      throw new UnauthorizedError('API key is required');
    }

    // Find the API key in the database
    const keyDoc = await ApiKey.findOne({ 
      where: { key: apiKey, isActive: true } 
    });

    if (!keyDoc) {
      throw new UnauthorizedError('Invalid API key');
    }

    // Attach the API key document to the request for use in other middleware
    req.apiKey = keyDoc;
    req.user = await keyDoc.getUser();
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check user role
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const checkRole = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (roles.length && !roles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { apiKeyAuth, checkRole };
