/**
 * Server-Side Rendering (SSR) Optimizer
 * 
 * This module provides utilities for optimizing server-side rendering performance,
 * including component caching, HTML streaming, and critical CSS extraction.
 */

const crypto = require('crypto');
const { Transform } = require('stream');
const zlib = require('zlib');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Try to import React if available
let React;
let ReactDOMServer;

try {
  React = require('react');
  ReactDOMServer = require('react-dom/server');
} catch (err) {
  // React not available, will use fallbacks
}

/**
 * SSR Cache for component rendering
 */
class SSRCache {
  /**
   * Create a new SSR cache
   * @param {Object} options - Cache options
   */
  constructor(options = {}) {
    this.options = {
      maxSize: options.maxSize || 100,
      ttl: options.ttl || 60000, // 1 minute
      enabled: options.enabled !== false,
      logger: options.logger || console,
      ...options
    };
    
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
  }
  
  /**
   * Generate a cache key for component props
   * @param {string} componentName - Component name
   * @param {Object} props - Component props
   * @returns {string} Cache key
   */
  generateKey(componentName, props) {
    // Create a stable JSON string from props
    const stableProps = this._getStableProps(props);
    
    // Create hash
    const hash = crypto
      .createHash('md5')
      .update(`${componentName}:${stableProps}`)
      .digest('hex');
    
    return hash;
  }
  
  /**
   * Get a stable representation of props for caching
   * @private
   * @param {Object} props - Component props
   * @returns {string} Stable JSON string
   */
  _getStableProps(props) {
    // Filter out non-serializable props
    const serializableProps = {};
    
    for (const [key, value] of Object.entries(props)) {
      // Skip functions and complex objects
      if (
        typeof value !== 'function' &&
        !(value instanceof Promise) &&
        !(value instanceof Map) &&
        !(value instanceof Set) &&
        !(value instanceof WeakMap) &&
        !(value instanceof WeakSet)
      ) {
        serializableProps[key] = value;
      }
    }
    
    // Sort keys for stable output
    return JSON.stringify(serializableProps, Object.keys(serializableProps).sort());
  }
  
  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {string} value - Rendered HTML
   * @returns {void}
   */
  set(key, value) {
    if (!this.options.enabled) {
      return;
    }
    
    // Check if cache is full
    if (this.cache.size >= this.options.maxSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    // Add to cache
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
    
    this.stats.size = this.cache.size;
  }
  
  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {string|null} Cached value or null if not found
   */
  get(key) {
    if (!this.options.enabled) {
      this.stats.misses++;
      return null;
    }
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.value;
  }
  
  /**
   * Clear the cache
   * @returns {void}
   */
  clear() {
    this.cache.clear();
    this.stats.size = 0;
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? this.stats.hits / (this.stats.hits + this.stats.misses)
      : 0;
    
    return {
      ...this.stats,
      hitRate
    };
  }
}

/**
 * Component for server-side rendering with caching
 */
class CachedSSRComponent {
  /**
   * Create a new cached SSR component
   * @param {Object} options - Component options
   */
  constructor(options = {}) {
    this.options = {
      cache: options.cache || new SSRCache(),
      ttl: options.ttl || 60000, // 1 minute
      logger: options.logger || console,
      ...options
    };
  }
  
  /**
   * Render a React component with caching
   * @param {React.Component} Component - React component
   * @param {Object} props - Component props
   * @param {Object} options - Render options
   * @returns {string} Rendered HTML
   */
  renderToString(Component, props, options = {}) {
    if (!React || !ReactDOMServer) {
      throw new Error('React and ReactDOMServer are required for renderToString');
    }
    
    const renderOptions = {
      ...this.options,
      ...options
    };
    
    // Generate cache key
    const componentName = Component.displayName || Component.name || 'UnknownComponent';
    const cacheKey = this.options.cache.generateKey(componentName, props);
    
    // Check cache
    const cached = this.options.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Render component
    const html = ReactDOMServer.renderToString(
      React.createElement(Component, props)
    );
    
    // Cache result
    this.options.cache.set(cacheKey, html);
    
    return html;
  }
  
