/**
 * Test Runner Script
 * 
 * This script runs tests and captures the output to a file
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create test results directory if it doesn't exist
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Output file
const outputFile = path.join(resultsDir, 'manual-test-results.txt');

// Tests to run
const tests = [
  {
    name: 'Analytics Service Tests',
    command: 'npx jest src/tests/unit/services/analytics.service.test.js --verbose'
  },
  {
    name: 'Workflow Service Tests',
    command: 'npx jest src/tests/unit/services/workflow.service.test.js --verbose'
  },
  {
    name: 'Chatbot Controller Tests',
    command: 'npx jest src/tests/unit/controllers/chatbot.controller.test.js --verbose'
  }
];

// Clear the output file
fs.writeFileSync(outputFile, '# Test Results\n\n');

// Run each test and append output to file
tests.forEach(test => {
  console.log(`Running ${test.name}...`);
  
  // Append test header to file
  fs.appendFileSync(outputFile, `## ${test.name}\n\n`);
  
  try {
    // Run the test and capture output
    const output = execSync(test.command, { encoding: 'utf8' });
    
    // Append output to file
    fs.appendFileSync(outputFile, '```\n' + output + '\n```\n\n');
    
    console.log(`${test.name} completed successfully.`);
  } catch (error) {
    // Append error output to file
    fs.appendFileSync(outputFile, '```\n' + error.stdout + '\n```\n\n');
    
    console.error(`${test.name} failed with error:`, error.message);
  }
});

console.log('All tests completed. Results saved to', outputFile);
