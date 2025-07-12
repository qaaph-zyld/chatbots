/**
 * Validation script for CommandExecutor integration
 * 
 * This script tests the integration of the CommandExecutor class
 * with the auto-test-runner.js file to ensure commands execute properly.
 */

const path = require('path');
const TestAutomationRunner = require('../auto-test-runner');

// Create test runner instance with verbose output
const runner = new TestAutomationRunner({
  outputDir: path.join(process.cwd(), 'test-results', 'validation'),
  verbose: true
});

console.log('Starting CommandExecutor validation tests...');

// Run a series of test commands to validate functionality
async function runValidationTests() {
  try {
    console.log('\n=== Test 1: Simple echo command ===');
    const echoResult = await runner.runCommand('echo "Hello, CommandExecutor!"');
    console.log(`Exit code: ${echoResult.code}`);
    console.log(`Output: ${echoResult.stdout.trim()}`);
    console.log(`Output files: ${echoResult.stdoutFile}, ${echoResult.stderrFile}, ${echoResult.statusFile}`);
    
    console.log('\n=== Test 2: Directory listing ===');
    const dirResult = await runner.runCommand('dir', [], { cwd: process.cwd() });
    console.log(`Exit code: ${dirResult.code}`);
    console.log(`Files found: ${dirResult.stdout.split('\n').length} lines`);
    
    console.log('\n=== Test 3: Command with timeout ===');
    try {
      // This should timeout after 1 second
      await runner.runCommand('ping -n 10 127.0.0.1', [], { timeout: 1000 });
      console.log('ERROR: Timeout test failed - command completed without timing out');
    } catch (error) {
      console.log('Timeout test passed - command was terminated as expected');
      console.log(`Error message: ${error.error ? error.error.message : 'Unknown error'}`);
    }
    
    console.log('\n=== Test 4: npm command ===');
    try {
      const npmResult = await runner.runCommand('npm', ['--version']);
      console.log(`Exit code: ${npmResult.code}`);
      console.log(`npm version: ${npmResult.stdout.trim()}`);
    } catch (error) {
      console.log(`npm command failed: ${error.error ? error.error.message : 'Unknown error'}`);
    }
    
    console.log('\nAll validation tests completed!');
    return true;
  } catch (error) {
    console.error('Validation tests failed:', error);
    return false;
  }
}

// Run the validation tests
runValidationTests()
  .then(success => {
    console.log(`\nValidation ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation script error:', error);
    process.exit(1);
  });