  /**
   * Render a React component to a static markup string with caching
   * @param {React.Component} Component - React component
   * @param {Object} props - Component props
   * @param {Object} options - Render options
   * @returns {string} Rendered HTML
   */
  renderToStaticMarkup(Component, props, options = {}) {
    if (!React || !ReactDOMServer) {
      throw new Error('React and ReactDOMServer are required for renderToStaticMarkup');
    }
    
    const renderOptions = {
      ...this.options,
      ...options
    };
    
    // Generate cache key
    const componentName = Component.displayName || Component.name || 'UnknownComponent';
    const cacheKey = `static:${this.options.cache.generateKey(componentName, props)}`;
    
    // Check cache
    const cached = this.options.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    // Render component
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Component, props)
    );
    
    // Cache result
    this.options.cache.set(cacheKey, html);
    
    return html;
  }
  
  /**
   * Render a React component to a node stream
   * @param {React.Component} Component - React component
   * @param {Object} props - Component props
   * @param {Object} options - Render options
   * @returns {stream.Readable} Readable stream
   */
  renderToNodeStream(Component, props, options = {}) {
    if (!React || !ReactDOMServer) {
      throw new Error('React and ReactDOMServer are required for renderToNodeStream');
    }
    
    return ReactDOMServer.renderToNodeStream(
      React.createElement(Component, props)
    );
  }
  
  /**
   * Render a React component to a static node stream
   * @param {React.Component} Component - React component
   * @param {Object} props - Component props
   * @param {Object} options - Render options
   * @returns {stream.Readable} Readable stream
   */
  renderToStaticNodeStream(Component, props, options = {}) {
    if (!React || !ReactDOMServer) {
      throw new Error('React and ReactDOMServer are required for renderToStaticNodeStream');
    }
    
    return ReactDOMServer.renderToStaticNodeStream(
      React.createElement(Component, props)
    );
  }
}

/**
 * HTML streaming transformer
 */
class HTMLStreamer extends Transform {
  /**
   * Create a new HTML streamer
   * @param {Object} options - Streamer options
   */
  constructor(options = {}) {
    super({ objectMode: false });
    
    this.options = {
      injectBefore: options.injectBefore || [],
      injectAfter: options.injectAfter || [],
      transformChunk: options.transformChunk || null,
      compress: options.compress || false,
      logger: options.logger || console,
      ...options
    };
    
    this.headSent = false;
    this.buffer = '';
    
    // Set up compression if needed
    if (this.options.compress) {
      this.compressor = this.options.compress === 'br'
        ? zlib.createBrotliCompress()
        : this.options.compress === 'deflate'
          ? zlib.createDeflate()
          : zlib.createGzip();
    }
  }
  
  /**
   * Transform implementation
   * @param {Buffer|string} chunk - Chunk to transform
   * @param {string} encoding - Chunk encoding
   * @param {Function} callback - Callback function
   * @private
   */
  _transform(chunk, encoding, callback) {
    try {
      // Convert chunk to string
      const chunkStr = Buffer.isBuffer(chunk) ? chunk.toString() : chunk;
      
      // Add to buffer
      this.buffer += chunkStr;
      
      // Check if we have the head
      if (!this.headSent && this.buffer.includes('</head>')) {
        // Split at head end
        const parts = this.buffer.split('</head>');
        const head = parts[0] + '</head>';
        const rest = parts.slice(1).join('</head>');
        
        // Inject before head end
        let output = head;
        
        if (this.options.injectBefore.length > 0) {
          output = output.replace('</head>', this.options.injectBefore.join('') + '</head>');
        }
        
        // Mark head as sent
        this.headSent = true;
        
        // Reset buffer with remaining content
        this.buffer = rest;
        
        // Apply transform if provided
        if (this.options.transformChunk) {
          output = this.options.transformChunk(output, 'head');
        }
        
        // Push output
        if (this.options.compress) {
          this.compressor.write(output);
          this.compressor.on('data', data => this.push(data));
        } else {
          this.push(output);
        }
      }
      
      // Check if we have complete body chunks to process
      if (this.headSent && this.buffer.includes('</body>')) {
        // Split at body end
        const parts = this.buffer.split('</body>');
        const body = parts[0];
        const end = '</body>' + parts.slice(1).join('</body>');
        
        // Reset buffer with remaining content
        this.buffer = end;
        
        // Apply transform if provided
        let output = body;
        
        if (this.options.transformChunk) {
          output = this.options.transformChunk(output, 'body');
        }
        
        // Push output
        if (this.options.compress) {
          this.compressor.write(output);
          this.compressor.on('data', data => this.push(data));
        } else {
          this.push(output);
        }
      }
      
      callback();
    } catch (err) {
      callback(err);
    }
  }
  
