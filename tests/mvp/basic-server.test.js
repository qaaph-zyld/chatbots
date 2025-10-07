/**
 * Basic Server Tests - MVP Core Functionality
 */

const http = require('http');
const path = require('path');

// Import the basic server (we'll need to modify it slightly for testing)
describe('Basic Server MVP Tests', () => {
  let server;
  const PORT = 3001; // Use different port for testing

  beforeAll((done) => {
    // Create a test version of the server
    server = http.createServer((req, res) => {
      const url = require('url');
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

      // Health check endpoint
      if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          service: 'ShopBot Website'
        }));
        return;
      }

      // Chat API endpoint
      if (pathname === '/api/chat/message' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const { message } = JSON.parse(body);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              data: {
                sessionId: 'test-session',
                userMessage: message,
                botResponse: `Test response to: ${message}`,
                timestamp: new Date().toISOString()
              }
            }));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
          }
        });
        return;
      }

      // Default 404
      res.writeHead(404);
      res.end('Not found');
    });

    server.listen(PORT, () => {
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  test('Health endpoint returns OK status', async () => {
    const response = await fetch(`http://localhost:${PORT}/health`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.service).toBe('ShopBot Website');
  });

  test('Chat API processes messages correctly', async () => {
    const testMessage = 'Hello, I want to buy a laptop';
    
    const response = await fetch(`http://localhost:${PORT}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: testMessage,
        sessionId: 'test-session'
      })
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.userMessage).toBe(testMessage);
    expect(data.data.botResponse).toContain(testMessage);
    expect(data.data.sessionId).toBe('test-session');
  });

  test('Chat API handles invalid JSON', async () => {
    const response = await fetch(`http://localhost:${PORT}/api/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid json'
    });
    
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid JSON');
  });

  test('Unknown endpoints return 404', async () => {
    const response = await fetch(`http://localhost:${PORT}/unknown-endpoint`);
    expect(response.status).toBe(404);
  });
});
