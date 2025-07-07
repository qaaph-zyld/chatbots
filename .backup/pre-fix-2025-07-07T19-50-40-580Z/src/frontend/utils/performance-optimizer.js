/**
 * Frontend Performance Optimizer
 * 
 * This utility provides various methods and components to optimize frontend performance,
 * including image optimization, lazy loading, resource prefetching, and performance metrics.
 */

// Import React if available in the project
let React;
let ReactDOM;

try {
  React = require('react');
  ReactDOM = require('react-dom');
} catch (err) {
  // React not available, will use fallbacks
}

/**
 * Image optimization component that lazy loads images and provides responsive sizing
 * @param {Object} props - Component props
 * @returns {React.Component} Optimized image component
 */
function OptimizedImage(props) {
  if (!React) {
    console.error('OptimizedImage requires React to be installed');
    return null;
  }
  
  const {
    src,
    alt,
    width,
    height,
    sizes,
    lazy = true,
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"%3E%3Crect width="300" height="150" fill="%23cccccc"/%3E%3C/svg%3E',
    threshold = 0.1,
    srcSet,
    className,
    style,
    onLoad,
    ...rest
  } = props;
  
  const imgRef = React.useRef(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(!lazy);
  
  React.useEffect(() => {
    if (!lazy) {
      return;
    }
    
    let observer;
    const currentRef = imgRef.current;
    
    if (currentRef && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.unobserve(currentRef);
            }
          });
        },
        { threshold }
      );
      
      observer.observe(currentRef);
    } else {
      // Fallback for browsers without IntersectionObserver
      setIsVisible(true);
    }
    
    return () => {
      if (observer && currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [lazy, threshold]);
  
  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
    
    // Report to performance metrics
    if (window.performance && window.performance.mark) {
      window.performance.mark(`image-loaded-${src}`);
    }
  };
  
  const imageStyles = {
    ...style,
    opacity: isLoaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out'
  };
  
  return (
    <div
      className={`optimized-image-container ${className || ''}`}
      ref={imgRef}
      style={{
        position: 'relative',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0'
      }}
    >
      {!isLoaded && (
        <img
          src={placeholder}
          alt={alt || ""}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      )}
      
      {isVisible && (
        <img
          src={src}
          alt={alt || ""}
          width={width}
          height={height}
          sizes={sizes}
          srcSet={srcSet}
          onLoad={handleLoad}
          style={imageStyles}
          loading={lazy ? 'lazy' : 'eager'}
          {...rest}
        />
      )}
    </div>
  );
}

/**
 * Lazy load a component with suspense and error boundary
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} options - Options for lazy loading
 * @returns {React.Component} Lazy loaded component
 */
