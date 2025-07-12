#!/usr/bin/env node

/**
 * Security Tests Runner
 * 
 * This script runs security tests to identify vulnerabilities in the codebase.
 * It checks for common security issues like XSS, CSRF, SQL injection, etc.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  reportsDir: './security-reports',
  testsDir: './src/tests/security',
  // Proxy configuration only used for local dependency installation if needed
  proxy: null
};

// Ensure reports directory exists
if (!fs.existsSync(config.reportsDir)) {
  fs.mkdirSync(config.reportsDir, { recursive: true });
}

// Set proxy environment variables if configured
if (config.proxy) {
  process.env.HTTP_PROXY = `http://${config.proxy.host}:${config.proxy.port}`;
  process.env.HTTPS_PROXY = `http://${config.proxy.host}:${config.proxy.port}`;
}

/**
 * Run a command and log output
 * 
 * @param {string} command - Command to run
 * @returns {string} Command output
 */
function runCommand(command) {
  console.log(`\n🔒 Running: ${command}\n`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    return output;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return error.stdout || '';
  }
}

/**
 * Run dependency vulnerability check
 */
function runDependencyCheck() {
  console.log('\n📦 Checking dependencies for vulnerabilities...');
  
  try {
    runCommand('npm audit --json > ' + path.join(config.reportsDir, 'npm-audit.json'));
    console.log('✅ Dependency check complete');
  } catch (error) {
    console.error('❌ Dependency check failed:', error.message);
  }
}

/**
 * Run static code analysis
 */
function runStaticAnalysis() {
  console.log('\n🔍 Running static code analysis...');
  
  try {
    // Run ESLint with security rules
    runCommand('npx eslint --no-eslintrc -c .eslintrc.security.js src/ -f json > ' + 
      path.join(config.reportsDir, 'eslint-security.json'));
    
    console.log('✅ Static analysis complete');
  } catch (error) {
    console.error('❌ Static analysis failed:', error.message);
  }
}

/**
 * Run security tests
 */
function runSecurityTests() {
  console.log('\n🧪 Running security tests...');
  
  try {
    // Run Jest security tests
    runCommand('npx jest --testPathPattern=src/tests/security --json > ' + 
      path.join(config.reportsDir, 'security-tests.json'));
    
    console.log('✅ Security tests complete');
  } catch (error) {
    console.error('❌ Security tests failed:', error.message);
  }
}

/**
 * Generate security report
 */
function generateReport() {
  console.log('\n📊 Generating security report...');
  
  const reportPath = path.join(config.reportsDir, 'security-report.md');
  
  let report = '# Security Test Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Add npm audit results if available
  const npmAuditPath = path.join(config.reportsDir, 'npm-audit.json');
  if (fs.existsSync(npmAuditPath)) {
    try {
      const auditData = JSON.parse(fs.readFileSync(npmAuditPath, 'utf8'));
      
      report += '## Dependency Vulnerabilities\n\n';
      
      if (auditData.vulnerabilities) {
        const vulnCount = Object.keys(auditData.vulnerabilities).length;
        
        if (vulnCount === 0) {
          report += '✅ No vulnerabilities found in dependencies\n\n';
        } else {
          report += `⚠️ Found ${vulnCount} vulnerable dependencies\n\n`;
          report += '| Package | Severity | Vulnerability | Recommendation |\n';
          report += '|---------|----------|---------------|----------------|\n';
          
          Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]) => {
            report += `| ${pkg} | ${vuln.severity} | ${vuln.title || 'N/A'} | ${vuln.recommendation || 'Update package'} |\n`;
          });
          
          report += '\n';
        }
      }
    } catch (error) {
      report += '## Dependency Vulnerabilities\n\n';
      report += '❌ Error parsing npm audit results\n\n';
    }
  }
  
  // Add static analysis results if available
  const staticAnalysisPath = path.join(config.reportsDir, 'eslint-security.json');
  if (fs.existsSync(staticAnalysisPath)) {
    try {
      const staticData = JSON.parse(fs.readFileSync(staticAnalysisPath, 'utf8'));
      
      report += '## Static Analysis\n\n';
      
      const issueCount = staticData.reduce((count, file) => count + file.messages.length, 0);
      
      if (issueCount === 0) {
        report += '✅ No security issues found in static analysis\n\n';
      } else {
        report += `⚠️ Found ${issueCount} potential security issues\n\n`;
        report += '| File | Line | Rule | Message |\n';
        report += '|------|------|------|--------|\n';
        
        staticData.forEach(file => {
          file.messages.forEach(msg => {
            report += `| ${file.filePath.replace(process.cwd(), '')} | ${msg.line} | ${msg.ruleId || 'N/A'} | ${msg.message} |\n`;
          });
        });
        
        report += '\n';
      }
    } catch (error) {
      report += '## Static Analysis\n\n';
      report += '❌ Error parsing static analysis results\n\n';
    }
  }
  
  // Add security test results if available
  const securityTestsPath = path.join(config.reportsDir, 'security-tests.json');
  if (fs.existsSync(securityTestsPath)) {
    try {
      const testData = JSON.parse(fs.readFileSync(securityTestsPath, 'utf8'));
      
      report += '## Security Tests\n\n';
      
      const failedTests = testData.testResults.reduce((count, suite) => {
        return count + suite.assertionResults.filter(test => test.status === 'failed').length;
      }, 0);
      
      if (failedTests === 0) {
        report += '✅ All security tests passed\n\n';
      } else {
        report += `❌ ${failedTests} security tests failed\n\n`;
        report += '| Test | Status | Message |\n';
        report += '|------|--------|--------|\n';
        
        testData.testResults.forEach(suite => {
          suite.assertionResults.forEach(test => {
            if (test.status === 'failed') {
              report += `| ${test.title} | ❌ Failed | ${test.failureMessages.join(' ')} |\n`;
            }
          });
        });
        
        report += '\n';
      }
    } catch (error) {
      report += '## Security Tests\n\n';
      report += '❌ Error parsing security test results\n\n';
    }
  }
  
  // Add recommendations
  report += '## Recommendations\n\n';
  report += '1. **Update vulnerable dependencies** - Run `npm audit fix` to automatically update vulnerable dependencies\n';
  report += '2. **Fix security issues** - Address the security issues identified in the static analysis\n';
  report += '3. **Implement missing security controls** - Add any missing security controls identified in the tests\n';
  report += '4. **Regular security testing** - Run security tests regularly as part of the CI/CD pipeline\n';
  
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Report saved to ${reportPath}`);
}

/**
 * Main function
 */
async function main() {
  console.log('🔒 Running Security Tests');
  console.log('=========================');
  
  // Run tests
  runDependencyCheck();
  runStaticAnalysis();
  runSecurityTests();
  
  // Generate report
  generateReport();
  
  console.log('\n✅ Security tests completed!');
}

// Run the script
main().catch(error => {
  console.error('Error running security tests:', error);
  process.exit(1);
});
