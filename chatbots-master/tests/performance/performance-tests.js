/**
 * Performance Tests
 * 
 * These tests verify the performance of the application after deployment.
 * They are run as part of the deployment verification process
 * to ensure the application meets performance requirements before switching traffic.
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Get the base URL from environment or use default
const BASE_URL = process.env.TEST_URL || 'https://chatbot-platform.example.com';
const API_VERSION = 'v1';

// Test credentials
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

// Performance thresholds
const THRESHOLDS = {
  latency: {
    p50: 100, // 50th percentile in ms
    p90: 300, // 90th percentile in ms
    p99: 500  // 99th percentile in ms
  },
  throughput: 100, // requests per second
  errorRate: 0.01  // 1% error rate
};

// Test duration
const DURATION = 30; // seconds

// Results directory
const RESULTS_DIR = path.join(__dirname, '../../test-results/performance');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Helper function to get auth token
async function getAuthToken() {
  const axios = require('axios');
  try {
    const response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    return response.data.token;
  } catch (error) {
    console.error('Failed to get auth token:', error.message);
    return null;
  }
}

// Helper function to run a performance test
async function runPerformanceTest(name, url, options = {}) {
  console.log(`Running performance test: ${name}`);
  
  const instance = autocannon({
    url,
    connections: 10,
    duration: DURATION,
    ...options
  });
  
  return new Promise((resolve) => {
    autocannon.track(instance);
    
    instance.on('done', (results) => {
      // Save results to file
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const resultsFile = path.join(RESULTS_DIR, `${name}-${timestamp}.json`);
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      
      // Check if results meet thresholds
      const passed = checkThresholds(name, results);
      
      resolve({ name, results, passed });
    });
  });
}

// Helper function to check if results meet thresholds
function checkThresholds(name, results) {
  const latency = results.latency;
  const throughput = results.requests.average;
  const errors = results.errors;
  const totalRequests = results.requests.total;
  const errorRate = errors / totalRequests;
  
  const latencyPassed = 
    latency.p50 <= THRESHOLDS.latency.p50 &&
    latency.p90 <= THRESHOLDS.latency.p90 &&
    latency.p99 <= THRESHOLDS.latency.p99;
  
  const throughputPassed = throughput >= THRESHOLDS.throughput;
  const errorRatePassed = errorRate <= THRESHOLDS.errorRate;
  
  const passed = latencyPassed && throughputPassed && errorRatePassed;
  
  console.log(`\nTest: ${name}`);
  console.log(`Latency (p50/p90/p99): ${latency.p50}/${latency.p90}/${latency.p99} ms`);
  console.log(`Throughput: ${throughput.toFixed(2)} req/sec`);
  console.log(`Error rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log(`Result: ${passed ? 'PASSED' : 'FAILED'}`);
  
  if (!latencyPassed) {
    console.log(`  ❌ Latency threshold not met`);
  }
  if (!throughputPassed) {
    console.log(`  ❌ Throughput threshold not met`);
  }
  if (!errorRatePassed) {
    console.log(`  ❌ Error rate threshold not met`);
  }
  
  return passed;
}

// Main function
async function main() {
  console.log('Starting performance tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Duration: ${DURATION} seconds`);
  console.log('-----------------------------------');
  
  const results = [];
  let allPassed = true;
  
  // Test 1: Health endpoint
  const healthTest = await runPerformanceTest(
    'health-endpoint',
    `${BASE_URL}/health`
  );
  results.push(healthTest);
  allPassed = allPassed && healthTest.passed;
  
  // Test 2: Static assets
  const staticTest = await runPerformanceTest(
    'static-assets',
    `${BASE_URL}/`
  );
  results.push(staticTest);
  allPassed = allPassed && staticTest.passed;
  
  // Get auth token for authenticated tests
  const authToken = await getAuthToken();
  
  if (authToken) {
    // Test 3: Get chatbots (authenticated)
    const chatbotsTest = await runPerformanceTest(
      'get-chatbots',
      `${BASE_URL}/api/${API_VERSION}/chatbots`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    results.push(chatbotsTest);
    allPassed = allPassed && chatbotsTest.passed;
    
    // Test 4: Get user profile (authenticated)
    const profileTest = await runPerformanceTest(
      'get-profile',
      `${BASE_URL}/api/${API_VERSION}/users/profile`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    results.push(profileTest);
    allPassed = allPassed && profileTest.passed;
    
    // Test 5: Create chatbot (authenticated)
    const createChatbotTest = await runPerformanceTest(
      'create-chatbot',
      `${BASE_URL}/api/${API_VERSION}/chatbots`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Performance Test Bot ${Date.now()}`,
          description: 'Created during performance testing',
          type: 'customer-support'
        })
      }
    );
    results.push(createChatbotTest);
    allPassed = allPassed && createChatbotTest.passed;
  } else {
    console.log('Skipping authenticated tests due to missing auth token');
  }
  
  // Test 6: Simulate chat messages
  const chatTest = await runPerformanceTest(
    'chat-messages',
    `${BASE_URL}/api/${API_VERSION}/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hello, how can you help me?',
        chatbotId: 'performance-test'
      })
    }
  );
  results.push(chatTest);
  allPassed = allPassed && chatTest.passed;
  
  // Summary
  console.log('\n===================================');
  console.log('Performance Test Summary');
  console.log('===================================');
  
  results.forEach(result => {
    console.log(`${result.name}: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  });
  
  console.log('\nOverall result:', allPassed ? '✅ PASSED' : '❌ FAILED');
  
  // Save summary to file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const summaryFile = path.join(RESULTS_DIR, `summary-${timestamp}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    duration: DURATION,
    thresholds: THRESHOLDS,
    results: results.map(r => ({
      name: r.name,
      passed: r.passed,
      latency: r.results.latency,
      throughput: r.results.requests.average,
      errorRate: r.results.errors / r.results.requests.total
    })),
    allPassed
  }, null, 2));
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(error => {
  console.error('Error running performance tests:', error);
  process.exit(1);
});
