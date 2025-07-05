/**
 * Client-Side Error Tracking Utility
 * 
 * This module provides functionality to track and report client-side errors
 * and performance issues to help identify and resolve frontend problems.
 */

class ErrorTracker {
  /**
   * Create a new error tracker
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      endpoint: options.endpoint || '/api/errors',
      appVersion: options.appVersion || '1.0.0',
      appName: options.appName || 'Chatbot Platform',
      environment: options.environment || process.env.NODE_ENV || 'development',
      release: options.release || null,
      maxErrors: options.maxErrors || 100,
      sampleRate: options.sampleRate || 1.0, // 1.0 = 100% of errors
      tags: options.tags || {},
      ignoreErrors: options.ignoreErrors || [],
      ignoreUrls: options.ignoreUrls || [],
      beforeSend: options.beforeSend || null,
      onError: options.onError || null,
      captureUnhandledRejections: options.captureUnhandledRejections !== false,
      captureGlobalErrors: options.captureGlobalErrors !== false,
      captureNetworkErrors: options.captureNetworkErrors !== false,
      breadcrumbs: options.breadcrumbs !== false,
      breadcrumbsMax: options.breadcrumbsMax || 50,
      console: options.console !== false,
      ...options
    };
    
    this.errorCount = 0;
    this.breadcrumbs = [];
    this.originalConsole = {};
    this.originalFetch = null;
    this.originalXhr = null;
    
    this._boundHandleError = this._handleError.bind(this);
    this._boundHandleRejection = this._handleRejection.bind(this);
  }

  /**
   * Initialize the error tracker
   * @returns {ErrorTracker} This instance for chaining
   */
  init() {
    // Set up global error handlers
    if (this.options.captureGlobalErrors && typeof window !== 'undefined') {
      window.addEventListener('error', this._boundHandleError);
    }
    
    // Set up unhandled rejection handlers
    if (this.options.captureUnhandledRejections && typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', this._boundHandleRejection);
    }
    
    // Set up console tracking
    if (this.options.console && typeof console !== 'undefined') {
      this._setupConsoleTracking();
    }
    
    // Set up network error tracking
    if (this.options.captureNetworkErrors && typeof window !== 'undefined') {
      this._setupNetworkTracking();
    }
    
    return this;
  }

  /**
   * Shut down the error tracker
   * @returns {ErrorTracker} This instance for chaining
   */
  shutdown() {
    // Remove global error handlers
    if (typeof window !== 'undefined') {
      window.removeEventListener('error', this._boundHandleError);
      window.removeEventListener('unhandledrejection', this._boundHandleRejection);
    }
    
    // Restore original console methods
    if (this.options.console && typeof console !== 'undefined') {
      this._restoreConsole();
    }
    
    // Restore original network methods
    if (this.options.captureNetworkErrors && typeof window !== 'undefined') {
      this._restoreNetworkTracking();
    }
    
    return this;
  }

  /**
   * Manually capture an error
   * @param {Error|string} error - Error object or message
   * @param {Object} additionalInfo - Additional information about the error
   * @returns {string|null} Error ID if sent, null otherwise
   */
  captureError(error, additionalInfo = {}) {
    const errorObj = this._normalizeError(error);
    
    if (!errorObj) {
      return null;
    }
    
    return this._processError(errorObj, additionalInfo);
  }

  /**
   * Manually capture a message
   * @param {string} message - Message to capture
   * @param {Object} additionalInfo - Additional information about the message
   * @param {string} level - Log level (info, warning, error)
   * @returns {string|null} Message ID if sent, null otherwise
   */
  captureMessage(message, additionalInfo = {}, level = 'info') {
    if (!message) {
      return null;
    }
    
    const errorObj = {
      message,
      name: 'Message',
      level
    };
    
    return this._processError(errorObj, additionalInfo);
  }

  /**
   * Add a breadcrumb
   * @param {Object} breadcrumb - Breadcrumb data
   * @param {string} breadcrumb.type - Breadcrumb type (e.g., navigation, xhr, console)
   * @param {string} breadcrumb.category - Breadcrumb category
   * @param {string} breadcrumb.message - Breadcrumb message
   * @param {Object} breadcrumb.data - Additional breadcrumb data
   * @param {string} breadcrumb.level - Log level (info, warning, error)
   * @returns {ErrorTracker} This instance for chaining
   */
  addBreadcrumb(breadcrumb) {
    if (!this.options.breadcrumbs) {
      return this;
    }
    
    const defaultBreadcrumb = {
      timestamp: new Date().toISOString(),
      type: 'manual',
      category: 'manual',
      level: 'info'
    };
    
    const finalBreadcrumb = { ...defaultBreadcrumb, ...breadcrumb };
    
    this.breadcrumbs.push(finalBreadcrumb);
    
    // Trim breadcrumbs if needed
    if (this.breadcrumbs.length > this.options.breadcrumbsMax) {
      this.breadcrumbs.shift();
    }
    
    return this;
  }

