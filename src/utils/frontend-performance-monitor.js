/**
 * Frontend Performance Monitor
 * 
 * This module provides utilities for monitoring, analyzing, and reporting
 * frontend performance metrics including Core Web Vitals, user experience
 * metrics, and custom performance markers.
 */

/**
 * Frontend Performance Monitor
 */
class FrontendPerformanceMonitor {
  /**
   * Create a new frontend performance monitor
   * @param {Object} options - Monitor options
   */
  constructor(options = {}) {
    this.options = {
      enabled: options.enabled !== false,
      reportingEndpoint: options.reportingEndpoint || '/api/performance/metrics',
      reportingInterval: options.reportingInterval || 10000, // 10 seconds
      samplingRate: options.samplingRate || 0.1, // 10% of users
      maxBufferSize: options.maxBufferSize || 50,
      automaticTracking: options.automaticTracking !== false,
      trackCoreWebVitals: options.trackCoreWebVitals !== false,
      trackResourceTiming: options.trackResourceTiming !== false,
      trackUserTiming: options.trackUserTiming !== false,
      trackErrors: options.trackErrors !== false,
      trackNavigation: options.trackNavigation !== false,
      trackInteractions: options.trackInteractions || false,
      trackMemory: options.trackMemory || false,
      trackNetworkInfo: options.trackNetworkInfo || false,
      trackDeviceInfo: options.trackDeviceInfo || false,
      customMetrics: options.customMetrics || [],
      ...options
    };
    
    // Metrics buffer
    this.metricsBuffer = [];
    
    // Performance marks and measures
    this.marks = new Map();
    this.measures = new Map();
    
    // Session ID
    this.sessionId = this._generateSessionId();
    
    // Check if browser environment
    this.isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
    
    // Initialize if in browser
    if (this.isBrowser && this.options.enabled) {
      this._init();
    }
  }
  
  /**
   * Initialize the monitor
   * @private
   */
  _init() {
    // Check if Performance API is available
    if (!window.performance || !window.performance.now) {
      console.warn('Performance API not supported. Performance monitoring will be limited.');
    }
    
    // Check if should track based on sampling rate
    if (Math.random() > this.options.samplingRate) {
      this.options.enabled = false;
      return;
    }
    
    // Set up automatic tracking
    if (this.options.automaticTracking) {
      this._setupAutomaticTracking();
    }
    
    // Set up reporting interval
    if (this.options.reportingEndpoint) {
      this._setupReportingInterval();
    }
    
    // Track initial page load
    this._trackPageLoad();
  }
  
  /**
   * Set up automatic tracking
   * @private
   */
  _setupAutomaticTracking() {
    // Track Core Web Vitals
    if (this.options.trackCoreWebVitals) {
      this._trackCoreWebVitals();
    }
    
    // Track resource timing
    if (this.options.trackResourceTiming) {
      this._trackResourceTiming();
    }
    
    // Track user timing
    if (this.options.trackUserTiming) {
      this._trackUserTiming();
    }
    
    // Track errors
    if (this.options.trackErrors) {
      this._trackErrors();
    }
    
    // Track navigation
    if (this.options.trackNavigation) {
      this._trackNavigation();
    }
    
    // Track interactions
    if (this.options.trackInteractions) {
      this._trackInteractions();
    }
    
    // Track memory
    if (this.options.trackMemory) {
      this._trackMemory();
    }
    
    // Track custom metrics
    this._trackCustomMetrics();
  }
  
  /**
   * Set up reporting interval
   * @private
   */
  _setupReportingInterval() {
    this.reportingInterval = setInterval(() => {
      this._reportMetrics();
    }, this.options.reportingInterval);
    
    // Report metrics on page unload
    window.addEventListener('beforeunload', () => {
      this._reportMetrics(true);
      clearInterval(this.reportingInterval);
    });
  }
  
