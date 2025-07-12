/**
 * Simple test runner that logs results to a file
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Output file
const outputFile = path.join(__dirname, 'simple-test-results.txt');

// Tests to run
const tests = [
  {
    name: 'Advanced Context Awareness Tests',
    command: 'npx jest tests/advanced-context-awareness.test.js --no-cache'
  },
  {
    name: 'Voice Components Tests',
    command: 'npx jest tests/integration/voice-components.test.js --no-cache'
  },
  {
    name: 'Analytics Service Tests',
    command: 'npx jest src/tests/unit/services/analytics.service.test.js --no-cache'
  },
  {
    name: 'Auth Flow Integration Tests',
    command: 'npx jest src/tests/integration/auth-flow-integration.test.js --no-cache'
  }
];

// Initialize results file
fs.writeFileSync(outputFile, `Test Results - ${new Date().toISOString()}\n\n`);

// Run each test and log results
let passedTests = 0;
let totalTests = tests.length;

tests.forEach(test => {
  fs.appendFileSync(outputFile, `=== ${test.name} ===\n`);
  fs.appendFileSync(outputFile, `Command: ${test.command}\n\n`);
  
  try {
    const output = execSync(test.command, { encoding: 'utf8' });
    fs.appendFileSync(outputFile, output + '\n');
    fs.appendFileSync(outputFile, `✅ ${test.name} PASSED\n\n`);
    passedTests++;
  } catch (error) {
    fs.appendFileSync(outputFile, `Error output:\n${error.stdout || ''}\n${error.stderr || ''}\n`);
    fs.appendFileSync(outputFile, `❌ ${test.name} FAILED\n\n`);
  }
});

// Calculate pass rate
const passRate = (passedTests / totalTests) * 100;

// Write summary
const summary = `
=== TEST SUMMARY ===
Passed Tests: ${passedTests}/${totalTests} (${passRate.toFixed(2)}%)

Test Results:
${tests.map((test, index) => {
  const passed = index < passedTests;
  return `${test.name}: ${passed ? '✅ PASSED' : '❌ FAILED'}`;
}).join('\n')}

Complete test results saved to: ${outputFile}
`;

fs.appendFileSync(outputFile, summary);
console.log(summary);
