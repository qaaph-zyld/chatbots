/**
 * Comprehensive Validation Suite for AI-Enhanced Test Automation Framework
 * 
 * This suite tests all major components of the framework to ensure they work
 * together seamlessly. It includes tests for:
 * - Core test execution
 * - Command parsing
 * - JSON output generation
 * - Analytics recording
 * - Error handling
 */

const path = require('path');
const fs = require('fs');
const { TestAutomationRunner } = require('../../auto-test-runner');

// Configuration
const TEST_OUTPUT_DIR = path.join(__dirname, '..', 'output');
const BASELINE_TESTS = './test-results/sample-tests/baseline.test.js';
const FAILING_TESTS = './test-results/sample-tests/failing.test.js';
const CONFIG_PATH = './test-results/baseline-jest.config.js';

// Ensure output directory exists
if (!fs.existsSync(TEST_OUTPUT_DIR)) {
  fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
}

// Generate timestamp for unique filenames
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');

// Test suite configuration
const validationTests = [
  {
    name: 'Baseline Tests (Should Pass)',
    testFile: BASELINE_TESTS,
    expectedExitCode: 0,
    expectJson: true,
    aiFixEnabled: false
  },
  {
    name: 'Failing Tests (Should Fail)',
    testFile: FAILING_TESTS,
    expectedExitCode: 1,
    expectJson: true,
    aiFixEnabled: false
  },
  {
    name: 'Failing Tests with AI Fix (Should Attempt Fix)',
    testFile: FAILING_TESTS,
    expectedExitCode: 1,
    expectJson: true,
    aiFixEnabled: true
  }
];

/**
 * Runs a validation test and reports results
 * @param {Object} test - Test configuration
 * @returns {Promise<Object>} - Test results
 */
async function runValidationTest(test) {
  console.log(`\n\n========== RUNNING: ${test.name} ==========`);
  
  // Create unique JSON output file path
  const jsonOutputFile = path.join(__dirname, '..', `validation-${test.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.json`);
  
  // Construct test command with relative paths
  const testCommand = `npx jest ${test.testFile} --config=${CONFIG_PATH} --json --outputFile="${jsonOutputFile}"`;
  
  console.log(`Test command: ${testCommand}`);
  console.log(`JSON output will be saved to: ${jsonOutputFile}`);
  
  // Initialize runner with test configuration
  const runner = new TestAutomationRunner({
    testCommand,
    outputDir: TEST_OUTPUT_DIR,
    maxRetries: 1,
    aiFixEnabled: test.aiFixEnabled
  });
  
  // Run the test
  console.log(`Starting test execution...`);
  const result = await runner.runTestsWithAutoFix();
  
  // Validate results
  const success = result.lastExitCode === test.expectedExitCode;
  const jsonExists = fs.existsSync(jsonOutputFile);
  
  console.log(`\nTest Results for ${test.name}:`);
  console.log(`- Exit Code: ${result.lastExitCode} (Expected: ${test.expectedExitCode}) - ${success ? 'PASS' : 'FAIL'}`);
  console.log(`- JSON Output Generated: ${jsonExists ? 'Yes' : 'No'} (Expected: ${test.expectJson ? 'Yes' : 'No'}) - ${jsonExists === test.expectJson ? 'PASS' : 'FAIL'}`);
  
  if (jsonExists) {
    try {
      const jsonContent = JSON.parse(fs.readFileSync(jsonOutputFile, 'utf8'));
      console.log(`- JSON Content Valid: Yes`);
      console.log(`- Test Summary: ${jsonContent.numPassedTests} passed, ${jsonContent.numFailedTests} failed`);
    } catch (err) {
      console.log(`- JSON Content Valid: No (Error: ${err.message})`);
    }
  }
  
  return {
    name: test.name,
    success,
    jsonExists,
    result
  };
}

/**
 * Main function to run all validation tests
 */
async function runComprehensiveValidation() {
  console.log('Starting Comprehensive Validation Suite...');
  console.log(`Timestamp: ${timestamp}`);
  
  const results = [];
  let overallSuccess = true;
  
  for (const test of validationTests) {
    try {
      const result = await runValidationTest(test);
      results.push(result);
      
      if (!result.success || (test.expectJson && !result.jsonExists)) {
        overallSuccess = false;
      }
    } catch (err) {
      console.error(`Error running test ${test.name}:`, err);
      results.push({
        name: test.name,
        success: false,
        error: err.message
      });
      overallSuccess = false;
    }
  }
  
  // Print overall summary
  console.log('\n\n========== VALIDATION SUMMARY ==========');
  results.forEach(result => {
    console.log(`${result.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
  });
  console.log(`\nOverall Validation: ${overallSuccess ? 'PASSED' : 'FAILED'}`);
  
  // Save results to file
  const summaryFile = path.join(__dirname, '..', `validation-summary-${timestamp}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify({
    timestamp,
    overallSuccess,
    tests: results
  }, null, 2));
  
  console.log(`\nDetailed results saved to: ${summaryFile}`);
  
  return {
    overallSuccess,
    results
  };
}

// Run the validation suite
runComprehensiveValidation()
  .then(({ overallSuccess }) => {
    process.exit(overallSuccess ? 0 : 1);
  })
  .catch(err => {
    console.error('Validation suite failed with error:', err);
    process.exit(1);
  });
