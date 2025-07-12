/**
 * Simple script to run tests and log results to a file
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get current timestamp for the log file
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = path.join(__dirname, `test-results-${timestamp}.txt`);

// Function to run a command and log output
function runCommandAndLog(command, args) {
  console.log(`Running: ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { 
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  const output = result.stdout + (result.stderr ? `\nErrors:\n${result.stderr}` : '');
  fs.appendFileSync(logFile, output + '\n\n');
  console.log(`Command completed with exit code: ${result.status}`);
  return result.status === 0;
}

// Initialize log file
fs.writeFileSync(logFile, `Test Results - ${new Date().toISOString()}\n\n`);

// Run tests in sequence
console.log('Starting test runs...');

// Run unit tests
fs.appendFileSync(logFile, '=== UNIT TESTS ===\n');
const unitTestsPassed = runCommandAndLog('npx', ['jest', '--testPathPattern=src/tests/unit', '--verbose']);

// Run integration tests
fs.appendFileSync(logFile, '=== INTEGRATION TESTS ===\n');
const integrationTestsPassed = runCommandAndLog('npx', ['jest', '--testPathPattern=src/tests/integration', '--verbose']);

// Run advanced context awareness tests
fs.appendFileSync(logFile, '=== ADVANCED CONTEXT AWARENESS TESTS ===\n');
const contextTestsPassed = runCommandAndLog('npx', ['jest', 'tests/advanced-context-awareness.test.js', '--verbose']);

// Run voice component tests
fs.appendFileSync(logFile, '=== VOICE COMPONENT TESTS ===\n');
const voiceTestsPassed = runCommandAndLog('npx', ['jest', 'tests/integration/voice-components.test.js', '--verbose']);

// Generate coverage report
fs.appendFileSync(logFile, '=== TEST COVERAGE SUMMARY ===\n');
runCommandAndLog('npx', ['jest', '--coverage', '--coverageReporters=text-summary']);

// Calculate overall pass rate
const testSuites = [
  { name: 'Unit Tests', passed: unitTestsPassed },
  { name: 'Integration Tests', passed: integrationTestsPassed },
  { name: 'Advanced Context Awareness Tests', passed: contextTestsPassed },
  { name: 'Voice Component Tests', passed: voiceTestsPassed }
];

const passedCount = testSuites.filter(suite => suite.passed).length;
const totalCount = testSuites.length;
const passRate = (passedCount / totalCount) * 100;

// Log summary
const summary = `
=== OVERALL TEST SUMMARY ===
Passed Test Suites: ${passedCount}/${totalCount} (${passRate.toFixed(2)}%)

Test Suites:
${testSuites.map(suite => `${suite.name}: ${suite.passed ? '✅ PASSED' : '❌ FAILED'}`).join('\n')}

Complete test results saved to: ${logFile}
`;

fs.appendFileSync(logFile, summary);
console.log(summary);
