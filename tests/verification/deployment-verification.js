/**
 * Deployment Verification Tests
 * 
 * These tests verify that a deployment is functioning correctly
 * by checking critical endpoints and functionality.
 */

const axios = require('axios');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const REPORT_DIR = path.join(__dirname, '../../reports/verification');
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'verification-test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'VerificationTest123!'
};

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Initialize report
const report = {
  timestamp: new Date().toISOString(),
  environment: process.env.DEPLOYMENT_ENVIRONMENT || 'unknown',
  version: process.env.DEPLOYMENT_SHA || 'unknown',
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }
};

/**
 * Run a test and record the result
 */
async function runTest(name, testFn) {
  const testResult = {
    name,
    status: 'running',
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 0,
    error: null
  };
  
  report.summary.total++;
  
  try {
    console.log(`Running test: ${name}`);
    const startTime = Date.now();
    await testFn();
    const endTime = Date.now();
    
    testResult.status = 'passed';
    testResult.duration = endTime - startTime;
    report.summary.passed++;
    console.log(`✅ Test passed: ${name} (${testResult.duration}ms)`);
  } catch (error) {
    testResult.status = 'failed';
    testResult.error = {
      message: error.message,
      stack: error.stack
    };
    report.summary.failed++;
    console.error(`❌ Test failed: ${name}`);
    console.error(`   Error: ${error.message}`);
  } finally {
    testResult.endTime = new Date().toISOString();
    report.tests.push(testResult);
  }
}

/**
 * Save the test report
 */
function saveReport() {
  const reportPath = path.join(REPORT_DIR, `verification-${report.timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to ${reportPath}`);
  
  // Generate HTML report
  const htmlReportPath = path.join(REPORT_DIR, `verification-${report.timestamp}.html`);
  const htmlContent = generateHtmlReport(report);
  fs.writeFileSync(htmlReportPath, htmlContent);
  console.log(`HTML report saved to ${htmlReportPath}`);
  
  return report;
}

/**
 * Generate HTML report
 */
function generateHtmlReport(report) {
  const passedTests = report.tests.filter(test => test.status === 'passed').length;
  const failedTests = report.tests.filter(test => test.status === 'failed').length;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Deployment Verification Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: flex; margin-bottom: 20px; }
        .summary-item { margin-right: 20px; padding: 10px; border-radius: 5px; min-width: 100px; text-align: center; }
        .passed { background-color: #d4edda; color: #155724; }
        .failed { background-color: #f8d7da; color: #721c24; }
        .test-item { margin-bottom: 10px; padding: 10px; border-radius: 5px; }
        .test-passed { background-color: #d4edda; }
        .test-failed { background-color: #f8d7da; }
        .error-details { background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px; white-space: pre-wrap; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Deployment Verification Report</h1>
        <p><strong>Environment:</strong> ${report.environment}</p>
        <p><strong>Version:</strong> ${report.version}</p>
        <p><strong>Timestamp:</strong> ${report.timestamp}</p>
      </div>
      
      <div class="summary">
        <div class="summary-item passed">
          <h2>${passedTests}</h2>
          <p>Passed</p>
        </div>
        <div class="summary-item failed">
          <h2>${failedTests}</h2>
          <p>Failed</p>
        </div>
        <div class="summary-item">
          <h2>${report.summary.total}</h2>
          <p>Total</p>
        </div>
      </div>
      
      <h2>Test Results</h2>
      ${report.tests.map(test => `
        <div class="test-item ${test.status === 'passed' ? 'test-passed' : 'test-failed'}">
          <h3>${test.name}</h3>
          <p><strong>Status:</strong> ${test.status}</p>
          <p><strong>Duration:</strong> ${test.duration}ms</p>
          ${test.error ? `
            <div class="error-details">
              <p><strong>Error:</strong> ${test.error.message}</p>
              <pre>${test.error.stack}</pre>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </body>
    </html>
  `;
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log(`Starting deployment verification tests against ${BASE_URL}`);
  console.log(`Environment: ${report.environment}`);
  console.log(`Version: ${report.version}`);
  console.log('-------------------------------------------');
  
  // API Health Check
  await runTest('API Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status !== 200 || response.data.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(response.data)}`);
    }
  });
  
  // API Component Health Checks
  await runTest('Database Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/health/database`);
    if (response.status !== 200 || response.data.status !== 'ok') {
      throw new Error(`Database health check failed: ${JSON.stringify(response.data)}`);
    }
  });
  
  await runTest('Cache Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/health/cache`);
    if (response.status !== 200 || response.data.status !== 'ok') {
      throw new Error(`Cache health check failed: ${JSON.stringify(response.data)}`);
    }
  });
  
  // API Functionality Tests
  await runTest('Authentication API', async () => {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (response.status !== 200 || !response.data.token) {
      throw new Error('Authentication failed');
    }
    
    // Store token for subsequent tests
    process.env.AUTH_TOKEN = response.data.token;
  });
  
  await runTest('User Profile API', async () => {
    const response = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${process.env.AUTH_TOKEN}` }
    });
    
    if (response.status !== 200 || !response.data.user) {
      throw new Error('Failed to retrieve user profile');
    }
  });
  
  await runTest('Chatbot List API', async () => {
    const response = await axios.get(`${BASE_URL}/api/chatbots`, {
      headers: { Authorization: `Bearer ${process.env.AUTH_TOKEN}` }
    });
    
    if (response.status !== 200 || !Array.isArray(response.data.chatbots)) {
      throw new Error('Failed to retrieve chatbot list');
    }
  });
  
  // UI Tests
  let browser;
  try {
    browser = await chromium.launch();
    
    await runTest('UI - Login Page', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/login`);
      
      // Check for login form
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const loginButton = await page.$('button[type="submit"]');
      
      if (!emailInput || !passwordInput || !loginButton) {
        throw new Error('Login form elements not found');
      }
      
      await page.close();
    });
    
    await runTest('UI - Registration Page', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/register`);
      
      // Check for registration form
      const emailInput = await page.$('input[type="email"]');
      const passwordInput = await page.$('input[type="password"]');
      const registerButton = await page.$('button[type="submit"]');
      
      if (!emailInput || !passwordInput || !registerButton) {
        throw new Error('Registration form elements not found');
      }
      
      await page.close();
    });
    
    await runTest('UI - User Login', async () => {
      const page = await browser.newPage();
      await page.goto(`${BASE_URL}/login`);
      
      // Login
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Check for successful login (redirect to dashboard)
      await page.waitForNavigation();
      const url = page.url();
      if (!url.includes('/dashboard')) {
        throw new Error(`Login failed, redirected to ${url}`);
      }
      
      await page.close();
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Save and return report
  const finalReport = saveReport();
  
  // Exit with appropriate code
  if (finalReport.summary.failed > 0) {
    console.error(`❌ Verification failed: ${finalReport.summary.failed} tests failed`);
    process.exit(1);
  } else {
    console.log(`✅ Verification passed: All ${finalReport.summary.passed} tests passed`);
    process.exit(0);
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  runVerification().catch(error => {
    console.error('Verification error:', error);
    process.exit(1);
  });
}

module.exports = { runVerification };
