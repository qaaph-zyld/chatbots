/**
 * Component Lazy Loading Utility
 * 
 * This utility provides functions for lazy loading React components
 * to improve initial load time and overall performance.
 */

import React, { lazy, Suspense } from 'react';

/**
 * Default loading component shown while lazy loading
 */
const DefaultLoadingComponent = () => (
  <div className="lazy-loading-spinner">
    <div className="spinner"></div>
    <p>Loading...</p>
  </div>
);

/**
 * Error boundary component for handling lazy loading errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error loading component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="lazy-loading-error">
          <h3>Something went wrong</h3>
          <p>The component failed to load. Please try refreshing the page.</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy load a component with customizable loading and error components
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} options - Configuration options
 * @param {React.Component} options.LoadingComponent - Component to show while loading
 * @param {React.Component} options.ErrorComponent - Component to show on error
 * @returns {React.Component} Lazy loaded component
 */
export const lazyLoad = (importFunc, options = {}) => {
  const LazyComponent = lazy(importFunc);
  const LoadingComponent = options.LoadingComponent || DefaultLoadingComponent;
  const ErrorComponent = options.ErrorComponent;

  return (props) => (
    <ErrorBoundary fallback={ErrorComponent && <ErrorComponent {...props} />}>
      <Suspense fallback={<LoadingComponent {...props} />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Lazy load a route component with preloading capability
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} options - Configuration options
 * @returns {Object} Route component with preload function
 */
export const lazyLoadRoute = (importFunc, options = {}) => {
  const LazyRouteComponent = lazyLoad(importFunc, options);
  
  // Add preload function to trigger the import earlier
  LazyRouteComponent.preload = () => importFunc();
  
  return LazyRouteComponent;
};

/**
 * Preload multiple components in parallel
 * @param {Array<Function>} importFuncs - Array of dynamic import functions
 * @returns {Promise<Array>} Promise resolving when all components are loaded
 */
export const preloadComponents = (importFuncs) => {
  return Promise.all(importFuncs.map(importFunc => importFunc()));
};

/**
 * Create a component that will be lazy loaded when it enters the viewport
 * @param {Function} importFunc - Dynamic import function
 * @param {Object} options - Configuration options
 * @returns {React.Component} Intersection observer wrapped lazy component
 */
export const lazyLoadOnVisible = (importFunc, options = {}) => {
  const LazyComponent = lazyLoad(importFunc, options);
  
  return class VisibilityLoadedComponent extends React.Component {
    constructor(props) {
      super(props);
      this.state = { visible: false };
      this.ref = React.createRef();
    }
    
    componentDidMount() {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            this.setState({ visible: true });
            observer.disconnect();
          }
        },
        { 
          rootMargin: options.rootMargin || '200px 0px',
          threshold: options.threshold || 0.1
        }
      );
      
      if (this.ref.current) {
        observer.observe(this.ref.current);
      }
      
      this.observer = observer;
    }
    
    componentWillUnmount() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }
    
    render() {
      return (
        <div ref={this.ref} style={{ minHeight: options.minHeight || '100px' }}>
          {this.state.visible ? <LazyComponent {...this.props} /> : (
            options.placeholderComponent ? 
              <options.placeholderComponent {...this.props} /> : 
              <div style={{ height: options.minHeight || '100px' }} />
          )}
        </div>
      );
    }
  };
};

/**
 * Example usage:
 * 
 * // Basic lazy loading
 * const LazyDashboard = lazyLoad(() => import('./Dashboard'));
 * 
 * // Route lazy loading with preloading
 * const LazySettings = lazyLoadRoute(() => import('./Settings'));
 * // Preload on hover: onMouseEnter={() => LazySettings.preload()}
 * 
 * // Lazy load when component is visible in viewport
 * const LazyDataTable = lazyLoadOnVisible(() => import('./DataTable'));
 */
