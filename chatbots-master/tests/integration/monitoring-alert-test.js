/**
 * Monitoring and Alert System Integration Test
 * 
 * This script tests the monitoring and alerting system by:
 * 1. Checking system health
 * 2. Retrieving metrics
 * 3. Creating a test alert
 * 4. Acknowledging and resolving the alert
 */

const axios = require('axios');
const assert = require('assert');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_USER = 'test-user';

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

/**
 * Run a test case
 * @param {string} name - Test name
 * @param {Function} testFn - Test function
 */
async function runTest(name, testFn) {
  results.total++;
  console.log(`\n🧪 Running test: ${name}`);
  try {
    await testFn();
    console.log(`✅ Test passed: ${name}`);
    results.passed++;
  } catch (error) {
    console.error(`❌ Test failed: ${name}`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    results.failed++;
  }
}

/**
 * Test system health
 */
async function testSystemHealth() {
  const response = await axios.get(`${API_BASE_URL}/health`);
  assert.strictEqual(response.status, 200);
  assert.ok(response.data.status === 'healthy' || response.data.status === 'unhealthy');
  assert.ok(response.data.components);
  assert.ok(response.data.components.database);
  assert.ok(response.data.components.cache);
  assert.ok(response.data.components.externalServices);
  assert.ok(response.data.components.systemResources);
  console.log(`   System status: ${response.data.status}`);
}

/**
 * Test component health
 */
async function testComponentHealth() {
  const components = ['database', 'cache', 'external-services', 'system-resources'];
  
  for (const component of components) {
    const response = await axios.get(`${API_BASE_URL}/health/components/${component}`);
    assert.ok(response.status === 200 || response.status === 503);
    console.log(`   ${component} status: ${response.data.status || response.data.services?.[0]?.status}`);
  }
}

/**
 * Test metrics retrieval
 */
async function testMetricsRetrieval() {
  const response = await axios.get(`${API_BASE_URL}/api/monitoring/metrics`, {
    params: {
      limit: 10
    }
  });
  assert.strictEqual(response.status, 200);
  assert.ok(Array.isArray(response.data.data));
  console.log(`   Retrieved ${response.data.data.length} metrics`);
}

/**
 * Test metrics aggregation
 */
async function testMetricsAggregation() {
  const response = await axios.get(`${API_BASE_URL}/api/monitoring/metrics/aggregated`, {
    params: {
      interval: 'hour'
    }
  });
  assert.strictEqual(response.status, 200);
  assert.ok(Array.isArray(response.data.data));
  console.log(`   Retrieved ${response.data.data.length} aggregated metrics`);
}

/**
 * Test health overview
 */
async function testHealthOverview() {
  const response = await axios.get(`${API_BASE_URL}/api/monitoring/overview`);
  assert.strictEqual(response.status, 200);
  assert.ok(response.data.overview);
  assert.ok(response.data.overview.database);
  assert.ok(response.data.overview.cache);
  console.log(`   Retrieved health overview`);
}

/**
 * Test alert creation
 */
async function testAlertCreation() {
  const alertData = {
    level: 'info',
    source: 'integration-test',
    message: 'Test alert from integration test',
    details: {
      test: true,
      timestamp: new Date().toISOString()
    }
  };
  
  const response = await axios.post(`${API_BASE_URL}/api/alerts`, alertData);
  assert.strictEqual(response.status, 201);
  assert.ok(response.data.data._id);
  console.log(`   Created alert with ID: ${response.data.data._id}`);
  
  return response.data.data._id;
}

/**
 * Test alert retrieval
 */
async function testAlertRetrieval() {
  const response = await axios.get(`${API_BASE_URL}/api/alerts`, {
    params: {
      limit: 10,
      source: 'integration-test'
    }
  });
  assert.strictEqual(response.status, 200);
  assert.ok(Array.isArray(response.data.data));
  assert.ok(response.data.data.length > 0);
  console.log(`   Retrieved ${response.data.data.length} alerts`);
}

/**
 * Test alert acknowledgement
 */
async function testAlertAcknowledgement(alertId) {
  const response = await axios.put(`${API_BASE_URL}/api/alerts/${alertId}/acknowledge`, {
    acknowledgedBy: TEST_USER
  });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.data.acknowledged, true);
  assert.strictEqual(response.data.data.acknowledgedBy, TEST_USER);
  console.log(`   Acknowledged alert with ID: ${alertId}`);
}

/**
 * Test alert resolution
 */
async function testAlertResolution(alertId) {
  const response = await axios.put(`${API_BASE_URL}/api/alerts/${alertId}/resolve`);
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.data.resolved, true);
  console.log(`   Resolved alert with ID: ${alertId}`);
}

/**
 * Test alert statistics
 */
async function testAlertStatistics() {
  const response = await axios.get(`${API_BASE_URL}/api/alerts/stats`);
  assert.strictEqual(response.status, 200);
  assert.ok(response.data.stats);
  assert.ok(typeof response.data.stats.total === 'number');
  console.log(`   Retrieved alert statistics: ${response.data.stats.total} total alerts`);
}

/**
 * Test metrics collection
 */
async function testMetricsCollection() {
  const response = await axios.post(`${API_BASE_URL}/api/monitoring/collect`);
  assert.strictEqual(response.status, 200);
  assert.ok(Array.isArray(response.data.data));
  console.log(`   Collected ${response.data.data.length} metrics`);
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Monitoring and Alert System Integration Test');
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  
  await runTest('System Health', testSystemHealth);
  await runTest('Component Health', testComponentHealth);
  await runTest('Metrics Retrieval', testMetricsRetrieval);
  await runTest('Metrics Aggregation', testMetricsAggregation);
  await runTest('Health Overview', testHealthOverview);
  
  // Create, acknowledge, and resolve an alert
  let alertId;
  await runTest('Alert Creation', async () => {
    alertId = await testAlertCreation();
  });
  
  await runTest('Alert Retrieval', testAlertRetrieval);
  
  if (alertId) {
    await runTest('Alert Acknowledgement', async () => {
      await testAlertAcknowledgement(alertId);
    });
    
    await runTest('Alert Resolution', async () => {
      await testAlertResolution(alertId);
    });
  }
  
  await runTest('Alert Statistics', testAlertStatistics);
  await runTest('Metrics Collection', testMetricsCollection);
  
  // Print results
  console.log('\n📊 Test Results:');
  console.log(`   Total: ${results.total}`);
  console.log(`   Passed: ${results.passed}`);
  console.log(`   Failed: ${results.failed}`);
  
  if (results.failed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
