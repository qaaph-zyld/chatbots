/**
 * Validation script for CommandExecutor integration with auto-test-runner.js
 * 
 * This script tests the integration of the CommandExecutor class with the 
 * auto-test-runner.js file to ensure commands execute properly.
 */

const path = require('path');
const TestAutomationRunner = require('../auto-test-runner');
const CommandExecutor = require('../test-utils/command-executor');

console.log('Starting CommandExecutor integration validation...');

// Test the direct CommandExecutor class
async function testCommandExecutor() {
  console.log('\n=== Testing CommandExecutor directly ===');
  
  try {
    const executor = new CommandExecutor({
      outputDir: path.join(process.cwd(), 'test-results', 'validation'),
      verbose: true
    });
    
    console.log('Running echo command...');
    const echoResult = await executor.runCommand('echo', ['Hello, CommandExecutor!']);
    console.log(`Exit code: ${echoResult.code}`);
    console.log(`Output: ${echoResult.stdout.trim()}`);
    console.log(`Output files: ${echoResult.stdoutFile}, ${echoResult.stderrFile}, ${echoResult.statusFile}`);
    
    return true;
  } catch (error) {
    console.error('CommandExecutor test failed:', error);
    return false;
  }
}

// Test the TestAutomationRunner with CommandExecutor integration
async function testTestAutomationRunner() {
  console.log('\n=== Testing TestAutomationRunner with CommandExecutor ===');
  
  try {
    const runner = new TestAutomationRunner({
      outputDir: path.join(process.cwd(), 'test-results', 'validation'),
      verbose: true
    });
    
    console.log('Running echo command through TestAutomationRunner...');
    const echoResult = await runner.runCommand('echo "Hello from TestAutomationRunner!"');
    console.log(`Exit code: ${echoResult.code}`);
    console.log(`Output: ${echoResult.stdout.trim()}`);
    console.log(`Output files: ${echoResult.stdoutFile}, ${echoResult.stderrFile}, ${echoResult.statusFile || 'N/A'}`);
    
    return true;
  } catch (error) {
    console.error('TestAutomationRunner test failed:', error);
    return false;
  }
}

// Run all validation tests
async function runValidation() {
  console.log('Starting validation tests...');
  
  // Test CommandExecutor directly
  const commandExecutorResult = await testCommandExecutor();
  console.log(`\nCommandExecutor test: ${commandExecutorResult ? 'PASSED' : 'FAILED'}`);
  
  // Test TestAutomationRunner with CommandExecutor integration
  const testAutomationRunnerResult = await testTestAutomationRunner();
  console.log(`\nTestAutomationRunner test: ${testAutomationRunnerResult ? 'PASSED' : 'FAILED'}`);
  
  // Overall result
  const overallResult = commandExecutorResult && testAutomationRunnerResult;
  console.log(`\nOverall validation: ${overallResult ? 'PASSED' : 'FAILED'}`);
  
  return overallResult;
}

// Run validation and exit with appropriate code
runValidation()
  .then(success => {
    console.log(`\nValidation complete. Exit code: ${success ? 0 : 1}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation script error:', error);
    process.exit(1);
  });
