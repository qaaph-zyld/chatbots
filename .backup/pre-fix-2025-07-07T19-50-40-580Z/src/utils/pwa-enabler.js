/**
 * Progressive Web App (PWA) Enabler
 * 
 * This module provides utilities to enable Progressive Web App features
 * including service worker registration, offline capabilities, and manifest generation.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * PWA Configuration Manager
 */
class PWAConfig {
  /**
   * Create a new PWA configuration
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      appName: options.appName || 'My PWA App',
      shortName: options.shortName || 'PWA App',
      description: options.description || 'A Progressive Web App',
      themeColor: options.themeColor || '#ffffff',
      backgroundColor: options.backgroundColor || '#ffffff',
      display: options.display || 'standalone',
      orientation: options.orientation || 'portrait',
      scope: options.scope || '/',
      startUrl: options.startUrl || '/',
      iconSizes: options.iconSizes || [72, 96, 128, 144, 152, 192, 384, 512],
      splashScreens: options.splashScreens || [],
      cacheStrategy: options.cacheStrategy || 'network-first',
      cacheName: options.cacheName || 'pwa-cache-v1',
      precacheUrls: options.precacheUrls || [],
      offlinePage: options.offlinePage || '/offline.html',
      outputDir: options.outputDir || path.join(process.cwd(), 'public'),
      manifestFilename: options.manifestFilename || 'manifest.json',
      swFilename: options.swFilename || 'service-worker.js',
      swRegisterFilename: options.swRegisterFilename || 'sw-register.js',
      logger: options.logger || console,
      ...options
    };
  }
  
  /**
   * Generate manifest.json file
   * @returns {Promise<string>} Path to generated manifest file
   */
  async generateManifest() {
    try {
      const manifest = {
        name: this.options.appName,
        short_name: this.options.shortName,
        description: this.options.description,
        theme_color: this.options.themeColor,
        background_color: this.options.backgroundColor,
        display: this.options.display,
        orientation: this.options.orientation,
        scope: this.options.scope,
        start_url: this.options.startUrl,
        icons: this.options.iconSizes.map(size => ({
          src: `/icons/icon-${size}x${size}.png`,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: 'any maskable'
        }))
      };
      
      // Add screenshots if provided
      if (this.options.screenshots && this.options.screenshots.length > 0) {
        manifest.screenshots = this.options.screenshots;
      }
      
      // Add shortcuts if provided
      if (this.options.shortcuts && this.options.shortcuts.length > 0) {
        manifest.shortcuts = this.options.shortcuts;
      }
      
      // Create output directory if it doesn't exist
      await mkdir(this.options.outputDir, { recursive: true });
      
      // Write manifest file
      const manifestPath = path.join(this.options.outputDir, this.options.manifestFilename);
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      this.options.logger.info(`Generated manifest file at ${manifestPath}`);
      
      return manifestPath;
    } catch (err) {
      this.options.logger.error('Error generating manifest:', err);
      throw err;
    }
  }
  
  /**
   * Generate service worker file
   * @returns {Promise<string>} Path to generated service worker file
   */
  async generateServiceWorker() {
    try {
      // Create cache key based on content
      const cacheKey = crypto
        .createHash('md5')
        .update(JSON.stringify({
          precacheUrls: this.options.precacheUrls,
          cacheStrategy: this.options.cacheStrategy,
          cacheName: this.options.cacheName,
          version: Date.now()
        }))
        .digest('hex');
      
      // Generate service worker content
      const swContent = this._generateServiceWorkerContent(cacheKey);
      
      // Create output directory if it doesn't exist
      await mkdir(this.options.outputDir, { recursive: true });
      
      // Write service worker file
      const swPath = path.join(this.options.outputDir, this.options.swFilename);
      await writeFile(swPath, swContent);
      
      this.options.logger.info(`Generated service worker file at ${swPath}`);
      
      return swPath;
    } catch (err) {
      this.options.logger.error('Error generating service worker:', err);
      throw err;
    }
  }
  
