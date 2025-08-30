/**
 * Script to run tests and save detailed results to a file
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Output file path
const outputFile = path.join(__dirname, 'test-results', 'manual-test-results.txt');

// Function to run a command and capture output
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    // Return error output if command fails
    return error.stdout || error.stderr || error.message;
  }
}

// Initialize the output file
const timestamp = new Date().toISOString();
const header = `Test Results Analysis - ${timestamp}\n\n`;
fs.writeFileSync(outputFile, header);

// Run tests and capture output
console.log('Running tests and capturing detailed output...');

// Run unit tests
fs.appendFileSync(outputFile, '=== UNIT TESTS ===\n\n');
const unitTestOutput = runCommand('npx jest --testPathPattern=src/tests/unit --verbose');
fs.appendFileSync(outputFile, unitTestOutput + '\n\n');

// Run integration tests
fs.appendFileSync(outputFile, '=== INTEGRATION TESTS ===\n\n');
const integrationTestOutput = runCommand('npx jest --testPathPattern=src/tests/integration --verbose');
fs.appendFileSync(outputFile, integrationTestOutput + '\n\n');

// Run advanced context awareness tests
fs.appendFileSync(outputFile, '=== ADVANCED CONTEXT AWARENESS TESTS ===\n\n');
const contextTestOutput = runCommand('npx jest tests/advanced-context-awareness.test.js --verbose');
fs.appendFileSync(outputFile, contextTestOutput + '\n\n');

// Run voice component tests
fs.appendFileSync(outputFile, '=== VOICE COMPONENT TESTS ===\n\n');
const voiceTestOutput = runCommand('npx jest tests/integration/voice-components.test.js --verbose');
fs.appendFileSync(outputFile, voiceTestOutput + '\n\n');

// Generate coverage report
fs.appendFileSync(outputFile, '=== TEST COVERAGE SUMMARY ===\n\n');
const coverageOutput = runCommand('npx jest --coverage --coverageReporters=text-summary');
fs.appendFileSync(outputFile, coverageOutput + '\n\n');

console.log(`Complete test results saved to: ${outputFile}`);
console.log('Please examine the file for detailed test results.');
