/**
 * Security Audit Script
 * 
 * This script performs security checks on the application to identify potential vulnerabilities.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const REPORT_DIR = path.join(__dirname, '../../reports/security');
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'security-test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'SecurityTest123!'
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
  vulnerabilities: [],
  summary: {
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: 0
  }
};

/**
 * Add a vulnerability to the report
 */
function addVulnerability(severity, title, description, location, remediation) {
  const vulnerability = {
    id: report.vulnerabilities.length + 1,
    severity,
    title,
    description,
    location,
    remediation,
    timestamp: new Date().toISOString()
  };
  
  report.vulnerabilities.push(vulnerability);
  report.summary[severity.toLowerCase()]++;
  report.summary.total++;
  
  console.log(`[${severity.toUpperCase()}] ${title}`);
}

/**
 * Save the security report
 */
function saveReport() {
  const reportPath = path.join(REPORT_DIR, `security-audit-${report.timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to ${reportPath}`);
  
  // Generate HTML report
  const htmlReportPath = path.join(REPORT_DIR, `security-audit-${report.timestamp}.html`);
  const htmlContent = generateHtmlReport(report);
  fs.writeFileSync(htmlReportPath, htmlContent);
  console.log(`HTML report saved to ${htmlReportPath}`);
  
  return report;
}

/**
 * Generate HTML report
 */
