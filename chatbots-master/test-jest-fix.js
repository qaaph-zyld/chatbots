/**
 * Test script to verify Jest execution fix
 * This script uses the TestAutomationRunner to run a simple Jest test
 */
const { TestAutomationRunner } = require('./auto-test-runner');

// Create a test runner instance with minimal configuration
const runner = new TestAutomationRunner({
  testCommand: process.platform === 'win32' ? '.\\node_modules\\.bin\\jest --version' : './node_modules/.bin/jest --version',
  outputDir: './test-results',
  networkTimeoutMs: 30000, // 30 seconds timeout
  aiFixEnabled: false // Disable AI fix for this test
});

console.log(`Platform: ${process.platform}`);
console.log(`Using command: ${process.platform === 'win32' ? '.\\node_modules\\.bin\\jest --version' : './node_modules/.bin/jest --version'}`);


// Run the test and log the results
async function runTest() {
  console.log('Starting Jest execution test...');
  
  try {
    const jestPath = process.platform === 'win32' ? '.\\node_modules\\.bin\\jest --version' : './node_modules/.bin/jest --version';
    console.log(`Executing command: ${jestPath}`);
    const result = await runner.runCommand(jestPath);
    console.log('Test completed successfully!');
    console.log('Exit code:', result.exitCode);
    console.log('Stdout:', result.stdout);
    
    // Write results to test-results file as per user's request
    const fs = require('fs');
    const path = require('path');
    const outputFile = path.join('./test-results', 'manual-test-results.txt');
    
    const output = `
=== JEST EXECUTION TEST RESULTS ===
Date: ${new Date().toISOString()}
Command: ./node_modules/.bin/jest --version
Exit code: ${result.exitCode}
Stdout: ${result.stdout}
===================================
`;
    
    fs.writeFileSync(outputFile, output);
    console.log(`Results written to ${outputFile}`);
    
    return result;
  } catch (error) {
    console.error('Test failed with error:', error);
    
    // Write error to test-results file
    const fs = require('fs');
    const path = require('path');
    const outputFile = path.join('./test-results', 'manual-test-results.txt');
    
    const output = `
=== JEST EXECUTION TEST ERROR ===
Date: ${new Date().toISOString()}
Command: ./node_modules/.bin/jest --version
Error: ${error.message || JSON.stringify(error)}
===============================
`;
    
    fs.writeFileSync(outputFile, output);
    console.log(`Error written to ${outputFile}`);
    
    throw error;
  }
}

// Run the test
runTest()
  .then(result => {
    console.log('Test script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
