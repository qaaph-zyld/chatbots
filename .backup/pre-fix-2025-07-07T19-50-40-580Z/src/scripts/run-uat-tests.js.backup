/**
 * Script to run User Acceptance Tests and generate a report
 * 
 * This script executes the UAT test suite using Playwright and generates
 * a comprehensive report of test results for stakeholder review.
 * 
 * Usage: node src/scripts/run-uat-tests.js [--browser=<browser>] [--project=<project>]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('@src/utils\logger');

// Parse command line arguments
const args = process.argv.slice(2);
const browserArg = args.find(arg => arg.startsWith('--browser='));
const projectArg = args.find(arg => arg.startsWith('--project='));

const browser = browserArg ? browserArg.split('=')[1] : 'chromium';
const project = projectArg ? projectArg.split('=')[1] : null;

// Output directories
const outputDir = path.join(__dirname, '../../uat-test-results');
const reportDir = path.join(__dirname, '../../reports/uat');

// Ensure directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

/**
 * Run UAT tests and generate report
 */
async function runUatTests() {
  try {
    logger.info('Starting UAT test execution');
    
    // Build the Playwright command
    let command = 'npx playwright test --config=playwright.uat.config.js';
    
    // Add browser if specified
    if (browser) {
      command += ` --project=${browser}`;
    }
    
    // Add project if specified
    if (project) {
      command += ` --grep="${project}"`;
    }
    
    // Execute the tests
    logger.info(`Executing command: ${command}`);
    execSync(command, { stdio: 'inherit' });
    
    // Generate summary report
    generateSummaryReport();
    
    logger.info('UAT tests completed successfully');
    logger.info(`HTML report available at: ${path.join(outputDir, 'html', 'index.html')}`);
    logger.info(`Summary report available at: ${path.join(reportDir, 'summary.md')}`);
    
    return {
      success: true,
      htmlReportPath: path.join(outputDir, 'html', 'index.html'),
      summaryReportPath: path.join(reportDir, 'summary.md')
    };
  } catch (error) {
    logger.error('Error running UAT tests', error);
    
    // Generate summary report even if tests fail
    generateSummaryReport();
    
    logger.info(`HTML report available at: ${path.join(outputDir, 'html', 'index.html')}`);
    logger.info(`Summary report available at: ${path.join(reportDir, 'summary.md')}`);
    
    throw error;
  }
}

/**
 * Generate a summary report from test results
 */
function generateSummaryReport() {
  try {
    logger.info('Generating UAT test summary report');
    
    // Read test results
    const resultsPath = path.join(outputDir, 'results.json');
    if (!fs.existsSync(resultsPath)) {
      logger.warn('Test results file not found, skipping summary report generation');
      return;
    }
    
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    
    // Calculate statistics
    const totalTests = results.suites.reduce((count, suite) => count + suite.specs.length, 0);
    const passedTests = results.suites.reduce((count, suite) => {
      return count + suite.specs.filter(spec => spec.tests.every(test => test.status === 'passed')).length;
    }, 0);
    const failedTests = totalTests - passedTests;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    // Group results by test suite
    const suiteResults = results.suites.map(suite => {
      const specsCount = suite.specs.length;
      const passedSpecs = suite.specs.filter(spec => spec.tests.every(test => test.status === 'passed')).length;
      const failedSpecs = specsCount - passedSpecs;
      
      return {
        name: suite.title,
        total: specsCount,
        passed: passedSpecs,
        failed: failedSpecs,
        passRate: specsCount > 0 ? Math.round((passedSpecs / specsCount) * 100) : 0
      };
    });
    
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    
    // Generate markdown report
    let report = `# UAT Test Summary Report\n\n`;
    report += `**Generated:** ${timestamp}\n\n`;
    report += `## Overall Results\n\n`;
    report += `- **Total Tests:** ${totalTests}\n`;
    report += `- **Passed:** ${passedTests}\n`;
    report += `- **Failed:** ${failedTests}\n`;
    report += `- **Pass Rate:** ${passRate}%\n\n`;
    
    report += `## Test Suite Results\n\n`;
    report += `| Suite | Total | Passed | Failed | Pass Rate |\n`;
    report += `|-------|-------|--------|--------|----------|\n`;
    
    suiteResults.forEach(suite => {
      report += `| ${suite.name} | ${suite.total} | ${suite.passed} | ${suite.failed} | ${suite.passRate}% |\n`;
    });
    
    report += `\n## Failed Tests\n\n`;
    
    let hasFailedTests = false;
    
    results.suites.forEach(suite => {
      const failedSpecs = suite.specs.filter(spec => spec.tests.some(test => test.status === 'failed'));
      
      if (failedSpecs.length > 0) {
        hasFailedTests = true;
        report += `### ${suite.title}\n\n`;
        
        failedSpecs.forEach(spec => {
          const failedTests = spec.tests.filter(test => test.status === 'failed');
          
          report += `#### ${spec.title}\n\n`;
          
          failedTests.forEach(test => {
            report += `- **Browser:** ${test.projectName}\n`;
            report += `- **Error:** ${test.error?.message || 'Unknown error'}\n\n`;
          });
        });
      }
    });
    
    if (!hasFailedTests) {
      report += `No failed tests! 🎉\n`;
    }
    
    report += `\n## Next Steps\n\n`;
    
    if (passRate < 100) {
      report += `1. Address failed tests\n`;
      report += `2. Re-run UAT tests to verify fixes\n`;
      report += `3. Continue with remaining UAT test scenarios\n`;
    } else {
      report += `1. Proceed with final UAT sign-off\n`;
      report += `2. Prepare for production deployment\n`;
      report += `3. Schedule release\n`;
    }
    
    // Write report to file
    const reportPath = path.join(reportDir, 'summary.md');
    fs.writeFileSync(reportPath, report);
    
    logger.info('UAT test summary report generated successfully');
  } catch (error) {
    logger.error('Error generating UAT test summary report', error);
    throw error;
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runUatTests()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('UAT test execution failed:', error);
      process.exit(1);
    });
} else {
  // Export for use in other scripts
  module.exports = runUatTests;
}