function lazyLoadComponent(importFunc, options = {}) {
  if (!React) {
    console.error('lazyLoadComponent requires React to be installed');
    return null;
  }
  
  const {
    fallback = null,
    errorFallback = null,
    timeout = 10000,
    onError = null,
    suspenseFallback = null
  } = options;
  
  const LazyComponent = React.lazy(() => {
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Component loading timed out after ${timeout}ms`));
      }, timeout);
    });
    
    // Race the import with the timeout
    return Promise.race([
      importFunc(),
      timeoutPromise
    ]).catch(err => {
      if (onError) {
        onError(err);
      }
      
      // Return a fallback component if provided
      if (errorFallback) {
        return { default: errorFallback };
      }
      
      // Re-throw the error to be caught by error boundary
      throw err;
    });
  });
  
  // Create error boundary if React >= 16
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error, info) {
      if (onError) {
        onError(error, info);
      }
    }
    
    render() {
      if (this.state.hasError) {
        return errorFallback ? React.createElement(errorFallback, { error: this.state.error }) : fallback || null;
      }
      
      return this.props.children;
    }
  }
  
  return function WrappedLazyComponent(props) {
    return React.createElement(
      ErrorBoundary,
      null,
      React.createElement(
        React.Suspense,
        { fallback: suspenseFallback || fallback || null },
        React.createElement(LazyComponent, props)
      )
    );
  };
}

/**
 * Resource prefetcher to preload critical resources
 */
class ResourcePrefetcher {
  constructor(options = {}) {
    this.options = {
      concurrency: options.concurrency || 3,
      timeout: options.timeout || 5000,
      priority: options.priority || 'low',
      ...options
    };
    
    this.queue = [];
    this.active = 0;
    this.supported = typeof document !== 'undefined';
    this.preloadedUrls = new Set();
  }
  
  /**
   * Preload a resource
   * @param {string} url - Resource URL
   * @param {string} type - Resource type (image, style, script, font, fetch)
   * @param {Object} options - Preload options
   * @returns {Promise} Promise that resolves when resource is preloaded
   */
  preload(url, type = 'fetch', options = {}) {
    if (!this.supported || this.preloadedUrls.has(url)) {
      return Promise.resolve();
    }
    
    const preloadOptions = {
      priority: options.priority || this.options.priority,
      timeout: options.timeout || this.options.timeout,
      ...options
    };
    
    return new Promise((resolve, reject) => {
      this.queue.push({
        url,
        type,
        options: preloadOptions,
        resolve,
        reject
      });
      
      this._processQueue();
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
   * Prefetch a page
   * @param {string} url - Page URL
   * @param {Object} options - Prefetch options
   * @returns {Promise} Promise that resolves when page is prefetched
   */
  prefetchPage(url, options = {}) {
    return this.preload(url, 'document', options);
  }
  
  /**
   * Process the queue
   * @private
   */
  _processQueue() {
    if (this.active >= this.options.concurrency || this.queue.length === 0) {
      return;
    }
    
    const item = this.queue.shift();
    this.active++;
    
    this._preloadResource(item.url, item.type, item.options)
      .then(item.resolve)
      .catch(item.reject)
      .finally(() => {
        this.active--;
        this._processQueue();
      });
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
      if (!this.supported) {
        return resolve();
      }
      
      // Mark as preloaded
      this.preloadedUrls.add(url);
      
      // Create link element
      const link = document.createElement('link');
      
      // Set attributes
      link.rel = type === 'document' ? 'prefetch' : 'preload';
      link.href = url;
      link.as = this._getResourceType(type);
      
      if (options.crossOrigin) {
        link.crossOrigin = options.crossOrigin;
      }
      
      if (options.priority) {
        link.importance = options.priority;
      }
      
      // Set up load handlers
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload ${url}`));
      
      // Add timeout
      const timeout = setTimeout(() => {
        reject(new Error(`Preload timeout for ${url}`));
      }, options.timeout);
      
      // Cleanup function
      const cleanup = () => {
        clearTimeout(timeout);
        link.onload = null;
        link.onerror = null;
      };
      
      // Add success and error handlers
      link.onload = () => {
        cleanup();
        resolve();
      };
      
      link.onerror = () => {
        cleanup();
        reject(new Error(`Failed to preload ${url}`));
      };
      
      // Add to document head
      document.head.appendChild(link);
    });
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
      audio: 'audio',
      video: 'video',
      track: 'track',
      worker: 'worker'
    };
    
    return types[type] || 'fetch';
  }
}

/**
 * Performance metrics collector
 */
class PerformanceMetrics {
  constructor(options = {}) {
    this.options = {
      sampleRate: options.sampleRate || 1.0, // 100%
      maxEntries: options.maxEntries || 100,
      reportUrl: options.reportUrl || null,
      reportInterval: options.reportInterval || 10000, // 10 seconds
      includeResourceTimings: options.includeResourceTimings !== false,
      includePaintTimings: options.includePaintTimings !== false,
      includeNavigationTimings: options.includeNavigationTimings !== false,
      ...options
    };
    
    this.metrics = {
      navigation: [],
      resource: [],
      paint: [],
      marks: [],
      measures: [],
      interactions: []
    };
    
    this.supported = typeof window !== 'undefined' && 
                    window.performance && 
                    window.PerformanceObserver;
    
    this.observers = [];
    
    // Initialize if supported
    if (this.supported) {
      this._init();
    }
  }
  