  /**
   * Generate service worker registration script
   * @returns {Promise<string>} Path to generated registration script
   */
  async generateServiceWorkerRegister() {
    try {
      // Generate registration script content
      const registerContent = `
        // Service Worker Registration Script
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/${this.options.swFilename}')
              .then(registration => {
                console.log('Service Worker registered with scope:', registration.scope);
              })
              .catch(error => {
                console.error('Service Worker registration failed:', error);
              });
          });
        }
      `;
      
      // Create output directory if it doesn't exist
      await mkdir(this.options.outputDir, { recursive: true });
      
      // Write registration script file
      const registerPath = path.join(this.options.outputDir, this.options.swRegisterFilename);
      await writeFile(registerPath, registerContent);
      
      this.options.logger.info(`Generated service worker registration script at ${registerPath}`);
      
      return registerPath;
    } catch (err) {
      this.options.logger.error('Error generating service worker registration script:', err);
      throw err;
    }
  }
  
  /**
   * Generate service worker content
   * @private
   * @param {string} cacheKey - Cache key
   * @returns {string} Service worker content
   */
  _generateServiceWorkerContent(cacheKey) {
    const { cacheName, precacheUrls, offlinePage, cacheStrategy } = this.options;
    
    return `
      // Service Worker for PWA
      // Cache key: ${cacheKey}
      
      const CACHE_NAME = '${cacheName}';
      const OFFLINE_PAGE = '${offlinePage}';
      
      // Resources to pre-cache
      const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};
      
      // Install event - precache resources
      self.addEventListener('install', event => {
        event.waitUntil(
          caches.open(CACHE_NAME)
            .then(cache => {
              console.log('Opened cache');
              return cache.addAll(PRECACHE_URLS)
                .then(() => self.skipWaiting());
            })
            .catch(error => {
              console.error('Pre-caching failed:', error);
            })
        );
      });
      
      // Activate event - clean up old caches
      self.addEventListener('activate', event => {
        event.waitUntil(
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames.map(name => {
                if (name !== CACHE_NAME) {
                  console.log('Deleting old cache:', name);
                  return caches.delete(name);
                }
              })
            );
          }).then(() => {
            console.log('Service Worker activated');
            return self.clients.claim();
          })
        );
      });
      
      // Fetch event - handle requests
      self.addEventListener('fetch', event => {
        // Skip cross-origin requests
        if (!event.request.url.startsWith(self.location.origin)) {
          return;
        }
        
        // Skip non-GET requests
        if (event.request.method !== 'GET') {
          return;
        }
        
        // Handle fetch based on strategy
        ${this._generateFetchHandler(cacheStrategy)}
      });
      
      // Handle offline page
      function serveOfflinePage() {
        return caches.open(CACHE_NAME)
          .then(cache => {
            return cache.match(OFFLINE_PAGE)
              .then(response => {
                return response || fetch(OFFLINE_PAGE)
                  .then(response => {
                    cache.put(OFFLINE_PAGE, response.clone());
                    return response;
                  });
              });
          });
      }
    `;
  }
  
  /**
   * Generate fetch handler based on caching strategy
   * @private
   * @param {string} strategy - Caching strategy
   * @returns {string} Fetch handler code
   */
  _generateFetchHandler(strategy) {
    switch (strategy) {
      case 'cache-first':
        return `
          event.respondWith(
            caches.match(event.request)
              .then(response => {
                // Return cached response if found
                if (response) {
                  return response;
                }
                
                // Otherwise fetch from network
                return fetch(event.request)
                  .then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                      return response;
                    }
                    
                    // Clone response to cache and return
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                      .then(cache => {
                        cache.put(event.request, responseToCache);
                      });
                    
                    return response;
                  })
                  .catch(error => {
                    // Network failed, show offline page
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return serveOfflinePage();
                    }
                    
                    return new Response('Network error', {
                      status: 408,
                      headers: new Headers({ 'Content-Type': 'text/plain' })
                    });
                  });
              })
          );
        `;
        
      case 'network-first':
        return `
          event.respondWith(
            fetch(event.request)
              .then(response => {
                // Check if valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                  return response;
                }
                
                // Clone response to cache and return
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
                
                return response;
              })
              .catch(error => {
                // Network failed, try cache
                return caches.match(event.request)
                  .then(response => {
                    // Return cached response if found
                    if (response) {
                      return response;
                    }
                    
                    // Otherwise show offline page for HTML requests
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return serveOfflinePage();
                    }
                    
                    return new Response('Network error', {
                      status: 408,
                      headers: new Headers({ 'Content-Type': 'text/plain' })
                    });
                  });
              })
          );
        `;
        
      case 'stale-while-revalidate':
        return `
          event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
              return cache.match(event.request).then(cachedResponse => {
                const fetchPromise = fetch(event.request)
                  .then(networkResponse => {
                    // Update cache with fresh response
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                  })
                  .catch(error => {
                    // Network failed for HTML requests, show offline page
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return serveOfflinePage();
                    }
                    
                    throw error;
                  });
                
                // Return cached response immediately, or wait for network
                return cachedResponse || fetchPromise;
              });
            })
          );
        `;
        
      default:
        return `
          event.respondWith(
            fetch(event.request)
              .catch(() => {
                return caches.match(event.request)
                  .then(response => {
                    if (response) {
                      return response;
                    }
                    
                    if (event.request.headers.get('accept').includes('text/html')) {
                      return serveOfflinePage();
                    }
                  });
              })
          );
        `;
    }
  }
  
