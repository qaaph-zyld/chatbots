/**
 * Request Timeout Middleware
 * 
 * This middleware enforces request timeouts to prevent long-running requests
 * from consuming too many server resources and potentially causing cascading failures.
 */

/**
 * Create a request timeout middleware
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Default timeout in milliseconds (default: 30000)
 * @param {Object} options.routeTimeouts - Route-specific timeouts, keyed by route path
 * @param {Function} options.onTimeout - Callback function when a request times out
 * @param {boolean} options.respondWithError - Whether to respond with an error (default: true)
 * @param {Object} options.logger - Logger instance (default: console)
 * @returns {Function} Express middleware function
 */
function requestTimeout(options = {}) {
  const defaultOptions = {
    timeout: 30000, // 30 seconds
    routeTimeouts: {},
    respondWithError: true,
    logger: console
  };
  
  const opts = { ...defaultOptions, ...options };
  
  return function timeoutMiddleware(req, res, next) {
    // Skip timeout for specific routes if needed
    if (req.path && opts.routeTimeouts && opts.routeTimeouts[req.path] === 0) {
      return next();
    }
    
    // Determine timeout for this request
    let timeout = opts.timeout;
    
    // Check for route-specific timeout
    if (req.path && opts.routeTimeouts && opts.routeTimeouts[req.path] !== undefined) {
      timeout = opts.routeTimeouts[req.path];
    }
    
    // Check for header-based timeout
    const headerTimeout = req.get('X-Request-Timeout');
    if (headerTimeout) {
      const parsedTimeout = parseInt(headerTimeout, 10);
      if (!isNaN(parsedTimeout) && parsedTimeout > 0) {
        // Use the smaller of the header timeout and the configured timeout
        timeout = Math.min(parsedTimeout, timeout);
      }
    }
    
    // Start timestamp for the request
    req.startTime = Date.now();
    
    // Set up timeout handler
    const timeoutId = setTimeout(() => {
      // Calculate request duration
      const duration = Date.now() - req.startTime;
      
      // Log timeout
      opts.logger.warn(`Request timed out after ${duration}ms: ${req.method} ${req.originalUrl || req.url}`);
      
      // Create timeout error
      const timeoutError = new Error(`Request timeout after ${duration}ms`);
      timeoutError.status = 408; // Request Timeout
      timeoutError.code = 'REQUEST_TIMEOUT';
      timeoutError.timeout = timeout;
      timeoutError.duration = duration;
      
      // Call onTimeout callback if provided
      if (typeof opts.onTimeout === 'function') {
        opts.onTimeout(req, res, timeoutError);
      }
      
      // Respond with error if configured
      if (opts.respondWithError && !res.headersSent) {
        // Check if the request accepts JSON
        if (req.accepts('json')) {
          res.status(408).json({
            error: 'Request Timeout',
            message: `The request took too long to process and exceeded the ${timeout}ms timeout.`,
            code: 'REQUEST_TIMEOUT',
            timeout,
            duration
          });
        } else {
          res.status(408).send(`Request Timeout: The request took too long to process and exceeded the ${timeout}ms timeout.`);
        }
      }
      
      // Abort the request if possible
      if (req.abort && typeof req.abort === 'function') {
        try {
          req.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }
      
      // Cleanup
      req.timedOut = true;
    }, timeout);
    
    // Store timeout ID on request for potential cancellation
    req.timeoutId = timeoutId;
    
    // Clear timeout when response is finished
    res.on('finish', () => {
      if (req.timeoutId) {
        clearTimeout(req.timeoutId);
        req.timeoutId = null;
      }
      
      // Calculate and log request duration if debug is enabled
      if (opts.debug) {
        const duration = Date.now() - req.startTime;
        opts.logger.debug(`Request completed in ${duration}ms: ${req.method} ${req.originalUrl || req.url}`);
      }
    });
    
    // Also clear timeout on close (client disconnected)
    res.on('close', () => {
      if (req.timeoutId) {
        clearTimeout(req.timeoutId);
        req.timeoutId = null;
      }
    });
    
    // Continue with the request
    next();
  };
}

/**
 * Manually clear a request timeout
 * @param {Object} req - Express request object
 */
function clearRequestTimeout(req) {
  if (req && req.timeoutId) {
    clearTimeout(req.timeoutId);
    req.timeoutId = null;
  }
}

/**
 * Extend a request timeout
 * @param {Object} req - Express request object
 * @param {number} additionalTime - Additional time in milliseconds
 * @returns {boolean} Whether the timeout was extended
 */
function extendRequestTimeout(req, additionalTime) {
  if (!req || !req.timeoutId || req.timedOut) {
    return false;
  }
  
  // Clear existing timeout
  clearTimeout(req.timeoutId);
  
  // Calculate remaining time
  const elapsed = Date.now() - req.startTime;
  const originalTimeout = req.timeout || 30000;
  const remaining = Math.max(0, originalTimeout - elapsed);
  
  // Set new timeout
  req.timeoutId = setTimeout(() => {
    // Calculate request duration
    const duration = Date.now() - req.startTime;
    
    // Create timeout error
    const timeoutError = new Error(`Request timeout after ${duration}ms`);
    timeoutError.status = 408; // Request Timeout
    timeoutError.code = 'REQUEST_TIMEOUT';
    timeoutError.timeout = originalTimeout + additionalTime;
    timeoutError.duration = duration;
    
    // Mark request as timed out
    req.timedOut = true;
    
    // Call onTimeout callback if provided
    if (typeof req.onTimeout === 'function') {
      req.onTimeout(req, req.res, timeoutError);
    }
    
    // Respond with error if configured
    if (req.respondWithError && !req.res.headersSent) {
      req.res.status(408).json({
        error: 'Request Timeout',
        message: `The request took too long to process and exceeded the ${originalTimeout + additionalTime}ms timeout.`,
        code: 'REQUEST_TIMEOUT'
      });
    }
  }, remaining + additionalTime);
  
  return true;
}

module.exports = {
  requestTimeout,
  clearRequestTimeout,
  extendRequestTimeout
};
