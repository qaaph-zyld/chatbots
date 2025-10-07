/**
 * Simplified MVP Server
 * Clean, minimal implementation focused on core functionality
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '../../public');

// Import MVP modules
const ChatHandler = require('./chat/ChatHandler');
const ProductService = require('./products/ProductService');
const CartService = require('./cart/CartService');
const AuthService = require('./auth/AuthService');
const BillingAPI = require('./api/billing');

class MVPServer {
  constructor() {
    this.chatHandler = new ChatHandler();
    this.productService = new ProductService();
    this.cartService = new CartService();
    this.authService = new AuthService();
    this.billingAPI = new BillingAPI();
    this.server = null;
  }

  // MIME types for static files
  getMimeType(filePath) {
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Handle static file serving
  serveStaticFile(req, res, pathname) {
    let filePath = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);
    
    // Security check - prevent directory traversal
    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        // File not found, serve index.html for SPA routing
        filePath = path.join(publicDir, 'index.html');
      }

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404);
          res.end('File not found');
          return;
        }

        const contentType = this.getMimeType(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });
  }

  // Main request handler
  handleRequest(req, res) {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
      this.handleAPIRequest(req, res, pathname);
      return;
    }

    // Health check
    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'ShopBot MVP'
      }));
      return;
    }

    // Serve static files
    this.serveStaticFile(req, res, pathname);
  }

  // Handle API requests
  handleAPIRequest(req, res, pathname) {
    // Chat API
    if (pathname === '/api/chat/message' && req.method === 'POST') {
      this.chatHandler.handleMessage(req, res);
      return;
    }

    if (pathname === '/api/chat/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        service: 'ShopBot Chat Service',
        status: 'operational',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Products API
    if (pathname === '/api/products' && req.method === 'GET') {
      this.productService.getProducts(req, res);
      return;
    }

    if (pathname.startsWith('/api/products/') && req.method === 'GET') {
      const productId = pathname.split('/')[3];
      this.productService.getProduct(req, res, productId);
      return;
    }

    // Cart API
    if (pathname === '/api/cart' && req.method === 'GET') {
      this.handleCartGet(req, res);
      return;
    }

    if (pathname === '/api/cart/add' && req.method === 'POST') {
      this.handleCartAdd(req, res);
      return;
    }

    if (pathname === '/api/cart/remove' && req.method === 'POST') {
      this.handleCartRemove(req, res);
      return;
    }

    if (pathname === '/api/cart/clear' && req.method === 'POST') {
      this.handleCartClear(req, res);
      return;
    }

    // Auth API
    if (pathname === '/api/auth/register' && req.method === 'POST') {
      this.handleAuthRegister(req, res);
      return;
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      this.handleAuthLogin(req, res);
      return;
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      this.handleAuthLogout(req, res);
      return;
    }

    if (pathname === '/api/auth/profile' && req.method === 'GET') {
      this.handleAuthProfile(req, res);
      return;
    }

    // Billing API
    if (pathname === '/api/billing/plans' && req.method === 'GET') {
      this.billingAPI.getPlans(req, res);
      return;
    }

    if (pathname === '/api/billing/subscribe' && req.method === 'POST') {
      this.billingAPI.createSubscription(req, res);
      return;
    }

    if (pathname.startsWith('/api/billing/status/') && req.method === 'GET') {
      const customerId = pathname.split('/')[4];
      this.billingAPI.getSubscriptionStatus(req, res, customerId);
      return;
    }

    if (pathname === '/api/billing/usage' && req.method === 'POST') {
      this.billingAPI.trackUsage(req, res);
      return;
    }

    if (pathname === '/api/billing/cancel' && req.method === 'POST') {
      this.billingAPI.cancelSubscription(req, res);
      return;
    }

    if (pathname === '/api/billing/webhook' && req.method === 'POST') {
      this.billingAPI.handleWebhook(req, res);
      return;
    }

    // Metrics endpoint
    if (pathname === '/api/metrics') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(`# HELP shopbot_info Information about ShopBot MVP
# TYPE shopbot_info gauge
shopbot_info{version="1.0.0",environment="${process.env.NODE_ENV || 'development'}"} 1

# HELP shopbot_uptime_seconds Uptime in seconds
# TYPE shopbot_uptime_seconds gauge
shopbot_uptime_seconds ${process.uptime()}
`);
      return;
    }

    // API endpoint not found
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'API endpoint not found'
    }));
  }

  // Start the server
  start() {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(PORT, () => {
      console.log(`🚀 ShopBot MVP Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💬 Chat interface: http://localhost:${PORT}/chat.html`);
      console.log(`📈 Metrics: http://localhost:${PORT}/api/metrics`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      this.server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    });

    return this.server;
  }

  // Helper method to parse request body
  parseRequestBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Helper method to get session ID from request
  getSessionId(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return req.headers['x-session-id'] || 'anonymous';
  }

  // Cart handlers
  async handleCartGet(req, res) {
    try {
      const sessionId = this.getSessionId(req);
      const cart = this.cartService.getCart(sessionId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: cart
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get cart'
      }));
    }
  }

  async handleCartAdd(req, res) {
    try {
      const sessionId = this.getSessionId(req);
      const { productId, quantity = 1 } = await this.parseRequestBody(req);
      
      // Get product details
      const product = this.productService.getProductById(productId);
      if (!product) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Product not found'
        }));
        return;
      }

      const result = this.cartService.addItem(sessionId, product, quantity);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: result,
        message: 'Item added to cart'
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to add item to cart'
      }));
    }
  }

  async handleCartRemove(req, res) {
    try {
      const sessionId = this.getSessionId(req);
      const { productId, quantity } = await this.parseRequestBody(req);
      
      const result = this.cartService.removeItem(sessionId, productId, quantity);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: result,
        message: 'Item removed from cart'
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to remove item from cart'
      }));
    }
  }

  async handleCartClear(req, res) {
    try {
      const sessionId = this.getSessionId(req);
      const result = this.cartService.clearCart(sessionId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: result,
        message: 'Cart cleared'
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to clear cart'
      }));
    }
  }

  // Auth handlers
  async handleAuthRegister(req, res) {
    try {
      const userData = await this.parseRequestBody(req);
      const result = await this.authService.register(userData);
      
      const statusCode = result.success ? 201 : 400;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Registration failed'
      }));
    }
  }

  async handleAuthLogin(req, res) {
    try {
      const { email, password } = await this.parseRequestBody(req);
      const result = await this.authService.login(email, password);
      
      const statusCode = result.success ? 200 : 401;
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Login failed'
      }));
    }
  }

  async handleAuthLogout(req, res) {
    try {
      const sessionToken = this.getSessionId(req);
      const result = await this.authService.logout(sessionToken);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Logout failed'
      }));
    }
  }

  async handleAuthProfile(req, res) {
    try {
      const sessionToken = this.getSessionId(req);
      const session = this.authService.verifySession(sessionToken);
      
      if (!session) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid or expired session'
        }));
        return;
      }

      const user = this.authService.getUserById(session.userId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: user
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Failed to get profile'
      }));
    }
  }

  // Stop the server (for testing)
  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = MVPServer;

// Start server if this file is run directly
if (require.main === module) {
  const server = new MVPServer();
  server.start();
}
