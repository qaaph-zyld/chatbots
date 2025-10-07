/**
 * Quick MVP Test Script
 * Tests all core MVP functionality
 */

const MVPServer = require('./src/mvp/server.js');
const http = require('http');

// Test configuration
const TEST_PORT = 3002;
const BASE_URL = `http://localhost:${TEST_PORT}`;

class MVPTester {
  constructor() {
    this.server = null;
    this.testResults = [];
  }

  async startServer() {
    console.log('🚀 Starting MVP Server for testing...');
    process.env.PORT = TEST_PORT;
    this.server = new MVPServer();
    await new Promise((resolve) => {
      this.server.start();
      setTimeout(resolve, 1000); // Wait for server to start
    });
    console.log(`✅ Server started on port ${TEST_PORT}`);
  }

  async stopServer() {
    if (this.server) {
      this.server.stop();
      console.log('🛑 Server stopped');
    }
  }

  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: TEST_PORT,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const response = {
              statusCode: res.statusCode,
              data: body ? JSON.parse(body) : null
            };
            resolve(response);
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              data: body
            });
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  async runTest(testName, testFn) {
    try {
      console.log(`\n🧪 Testing: ${testName}`);
      const result = await testFn();
      this.testResults.push({ name: testName, status: 'PASS', result });
      console.log(`✅ ${testName}: PASSED`);
      return result;
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      console.log(`❌ ${testName}: FAILED - ${error.message}`);
      return null;
    }
  }

  async runAllTests() {
    console.log('\n🎯 Starting MVP Functionality Tests\n');

    // Test 1: Health Check
    await this.runTest('Health Check', async () => {
      const response = await this.makeRequest('GET', '/health');
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      if (!response.data.status || response.data.status !== 'ok') {
        throw new Error('Health check failed');
      }
      return response.data;
    });

    // Test 2: Products API
    await this.runTest('Products API', async () => {
      const response = await this.makeRequest('GET', '/api/products');
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error('Products API failed');
      }
      if (response.data.data.length === 0) {
        throw new Error('No products found');
      }
      return `Found ${response.data.data.length} products`;
    });

    // Test 3: Chat API
    await this.runTest('Chat API', async () => {
      const response = await this.makeRequest('POST', '/api/chat/message', {
        message: 'Hello, I want to buy a laptop',
        sessionId: 'test-session-123'
      });
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      if (!response.data.success || !response.data.data.botResponse) {
        throw new Error('Chat API failed');
      }
      return response.data.data.botResponse;
    });

    // Test 4: User Registration
    let authToken = null;
    await this.runTest('User Registration', async () => {
      const response = await this.makeRequest('POST', '/api/auth/register', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123'
      });
      if (response.statusCode !== 201) {
        throw new Error(`Expected 201, got ${response.statusCode}`);
      }
      if (!response.data.success || !response.data.user) {
        throw new Error('Registration failed');
      }
      return response.data.user.name;
    });

    // Test 5: User Login
    await this.runTest('User Login', async () => {
      const response = await this.makeRequest('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'testpassword123'
      });
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      if (!response.data.success || !response.data.session) {
        throw new Error('Login failed');
      }
      authToken = response.data.session.token;
      return 'Login successful';
    });

    // Test 6: Cart Operations
    await this.runTest('Cart Operations', async () => {
      // Get empty cart
      let response = await this.makeRequest('GET', '/api/cart');
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }

      // Add item to cart
      response = await this.makeRequest('POST', '/api/cart/add', {
        productId: 'laptop-001',
        quantity: 1
      });
      if (response.statusCode !== 200) {
        throw new Error(`Add to cart failed: ${response.statusCode}`);
      }

      // Get cart with item
      response = await this.makeRequest('GET', '/api/cart');
      if (response.data.data.itemCount !== 1) {
        throw new Error('Cart should have 1 item');
      }

      return 'Cart operations successful';
    });

    // Test 7: Metrics Endpoint
    await this.runTest('Metrics Endpoint', async () => {
      const response = await this.makeRequest('GET', '/api/metrics');
      if (response.statusCode !== 200) {
        throw new Error(`Expected 200, got ${response.statusCode}`);
      }
      if (!response.data.includes('shopbot_info')) {
        throw new Error('Metrics format invalid');
      }
      return 'Metrics working';
    });

    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(t => t.status === 'FAIL')
        .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }
    
    console.log(`\n🎯 MVP Status: ${passed === total ? '✅ FULLY FUNCTIONAL' : '⚠️ NEEDS FIXES'}`);
  }
}

// Run tests
async function main() {
  const tester = new MVPTester();
  
  try {
    await tester.startServer();
    await tester.runAllTests();
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await tester.stopServer();
  }
}

if (require.main === module) {
  main();
}

module.exports = MVPTester;