  /**
   * Initialize performance observers
   * @private
   */
  _init() {
    // Sample based on sample rate
    if (Math.random() > this.options.sampleRate) {
      return;
    }
    
    // Observe navigation timings
    if (this.options.includeNavigationTimings) {
      try {
        const navigationObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          this._addEntries('navigation', entries);
        });
        
        navigationObserver.observe({ type: 'navigation', buffered: true });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation timing observation not supported', e);
      }
    }
    
    // Observe resource timings
    if (this.options.includeResourceTimings) {
      try {
        const resourceObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          this._addEntries('resource', entries);
        });
        
        resourceObserver.observe({ type: 'resource', buffered: true });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('Resource timing observation not supported', e);
      }
    }
    
    // Observe paint timings
    if (this.options.includePaintTimings) {
      try {
        const paintObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          this._addEntries('paint', entries);
        });
        
        paintObserver.observe({ type: 'paint', buffered: true });
        this.observers.push(paintObserver);
      } catch (e) {
        console.warn('Paint timing observation not supported', e);
      }
    }
    
    // Observe marks and measures
    try {
      const markObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const marks = entries.filter(entry => entry.entryType === 'mark');
        const measures = entries.filter(entry => entry.entryType === 'measure');
        
        this._addEntries('marks', marks);
        this._addEntries('measures', measures);
      });
      
      markObserver.observe({ entryTypes: ['mark', 'measure'], buffered: true });
      this.observers.push(markObserver);
    } catch (e) {
      console.warn('Mark/measure observation not supported', e);
    }
    
    // Set up reporting interval if needed
    if (this.options.reportUrl) {
      this.reportInterval = setInterval(() => {
        this.report();
      }, this.options.reportInterval);
    }
    
    // Track first input delay and interactions
    this._trackInteractions();
  }
  
  /**
   * Track user interactions
   * @private
   */
  _trackInteractions() {
    try {
      // First Input Delay
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.metrics.interactions.push({
            type: 'first-input',
            startTime: entry.startTime,
            processingStart: entry.processingStart,
            processingEnd: entry.processingEnd,
            duration: entry.processingStart - entry.startTime,
            name: entry.name
          });
        });
      });
      
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);
    } catch (e) {
      console.warn('First Input Delay observation not supported', e);
    }
    
    // Track click interactions
    if (typeof document !== 'undefined') {
      document.addEventListener('click', event => {
        // Only track if performance is available
        if (!window.performance || !window.performance.now) {
          return;
        }
        
        const target = event.target.tagName.toLowerCase();
        const id = event.target.id;
        const className = event.target.className;
        
        this.metrics.interactions.push({
          type: 'click',
          target,
          id,
          className,
          time: window.performance.now()
        });
        
        // Trim if needed
        if (this.metrics.interactions.length > this.options.maxEntries) {
          this.metrics.interactions = this.metrics.interactions.slice(-this.options.maxEntries);
        }
      }, { passive: true });
    }
  }
  
  /**
   * Add entries to metrics
   * @private
   * @param {string} type - Entry type
   * @param {Array} entries - Performance entries
   */
  _addEntries(type, entries) {
    if (!entries || !entries.length) {
      return;
    }
    
    // Convert entries to plain objects
    const plainEntries = entries.map(entry => {
      const plainEntry = {};
      
      for (const key in entry) {
        const value = entry[key];
        if (typeof value !== 'function') {
          plainEntry[key] = value;
        }
      }
      
      return plainEntry;
    });
    
    // Add entries
    this.metrics[type] = [...this.metrics[type], ...plainEntries];
    
    // Trim if needed
    if (this.metrics[type].length > this.options.maxEntries) {
      this.metrics[type] = this.metrics[type].slice(-this.options.maxEntries);
    }
  }
  
  /**
   * Mark a performance event
   * @param {string} name - Mark name
   */
  mark(name) {
    if (this.supported && window.performance.mark) {
      window.performance.mark(name);
    }
  }
  
  /**
   * Measure between two marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   */
  measure(name, startMark, endMark) {
    if (this.supported && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
      } catch (e) {
        console.warn(`Failed to measure ${name}:`, e);
      }
    }
  }
  
  /**
   * Get all collected metrics
   * @returns {Object} Metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Get core web vitals
   * @returns {Object} Core web vitals
   */
  getCoreWebVitals() {
    const vitals = {
      lcp: null, // Largest Contentful Paint
      fid: null, // First Input Delay
      cls: null, // Cumulative Layout Shift
      fcp: null, // First Contentful Paint
      ttfb: null // Time to First Byte
    };
    
    // Extract FCP
    const fcpEntry = this.metrics.paint.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      vitals.fcp = fcpEntry.startTime;
    }
    
    // Extract LCP - approximation from paint entries
    const lcpEntries = this.metrics.paint.filter(entry => entry.name === 'largest-contentful-paint');
    if (lcpEntries.length) {
      vitals.lcp = Math.max(...lcpEntries.map(entry => entry.startTime));
    }
    
    // Extract FID from interactions
    const fidEntry = this.metrics.interactions.find(entry => entry.type === 'first-input');
    if (fidEntry) {
      vitals.fid = fidEntry.duration;
    }
    
    // Extract TTFB from navigation
    if (this.metrics.navigation.length) {
      vitals.ttfb = this.metrics.navigation[0].responseStart;
    }
    
    return vitals;
  }
  
  /**
   * Report metrics to server
   * @returns {Promise} Promise that resolves when metrics are reported
   */
  report() {
    if (!this.options.reportUrl) {
      return Promise.resolve();
    }
    
    const metrics = this.getMetrics();
    const vitals = this.getCoreWebVitals();
    
    const data = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      vitals,
      metrics
    };
    
    return fetch(this.options.reportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(err => {
      console.error('Failed to report metrics:', err);
    });
  }
  
  /**
   * Dispose observers and intervals
   */
  dispose() {
    // Clear report interval
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    // Disconnect observers
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (e) {
        // Ignore
      }
    });
    
    this.observers = [];
  }
}