  /**
   * Clear all breadcrumbs
   * @returns {ErrorTracker} This instance for chaining
   */
  clearBreadcrumbs() {
    this.breadcrumbs = [];
    return this;
  }

  /**
   * Set a tag
   * @param {string} key - Tag key
   * @param {string} value - Tag value
   * @returns {ErrorTracker} This instance for chaining
   */
  setTag(key, value) {
    this.options.tags[key] = value;
    return this;
  }

  /**
   * Set multiple tags
   * @param {Object} tags - Tags object
   * @returns {ErrorTracker} This instance for chaining
   */
  setTags(tags) {
    this.options.tags = { ...this.options.tags, ...tags };
    return this;
  }

  /**
   * Set user information
   * @param {Object} user - User information
   * @returns {ErrorTracker} This instance for chaining
   */
  setUser(user) {
    this.options.user = user;
    return this;
  }

  /**
   * Set up console tracking
   * @private
   */
  _setupConsoleTracking() {
    const methods = ['error', 'warn', 'info', 'debug', 'log'];
    
    methods.forEach(method => {
      this.originalConsole[method] = console[method];
      
      console[method] = (...args) => {
        // Add breadcrumb for console message
        this.addBreadcrumb({
          type: 'console',
          category: 'console',
          level: method === 'error' ? 'error' : method === 'warn' ? 'warning' : 'info',
          message: args.map(arg => {
            try {
              return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
            } catch (e) {
              return '[Object]';
            }
          }).join(' ')
        });
        
        // Call original method
        this.originalConsole[method].apply(console, args);
      };
    });
  }

  /**
   * Restore original console methods
   * @private
   */
  _restoreConsole() {
    Object.keys(this.originalConsole).forEach(method => {
      console[method] = this.originalConsole[method];
    });
    
    this.originalConsole = {};
  }

