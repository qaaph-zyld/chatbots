/**
 * Baseline validation script to test JSON output generation
 */

const path = require('path');
const { TestAutomationRunner } = require('../auto-test-runner');

console.log('Starting baseline validation tests...');

// Create a timestamp for the JSON output file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const jsonOutputFile = path.join(__dirname, `jest-baseline-results-${timestamp}.json`);

// Configure the test runner with specific options for baseline validation
const runner = new TestAutomationRunner({
  // Use the fixed baseline Jest configuration
  testCommand: `npx jest test-results/sample-tests/baseline.test.js --config=test-results/baseline-jest.config.js --json --outputFile="${jsonOutputFile}"`,
  outputDir: path.join(__dirname, 'output'),
  maxRetries: 1,
  networkTimeoutMs: 60000,
  aiFixEnabled: false // Disable AI fixes for baseline validation
});

// Run the tests and log the results
async function runBaselineValidation() {
  try {
    console.log(`Test command: ${runner.testCommand}`);
    console.log(`JSON output will be saved to: ${jsonOutputFile}`);
    
    const result = await runner.runTestsWithAutoFix();
    
    console.log(`Test execution completed with exit code: ${result.testResult?.exitCode || 'unknown'}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
      console.log('✅ Baseline validation passed!');
    } else {
      console.log('❌ Baseline validation failed!');
    }
    
    // Check if the JSON file was created
    const fs = require('fs');
    if (fs.existsSync(jsonOutputFile)) {
      console.log(`✅ JSON output file was successfully created at: ${jsonOutputFile}`);
      
      // Read and parse the JSON file to verify its contents
      try {
        const jsonContent = fs.readFileSync(jsonOutputFile, 'utf8');
        const parsedResults = JSON.parse(jsonContent);
        console.log('JSON file contents are valid.');
        console.log(`Test summary: ${parsedResults.numPassedTests} passed, ${parsedResults.numFailedTests} failed`);
      } catch (error) {
        console.error(`Error parsing JSON file: ${error.message}`);
      }
    } else {
      console.error('❌ JSON output file was not created!');
    }
  } catch (error) {
    console.error('Error during baseline validation:', error);
  }
}

// Run the validation
runBaselineValidation().catch(console.error);