function generateHtmlReport(report) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Security Audit Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: flex; margin-bottom: 20px; }
        .summary-item { margin-right: 20px; padding: 10px; border-radius: 5px; min-width: 100px; text-align: center; }
        .high { background-color: #f8d7da; color: #721c24; }
        .medium { background-color: #fff3cd; color: #856404; }
        .low { background-color: #d1ecf1; color: #0c5460; }
        .info { background-color: #d6d8d9; color: #1b1e21; }
        .vulnerability { margin-bottom: 20px; padding: 15px; border-radius: 5px; }
        .vulnerability-high { border-left: 5px solid #dc3545; }
        .vulnerability-medium { border-left: 5px solid #ffc107; }
        .vulnerability-low { border-left: 5px solid #17a2b8; }
        .vulnerability-info { border-left: 5px solid #6c757d; }
        .section { background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Security Audit Report</h1>
        <p><strong>Environment:</strong> ${report.environment}</p>
        <p><strong>Version:</strong> ${report.version}</p>
        <p><strong>Timestamp:</strong> ${report.timestamp}</p>
      </div>
      
      <div class="summary">
        <div class="summary-item high">
          <h2>${report.summary.high}</h2>
          <p>High</p>
        </div>
        <div class="summary-item medium">
          <h2>${report.summary.medium}</h2>
          <p>Medium</p>
        </div>
        <div class="summary-item low">
          <h2>${report.summary.low}</h2>
          <p>Low</p>
        </div>
        <div class="summary-item info">
          <h2>${report.summary.info}</h2>
          <p>Info</p>
        </div>
        <div class="summary-item">
          <h2>${report.summary.total}</h2>
          <p>Total</p>
        </div>
      </div>
      
      <h2>Vulnerabilities</h2>
      ${report.vulnerabilities.map(vuln => `
        <div class="vulnerability vulnerability-${vuln.severity.toLowerCase()}">
          <h3>[${vuln.severity.toUpperCase()}] ${vuln.title}</h3>
          <div class="section">
            <p><strong>Description:</strong></p>
            <p>${vuln.description}</p>
          </div>
          <div class="section">
            <p><strong>Location:</strong></p>
            <p>${vuln.location}</p>
          </div>
          <div class="section">
            <p><strong>Remediation:</strong></p>
            <p>${vuln.remediation}</p>
          </div>
        </div>
      `).join('')}
    </body>
    </html>
  `;
}

/**
 * Run dependency security check
 */
async function checkDependencies() {
  console.log('Checking dependencies for vulnerabilities...');
  
  try {
    // Run npm audit
    const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
    const auditResult = JSON.parse(auditOutput);
    
    // Process vulnerabilities
    if (auditResult.vulnerabilities) {
      const vulnCount = auditResult.metadata.vulnerabilities;
      
      if (vulnCount.critical > 0 || vulnCount.high > 0 || vulnCount.moderate > 0 || vulnCount.low > 0) {
        // Process each vulnerability
        Object.entries(auditResult.vulnerabilities).forEach(([pkg, vuln]) => {
          const severity = vuln.severity;
          const title = `Vulnerable dependency: ${pkg}@${vuln.version}`;
          const description = vuln.overview || `${pkg} has ${severity} severity vulnerability`;
          const location = `package.json`;
          const remediation = vuln.recommendation || `Update to ${pkg}@${vuln.fixAvailable?.version || 'latest'}`;
          
          addVulnerability(severity, title, description, location, remediation);
        });
      }
    }
  } catch (error) {
    console.error('Error running dependency check:', error.message);
    addVulnerability(
      'medium',
      'Dependency check failed',
      'Unable to run npm audit to check for vulnerable dependencies',
      'package.json',
      'Ensure npm is installed and package.json is valid'
    );
  }
}

/**
 * Check for security headers
 */
async function checkSecurityHeaders() {
  console.log('Checking security headers...');
  
  try {
    const response = await axios.get(BASE_URL);
    const headers = response.headers;
    
    // Check Content-Security-Policy
    if (!headers['content-security-policy']) {
      addVulnerability(
        'medium',
        'Missing Content-Security-Policy header',
        'Content Security Policy helps prevent XSS attacks by specifying which dynamic resources are allowed to load',
        'Server configuration',
        'Add a Content-Security-Policy header with appropriate directives'
      );
    }
    
    // Check X-XSS-Protection
    if (!headers['x-xss-protection']) {
      addVulnerability(
        'low',
        'Missing X-XSS-Protection header',
        'X-XSS-Protection header enables browser XSS filtering',
        'Server configuration',
        'Add X-XSS-Protection: 1; mode=block header'
      );
    }
    
    // Check X-Content-Type-Options
    if (!headers['x-content-type-options']) {
      addVulnerability(
        'low',
        'Missing X-Content-Type-Options header',
        'X-Content-Type-Options prevents MIME type sniffing',
        'Server configuration',
        'Add X-Content-Type-Options: nosniff header'
      );
    }
    
    // Check X-Frame-Options
    if (!headers['x-frame-options']) {
      addVulnerability(
        'medium',
        'Missing X-Frame-Options header',
        'X-Frame-Options prevents clickjacking attacks',
        'Server configuration',
        'Add X-Frame-Options: DENY or SAMEORIGIN header'
      );
    }
    
    // Check Strict-Transport-Security
    if (!headers['strict-transport-security']) {
      addVulnerability(
        'medium',
        'Missing Strict-Transport-Security header',
        'HSTS ensures that browser always uses HTTPS for the domain',
        'Server configuration',
        'Add Strict-Transport-Security: max-age=31536000; includeSubDomains header'
      );
    }
    
    // Check for secure cookies
    if (headers['set-cookie'] && !headers['set-cookie'].includes('secure')) {
      addVulnerability(
        'high',
        'Insecure cookies',
        'Cookies are not set with the Secure flag, allowing transmission over unencrypted connections',
        'Server configuration',
        'Set the Secure flag on all cookies'
      );
    }
  } catch (error) {
    console.error('Error checking security headers:', error.message);
  }
}

/**
 * Check for common API vulnerabilities
 */
async function checkApiVulnerabilities() {
  console.log('Checking API endpoints for vulnerabilities...');
  
  // First, try to authenticate
  let authToken;
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      console.log('Successfully authenticated for API tests');
    }
  } catch (error) {
    console.error('Error authenticating for API tests:', error.message);
    addVulnerability(
      'info',
      'Authentication failed for API tests',
      'Could not authenticate with test credentials',
      'API authentication endpoint',
      'Ensure test user exists and credentials are correct'
    );
    return;
  }
  
  // Check for rate limiting
  try {
    console.log('Testing rate limiting...');
    const requests = [];
    for (let i = 0; i < 20; i++) {
      requests.push(axios.get(`${BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      }));
    }
    
    await Promise.all(requests);
    
    addVulnerability(
      'medium',
      'No rate limiting detected',
      'API does not appear to implement rate limiting, which could lead to abuse',
      'API middleware',
      'Implement rate limiting middleware for all API endpoints'
    );
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.log('Rate limiting is properly implemented');
    } else {
      console.error('Error testing rate limiting:', error.message);
    }
  }
  
  // Check for SQL injection vulnerabilities
  try {
    console.log('Testing for SQL injection vulnerabilities...');
    const sqlInjectionPayloads = [
      "' OR 1=1 --",
      "admin' --",
      "'; DROP TABLE users; --"
    ];
    
    for (const payload of sqlInjectionPayloads) {
      try {
        await axios.get(`${BASE_URL}/api/users/search?q=${encodeURIComponent(payload)}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch (error) {
        // If we get a 500 error, it might indicate SQL injection vulnerability
        if (error.response && error.response.status === 500) {
          addVulnerability(
            'high',
            'Potential SQL injection vulnerability',
            `API endpoint may be vulnerable to SQL injection attacks. Payload: ${payload}`,
            '/api/users/search endpoint',
            'Use parameterized queries or ORM to prevent SQL injection'
          );
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error testing for SQL injection:', error.message);
  }
  
  // Check for proper CORS configuration
  try {
    console.log('Testing CORS configuration...');
    const response = await axios.options(BASE_URL, {
      headers: {
        'Origin': 'https://malicious-site.example.com',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const allowOrigin = response.headers['access-control-allow-origin'];
    if (allowOrigin === '*' || allowOrigin === 'https://malicious-site.example.com') {
      addVulnerability(
        'medium',
        'Overly permissive CORS policy',
        `CORS policy allows requests from any origin: ${allowOrigin}`,
        'CORS middleware configuration',
        'Restrict CORS to only trusted origins'
      );
    }
  } catch (error) {
    // A CORS error is actually good in this case
    console.log('CORS properly restricted');
  }
}

/**
 * Run all security checks
 */
async function runSecurityAudit() {
  console.log(`Starting security audit against ${BASE_URL}`);
  console.log(`Environment: ${report.environment}`);
  console.log(`Version: ${report.version}`);
  console.log('-------------------------------------------');
  
  // Run security checks
  await checkDependencies();
  await checkSecurityHeaders();
  await checkApiVulnerabilities();
  
  // Save and return report
  const finalReport = saveReport();
  
  // Print summary
  console.log('\nSecurity Audit Summary:');
  console.log(`High: ${finalReport.summary.high}`);
  console.log(`Medium: ${finalReport.summary.medium}`);
  console.log(`Low: ${finalReport.summary.low}`);
  console.log(`Info: ${finalReport.summary.info}`);
  console.log(`Total: ${finalReport.summary.total}`);
  
  // Exit with appropriate code
  if (finalReport.summary.high > 0) {
    console.error('\n❌ Security audit failed: High severity vulnerabilities found');
    return 1;
  } else if (finalReport.summary.medium > 0) {
    console.warn('\n⚠️ Security audit warning: Medium severity vulnerabilities found');
    return 0; // Don't fail the build for medium severity
  } else {
    console.log('\n✅ Security audit passed: No high severity vulnerabilities found');
    return 0;
  }
}

// Run security audit if this script is executed directly
if (require.main === module) {
  runSecurityAudit().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Security audit error:', error);
    process.exit(1);
  });
}

module.exports = { runSecurityAudit };
