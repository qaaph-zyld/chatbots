/**
 * End-to-End Integration Test for Monitoring and Alert System
 * 
 * This test covers the integration between monitoring and alerting systems:
 * 1. Metric threshold triggering alerts
 * 2. Notification delivery verification
 * 3. Dashboard visualization of metrics and alerts
 * 4. Multi-tenant isolation for monitoring data
 */

const { chromium } = require('playwright');
const axios = require('axios');
const assert = require('assert');
const sinon = require('sinon');
const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const config = require('../../src/core/config');
const monitoringService = require('../../src/services/monitoring.service');
const alertService = require('../../src/services/alert.service');
const User = require('../../src/auth/models/user.model');
const Tenant = require('../../src/tenancy/models/tenant.model');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'AdminPassword123!'
};

// Test tenants
const TEST_TENANTS = [
  {
    id: 'tenant1',
    name: 'Test Tenant 1',
    adminEmail: 'admin1@tenant1.com',
    adminPassword: 'Tenant1Pass!'
  },
  {
    id: 'tenant2',
    name: 'Test Tenant 2',
    adminEmail: 'admin2@tenant2.com',
    adminPassword: 'Tenant2Pass!'
  }
];

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

let browser;
let adminPage;
let tenant1Page;
let tenant2Page;
let emailSpy;
let slackSpy;
let webhookSpy;

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
 * Setup test environment
 */
async function setup() {
  // Launch browser
  browser = await chromium.launch({ headless: true });
  
  // Setup pages for each tenant
  adminPage = await browser.newPage();
  tenant1Page = await browser.newPage();
  tenant2Page = await browser.newPage();
  
  // Setup spies for notification channels
  emailSpy = sinon.spy(nodemailer, 'createTransport');
  slackSpy = sinon.spy(fetch, 'Promise');
  webhookSpy = sinon.spy(fetch, 'Promise');
  
  // Login as admin
  await adminPage.goto(`${API_BASE_URL}/login`);
  await adminPage.fill('input[name="email"]', ADMIN_USER.email);
  await adminPage.fill('input[name="password"]', ADMIN_USER.password);
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForNavigation();
  
  // Login as tenant 1 admin
  await tenant1Page.goto(`${API_BASE_URL}/login`);
  await tenant1Page.fill('input[name="email"]', TEST_TENANTS[0].adminEmail);
  await tenant1Page.fill('input[name="password"]', TEST_TENANTS[0].adminPassword);
  await tenant1Page.click('button[type="submit"]');
  await tenant1Page.waitForNavigation();
  
  // Login as tenant 2 admin
  await tenant2Page.goto(`${API_BASE_URL}/login`);
  await tenant2Page.fill('input[name="email"]', TEST_TENANTS[1].adminEmail);
  await tenant2Page.fill('input[name="password"]', TEST_TENANTS[1].adminPassword);
  await tenant2Page.click('button[type="submit"]');
  await tenant2Page.waitForNavigation();
}

/**
 * Teardown test environment
 */
async function teardown() {
  // Restore spies
  emailSpy.restore();
  slackSpy.restore();
  webhookSpy.restore();
  
  // Close browser
  await browser.close();
}

/**
 * Test metric threshold triggering alert
 */
async function testMetricThresholdAlert() {
  // Create a high CPU usage metric for tenant 1
  const metricData = {
    name: 'cpu_usage',
    value: 95, // High CPU usage
    timestamp: new Date().toISOString(),
    tenantId: TEST_TENANTS[0].id,
    metadata: {
      host: 'app-server-1',
      environment: 'production'
    }
  };
  
  // Submit the metric via API
  const response = await axios.post(
    `${API_BASE_URL}/api/monitoring/metrics`,
    metricData,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TEST_TENANTS[0].id
      }
    }
  );
  
  assert.strictEqual(response.status, 201);
  
  // Wait for alert to be generated (the monitoring service should detect the high CPU and create an alert)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check if an alert was created
  const alertsResponse = await axios.get(
    `${API_BASE_URL}/api/alerts?source=cpu_usage&resolved=false`,
    {
      headers: {
        'X-Tenant-ID': TEST_TENANTS[0].id
      }
    }
  );
  
  assert.strictEqual(alertsResponse.status, 200);
  assert.ok(alertsResponse.data.data.length > 0);
  
  // Verify the alert details
  const alert = alertsResponse.data.data[0];
  assert.strictEqual(alert.level, 'warning');
  assert.strictEqual(alert.source, 'cpu_usage');
  assert.ok(alert.message.includes('High CPU usage'));
  
  console.log(`   Alert created with ID: ${alert._id}`);
  
  return alert._id;
}

/**
 * Test notification delivery verification
 */
async function testNotificationDelivery(alertId) {
  // Verify email notification was sent
  assert.ok(emailSpy.called, 'Email notification should be sent');
  
  // If Slack is configured, verify Slack notification
  if (config.alerts && config.alerts.slack && config.alerts.slack.enabled) {
    assert.ok(slackSpy.called, 'Slack notification should be sent');
  }
  
  // If webhook is configured, verify webhook notification
  if (config.alerts && config.alerts.webhook && config.alerts.webhook.enabled) {
    assert.ok(webhookSpy.called, 'Webhook notification should be sent');
  }
  
  console.log('   Notifications were sent successfully');
}

/**
 * Test dashboard visualization
 */
