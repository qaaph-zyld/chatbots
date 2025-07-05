/**
 * Content Preloader Utility
 * 
 * This module provides functionality to preload content and resources before they're needed,
 * improving perceived performance and reducing wait times for users.
 */

class ContentPreloader {
  /**
   * Create a new content preloader
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      concurrency: options.concurrency || 3,
      timeout: options.timeout || 10000, // 10 seconds
      retries: options.retries || 1,
      retryDelay: options.retryDelay || 1000, // 1 second
      priority: options.priority || 'low',
      preloadTypes: options.preloadTypes || ['image', 'style', 'script', 'font'],
      logger: options.logger || console,
      ...options
    };
    
    this.preloadedResources = new Set();
    this.preloadQueue = [];
    this.activePreloads = 0;
    this.supported = typeof window !== 'undefined' && 'requestIdleCallback' in window;
    this.idleCallbackId = null;
    this.observer = null;
    
    // Initialize if in browser environment
    if (typeof window !== 'undefined') {
      this._init();
    }
  }
  
  /**
   * Initialize the preloader
   * @private
   */
  _init() {
    // Set up intersection observer for viewport detection
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this._handleIntersection.bind(this),
        {
          rootMargin: '200px 0px', // Start preloading when within 200px of viewport
          threshold: 0.01
        }
      );
    }
    
    // Start processing queue when browser is idle
    this._scheduleQueueProcessing();
  }
  
  /**
   * Schedule queue processing during idle time
   * @private
   */
  _scheduleQueueProcessing() {
    if (!this.supported) {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this._processQueue(), 50);
      return;
    }
    
    this.idleCallbackId = window.requestIdleCallback(
      (deadline) => {
        // Process queue until we run out of idle time
        while (
          deadline.timeRemaining() > 0 && 
          this.preloadQueue.length > 0 && 
          this.activePreloads < this.options.concurrency
        ) {
          this._processNextItem();
        }
        
        // Schedule more processing if queue is not empty
        if (this.preloadQueue.length > 0) {
          this._scheduleQueueProcessing();
        }
      },
      { timeout: 1000 }
    );
  }
  
  /**
   * Handle intersection observer entries
   * @private
   * @param {Array<IntersectionObserverEntry>} entries - Intersection entries
   */
  _handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // Stop observing
        this.observer.unobserve(element);
        
        // Get preload data
        const preloadData = element.dataset.preload;
        
        if (preloadData) {
          try {
            const data = JSON.parse(preloadData);
            
            if (data.url) {
              this.preload(data.url, data.type, data);
            } else if (Array.isArray(data)) {
              data.forEach(item => {
                if (item.url) {
                  this.preload(item.url, item.type, item);
                }
              });
            }
          } catch (err) {
            this.options.logger.error('Error parsing preload data:', err);
          }
        }
      }
    });
  }
  
  /**
   * Process the next item in the queue
   * @private
   */
  _processNextItem() {
    if (this.preloadQueue.length === 0 || this.activePreloads >= this.options.concurrency) {
      return;
    }
    
    const item = this.preloadQueue.shift();
    this.activePreloads++;
    
    this._preloadResource(item.url, item.type, item.options)
      .then(() => {
        if (item.resolve) {
          item.resolve();
        }
      })
      .catch(err => {
        if (item.reject) {
          item.reject(err);
        }
      })
      .finally(() => {
        this.activePreloads--;
        
        // Process more items if available
        if (this.preloadQueue.length > 0) {
          this._processNextItem();
        }
      });
  }
  
  /**
   * Preload a resource
   * @param {string} url - Resource URL
   * @param {string} type - Resource type (image, style, script, font, fetch)
   * @param {Object} options - Preload options
   * @returns {Promise} Promise that resolves when resource is preloaded
   */
  preload(url, type = 'fetch', options = {}) {
    // Skip if already preloaded
    if (this.preloadedResources.has(url)) {
      return Promise.resolve();
    }
    
    const preloadOptions = {
      ...this.options,
      ...options
    };
    
    return new Promise((resolve, reject) => {
      // Add to queue
      this.preloadQueue.push({
        url,
        type,
        options: preloadOptions,
        resolve,
        reject
      });
      
      // Start processing if not already running
      if (this.activePreloads < this.options.concurrency) {
        this._processNextItem();
      }
    });
  }
  
  /**
   * Preload multiple resources
   * @param {Array<Object>} resources - Array of resource objects
   * @returns {Promise} Promise that resolves when all resources are preloaded
   */
  preloadMany(resources) {
    if (!Array.isArray(resources)) {
      return Promise.reject(new Error('Resources must be an array'));
    }
    
    return Promise.all(
      resources.map(resource => {
        if (typeof resource === 'string') {
          return this.preload(resource);
        }
        
        return this.preload(resource.url, resource.type, resource.options);
      })
    );
  }
  
  /**
   * Preload resources for a route
   * @param {string} route - Route path
   * @param {Array<Object>} resources - Resources to preload
   * @returns {Promise} Promise that resolves when resources are preloaded
   */
  preloadRoute(route, resources) {
    if (!Array.isArray(resources)) {
      return Promise.reject(new Error('Resources must be an array'));
    }
    
    // Store route resources for later use
    if (!this.routeResources) {
      this.routeResources = new Map();
    }
    
    this.routeResources.set(route, resources);
    
    // Don't preload immediately, will be triggered by navigation
    return Promise.resolve();
  }
  
  /**
   * Preload resources for a specific route
   * @param {string} route - Route path
   * @returns {Promise} Promise that resolves when resources are preloaded
   */
  preloadRouteResources(route) {
    if (!this.routeResources || !this.routeResources.has(route)) {
      return Promise.resolve();
    }
    
    const resources = this.routeResources.get(route);
    return this.preloadMany(resources);
  }
  
  /**
   * Observe an element for preloading when it enters the viewport
   * @param {HTMLElement} element - Element to observe
   * @returns {void}
   */
  observe(element) {
    if (!this.observer || !element) {
      return;
    }
    
    this.observer.observe(element);
  }
  
  /**
   * Preload a resource
   * @private
   * @param {string} url - Resource URL
   * @param {string} type - Resource type
   * @param {Object} options - Preload options
   * @returns {Promise} Promise that resolves when resource is preloaded
   */
  _preloadResource(url, type, options) {
    return new Promise((resolve, reject) => {
      // Mark as preloaded
      this.preloadedResources.add(url);
      
      // Set up timeout
      const timeout = setTimeout(() => {
        if (options.retries > 0) {
          // Retry
          options.retries--;
          setTimeout(() => {
            this._preloadResource(url, type, options)
              .then(resolve)
              .catch(reject);
          }, options.retryDelay);
        } else {
          reject(new Error(`Preload timeout for ${url}`));
        }
      }, options.timeout);
      
      // Determine preload method based on type and environment
      if (typeof document === 'undefined') {
        // Server-side, just resolve
        clearTimeout(timeout);
        resolve();
        return;
      }
      
      switch (type) {
        case 'image':
          this._preloadImage(url, timeout, resolve, reject);
          break;
          
        case 'style':
        case 'script':
        case 'font':
          this._preloadWithLink(url, type, timeout, resolve, reject);
          break;
          
        case 'json':
        case 'api':
          this._preloadWithFetch(url, timeout, resolve, reject);
          break;
          
        case 'html':
        case 'document':
          this._preloadDocument(url, timeout, resolve, reject);
          break;
          
        default:
          this._preloadWithLink(url, 'fetch', timeout, resolve, reject);
      }
    });
  }
  
  /**
   * Preload an image
   * @private
   * @param {string} url - Image URL
   * @param {number} timeout - Timeout ID
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   */
  _preloadImage(url, timeout, resolve, reject) {
    const img = new Image();
    
    img.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Failed to preload image: ${url}`));
    };
    
    img.src = url;
  }
  
  /**
   * Preload with link element
   * @private
   * @param {string} url - Resource URL
   * @param {string} type - Resource type
   * @param {number} timeout - Timeout ID
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   */
  _preloadWithLink(url, type, timeout, resolve, reject) {
    const link = document.createElement('link');
    
    link.rel = 'preload';
    link.href = url;
    link.as = this._getResourceType(type);
    
    if (type === 'font') {
      link.crossOrigin = 'anonymous';
    }
    
    link.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    
    link.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Failed to preload ${type}: ${url}`));
    };
    
    document.head.appendChild(link);
  }
  
  /**
   * Preload with fetch
   * @private
   * @param {string} url - Resource URL
   * @param {number} timeout - Timeout ID
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   */
  _preloadWithFetch(url, timeout, resolve, reject) {
    fetch(url, { method: 'GET', mode: 'no-cors', cache: 'force-cache' })
      .then(() => {
        clearTimeout(timeout);
        resolve();
      })
      .catch(err => {
        clearTimeout(timeout);
        reject(err);
      });
  }
  
  /**
   * Preload a document
   * @private
   * @param {string} url - Document URL
   * @param {number} timeout - Timeout ID
   * @param {Function} resolve - Promise resolve function
   * @param {Function} reject - Promise reject function
   */
  _preloadDocument(url, timeout, resolve, reject) {
    const link = document.createElement('link');
    
    link.rel = 'prefetch';
    link.href = url;
    
    link.onload = () => {
      clearTimeout(timeout);
      resolve();
    };
    
    link.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Failed to preload document: ${url}`));
    };
    
    document.head.appendChild(link);
  }
  
  /**
   * Get resource type for preload
   * @private
   * @param {string} type - Resource type
   * @returns {string} Resource type for preload
   */
  _getResourceType(type) {
    const types = {
      image: 'image',
      style: 'style',
      script: 'script',
      font: 'font',
      document: 'document',
      fetch: 'fetch',
      json: 'fetch',
      api: 'fetch'
    };
    
    return types[type] || 'fetch';
  }
  
  /**
   * Clear preloaded resources
   * @returns {void}
   */
  clear() {
    this.preloadedResources.clear();
    this.preloadQueue = [];
  }
  
  /**
   * Dispose the preloader
   * @returns {void}
   */
  dispose() {
    // Clear queue
    this.preloadQueue = [];
    
    // Cancel idle callback
    if (this.idleCallbackId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(this.idleCallbackId);
      this.idleCallbackId = null;
    }
    
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

/**
 * React hook for content preloading
 * @param {ContentPreloader} preloader - Content preloader instance
 * @returns {Object} Preloading utilities
 */
function useContentPreloader(preloader) {
  // Check if React is available
  let React;
  
  try {
    React = require('react');
  } catch (err) {
    throw new Error('React is required for useContentPreloader hook');
  }
  
  const preloadRef = React.useRef(null);
  
  React.useEffect(() => {
    // Create preloader if not provided
    if (!preloader) {
      preloadRef.current = preloadRef.current || new ContentPreloader();
    } else {
      preloadRef.current = preloader;
    }
    
    return () => {
      // No need to dispose if external preloader
      if (!preloader && preloadRef.current) {
        preloadRef.current.dispose();
      }
    };
  }, [preloader]);
  
  /**
   * Observe an element for preloading
   * @param {HTMLElement} element - Element to observe
   */
  const observe = React.useCallback((element) => {
    if (preloadRef.current && element) {
      preloadRef.current.observe(element);
    }
  }, []);
  
  /**
   * Preload a resource
   * @param {string} url - Resource URL
   * @param {string} type - Resource type
   * @param {Object} options - Preload options
   * @returns {Promise} Promise that resolves when resource is preloaded
   */
  const preload = React.useCallback((url, type, options) => {
    if (preloadRef.current) {
      return preloadRef.current.preload(url, type, options);
    }
    return Promise.resolve();
  }, []);
  
  /**
   * Preload multiple resources
   * @param {Array<Object>} resources - Resources to preload
   * @returns {Promise} Promise that resolves when all resources are preloaded
   */
  const preloadMany = React.useCallback((resources) => {
    if (preloadRef.current) {
      return preloadRef.current.preloadMany(resources);
    }
    return Promise.resolve();
  }, []);
  
  /**
   * Preload resources for a route
   * @param {string} route - Route path
   * @returns {Promise} Promise that resolves when resources are preloaded
   */
  const preloadRoute = React.useCallback((route) => {
    if (preloadRef.current) {
      return preloadRef.current.preloadRouteResources(route);
    }
    return Promise.resolve();
  }, []);
  
  return {
    preloader: preloadRef.current,
    observe,
    preload,
    preloadMany,
    preloadRoute
  };
}

/**
 * Express middleware for adding preload headers
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function preloadMiddleware(options = {}) {
  const opts = {
    routes: options.routes || {},
    staticAssets: options.staticAssets || [],
    dynamicAssets: options.dynamicAssets || [],
    ...options
  };
  
  return function(req, res, next) {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method to add preload headers
    res.send = function(body) {
      // Only process HTML responses
      if (typeof body === 'string' && res.get('Content-Type')?.includes('text/html')) {
        // Add preload headers for static assets
        opts.staticAssets.forEach(asset => {
          res.set('Link', `<${asset.url}>; rel=preload; as=${asset.type || 'fetch'}${asset.crossorigin ? '; crossorigin' : ''}`);
        });
        
        // Add preload headers for route-specific assets
        const route = req.path || '/';
        
        if (opts.routes[route]) {
          opts.routes[route].forEach(asset => {
            res.set('Link', `<${asset.url}>; rel=preload; as=${asset.type || 'fetch'}${asset.crossorigin ? '; crossorigin' : ''}`);
          });
        }
        
        // Add preload information to HTML
        if (opts.injectPreloadData) {
          const preloadData = {
            static: opts.staticAssets,
            route: opts.routes[route] || [],
            dynamic: opts.dynamicAssets
          };
          
          const preloadScript = `
            <script>
              window.__PRELOAD_DATA__ = ${JSON.stringify(preloadData)};
            </script>
          `;
          
          body = body.replace('</head>', `${preloadScript}</head>`);
        }
      }
      
      // Call original send method
      return originalSend.call(this, body);
    };
    
    next();
  };
}

/**
 * Create a content preloader
 * @param {Object} options - Preloader options
 * @returns {ContentPreloader} Content preloader instance
 */
function createContentPreloader(options = {}) {
  return new ContentPreloader(options);
}

module.exports = {
  ContentPreloader,
  useContentPreloader,
  preloadMiddleware,
  createContentPreloader
};