  /**
   * Flush implementation
   * @param {Function} callback - Callback function
   * @private
   */
  _flush(callback) {
    try {
      // Process any remaining buffer
      if (this.buffer.length > 0) {
        let output = this.buffer;
        
        // Apply transform if provided
        if (this.options.transformChunk) {
          output = this.options.transformChunk(output, 'end');
        }
        
        // Inject after content if we're at the end
        if (output.includes('</html>') && this.options.injectAfter.length > 0) {
          output = output.replace('</html>', this.options.injectAfter.join('') + '</html>');
        }
        
        // Push output
        if (this.options.compress) {
          this.compressor.write(output);
          this.compressor.end();
          this.compressor.on('data', data => this.push(data));
          this.compressor.on('end', callback);
        } else {
          this.push(output);
          callback();
        }
      } else {
        if (this.options.compress) {
          this.compressor.end();
          this.compressor.on('end', callback);
        } else {
          callback();
        }
      }
    } catch (err) {
      callback(err);
    }
  }
}

/**
 * Critical CSS extractor
 */
class CriticalCSSExtractor {
  /**
   * Create a new critical CSS extractor
   * @param {Object} options - Extractor options
   */
  constructor(options = {}) {
    this.options = {
      outputPath: options.outputPath || path.join(process.cwd(), 'public', 'css'),
      cssFiles: options.cssFiles || [],
      routes: options.routes || [],
      viewport: options.viewport || {
        width: 1200,
        height: 800
      },
      userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
      timeout: options.timeout || 30000,
      minify: options.minify !== false,
      logger: options.logger || console,
      ...options
    };
  }
  
  /**
   * Extract critical CSS for a route
   * @param {string} route - Route path
   * @param {string} html - HTML content
   * @returns {Promise<string>} Critical CSS
   */
  async extractForRoute(route, html) {
    try {
      // Check if we have puppeteer
      let puppeteer;
      
      try {
        puppeteer = require('puppeteer');
      } catch (err) {
        throw new Error('Puppeteer is required for critical CSS extraction');
      }
      
      // Launch browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      try {
        // Create page
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport(this.options.viewport);
        
        // Set user agent
        await page.setUserAgent(this.options.userAgent);
        
        // Set content
        await page.setContent(html, {
          waitUntil: 'networkidle0',
          timeout: this.options.timeout
        });
        
        // Extract critical CSS
        const criticalCSS = await page.evaluate(() => {
          const styleSheets = Array.from(document.styleSheets);
          let css = '';
          
          for (const sheet of styleSheets) {
            try {
              const rules = sheet.cssRules || sheet.rules;
              
              for (const rule of rules) {
                // Skip non-style rules
                if (rule.type !== 1) {
                  continue;
                }
                
                const selector = rule.selectorText;
                
                // Check if selector matches any element in viewport
                try {
                  const elements = document.querySelectorAll(selector);
                  
                  for (const element of elements) {
                    const rect = element.getBoundingClientRect();
                    
                    // Check if element is in viewport
                    if (
                      rect.top < window.innerHeight &&
                      rect.left < window.innerWidth &&
                      rect.bottom > 0 &&
                      rect.right > 0
                    ) {
                      css += rule.cssText + '\n';
                      break;
                    }
                  }
                } catch (err) {
                  // Invalid selector, skip
                }
              }
            } catch (err) {
              // Cross-origin stylesheet, skip
            }
          }
          
          return css;
        });
        
        return criticalCSS;
      } finally {
        // Close browser
        await browser.close();
      }
    } catch (err) {
      this.options.logger.error(`Error extracting critical CSS for route ${route}:`, err);
      
      // Return empty string on error
      return '';
    }
  }
  
  /**
   * Extract critical CSS for all routes
   * @returns {Promise<Object>} Critical CSS by route
   */
  async extractForAllRoutes() {
    const results = {};
    
    for (const route of this.options.routes) {
      try {
        // Get HTML for route
        const html = await this._getRouteHTML(route);
        
        // Extract critical CSS
        const css = await this.extractForRoute(route, html);
        
        // Store result
        results[route] = css;
        
        // Save to file
        await this._saveCriticalCSS(route, css);
      } catch (err) {
        this.options.logger.error(`Error processing route ${route}:`, err);
      }
    }
    
    return results;
  }
  
  /**
   * Get HTML for a route
   * @private
   * @param {string} route - Route path
   * @returns {Promise<string>} HTML content
   */
  async _getRouteHTML(route) {
    // If we have a URL, fetch it
    if (route.startsWith('http')) {
      try {
        const response = await fetch(route);
        return await response.text();
      } catch (err) {
        throw new Error(`Failed to fetch HTML for route ${route}: ${err.message}`);
      }
    }
    
    // Otherwise, check if we have a render function
    if (typeof this.options.renderRoute === 'function') {
      return this.options.renderRoute(route);
    }
    
    throw new Error(`No way to get HTML for route ${route}`);
  }
  
  /**
   * Save critical CSS to file
   * @private
   * @param {string} route - Route path
   * @param {string} css - CSS content
   * @returns {Promise<void>}
   */
  async _saveCriticalCSS(route, css) {
    try {
      // Create directory if it doesn't exist
      await mkdir(this.options.outputPath, { recursive: true });
      
      // Generate filename
      const filename = route === '/'
        ? 'index'
        : route.replace(/^\//, '').replace(/\//g, '-');
      
      // Minify if needed
      let processedCSS = css;
      
      if (this.options.minify && css.trim().length > 0) {
        try {
          const CleanCSS = require('clean-css');
          const minifier = new CleanCSS();
          const minified = minifier.minify(css);
          
          if (minified.styles) {
            processedCSS = minified.styles;
          }
        } catch (err) {
          this.options.logger.warn(`Failed to minify CSS for route ${route}:`, err);
        }
      }
      
      // Write to file
      const filePath = path.join(this.options.outputPath, `critical-${filename}.css`);
      await writeFile(filePath, processedCSS);
      
      this.options.logger.info(`Saved critical CSS for route ${route} to ${filePath}`);
    } catch (err) {
      this.options.logger.error(`Failed to save critical CSS for route ${route}:`, err);
    }
  }
}