  /**
   * Set up network tracking
   * @private
   */
  _setupNetworkTracking() {
    // Track fetch
    if (typeof window !== 'undefined' && window.fetch) {
      this.originalFetch = window.fetch;
      
      window.fetch = (input, init) => {
        const url = typeof input === 'string' ? input : input.url;
        const method = init && init.method ? init.method : 'GET';
        
        // Add breadcrumb for fetch request
        this.addBreadcrumb({
          type: 'xhr',
          category: 'fetch',
          level: 'info',
          message: `${method} ${url}`,
          data: {
            url,
            method,
            headers: init && init.headers ? init.headers : undefined
          }
        });
        
        return this.originalFetch.apply(window, [input, init])
          .then(response => {
            // Add breadcrumb for fetch response
            this.addBreadcrumb({
              type: 'xhr',
              category: 'fetch',
              level: response.ok ? 'info' : 'error',
              message: `${method} ${url} ${response.status}`,
              data: {
                url,
                method,
                status: response.status,
                statusText: response.statusText
              }
            });
            
            return response;
          })
          .catch(error => {
            // Capture fetch error
            this.captureError(error, {
              tags: {
                type: 'fetch',
                url,
                method
              }
            });
            
            throw error;
          });
      };
    }
    
    // Track XMLHttpRequest
    if (typeof window !== 'undefined' && window.XMLHttpRequest) {
      this.originalXhr = {
        open: XMLHttpRequest.prototype.open,
        send: XMLHttpRequest.prototype.send
      };
      
      XMLHttpRequest.prototype.open = function(method, url) {
        this._errorTracker_method = method;
        this._errorTracker_url = url;
        
        return this.originalXhr.open.apply(this, arguments);
      };
      
      XMLHttpRequest.prototype.send = function() {
        const xhr = this;
        
        // Add breadcrumb for XHR request
        this.addBreadcrumb({
          type: 'xhr',
          category: 'xhr',
          level: 'info',
          message: `${xhr._errorTracker_method} ${xhr._errorTracker_url}`,
          data: {
            url: xhr._errorTracker_url,
            method: xhr._errorTracker_method
          }
        });
        
        const onreadystatechange = xhr.onreadystatechange;
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            // Add breadcrumb for XHR response
            this.addBreadcrumb({
              type: 'xhr',
              category: 'xhr',
              level: xhr.status >= 400 ? 'error' : 'info',
              message: `${xhr._errorTracker_method} ${xhr._errorTracker_url} ${xhr.status}`,
              data: {
                url: xhr._errorTracker_url,
                method: xhr._errorTracker_method,
                status: xhr.status,
                statusText: xhr.statusText
              }
            });
            
            // Capture XHR error
            if (xhr.status >= 400) {
              this.captureMessage(`XHR Error: ${xhr.status} ${xhr.statusText}`, {
                tags: {
                  type: 'xhr',
                  url: xhr._errorTracker_url,
                  method: xhr._errorTracker_method,
                  status: xhr.status
                }
              }, 'error');
            }
          }
          
          if (onreadystatechange) {
            return onreadystatechange.apply(this, arguments);
          }
        }.bind(this);
        
        return this.originalXhr.send.apply(this, arguments);
      }.bind(this);
    }
  }

  /**
   * Restore original network methods
   * @private
   */
  _restoreNetworkTracking() {
    if (this.originalFetch) {
      window.fetch = this.originalFetch;
      this.originalFetch = null;
    }
    
    if (this.originalXhr) {
      XMLHttpRequest.prototype.open = this.originalXhr.open;
      XMLHttpRequest.prototype.send = this.originalXhr.send;
      this.originalXhr = null;
    }
  }

  /**
   * Handle global error event
   * @private
   * @param {ErrorEvent} event - Error event
   */
  _handleError(event) {
    // Prevent default if we're handling it
    if (this._shouldCaptureError(event.error || event.message)) {
      const errorObj = this._normalizeError(event.error || event);
      
      if (errorObj) {
        this._processError(errorObj, {
          tags: {
            type: 'global',
            source: event.filename,
            line: event.lineno,
            column: event.colno
          }
        });
      }
    }
  }

  /**
   * Handle unhandled rejection event
   * @private
   * @param {PromiseRejectionEvent} event - Promise rejection event
   */
  _handleRejection(event) {
    if (this._shouldCaptureError(event.reason)) {
      const errorObj = this._normalizeError(event.reason);
      
      if (errorObj) {
        this._processError(errorObj, {
          tags: {
            type: 'unhandledrejection'
          }
        });
      }
    }
  }

  /**
   * Normalize an error object
   * @private
   * @param {Error|string|Object} error - Error to normalize
   * @returns {Object|null} Normalized error object or null if ignored
   */
  _normalizeError(error) {
    if (!error) {
      return null;
    }
    
    let errorObj;
    
    if (typeof error === 'string') {
      errorObj = {
        message: error,
        name: 'Error',
        stack: null
      };
    } else if (error instanceof Error) {
      errorObj = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      };
    } else if (typeof error === 'object') {
      errorObj = {
        message: error.message || 'Unknown error',
        name: error.name || 'Error',
        stack: error.stack || null
      };
    } else {
      try {
        errorObj = {
          message: String(error),
          name: 'Error',
          stack: null
        };
      } catch (e) {
        errorObj = {
          message: 'Unknown error',
          name: 'Error',
          stack: null
        };
      }
    }
    
    return errorObj;
  }

  /**
   * Process an error
   * @private
   * @param {Object} errorObj - Normalized error object
   * @param {Object} additionalInfo - Additional information about the error
   * @returns {string|null} Error ID if sent, null otherwise
   */
  _processError(errorObj, additionalInfo = {}) {
    // Check if we should capture this error
    if (!this._shouldCaptureError(errorObj)) {
      return null;
    }
    
    // Check if we've reached the maximum number of errors
    if (this.errorCount >= this.options.maxErrors) {
      return null;
    }
    
    // Apply sampling rate
    if (Math.random() > this.options.sampleRate) {
      return null;
    }
    
    // Increment error count
    this.errorCount++;
    
    // Generate error ID
    const errorId = this._generateErrorId();
    
    // Create error report
    const report = this._createErrorReport(errorObj, errorId, additionalInfo);
    
    // Call beforeSend hook if provided
    if (typeof this.options.beforeSend === 'function') {
      const modifiedReport = this.options.beforeSend(report);
      
      if (!modifiedReport) {
        return null;
      }
    }
    
    // Call onError hook if provided
    if (typeof this.options.onError === 'function') {
      this.options.onError(report);
    }
    
    // Send error report
    this._sendErrorReport(report);
    
    return errorId;
  }

  /**
   * Check if an error should be captured
   * @private
   * @param {Object|string} error - Error to check
   * @returns {boolean} Whether the error should be captured
   */
  _shouldCaptureError(error) {
    if (!error) {
      return false;
    }
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // Check ignore patterns
    for (const pattern of this.options.ignoreErrors) {
      if (typeof pattern === 'string' && errorMessage.includes(pattern)) {
        return false;
      }
      
      if (pattern instanceof RegExp && pattern.test(errorMessage)) {
        return false;
      }
    }
    
    // Check ignore URLs
    if (typeof window !== 'undefined' && window.location) {
      const currentUrl = window.location.href;
      
      for (const pattern of this.options.ignoreUrls) {
        if (typeof pattern === 'string' && currentUrl.includes(pattern)) {
          return false;
        }
        
        if (pattern instanceof RegExp && pattern.test(currentUrl)) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Generate a unique error ID
   * @private
   * @returns {string} Error ID
   */
  _generateErrorId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Create an error report
   * @private
   * @param {Object} errorObj - Normalized error object
   * @param {string} errorId - Error ID
   * @param {Object} additionalInfo - Additional information about the error
   * @returns {Object} Error report
   */
  _createErrorReport(errorObj, errorId, additionalInfo = {}) {
    // Get browser and OS information
    const browserInfo = this._getBrowserInfo();
    
    // Create report
    const report = {
      id: errorId,
      timestamp: new Date().toISOString(),
      error: {
        message: errorObj.message,
        name: errorObj.name,
        stack: errorObj.stack,
        cause: errorObj.cause
      },
      level: errorObj.level || 'error',
      user: this.options.user,
      tags: { ...this.options.tags, ...(additionalInfo.tags || {}) },
      breadcrumbs: this.options.breadcrumbs ? [...this.breadcrumbs] : [],
      context: {
        ...additionalInfo.context,
        url: typeof window !== 'undefined' ? window.location.href : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        browser: browserInfo.browser,
        os: browserInfo.os,
        device: browserInfo.device,
        screen: typeof window !== 'undefined' && window.screen ? {
          width: window.screen.width,
          height: window.screen.height,
          colorDepth: window.screen.colorDepth
        } : null
      },
      app: {
        name: this.options.appName,
        version: this.options.appVersion,
        environment: this.options.environment,
        release: this.options.release
      }
    };
    
    return report;
  }

  /**
   * Send an error report
   * @private
   * @param {Object} report - Error report
   * @returns {Promise<Response|null>} Response or null if sending failed
   */
  _sendErrorReport(report) {
    // Don't send in development unless explicitly enabled
    if (this.options.environment === 'development' && !this.options.sendInDevelopment) {
      console.warn('Error report not sent in development:', report);
      return null;
    }
    
    // Use fetch to send the report
    if (typeof fetch === 'function') {
      return fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report),
        // Don't let the error tracker track this request
        credentials: 'same-origin',
        mode: 'cors',
        keepalive: true
      }).catch(err => {
        console.error('Failed to send error report:', err);
        return null;
      });
    }
    
    // Fallback to XMLHttpRequest
    if (typeof XMLHttpRequest !== 'undefined') {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', this.options.endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(report));
      return null;
    }
    
    return null;
  }

  /**
   * Get browser and OS information
   * @private
   * @returns {Object} Browser and OS information
   */
  _getBrowserInfo() {
    const info = {
      browser: {
        name: 'Unknown',
        version: 'Unknown'
      },
      os: {
        name: 'Unknown',
        version: 'Unknown'
      },
      device: 'Unknown'
    };
    
    if (typeof navigator === 'undefined') {
      return info;
    }
    
    const ua = navigator.userAgent;
    
    // Detect browser
    if (ua.includes('Firefox/')) {
      info.browser.name = 'Firefox';
      info.browser.version = ua.match(/Firefox\/([0-9.]+)/)[1];
    } else if (ua.includes('Chrome/')) {
      info.browser.name = 'Chrome';
      info.browser.version = ua.match(/Chrome\/([0-9.]+)/)[1];
    } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
      info.browser.name = 'Safari';
      info.browser.version = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (ua.includes('Edge/')) {
      info.browser.name = 'Edge';
      info.browser.version = ua.match(/Edge\/([0-9.]+)/)[1];
    } else if (ua.includes('Edg/')) {
      info.browser.name = 'Edge';
      info.browser.version = ua.match(/Edg\/([0-9.]+)/)[1];
    } else if (ua.includes('MSIE ')) {
      info.browser.name = 'Internet Explorer';
      info.browser.version = ua.match(/MSIE ([0-9.]+)/)[1];
    } else if (ua.includes('Trident/')) {
      info.browser.name = 'Internet Explorer';
      info.browser.version = ua.match(/rv:([0-9.]+)/)[1];
    }
    
    // Detect OS
    if (ua.includes('Windows')) {
      info.os.name = 'Windows';
      if (ua.includes('Windows NT 10.0')) info.os.version = '10';
      else if (ua.includes('Windows NT 6.3')) info.os.version = '8.1';
      else if (ua.includes('Windows NT 6.2')) info.os.version = '8';
      else if (ua.includes('Windows NT 6.1')) info.os.version = '7';
      else if (ua.includes('Windows NT 6.0')) info.os.version = 'Vista';
      else if (ua.includes('Windows NT 5.1')) info.os.version = 'XP';
      else info.os.version = 'Unknown';
    } else if (ua.includes('Mac OS X')) {
      info.os.name = 'macOS';
      const version = ua.match(/Mac OS X ([0-9_.]+)/);
      if (version) {
        info.os.version = version[1].replace(/_/g, '.');
      }
    } else if (ua.includes('Linux')) {
      info.os.name = 'Linux';
    } else if (ua.includes('Android')) {
      info.os.name = 'Android';
      const version = ua.match(/Android ([0-9.]+)/);
      if (version) {
        info.os.version = version[1];
      }
    } else if (ua.includes('iOS')) {
      info.os.name = 'iOS';
      const version = ua.match(/OS ([0-9_]+)/);
      if (version) {
        info.os.version = version[1].replace(/_/g, '.');
      }
    }
    
    // Detect device
    if (ua.includes('Mobile')) {
      info.device = 'Mobile';
    } else if (ua.includes('Tablet')) {
      info.device = 'Tablet';
    } else {
      info.device = 'Desktop';
    }
    
    return info;
  }
}

