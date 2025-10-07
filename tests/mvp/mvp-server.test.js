/**
 * MVP Server Integration Tests
 */

const MVPServer = require('../../src/mvp/server');

describe('MVP Server Integration Tests', () => {
  let server;
  let mvpServer;
  const PORT = 3002; // Use different port for testing

  beforeAll((done) => {
    // Create a custom server instance for testing
    mvpServer = new MVPServer();
    
    // Override the start method to use test port
    const originalStart = mvpServer.start;
    mvpServer.start = function() {
      this.server = require('http').createServer((req, res) => {
        this.handleRequest(req, res);
      });
      
      this.server.listen(PORT, () => {
        console.log(`Test server running on port ${PORT}`);
      });
      
      return this.server;
    };
    
    server = mvpServer.start();
    
    // Wait for server to start
    setTimeout(done, 200);
  });

  afterAll((done) => {
    mvpServer.stop();
    setTimeout(done, 100);
  });

  test('Server starts and responds to health check', async () => {
    const response = await fetch(`http://localhost:${PORT}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.service).toBe('ShopBot MVP');
  });

  test('Chat API processes enhanced messages', async () => {
    const testMessage = 'I want to buy a laptop for gaming';
    
    const response = await fetch(`http://localhost:${PORT}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: testMessage,
        sessionId: 'test-session-mvp'
      })
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.userMessage).toBe(testMessage);
    expect(data.data.botResponse).toContain('Gaming');
    expect(data.data.sessionId).toBe('test-session-mvp');
  });

  test('Products API returns product list', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/products`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data.products)).toBe(true);
    expect(data.data.products.length).toBeGreaterThan(0);
    expect(data.data.pagination).toBeDefined();
  });

  test('Products API filters by category', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/products?category=Electronics`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.products.every(p => p.category === 'Electronics')).toBe(true);
  });

  test('Products API searches products', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/products?search=laptop`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.products.length).toBeGreaterThan(0);
    expect(data.data.products.some(p => 
      p.name.toLowerCase().includes('laptop') || 
      p.tags.includes('laptop')
    )).toBe(true);
  });

  test('Single product API returns product details', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/products/laptop-001`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.product.id).toBe('laptop-001');
    expect(data.data.product.name).toBe('Dell XPS 13');
    expect(Array.isArray(data.data.relatedProducts)).toBe(true);
  });

  test('Non-existent product returns 404', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/products/non-existent`);
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Product not found');
  });

  test('Metrics endpoint returns Prometheus format', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/metrics`);
    const text = await response.text();
    
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain');
    expect(text).toContain('shopbot_info');
    expect(text).toContain('shopbot_uptime_seconds');
  });

  test('Unknown API endpoint returns 404', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/unknown`);
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('API endpoint not found');
  });
});