  /**
   * Track Core Web Vitals
   * @private
   */
  _trackCoreWebVitals() {
    // Use web-vitals library if available
    if (typeof webVitals !== 'undefined') {
      const { getLCP, getFID, getCLS, getFCP, getTTFB } = webVitals;
      
      getLCP(metric => this._addMetric('LCP', metric.value));
      getFID(metric => this._addMetric('FID', metric.value));
      getCLS(metric => this._addMetric('CLS', metric.value));
      getFCP(metric => this._addMetric('FCP', metric.value));
      getTTFB(metric => this._addMetric('TTFB', metric.value));
    } else {
      // Fallback to Performance API
      this._trackPaintTiming();
      this._trackFirstInputDelay();
      this._trackLayoutShift();
    }
  }
  
  /**
   * Track paint timing
   * @private
   */
  _trackPaintTiming() {
    if (window.performance && window.performance.getEntriesByType) {
      // First Paint and First Contentful Paint
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.name === 'first-paint') {
            this._addMetric('FP', entry.startTime);
          } else if (entry.name === 'first-contentful-paint') {
            this._addMetric('FCP', entry.startTime);
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint'] });
      
      // Largest Contentful Paint
      if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
        const lcpObserver = new PerformanceObserver(list => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (lastEntry) {
            this._addMetric('LCP', lastEntry.startTime);
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }
    }
  }
  
  /**
   * Track first input delay
   * @private
   */
  _trackFirstInputDelay() {
    if (PerformanceObserver.supportedEntryTypes.includes('first-input')) {
      const fidObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const firstInput = entries[0];
        
        if (firstInput) {
          const delay = firstInput.processingStart - firstInput.startTime;
          this._addMetric('FID', delay);
        }
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
    }
  }
  
  /**
   * Track layout shift
   * @private
   */
  _trackLayoutShift() {
    if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      let cumulativeLayoutShift = 0;
      
      const clsObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            cumulativeLayoutShift += entry.value;
            this._addMetric('CLS', cumulativeLayoutShift);
          }
        });
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }
  
  /**
   * Track resource timing
   * @private
   */
  _trackResourceTiming() {
    if (window.performance && window.performance.getEntriesByType) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          // Filter out non-interesting resources
          if (entry.initiatorType === 'fetch' || 
              entry.initiatorType === 'xmlhttprequest' || 
              entry.initiatorType === 'script' || 
              entry.initiatorType === 'css' || 
              entry.initiatorType === 'img') {
            
            this._addMetric('resource', {
              name: entry.name,
              type: entry.initiatorType,
              duration: entry.duration,
              transferSize: entry.transferSize,
              startTime: entry.startTime
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }
  
  /**
   * Track user timing
   * @private
   */
  _trackUserTiming() {
    if (window.performance && window.performance.getEntriesByType) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.entryType === 'mark') {
            this._addMetric('mark', {
              name: entry.name,
              startTime: entry.startTime
            });
          } else if (entry.entryType === 'measure') {
            this._addMetric('measure', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['mark', 'measure'] });
    }
  }
  
  /**
   * Track errors
   * @private
   */
  _trackErrors() {
    window.addEventListener('error', event => {
      this._addMetric('error', {
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now()
      });
    });
    
    window.addEventListener('unhandledrejection', event => {
      this._addMetric('unhandledrejection', {
        message: event.reason?.message || String(event.reason),
        timestamp: Date.now()
      });
    });
  }
  
  /**
   * Track navigation
   * @private
   */
  _trackNavigation() {
    // Track page navigation
    if ('navigation' in window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0];
      
      if (navigation) {
        this._addMetric('navigation', {
          type: navigation.type,
          redirectCount: navigation.redirectCount,
          domComplete: navigation.domComplete,
          domInteractive: navigation.domInteractive,
          loadEventEnd: navigation.loadEventEnd,
          loadEventStart: navigation.loadEventStart,
          domContentLoadedEventEnd: navigation.domContentLoadedEventEnd,
          domContentLoadedEventStart: navigation.domContentLoadedEventStart,
          responseEnd: navigation.responseEnd,
          responseStart: navigation.responseStart,
          requestStart: navigation.requestStart,
          connectEnd: navigation.connectEnd,
          connectStart: navigation.connectStart,
          domainLookupEnd: navigation.domainLookupEnd,
          domainLookupStart: navigation.domainLookupStart,
          redirectEnd: navigation.redirectEnd,
          redirectStart: navigation.redirectStart
        });
      }
    }
    
    // Track history API navigation
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      window.dispatchEvent(new Event('pushstate'));
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
    
    window.history.replaceState = function(...args) {
      const result = originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event('replacestate'));
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
    
    window.addEventListener('popstate', () => {
      window.dispatchEvent(new Event('locationchange'));
    });
    
    window.addEventListener('locationchange', () => {
      this._addMetric('locationchange', {
        url: window.location.href,
        timestamp: Date.now()
      });
    });
  }
  
  /**
   * Track interactions
   * @private
   */
  _trackInteractions() {
    // Track clicks
    document.addEventListener('click', event => {
      const target = event.target;
      const tagName = target.tagName.toLowerCase();
      const id = target.id;
      const className = target.className;
      
      this._addMetric('interaction', {
        type: 'click',
        tagName,
        id,
        className,
        timestamp: Date.now()
      });
    });
    
    // Track form submissions
    document.addEventListener('submit', event => {
      const form = event.target;
      const id = form.id;
      const action = form.action;
      
      this._addMetric('interaction', {
        type: 'form_submit',
        id,
        action,
        timestamp: Date.now()
      });
    });
  }
  
  /**
   * Track memory
   * @private
   */
  _trackMemory() {
    if (window.performance && window.performance.memory) {
      // Chrome-only memory info
      setInterval(() => {
        this._addMetric('memory', {
          jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
          totalJSHeapSize: window.performance.memory.totalJSHeapSize,
          usedJSHeapSize: window.performance.memory.usedJSHeapSize,
          timestamp: Date.now()
        });
      }, 30000); // Every 30 seconds
    }
  }
  
  /**
   * Track custom metrics
   * @private
   */
  _trackCustomMetrics() {
    this.options.customMetrics.forEach(metric => {
      if (typeof metric.track === 'function') {
        metric.track(value => {
          this._addMetric(metric.name, value);
        });
      }
    });
  }
  
  /**
   * Track page load
   * @private
   */
  _trackPageLoad() {
    // Basic page load timing
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      
      // Wait for load event to complete
      window.addEventListener('load', () => {
        // Give browser time to finish calculations
        setTimeout(() => {
          const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
          const domReadyTime = timing.domComplete - timing.domLoading;
          const networkLatency = timing.responseEnd - timing.requestStart;
          const serverResponseTime = timing.responseEnd - timing.responseStart;
          const redirectTime = timing.redirectEnd - timing.redirectStart;
          const dnsLookupTime = timing.domainLookupEnd - timing.domainLookupStart;
          const tcpConnectTime = timing.connectEnd - timing.connectStart;
          
          this._addMetric('pageLoad', {
            pageLoadTime,
            domReadyTime,
            networkLatency,
            serverResponseTime,
            redirectTime,
            dnsLookupTime,
            tcpConnectTime,
            url: window.location.href,
            timestamp: Date.now()
          });
        }, 0);
      });
    }
    
    // Track device and network info
    if (this.options.trackDeviceInfo) {
      this._addMetric('deviceInfo', {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        timestamp: Date.now()
      });
    }
    
    if (this.options.trackNetworkInfo && navigator.connection) {
      this._addMetric('networkInfo', {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData,
        timestamp: Date.now()
      });
      
      // Track changes in network conditions
      navigator.connection.addEventListener('change', () => {
        this._addMetric('networkInfo', {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData,
          timestamp: Date.now()
        });
      });
    }
  }
  
  /**
   * Add a metric to the buffer
   * @private
   * @param {string} name - Metric name
   * @param {*} value - Metric value
   */
  _addMetric(name, value) {
    if (!this.options.enabled) {
      return;
    }
    
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      url: window.location.href
    };
    
    this.metricsBuffer.push(metric);
    
    // Report if buffer is full
    if (this.metricsBuffer.length >= this.options.maxBufferSize) {
      this._reportMetrics();
    }
  }
  
  /**
   * Report metrics to the server
   * @private
   * @param {boolean} [sync=false] - Whether to send synchronously
   */
  _reportMetrics(sync = false) {
    if (!this.options.enabled || !this.options.reportingEndpoint || this.metricsBuffer.length === 0) {
      return;
    }
    
    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];
    
    const payload = {
      metrics,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    try {
      if (sync) {
        // Use synchronous request for beforeunload
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(this.options.reportingEndpoint, blob);
      } else {
        // Use fetch for normal reporting
        fetch(this.options.reportingEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(error => {
          console.error('Error reporting performance metrics:', error);
        });
      }
    } catch (error) {
      console.error('Error reporting performance metrics:', error);
      
      // Put metrics back in buffer if sending failed
      this.metricsBuffer = [...metrics, ...this.metricsBuffer];
      
      // Trim buffer if it gets too large
      if (this.metricsBuffer.length > this.options.maxBufferSize * 2) {
        this.metricsBuffer = this.metricsBuffer.slice(-this.options.maxBufferSize);
      }
    }
  }
  
  /**
   * Generate a session ID
   * @private
   * @returns {string} Session ID
   */
  _generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Create a performance mark
   * @param {string} name - Mark name
   * @param {Object} [data] - Additional data
   */
  mark(name, data = {}) {
    if (!this.options.enabled) {
      return;
    }
    
    const timestamp = window.performance?.now() || Date.now();
    
    this.marks.set(name, {
      name,
      timestamp,
      data
    });
    
    // Create browser performance mark if available
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
    
    this._addMetric('mark', {
      name,
      timestamp,
      data
    });
    
    return timestamp;
  }
  
  /**
   * Create a performance measure between marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   * @param {Object} [data] - Additional data
   * @returns {number|null} Duration in milliseconds
   */
  measure(name, startMark, endMark, data = {}) {
    if (!this.options.enabled) {
      return null;
    }
    
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : { timestamp: window.performance?.now() || Date.now() };
    
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return null;
    }
    
    const duration = end.timestamp - start.timestamp;
    
    this.measures.set(name, {
      name,
      startMark,
      endMark,
      duration,
      data
    });
    
    // Create browser performance measure if available
    if (window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
      } catch (error) {
        // Ignore errors from browser's performance API
      }
    }
    
    this._addMetric('measure', {
      name,
      startMark,
      endMark,
      duration,
      data
    });
    
    return duration;
  }
  
  /**
   * Track a custom event
   * @param {string} category - Event category
   * @param {string} action - Event action
   * @param {string} [label] - Event label
   * @param {number} [value] - Event value
   * @param {Object} [data] - Additional data
   */
  trackEvent(category, action, label, value, data = {}) {
    if (!this.options.enabled) {
      return;
    }
    
    this._addMetric('event', {
      category,
      action,
      label,
      value,
      data
    });
  }
  
  /**
   * Track a component render time
   * @param {string} componentName - Component name
   * @param {number} renderTime - Render time in milliseconds
   * @param {Object} [data] - Additional data
   */
  trackComponentRender(componentName, renderTime, data = {}) {
    if (!this.options.enabled) {
      return;
    }
    
    this._addMetric('componentRender', {
      componentName,
      renderTime,
      data
    });
  }
  
  /**
   * Track a route change
   * @param {string} from - Previous route
   * @param {string} to - New route
   * @param {number} [duration] - Transition duration in milliseconds
   * @param {Object} [data] - Additional data
   */
  trackRouteChange(from, to, duration, data = {}) {
    if (!this.options.enabled) {
      return;
    }
    
    this._addMetric('routeChange', {
      from,
      to,
      duration,
      data
    });
  }
  
  /**
   * Track an API call
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} duration - Call duration in milliseconds
   * @param {number} status - HTTP status code
   * @param {Object} [data] - Additional data
   */
  trackApiCall(endpoint, method, duration, status, data = {}) {
    if (!this.options.enabled) {
      return;
    }
    
    this._addMetric('apiCall', {
      endpoint,
      method,
      duration,
      status,
      data
    });
  }
  
  /**
   * Get all metrics
   * @returns {Array<Object>} Metrics
   */
  getMetrics() {
    return [...this.metricsBuffer];
  }
  
  /**
   * Get all marks
   * @returns {Map} Marks
   */
  getMarks() {
    return new Map(this.marks);
  }
  
  /**
   * Get all measures
   * @returns {Map} Measures
   */
  getMeasures() {
    return new Map(this.measures);
  }
  
  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metricsBuffer = [];
  }
  
  /**
   * Clear all marks
   */
  clearMarks() {
    this.marks.clear();
    
    if (window.performance && window.performance.clearMarks) {
      window.performance.clearMarks();
    }
  }
  
  /**
   * Clear all measures
   */
  clearMeasures() {
    this.measures.clear();
    
    if (window.performance && window.performance.clearMeasures) {
      window.performance.clearMeasures();
    }
  }
  
  /**
   * Dispose the monitor
   */
  dispose() {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }
    
    this.clearMetrics();
    this.clearMarks();
    this.clearMeasures();
  }
}