async function testDashboardVisualization() {
  // Navigate to monitoring dashboard
  await adminPage.goto(`${API_BASE_URL}/admin/monitoring`);
  await adminPage.waitForSelector('.monitoring-dashboard');
  
  // Check if metrics are displayed
  const metricsVisible = await adminPage.isVisible('.metrics-chart');
  assert.ok(metricsVisible, 'Metrics chart should be visible');
  
  // Check if alerts are displayed
  const alertsVisible = await adminPage.isVisible('.alerts-list');
  assert.ok(alertsVisible, 'Alerts list should be visible');
  
  // Check if there's at least one alert in the list
  const alertCount = await adminPage.evaluate(() => {
    return document.querySelectorAll('.alert-item').length;
  });
  assert.ok(alertCount > 0, 'At least one alert should be displayed');
  
  console.log(`   Dashboard displays ${alertCount} alerts`);
}

/**
 * Test multi-tenant isolation
 */
async function testMultiTenantIsolation() {
  // Create a metric for tenant 2
  const metricData = {
    name: 'memory_usage',
    value: 85,
    timestamp: new Date().toISOString(),
    tenantId: TEST_TENANTS[1].id,
    metadata: {
      host: 'app-server-2',
      environment: 'production'
    }
  };
  
  // Submit the metric via API
  await axios.post(
    `${API_BASE_URL}/api/monitoring/metrics`,
    metricData,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TEST_TENANTS[1].id
      }
    }
  );
  
  // Create an alert for tenant 2
  const alertData = {
    level: 'warning',
    source: 'memory_usage',
    message: 'High memory usage detected',
    details: {
      value: 85,
      threshold: 80,
      host: 'app-server-2'
    }
  };
  
  await axios.post(
    `${API_BASE_URL}/api/alerts`,
    alertData,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': TEST_TENANTS[1].id
      }
    }
  );
  
  // Check tenant 1's alerts - should not see tenant 2's alert
  const tenant1Alerts = await axios.get(
    `${API_BASE_URL}/api/alerts`,
    {
      headers: {
        'X-Tenant-ID': TEST_TENANTS[0].id
      }
    }
  );
  
  // Verify tenant 1 doesn't see tenant 2's memory_usage alert
  const tenant1HasTenant2Alert = tenant1Alerts.data.data.some(alert => 
    alert.source === 'memory_usage' && 
    alert.message.includes('High memory usage')
  );
  
  assert.strictEqual(tenant1HasTenant2Alert, false, 'Tenant 1 should not see tenant 2\'s alerts');
  
  // Check tenant 2's alerts - should see their own alert but not tenant 1's
  const tenant2Alerts = await axios.get(
    `${API_BASE_URL}/api/alerts`,
    {
      headers: {
        'X-Tenant-ID': TEST_TENANTS[1].id
      }
    }
  );
  
  // Verify tenant 2 sees their own memory_usage alert
  const tenant2HasOwnAlert = tenant2Alerts.data.data.some(alert => 
    alert.source === 'memory_usage' && 
    alert.message.includes('High memory usage')
  );
  
  assert.strictEqual(tenant2HasOwnAlert, true, 'Tenant 2 should see their own alerts');
  
  // Verify tenant 2 doesn't see tenant 1's cpu_usage alert
  const tenant2HasTenant1Alert = tenant2Alerts.data.data.some(alert => 
    alert.source === 'cpu_usage' && 
    alert.message.includes('High CPU usage')
  );
  
  assert.strictEqual(tenant2HasTenant1Alert, false, 'Tenant 2 should not see tenant 1\'s alerts');
  
  // Check dashboard visualization for each tenant
  await tenant1Page.goto(`${API_BASE_URL}/admin/monitoring`);
  await tenant1Page.waitForSelector('.monitoring-dashboard');
  
  const tenant1AlertTypes = await tenant1Page.evaluate(() => {
    return Array.from(document.querySelectorAll('.alert-item .alert-source')).map(el => el.textContent);
  });
  
  await tenant2Page.goto(`${API_BASE_URL}/admin/monitoring`);
  await tenant2Page.waitForSelector('.monitoring-dashboard');
  
  const tenant2AlertTypes = await tenant2Page.evaluate(() => {
    return Array.from(document.querySelectorAll('.alert-item .alert-source')).map(el => el.textContent);
  });
  
  // Verify tenant dashboards show only their own alerts
  assert.ok(tenant1AlertTypes.some(type => type.includes('cpu_usage')), 'Tenant 1 dashboard should show CPU alerts');
  assert.ok(!tenant1AlertTypes.some(type => type.includes('memory_usage')), 'Tenant 1 dashboard should not show memory alerts');
  
  assert.ok(tenant2AlertTypes.some(type => type.includes('memory_usage')), 'Tenant 2 dashboard should show memory alerts');
  assert.ok(!tenant2AlertTypes.some(type => type.includes('cpu_usage')), 'Tenant 2 dashboard should not show CPU alerts');
  
  console.log('   Multi-tenant isolation verified successfully');
}

/**
 * Run all tests
 */
async function runAllTests() {
  try {
    console.log('🚀 Starting Monitoring and Alert Integration E2E Tests');
    
    await setup();
    
    // Test metric threshold triggering alert
    let alertId;
    await runTest('Metric threshold triggering alert', async () => {
      alertId = await testMetricThresholdAlert();
    });
    
    // Test notification delivery
    await runTest('Notification delivery verification', async () => {
      await testNotificationDelivery(alertId);
    });
    
    // Test dashboard visualization
    await runTest('Dashboard visualization', async () => {
      await testDashboardVisualization();
    });
    
    // Test multi-tenant isolation
    await runTest('Multi-tenant isolation', async () => {
      await testMultiTenantIsolation();
    });
    
    await teardown();
    
    // Print test summary
    console.log('\n📊 Test Summary:');
    console.log(`   Total: ${results.total}`);
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}`);
    
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
