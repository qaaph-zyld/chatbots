/**
 * Security Middleware Module
 * 
 * Provides comprehensive security measures for the chatbot platform,
 * including helmet configuration, rate limiting, CORS, and more.
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const hpp = require('hpp');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../utils/logger');

/**
 * Configure and return all security middleware
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} - Object containing all security middleware
 */
const configureSecurityMiddleware = (options = {}) => {
  const config = {
    // Default configuration
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' },
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests from this IP, please try again later',
    },
    cors: {
      origin: '*', // Update in production
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
      credentials: true,
    },
    ...options,
  };

  // Create middleware object
  const middleware = {
    /**
     * Apply all security middleware to an Express app
     * 
     * @param {Object} app - Express app
     */
    applyAll: (app) => {
      if (!app || typeof app.use !== 'function') {
        throw new Error('Invalid Express app');
      }

      // Apply all middleware
      app.use(middleware.helmet());
      app.use(middleware.cors());
      app.use(middleware.requestId());
      app.use(middleware.rateLimit());
      app.use(middleware.hpp());
      app.use(middleware.xss());
      app.use(middleware.mongoSanitize());
      app.use(middleware.securityHeaders());

      logger.info('Security: Applied all security middleware');
    },

    /**
     * Helmet middleware for setting secure HTTP headers
     */
    helmet: () => helmet(config.helmet),

    /**
     * Rate limiting middleware
     */
    rateLimit: () => rateLimit(config.rateLimit),

    /**
     * CORS middleware
     */
    cors: () => cors(config.cors),

    /**
     * HTTP Parameter Pollution protection
     */
    hpp: () => hpp(),

    /**
     * XSS protection middleware
     */
    xss: () => xss(),

    /**
     * MongoDB query sanitization
     */
    mongoSanitize: () => mongoSanitize(),

    /**
     * Request ID middleware
     */
    requestId: () => (req, res, next) => {
      req.id = req.headers['x-request-id'] || uuidv4();
      res.setHeader('X-Request-ID', req.id);
      next();
    },

    /**
     * Additional security headers middleware
     */
    securityHeaders: () => (req, res, next) => {
      // Set additional security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    },

    /**
     * JWT authentication middleware
     * 
     * @param {Object} options - JWT options
     */
    jwtAuth: (jwtOptions = {}) => {
      const jwt = require('express-jwt');
      const config = {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        algorithms: ['HS256'],
        ...jwtOptions,
      };

      return jwt(config);
    },

    /**
     * API key authentication middleware
     */
    apiKeyAuth: () => (req, res, next) => {
      const apiKey = req.headers['x-api-key'];
      
      if (!apiKey) {
        return res.status(401).json({ 
          success: false, 
          message: 'API key is missing' 
        });
      }
      
      // In a real implementation, validate against stored API keys
      // This is a placeholder for demonstration
      if (apiKey !== process.env.API_KEY) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid API key' 
        });
      }
      
      next();
    },
    
    /**
     * Role-based access control middleware
     * 
     * @param {string[]} roles - Allowed roles
     */
    rbac: (roles = []) => (req, res, next) => {
      // Assuming user and role are set by previous auth middleware
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Insufficient permissions' 
        });
      }
      
      next();
    },
    
    /**
     * Content Security Policy reporting middleware
     */
    cspReporting: () => (req, res, next) => {
      if (req.method === 'POST' && req.path === '/api/csp-report') {
        try {
          const report = req.body;
          logger.warn('CSP Violation:', report);
          return res.status(204).end();
        } catch (err) {
          logger.error('Error processing CSP report:', err);
          return res.status(400).end();
        }
      }
      next();
    },
    
    /**
     * SQL injection protection middleware
     */
    sqlInjectionProtection: () => (req, res, next) => {
      // Simple SQL injection detection
      const isSuspicious = (value) => {
        if (typeof value !== 'string') return false;
        
        const sqlRegex = /('|"|;|--|\/\*|\*\/|=|drop|select|insert|update|delete|union|into|load_file|outfile)/i;
        return sqlRegex.test(value);
      };
      
      // Check query parameters
      const params = req.query;
      for (const key in params) {
        if (isSuspicious(params[key])) {
          logger.warn(`Potential SQL injection attempt in query param: ${key}=${params[key]}`);
          return res.status(403).json({ 
            success: false, 
            message: 'Invalid request' 
          });
        }
      }
      
      // For POST/PUT requests, check body
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const checkObject = (obj) => {
          for (const key in obj) {
            if (typeof obj[key] === 'string' && isSuspicious(obj[key])) {
              logger.warn(`Potential SQL injection attempt in body: ${key}=${obj[key]}`);
              return true;
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              if (checkObject(obj[key])) return true;
            }
          }
          return false;
        };
        
        if (checkObject(req.body)) {
          return res.status(403).json({ 
            success: false, 
            message: 'Invalid request' 
          });
        }
      }
      
      next();
    }
  };

  return middleware;
};

module.exports = configureSecurityMiddleware;
