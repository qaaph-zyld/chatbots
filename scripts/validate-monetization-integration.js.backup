/**
 * Validate Monetization Integration
 * 
 * Script to validate the integration between billing and analytics components
 * Runs integration tests and validates end-to-end flows
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const axios = require('axios');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const API_PREFIX = '/api';
const REPORT_DIR = path.join(__dirname, '..', 'test-results', 'monetization-integration');
const REPORT_FILE = path.join(REPORT_DIR, 'integration-report.json');
const SUMMARY_FILE = path.join(REPORT_DIR, 'integration-summary.txt');

// Test data
const TEST_TENANT = {
  id: 'test-tenant-' + Date.now(),
  name: 'Test Tenant',
  email: 'test@example.com'
};

// Test server process
let serverProcess = null;

/**
 * Ensure directory exists
 * @param {string} dir - Directory path
 */
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Start the test server
 * @returns {Promise<void>}
 */
const startServer = async () => {
  return new Promise((resolve, reject) => {
    console.log('Starting test server...');
    
    serverProcess = spawn('npm', ['run', 'start:test'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    serverProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      
      // Check for server ready message
      if (chunk.includes('Server listening on port') || chunk.includes('ready on port')) {
        console.log('Server started successfully');
        resolve();
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });
    
    // Set a timeout in case the server doesn't start
    setTimeout(() => {
      if (serverProcess) {
        console.log('Server output:', output);
        console.error('Server error output:', errorOutput);
        reject(new Error('Server failed to start within timeout period'));
      }
    }, 30000);
  });
};

/**
 * Stop the test server
 */
const stopServer = () => {
  if (serverProcess) {
    console.log('Stopping test server...');
    
    // On Windows, we need to use taskkill to terminate the process tree
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t'], {
        stdio: 'ignore'
      });
    } else {
      serverProcess.kill('SIGTERM');
    }
    
    serverProcess = null;
  }
};

/**
 * Run API tests
 * @returns {Promise<Object>} Test results
 */
