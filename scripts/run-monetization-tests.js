/**
 * Run Monetization Tests
 * 
 * Script to run unit tests for monetization features (billing and analytics)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_DIRS = [
  'tests/unit/billing',
  'tests/unit/analytics'
];

const REPORT_DIR = path.join(__dirname, '..', 'test-results', 'monetization');
const REPORT_FILE = path.join(REPORT_DIR, 'test-report.json');
const SUMMARY_FILE = path.join(REPORT_DIR, 'test-summary.txt');

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
 * Run Jest tests for specified directories
 * @param {Array<string>} testDirs - Test directories
 * @returns {Promise<Object>} Test results
 */
const runTests = async (testDirs) => {
  return new Promise((resolve, reject) => {
    // Ensure report directory exists
    ensureDirectoryExists(REPORT_DIR);
    
    // Build Jest command
    const jestArgs = [
      '--json',
      '--outputFile', REPORT_FILE,
      '--coverage',
      '--coverageDirectory', path.join(REPORT_DIR, 'coverage'),
      ...testDirs
    ];
    
    console.log(`Running tests with command: jest ${jestArgs.join(' ')}`);
    
    // Run Jest
    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      shell: true
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        try {
          const reportData = fs.readFileSync(REPORT_FILE, 'utf8');
          const results = JSON.parse(reportData);
          resolve(results);
        } catch (error) {
          reject(new Error(`Failed to read test report: ${error.message}`));
        }
      } else {
        reject(new Error(`Jest exited with code ${code}`));
      }
    });
    
    jest.on('error', (error) => {
      reject(new Error(`Failed to run Jest: ${error.message}`));
    });
  });
};

/**
 * Generate test summary
 * @param {Object} results - Test results
 * @returns {string} Summary text
 */
const generateSummary = (results) => {
  const { numTotalTests, numPassedTests, numFailedTests, numPendingTests } = results;
  const passRate = (numPassedTests / numTotalTests * 100).toFixed(2);
  
  let summary = `
=================================================
MONETIZATION FEATURES TEST SUMMARY
=================================================
Date: ${new Date().toISOString()}

Total Tests: ${numTotalTests}
Passed Tests: ${numPassedTests}
Failed Tests: ${numFailedTests}
Pending Tests: ${numPendingTests}
Pass Rate: ${passRate}%
=================================================
`;

  // Add test suite details
  summary += '\nTEST SUITE DETAILS\n';
  summary += '=================================================\n';
  
  results.testResults.forEach((suite) => {
    const suiteName = suite.name.replace(process.cwd(), '');
    const suiteStatus = suite.status;
    const suiteTime = (suite.perfStats.end - suite.perfStats.start) / 1000;
    
    summary += `\n${suiteName}\n`;
    summary += `Status: ${suiteStatus}\n`;
    summary += `Time: ${suiteTime.toFixed(2)}s\n`;
    
    // Add test case details
    suite.assertionResults.forEach((test) => {
      const testStatus = test.status === 'passed' ? '✓' : '✗';
      summary += `  ${testStatus} ${test.title}\n`;
      
      // Add failure details
      if (test.status === 'failed') {
        summary += `    Error: ${test.failureMessages.join('\n    ')}\n`;
      }
    });
    
    summary += '-------------------------\n';
  });
  
  return summary;
};

/**
 * Main function
 */
const main = async () => {
  try {
    console.log('Starting monetization feature tests...');
    
    // Run tests
    const results = await runTests(TEST_DIRS);
    
    // Generate and save summary
    const summary = generateSummary(results);
    fs.writeFileSync(SUMMARY_FILE, summary);
    
    console.log(`\nTests completed. Summary saved to ${SUMMARY_FILE}`);
    console.log(`Detailed report saved to ${REPORT_FILE}`);
    
    // Print summary to console
    console.log(summary);
    
    // Exit with appropriate code
    process.exit(results.numFailedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error(`Error running tests: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main();
