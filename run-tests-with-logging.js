/**
 * Script to run tests and log results to a file
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create results directory if it doesn't exist
const resultsDir = path.join(__dirname, 'test-results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

// Get current timestamp for the log file
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = path.join(resultsDir, `test-results-${timestamp}.log`);

// Function to log to both console and file
function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

// Initialize log file
fs.writeFileSync(logFile, `Test Results - ${new Date().toISOString()}\n\n`);

// Run tests and capture results
try {
  log('Running Jest tests...\n');
  
  // Run unit tests
  log('=== UNIT TESTS ===');
  try {
    const unitTestOutput = execSync('npx jest --testPathPattern=src/tests/unit --verbose', { encoding: 'utf8' });
    log(unitTestOutput);
    log('✅ Unit tests completed\n');
  } catch (error) {
    log('❌ Some unit tests failed:');
    log(error.stdout || error.message);
    log('\n');
  }
  
  // Run integration tests
  log('=== INTEGRATION TESTS ===');
  try {
    const integrationTestOutput = execSync('npx jest --testPathPattern=src/tests/integration --verbose', { encoding: 'utf8' });
    log(integrationTestOutput);
    log('✅ Integration tests completed\n');
  } catch (error) {
    log('❌ Some integration tests failed:');
    log(error.stdout || error.message);
    log('\n');
  }
  
  // Run advanced context awareness tests
  log('=== ADVANCED CONTEXT AWARENESS TESTS ===');
  try {
    const contextTestOutput = execSync('npx jest tests/advanced-context-awareness.test.js --verbose', { encoding: 'utf8' });
    log(contextTestOutput);
    log('✅ Advanced context awareness tests completed\n');
  } catch (error) {
    log('❌ Some advanced context awareness tests failed:');
    log(error.stdout || error.message);
    log('\n');
  }
  
  // Run voice component tests
  log('=== VOICE COMPONENT TESTS ===');
  try {
    const voiceTestOutput = execSync('npx jest tests/integration/voice-components.test.js --verbose', { encoding: 'utf8' });
    log(voiceTestOutput);
    log('✅ Voice component tests completed\n');
  } catch (error) {
    log('❌ Some voice component tests failed:');
    log(error.stdout || error.message);
    log('\n');
  }
  
  // Calculate overall statistics
  log('=== TEST SUMMARY ===');
  try {
    const summaryOutput = execSync('npx jest --coverage --coverageReporters=text-summary', { encoding: 'utf8' });
    log(summaryOutput);
  } catch (error) {
    log('❌ Error generating test summary:');
    log(error.stdout || error.message);
  }
  
  log(`\nComplete test results saved to: ${logFile}`);
} catch (error) {
  log('Error running tests:');
  log(error.message);
}