/**
 * Create a debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Whether to call immediately
 * @returns {Function} Debounced function
 */
function debounce(func, wait, immediate) {
  let timeout;
  
  return function executedFunction(...args) {
    const context = this;
    
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Create a throttled function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Optimize event listeners by applying throttling or debouncing
 * @param {string} eventType - Event type (scroll, resize, input, etc.)
 * @param {Function} handler - Event handler
 * @param {Object} options - Options
 * @returns {Function} Optimized handler
 */
function optimizeEventListener(eventType, handler, options = {}) {
  const {
    throttleTime = 100,
    debounceTime = 300,
    immediate = false,
    type = 'auto'
  } = options;
  
  let optimizedHandler;
  
  // Determine optimization type
  const optimizationType = type === 'auto'
    ? (eventType === 'scroll' || eventType === 'mousemove' ? 'throttle' : 'debounce')
    : type;
  
  // Apply optimization
  if (optimizationType === 'throttle') {
    optimizedHandler = throttle(handler, throttleTime);
  } else if (optimizationType === 'debounce') {
    optimizedHandler = debounce(handler, debounceTime, immediate);
  } else {
    optimizedHandler = handler;
  }
  
  return optimizedHandler;
}

/**
 * React hook for optimized window resize event
 * @param {Function} handler - Event handler
 * @param {Object} options - Options
 * @returns {void}
 */
function useWindowResize(handler, options = {}) {
  if (!React) {
    console.error('useWindowResize requires React to be installed');
    return;
  }
  
  React.useEffect(() => {
    const optimizedHandler = optimizeEventListener('resize', handler, options);
    
    window.addEventListener('resize', optimizedHandler);
    
    return () => {
      window.removeEventListener('resize', optimizedHandler);
    };
  }, [handler, options]);
}

/**
 * React hook for optimized scroll event
 * @param {Function} handler - Event handler
 * @param {Object} options - Options
 * @returns {void}
 */
function useScroll(handler, options = {}) {
  if (!React) {
    console.error('useScroll requires React to be installed');
    return;
  }
  
  const {
    element = null,
    ...throttleOptions
  } = options;
  
  React.useEffect(() => {
    const targetElement = element || window;
    const optimizedHandler = optimizeEventListener('scroll', handler, throttleOptions);
    
    targetElement.addEventListener('scroll', optimizedHandler);
    
    return () => {
      targetElement.removeEventListener('scroll', optimizedHandler);
    };
  }, [handler, element, throttleOptions]);
}

// Export all utilities
module.exports = {
  OptimizedImage,
  lazyLoadComponent,
  ResourcePrefetcher,
  PerformanceMetrics,
  debounce,
  throttle,
  optimizeEventListener,
  useWindowResize,
  useScroll
};