  /**
   * Generate offline page
   * @returns {Promise<string>} Path to generated offline page
   */
  async generateOfflinePage() {
    try {
      // Generate offline page content
      const offlineContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Offline - ${this.options.appName}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
              text-align: center;
              background-color: ${this.options.backgroundColor};
              color: #333;
            }
            h1 {
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 20px;
              max-width: 600px;
            }
            button {
              background-color: ${this.options.themeColor};
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <h1>You're offline</h1>
          <p>It looks like you've lost your internet connection. Please check your network settings and try again.</p>
          <button onclick="window.location.reload()">Try Again</button>
          <script>
            // Check for online status changes
            window.addEventListener('online', () => {
              window.location.reload();
            });
          </script>
        </body>
        </html>
      `;
      
      // Create output directory if it doesn't exist
      await mkdir(path.dirname(path.join(this.options.outputDir, this.options.offlinePage)), { recursive: true });
      
      // Write offline page file
      const offlinePath = path.join(this.options.outputDir, this.options.offlinePage);
      await writeFile(offlinePath, offlineContent);
      
      this.options.logger.info(`Generated offline page at ${offlinePath}`);
      
      return offlinePath;
    } catch (err) {
      this.options.logger.error('Error generating offline page:', err);
      throw err;
    }
  }
  
  /**
   * Generate all PWA files
   * @returns {Promise<Object>} Paths to generated files
   */
  async generateAll() {
    try {
      const manifestPath = await this.generateManifest();
      const offlinePath = await this.generateOfflinePage();
      const swPath = await this.generateServiceWorker();
      const swRegisterPath = await this.generateServiceWorkerRegister();
      
      return {
        manifestPath,
        offlinePath,
        swPath,
        swRegisterPath
      };
    } catch (err) {
      this.options.logger.error('Error generating PWA files:', err);
      throw err;
    }
  }
}

/**
 * Express middleware for PWA
 * @param {Object} options - Middleware options
 * @returns {Function} Express middleware
 */
function pwaMiddleware(options = {}) {
  const opts = {
    injectManifest: options.injectManifest !== false,
    injectServiceWorker: options.injectServiceWorker !== false,
    ...options
  };
  
  return function(req, res, next) {
    // Store original send method
    const originalSend = res.send;
    
    // Override send method
    res.send = function(body) {
      // Only process HTML responses
      if (typeof body === 'string' && res.get('Content-Type')?.includes('text/html')) {
        // Inject manifest link
        if (opts.injectManifest) {
          const manifestLink = '<link rel="manifest" href="/manifest.json">';
          body = body.replace('</head>', `${manifestLink}</head>`);
        }
        
        // Inject theme color meta
        if (opts.themeColor) {
          const themeColorMeta = `<meta name="theme-color" content="${opts.themeColor}">`;
          body = body.replace('</head>', `${themeColorMeta}</head>`);
        }
        
        // Inject Apple touch icon
        if (opts.appleIcon) {
          const appleIconLink = `<link rel="apple-touch-icon" href="${opts.appleIcon}">`;
          body = body.replace('</head>', `${appleIconLink}</head>`);
        }
        
        // Inject service worker registration
        if (opts.injectServiceWorker) {
          const swScript = '<script src="/sw-register.js"></script>';
          body = body.replace('</body>', `${swScript}</body>`);
        }
      }
      
      // Call original send method
      return originalSend.call(this, body);
    };
    
    next();
  };
}

/**
 * Create a PWA configuration
 * @param {Object} options - Configuration options
 * @returns {PWAConfig} PWA configuration instance
 */
function createPWAConfig(options = {}) {
  return new PWAConfig(options);
}

module.exports = {
  PWAConfig,
  pwaMiddleware,
  createPWAConfig
};
