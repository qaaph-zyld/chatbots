/**
 * Security Tests
 * 
 * These tests verify the security of the application after deployment.
 * They are run as part of the deployment verification process
 * to ensure the application meets security requirements before switching traffic.
 */

const axios = require('axios');
const { expect } = require('chai');
const fs = require('fs');
const path = require('path');

// Get the base URL from environment or use default
const BASE_URL = process.env.TEST_URL || 'https://chatbot-platform.example.com';
const API_VERSION = 'v1';

// Test credentials
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

// Results directory
const RESULTS_DIR = path.join(__dirname, '../../test-results/security');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Helper function to get auth token
async function getAuthToken() {
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

// Helper function to check security headers
async function checkSecurityHeaders(url) {
  try {
    const response = await axios.get(url, { validateStatus: () => true });
    const headers = response.headers;
    
    const results = {
      url,
      status: response.status,
      headers: {
        'X-Content-Type-Options': headers['x-content-type-options'] === 'nosniff',
        'X-Frame-Options': !!headers['x-frame-options'],
        'X-XSS-Protection': !!headers['x-xss-protection'],
        'Content-Security-Policy': !!headers['content-security-policy'],
        'Strict-Transport-Security': !!headers['strict-transport-security'],
        'Referrer-Policy': !!headers['referrer-policy'],
        'Permissions-Policy': !!headers['permissions-policy'] || !!headers['feature-policy']
      }
    };
    
    return results;
  } catch (error) {
    console.error(`Error checking security headers for ${url}:`, error.message);
    return {
      url,
      error: error.message
    };
  }
}

// Helper function to test for common vulnerabilities
async function testVulnerabilities() {
  const results = {
    xss: [],
    sqli: [],
    csrf: [],
    openRedirect: [],
    rateLimit: []
  };
  
  // XSS test payloads
  const xssPayloads = [
    '<script>alert(1)</script>',
    '"><script>alert(1)</script>',
    '\'><script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    'javascript:alert(1)'
  ];
  
  // SQL injection test payloads
  const sqliPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "1; DROP TABLE users; --",
    "' UNION SELECT username, password FROM users; --"
  ];
  
  // Open redirect test payloads
  const redirectPayloads = [
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    'javascript:alert(document.domain)'
  ];
  
  // Get auth token for authenticated tests
  const authToken = await getAuthToken();
  
  // Test XSS vulnerabilities
  for (const payload of xssPayloads) {
    try {
      // Test in query parameters
      const response = await axios.get(`${BASE_URL}/api/${API_VERSION}/search?q=${encodeURIComponent(payload)}`, {
        validateStatus: () => true,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      
      results.xss.push({
        payload,
        context: 'query',
        status: response.status,
        reflected: response.data.includes(payload)
      });
      
      // Test in body parameters
      const bodyResponse = await axios.post(
        `${BASE_URL}/api/${API_VERSION}/chat`,
        { message: payload },
        {
          validateStatus: () => true,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        }
      );
      
      results.xss.push({
        payload,
        context: 'body',
        status: bodyResponse.status,
        reflected: typeof bodyResponse.data === 'string' && bodyResponse.data.includes(payload)
      });
    } catch (error) {
      console.error(`Error testing XSS with payload ${payload}:`, error.message);
    }
  }
  
  // Test SQL injection vulnerabilities
  for (const payload of sqliPayloads) {
    try {
      // Test in query parameters
      const response = await axios.get(`${BASE_URL}/api/${API_VERSION}/chatbots?filter=${encodeURIComponent(payload)}`, {
        validateStatus: () => true,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      
      results.sqli.push({
        payload,
        context: 'query',
        status: response.status,
        suspicious: response.status === 500 || (response.data && response.data.length > 10)
      });
      
      // Test in body parameters
      const bodyResponse = await axios.post(
        `${BASE_URL}/api/${API_VERSION}/auth/login`,
        { email: TEST_USER_EMAIL, password: payload },
        { validateStatus: () => true }
      );
      
      results.sqli.push({
        payload,
        context: 'body',
        status: bodyResponse.status,
        suspicious: bodyResponse.status === 500
      });
    } catch (error) {
      console.error(`Error testing SQL injection with payload ${payload}:`, error.message);
    }
  }
  
  // Test CSRF protection
  if (authToken) {
    try {
      // First make a legitimate request to get CSRF token if any
      const getResponse = await axios.get(`${BASE_URL}/api/${API_VERSION}/users/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      const csrfToken = getResponse.headers['x-csrf-token'] || '';
      
      // Try to make a state-changing request without CSRF token
      const noCsrfResponse = await axios.post(
        `${BASE_URL}/api/${API_VERSION}/users/profile`,
        { name: 'CSRF Test' },
        {
          validateStatus: () => true,
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      // Try with incorrect CSRF token
      const wrongCsrfResponse = await axios.post(
        `${BASE_URL}/api/${API_VERSION}/users/profile`,
        { name: 'CSRF Test' },
        {
          validateStatus: () => true,
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'X-CSRF-Token': 'wrong-token'
          }
        }
      );
      
      // Try with correct CSRF token if available
      const correctCsrfResponse = csrfToken ? await axios.post(
        `${BASE_URL}/api/${API_VERSION}/users/profile`,
        { name: 'CSRF Test' },
        {
          validateStatus: () => true,
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'X-CSRF-Token': csrfToken
          }
        }
      ) : { status: 'N/A' };
      
      results.csrf.push({
        noCsrfStatus: noCsrfResponse.status,
        wrongCsrfStatus: wrongCsrfResponse.status,
        correctCsrfStatus: correctCsrfResponse.status,
        csrfProtectionPresent: noCsrfResponse.status === 403 || wrongCsrfResponse.status === 403
      });
    } catch (error) {
      console.error('Error testing CSRF protection:', error.message);
    }
  }
  
  // Test open redirect vulnerabilities
  for (const payload of redirectPayloads) {
    try {
      const response = await axios.get(`${BASE_URL}/redirect?url=${encodeURIComponent(payload)}`, {
        validateStatus: () => true,
        maxRedirects: 0
      });
      
      results.openRedirect.push({
        payload,
        status: response.status,
        location: response.headers.location,
        vulnerable: response.headers.location && response.headers.location.includes('evil.com')
      });
    } catch (error) {
      if (error.response && error.response.headers.location) {
        results.openRedirect.push({
          payload,
          status: error.response.status,
          location: error.response.headers.location,
          vulnerable: error.response.headers.location.includes('evil.com')
        });
      } else {
        console.error(`Error testing open redirect with payload ${payload}:`, error.message);
      }
    }
  }
  
  // Test rate limiting
  try {
    const requests = [];
    for (let i = 0; i < 20; i++) {
      requests.push(axios.post(
        `${BASE_URL}/api/${API_VERSION}/auth/login`,
        { email: `test${i}@example.com`, password: 'wrong-password' },
        { validateStatus: () => true }
      ));
    }
    
    const responses = await Promise.all(requests);
    const statusCodes = responses.map(r => r.status);
    const rateLimited = statusCodes.some(status => status === 429);
    
    results.rateLimit.push({
      endpoint: '/api/v1/auth/login',
      requests: 20,
      statusCodes,
      rateLimited
    });
  } catch (error) {
    console.error('Error testing rate limiting:', error.message);
  }
  
  return results;
}

// Main function
async function main() {
  console.log('Starting security tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('-----------------------------------');
  
  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    securityHeaders: {},
    vulnerabilities: {}
  };
  
  // Check security headers
  console.log('Checking security headers...');
  results.securityHeaders = {
    main: await checkSecurityHeaders(BASE_URL),
    api: await checkSecurityHeaders(`${BASE_URL}/api/${API_VERSION}/health`),
    static: await checkSecurityHeaders(`${BASE_URL}/static/css/main.css`)
  };
  
  // Test for vulnerabilities
  console.log('Testing for vulnerabilities...');
  results.vulnerabilities = await testVulnerabilities();
  
  // Analyze results
  const headerIssues = [];
  const vulnerabilityIssues = [];
  
  // Check header results
  Object.entries(results.securityHeaders).forEach(([page, result]) => {
    if (result.error) {
      headerIssues.push(`Failed to check headers for ${page}: ${result.error}`);
      return;
    }
    
    Object.entries(result.headers).forEach(([header, present]) => {
      if (!present) {
        headerIssues.push(`Missing security header ${header} on ${page}`);
      }
    });
  });
  
  // Check vulnerability results
  const xssVulnerable = results.vulnerabilities.xss.some(test => test.reflected);
  const sqliSuspicious = results.vulnerabilities.sqli.some(test => test.suspicious);
  const csrfVulnerable = results.vulnerabilities.csrf.some(test => !test.csrfProtectionPresent);
  const openRedirectVulnerable = results.vulnerabilities.openRedirect.some(test => test.vulnerable);
  const rateLimitMissing = results.vulnerabilities.rateLimit.some(test => !test.rateLimited);
  
  if (xssVulnerable) vulnerabilityIssues.push('Potential XSS vulnerability detected');
  if (sqliSuspicious) vulnerabilityIssues.push('Potential SQL injection vulnerability detected');
  if (csrfVulnerable) vulnerabilityIssues.push('CSRF protection may be missing');
  if (openRedirectVulnerable) vulnerabilityIssues.push('Open redirect vulnerability detected');
  if (rateLimitMissing) vulnerabilityIssues.push('Rate limiting may be insufficient');
  
  // Summary
  console.log('\n===================================');
  console.log('Security Test Summary');
  console.log('===================================');
  
  if (headerIssues.length === 0) {
    console.log('✅ All security headers are properly configured');
  } else {
    console.log('❌ Security header issues:');
    headerIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  if (vulnerabilityIssues.length === 0) {
    console.log('✅ No obvious vulnerabilities detected');
  } else {
    console.log('❌ Potential vulnerabilities:');
    vulnerabilityIssues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  const passed = headerIssues.length === 0 && vulnerabilityIssues.length === 0;
  console.log('\nOverall result:', passed ? '✅ PASSED' : '❌ FAILED');
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultsFile = path.join(RESULTS_DIR, `security-test-results-${timestamp}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify({
    ...results,
    summary: {
      headerIssues,
      vulnerabilityIssues,
      passed
    }
  }, null, 2));
  
  // Exit with appropriate code
  process.exit(passed ? 0 : 1);
}

// Run the tests
main().catch(error => {
  console.error('Error running security tests:', error);
  process.exit(1);
});
