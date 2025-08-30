/**
 * Performance Middleware
 * 
 * This module provides Express middleware for optimizing API performance,
 * including response compression, caching headers, and request timing.
 */

const compression = require('compression');
const helmet = require('helmet');
const responseTime = require('response-time');
const { performance } = require('perf_hooks');
const config = require('../config');

/**
 * Configure and return compression middleware
 * @returns {Function} Compression middleware
 */
const compressResponses = () => {
  return compression({
    // Only compress responses larger than 1KB
    threshold: 1024,
    // Don't compress responses for clients that don't support it
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Use compression by default
      return compression.filter(req, res);
    },
    // Compression level (0-9, where 0 = no compression, 9 = max compression)
    level: 6
  });
};

/**
 * Add security headers
 * @returns {Function} Helmet middleware
 */
const securityHeaders = () => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "wss:", "ws:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"]
      }
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' }
  });
};

/**
 * Add cache control headers based on route
 * @returns {Function} Cache control middleware
 */
const cacheControl = () => {
  return (req, res, next) => {
    // Static assets can be cached longer
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      res.set('Cache-Control', 'public, max-age=86400'); // 24 hours
    } 
    // API responses that rarely change
    else if (req.path.match(/^\/api\/v1\/(settings|chatbot-templates)/)) {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
    // Dynamic API responses
    else if (req.path.match(/^\/api\/v1\//)) {
      res.set('Cache-Control', 'private, max-age=0, no-cache');
    }
    // Default for other routes
    else {
      res.set('Cache-Control', 'no-store');
    }
    next();
  };
};

/**
 * Track response time and log slow requests
 * @returns {Function} Response time middleware
 */
const trackResponseTime = () => {
  return responseTime((req, res, time) => {
    // Add response time to headers
    res.set('X-Response-Time', `${time.toFixed(2)}ms`);
    
    // Log slow requests (> 1000ms)
    if (time > 1000) {
      console.warn(`Slow request: ${req.method} ${req.originalUrl} - ${time.toFixed(2)}ms`);
    }
    
    // Collect metrics for monitoring
    if (req.path.match(/^\/api\/v1\//)) {
      const endpoint = req.path.split('?')[0];
      const method = req.method;
      
      // This would typically be sent to a metrics collection system
      // For now, we'll just log it in development
      if (config.env === 'development') {
        console.log(`API Metrics: ${method} ${endpoint} - ${time.toFixed(2)}ms`);
      }
    }
  });
};

/**
 * Detailed performance monitoring for critical paths
 * @param {Array<string>} paths - Critical API paths to monitor
 * @returns {Function} Performance monitoring middleware
 */
const detailedPerformanceMonitoring = (paths = []) => {
  return (req, res, next) => {
    // Only monitor specified paths
    if (!paths.some(path => req.path.includes(path))) {
      return next();
    }
    
    // Start performance measurement
    const start = performance.now();
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Store the start time and request ID
    req.performanceTracking = {
      id: requestId,
      start,
      marks: {},
      measures: {}
    };
    
    // Function to mark points in request processing
    req.markPerformance = (markName) => {
      if (!req.performanceTracking) return;
      
      const markTime = performance.now();
      req.performanceTracking.marks[markName] = markTime;
      
      // Measure from start to this mark
      const measureFromStart = markTime - req.performanceTracking.start;
      req.performanceTracking.measures[`start_to_${markName}`] = measureFromStart;
      
      // Log in development
      if (config.env === 'development') {
        console.log(`Performance [${req.performanceTracking.id}] - ${markName}: ${measureFromStart.toFixed(2)}ms`);
      }
    };
    
    // Capture response finish
    res.on('finish', () => {
      if (!req.performanceTracking) return;
      
      const end = performance.now();
      const totalDuration = end - req.performanceTracking.start;
      
      // Add final measurements
      req.performanceTracking.measures.total = totalDuration;
      
      // Log complete performance data in development
      if (config.env === 'development') {
        console.log(`Performance [${req.performanceTracking.id}] - Complete: ${totalDuration.toFixed(2)}ms`, {
          path: req.path,
          method: req.method,
          measures: req.performanceTracking.measures
        });
      }
      
      // In production, this would be sent to a monitoring system
    });
    
    next();
  };
};

/**
 * Prevent memory leaks from large request bodies
 * @returns {Function} Request size limiting middleware
 */
const limitRequestSize = () => {
  return (req, res, next) => {
    // Skip for file uploads
    if (req.is('multipart/form-data')) {
      return next();
    }
    
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    // Limit request size to 10MB by default
    const maxSize = config.api?.maxRequestSizeBytes || 10 * 1024 * 1024;
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: 'Request entity too large',
        message: `The request size (${contentLength} bytes) exceeds the maximum allowed size (${maxSize} bytes)`
      });
    }
    
    next();
  };
};

/**
 * Apply all performance middleware to an Express app
 * @param {Express} app - Express application
 */
const applyPerformanceMiddleware = (app) => {
  // Apply middleware in the correct order
  app.use(compressResponses());
  app.use(securityHeaders());
  app.use(cacheControl());
  app.use(trackResponseTime());
  app.use(limitRequestSize());
  
  // Apply detailed monitoring to critical paths
  app.use(detailedPerformanceMonitoring([
    '/api/v1/chatbots',
    '/api/v1/conversations',
    '/api/v1/analytics'
  ]));
  
  console.log('Performance middleware applied');
};

module.exports = {
  applyPerformanceMiddleware,
  compressResponses,
  securityHeaders,
  cacheControl,
  trackResponseTime,
  detailedPerformanceMonitoring,
  limitRequestSize
};