// Create singleton instance
let errorTrackerInstance = null;

/**
 * Initialize the error tracker
 * @param {Object} options - Configuration options
 * @returns {ErrorTracker} Error tracker instance
 */
function initErrorTracker(options = {}) {
  if (!errorTrackerInstance) {
    errorTrackerInstance = new ErrorTracker(options);
    errorTrackerInstance.init();
  }
  
  return errorTrackerInstance;
}

/**
 * Get the error tracker instance
 * @returns {ErrorTracker|null} Error tracker instance or null if not initialized
 */
function getErrorTracker() {
  return errorTrackerInstance;
}

/**
 * Capture an error
 * @param {Error|string} error - Error object or message
 * @param {Object} additionalInfo - Additional information about the error
 * @returns {string|null} Error ID if sent, null otherwise
 */
function captureError(error, additionalInfo = {}) {
  if (!errorTrackerInstance) {
    console.warn('Error tracker not initialized. Call initErrorTracker first.');
    return null;
  }
  
  return errorTrackerInstance.captureError(error, additionalInfo);
}

/**
 * Capture a message
 * @param {string} message - Message to capture
 * @param {Object} additionalInfo - Additional information about the message
 * @param {string} level - Log level (info, warning, error)
 * @returns {string|null} Message ID if sent, null otherwise
 */
function captureMessage(message, additionalInfo = {}, level = 'info') {
  if (!errorTrackerInstance) {
    console.warn('Error tracker not initialized. Call initErrorTracker first.');
    return null;
  }
  
  return errorTrackerInstance.captureMessage(message, additionalInfo, level);
}

/**
 * Add a breadcrumb
 * @param {Object} breadcrumb - Breadcrumb data
 * @returns {ErrorTracker|null} Error tracker instance or null if not initialized
 */
function addBreadcrumb(breadcrumb) {
  if (!errorTrackerInstance) {
    console.warn('Error tracker not initialized. Call initErrorTracker first.');
    return null;
  }
  
  return errorTrackerInstance.addBreadcrumb(breadcrumb);
}

module.exports = {
  ErrorTracker,
  initErrorTracker,
  getErrorTracker,
  captureError,
  captureMessage,
  addBreadcrumb
};