/**
 * Express middleware for SSR optimization
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function ssrMiddleware(options = {}) {
  const opts = {
    cache: options.cache !== false,
    cacheControl: options.cacheControl || 'public, max-age=3600',
    criticalCSS: options.criticalCSS || false,
    criticalCSSPath: options.criticalCSSPath || '/css',
    streaming: options.streaming !== false,
    logger: options.logger || console,
    ...options
  };
  
  // Create cache if enabled
  const ssrCache = opts.cache ? new SSRCache(opts.cacheOptions) : null;
  
  return function(req, res, next) {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method
    res.send = function(body) {
      // Only process HTML responses
      if (typeof body === 'string' && res.get('Content-Type')?.includes('text/html')) {
        // Add cache control header if not present
        if (opts.cache && !res.get('Cache-Control')) {
          res.set('Cache-Control', opts.cacheControl);
        }
        
        // Inject critical CSS if enabled
        if (opts.criticalCSS) {
          const route = req.path || '/';
          const filename = route === '/'
            ? 'index'
            : route.replace(/^\//, '').replace(/\//g, '-');
          
          const criticalCSSPath = `${opts.criticalCSSPath}/critical-${filename}.css`;
          
          // Check if critical CSS file exists
          try {
            const cssFilePath = path.join(process.cwd(), 'public', criticalCSSPath);
            
            if (fs.existsSync(cssFilePath)) {
              const cssTag = `<link rel="stylesheet" href="${criticalCSSPath}">`;
              body = body.replace('</head>', `${cssTag}</head>`);
            }
          } catch (err) {
            opts.logger.debug(`Critical CSS not found for route ${route}`);
          }
        }
        
        // Cache the response if enabled
        if (opts.cache && ssrCache) {
          const cacheKey = `${req.method}:${req.originalUrl || req.url}`;
          ssrCache.set(cacheKey, body);
        }
      }
      
      // Call original send method
      return originalSend.call(this, body);
    };
    
    // Check cache if enabled
    if (opts.cache && ssrCache) {
      const cacheKey = `${req.method}:${req.originalUrl || req.url}`;
      const cached = ssrCache.get(cacheKey);
      
      if (cached) {
        return res.send(cached);
      }
    }
    
    next();
  };
}

module.exports = {
  SSRCache,
  CachedSSRComponent,
  HTMLStreamer,
  CriticalCSSExtractor,
  ssrMiddleware
};