const runApiTests = async () => {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Helper function to run a test
  const runTest = async (name, testFn) => {
    results.total++;
    
    try {
      await testFn();
      results.passed++;
      results.tests.push({
        name,
        status: 'passed'
      });
      console.log(`✓ ${name}`);
    } catch (error) {
      results.failed++;
      results.tests.push({
        name,
        status: 'failed',
        error: error.message,
        stack: error.stack
      });
      console.error(`✗ ${name}`);
      console.error(`  Error: ${error.message}`);
    }
  };
  
  // Helper function for API requests
  const api = axios.create({
    baseURL: `${SERVER_URL}${API_PREFIX}`,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': TEST_TENANT.id
    }
  });
  
  // Test billing endpoints
  await runTest('Billing - Get plans', async () => {
    const response = await api.get('/billing/plans');
    if (!response.data.success || !Array.isArray(response.data.plans)) {
      throw new Error('Failed to get plans');
    }
  });
  
  await runTest('Billing - Create trial', async () => {
    const response = await api.post('/billing/trials', {
      tenantId: TEST_TENANT.id,
      planId: 'pro-plan', // Assuming this plan exists
      durationDays: 14
    });
    
    if (!response.data.success || !response.data.trial) {
      throw new Error('Failed to create trial');
    }
  });
  
  await runTest('Billing - Check trial eligibility', async () => {
    const response = await api.get(`/billing/trials/check-eligibility/${TEST_TENANT.id}`);
    
    if (!response.data.success || response.data.eligible === undefined) {
      throw new Error('Failed to check trial eligibility');
    }
  });
  
  await runTest('Billing - Get supported currencies', async () => {
    const response = await api.get('/billing/currencies');
    
    if (!response.data.success || !response.data.currencies) {
      throw new Error('Failed to get supported currencies');
    }
  });
  
  await runTest('Billing - Get exchange rates', async () => {
    const response = await api.get('/billing/currencies/rates');
    
    if (!response.data.success || !response.data.rates) {
      throw new Error('Failed to get exchange rates');
    }
  });
  
  await runTest('Billing - List coupons', async () => {
    const response = await api.get('/billing/coupons');
    
    if (!response.data.success || !Array.isArray(response.data.coupons)) {
      throw new Error('Failed to list coupons');
    }
  });
  
  // Test analytics endpoints
  await runTest('Analytics - Get dashboard data', async () => {
    const response = await api.get('/analytics/dashboard', {
      params: {
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      }
    });
    
    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to get dashboard data');
    }
  });
  
  await runTest('Analytics - Get events', async () => {
    const response = await api.get('/analytics/events', {
      params: {
        startDate: '2023-01-01',
        endDate: '2023-12-31'
      }
    });
    
    if (!response.data.success || !Array.isArray(response.data.events)) {
      throw new Error('Failed to get events');
    }
  });
  
  await runTest('Analytics - Generate demo data', async () => {
    const response = await api.post('/analytics/demo-data', {
      tenantId: TEST_TENANT.id,
      userCount: 5,
      eventCount: 50,
      sessionCount: 10
    });
    
    if (!response.data.success) {
      throw new Error('Failed to generate demo data');
    }
  });
  
  // Test integration between billing and analytics
  await runTest('Integration - Subscription event analytics', async () => {
    // Create a subscription
    const subscriptionResponse = await api.post('/billing/subscriptions', {
      tenantId: TEST_TENANT.id,
      planId: 'basic-plan',
      paymentMethodId: 'pm_test'
    });
    
    if (!subscriptionResponse.data.success) {
      throw new Error('Failed to create subscription');
    }
    
    // Check if subscription events were recorded in analytics
    const eventsResponse = await api.get('/analytics/events', {
      params: {
        eventType: 'subscription_created',
        startDate: new Date(Date.now() - 60000).toISOString(), // Last minute
        endDate: new Date().toISOString()
      }
    });
    
    if (!eventsResponse.data.success || !eventsResponse.data.events.some(e => 
      e.eventType === 'subscription_created' && e.eventData.tenantId === TEST_TENANT.id)) {
      throw new Error('Subscription event not found in analytics');
    }
  });
  
  return results;
};

/**
 * Generate test summary
 * @param {Object} results - Test results
 * @returns {string} Summary text
 */
const generateSummary = (results) => {
  const passRate = (results.passed / results.total * 100).toFixed(2);
  
  let summary = `
=================================================
MONETIZATION INTEGRATION TEST SUMMARY
=================================================
Date: ${new Date().toISOString()}

Total Tests: ${results.total}
Passed Tests: ${results.passed}
Failed Tests: ${results.failed}
Pass Rate: ${passRate}%
=================================================
`;

  // Add test details
  summary += '\nTEST DETAILS\n';
  summary += '=================================================\n';
  
  results.tests.forEach((test) => {
    const status = test.status === 'passed' ? '✓' : '✗';
    summary += `\n${status} ${test.name}\n`;
    
    if (test.status === 'failed') {
      summary += `  Error: ${test.error}\n`;
    }
  });
  
  return summary;
};

/**
 * Main function
 */
const main = async () => {
  try {
    console.log('Starting monetization integration validation...');
    
    // Ensure report directory exists
    ensureDirectoryExists(REPORT_DIR);
    
    // Start server
    await startServer();
    
    // Run API tests
    const results = await runApiTests();
    
    // Generate and save summary
    const summary = generateSummary(results);
    fs.writeFileSync(SUMMARY_FILE, summary);
    fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));
    
    console.log(`\nTests completed. Summary saved to ${SUMMARY_FILE}`);
    console.log(`Detailed report saved to ${REPORT_FILE}`);
    
    // Print summary to console
    console.log(summary);
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error(`Error running tests: ${error.message}`);
    process.exit(1);
  } finally {
    // Stop server
    stopServer();
  }
};

// Handle process termination
process.on('SIGINT', () => {
  stopServer();
  process.exit(1);
});

process.on('SIGTERM', () => {
  stopServer();
  process.exit(1);
});

// Run the script
main();