/**
 * Create a React hook for performance monitoring
 * @param {FrontendPerformanceMonitor} monitor - Performance monitor instance
 * @returns {Object} React hook
 */
function createPerformanceMonitorHook(monitor) {
  return {
    /**
     * Use performance monitor
     * @returns {Object} Performance monitor methods
     */
    usePerformanceMonitor() {
      // Check if React is available
      const React = typeof window !== 'undefined' ? window.React : null;
      
      if (!React) {
        console.warn('React not found. Performance monitor hook will not work.');
        return {};
      }
      
      const { useEffect, useRef } = React;
      
      /**
       * Track component render time
       * @param {string} componentName - Component name
       * @param {Object} [data] - Additional data
       */
      const trackRender = (componentName, data = {}) => {
        const renderStartRef = useRef(null);
        
        useEffect(() => {
          const renderEnd = window.performance?.now() || Date.now();
          
          if (renderStartRef.current) {
            const renderTime = renderEnd - renderStartRef.current;
            monitor.trackComponentRender(componentName, renderTime, data);
          }
        });
        
        renderStartRef.current = window.performance?.now() || Date.now();
      };
      
      /**
       * Create a performance mark
       * @param {string} name - Mark name
       * @param {Object} [data] - Additional data
       */
      const mark = (name, data = {}) => {
        return monitor.mark(name, data);
      };
      
      /**
       * Create a performance measure between marks
       * @param {string} name - Measure name
       * @param {string} startMark - Start mark name
       * @param {string} [endMark] - End mark name
       * @param {Object} [data] - Additional data
       * @returns {number|null} Duration in milliseconds
       */
      const measure = (name, startMark, endMark, data = {}) => {
        return monitor.measure(name, startMark, endMark, data);
      };
      
      /**
       * Track a custom event
       * @param {string} category - Event category
       * @param {string} action - Event action
       * @param {string} [label] - Event label
       * @param {number} [value] - Event value
       * @param {Object} [data] - Additional data
       */
      const trackEvent = (category, action, label, value, data = {}) => {
        monitor.trackEvent(category, action, label, value, data);
      };
      
      /**
       * Track an API call
       * @param {string} endpoint - API endpoint
       * @param {string} method - HTTP method
       * @param {number} duration - Call duration in milliseconds
       * @param {number} status - HTTP status code
       * @param {Object} [data] - Additional data
       */
      const trackApiCall = (endpoint, method, duration, status, data = {}) => {
        monitor.trackApiCall(endpoint, method, duration, status, data);
      };
      
      return {
        trackRender,
        mark,
        measure,
        trackEvent,
        trackApiCall
      };
    }
  };
}

/**
 * Create a performance monitor
 * @param {Object} options - Monitor options
 * @returns {FrontendPerformanceMonitor} Performance monitor instance
 */
function createPerformanceMonitor(options = {}) {
  return new FrontendPerformanceMonitor(options);
}

module.exports = {
  FrontendPerformanceMonitor,
  createPerformanceMonitor,
  createPerformanceMonitorHook
};
