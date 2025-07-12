/**
 * Integration example for the robust command runner
 * Shows how to use the robust command runner in actual code
 */
const path = require('path');
const fs = require('fs');
const { runCommand, runNodeScript } = require('./robust-command-runner');

/**
 * Example: Run Jest tests with proper error handling
 * @param {string} testPattern - Optional test pattern to run specific tests
 * @returns {Promise<object>} - Test results
 */
async function runJestTests(testPattern = '') {
  console.log('Running Jest tests...');
  
  const args = ['test'];
  if (testPattern) {
    args.push(testPattern);
  }
  
  try {
    // Use the robust command runner to execute Jest
    const result = await runCommand('npm', args, {
      cwd: process.cwd(),
      timeout: 120000 // 2 minutes timeout
    });
    
    console.log(`Tests completed with exit code: ${result.code}`);
    console.log(`Output logs: ${result.stdoutFile}`);
    
    return {
      success: result.code === 0,
      output: result.stdout,
      errors: result.stderr,
      exitCode: result.code
    };
  } catch (error) {
    console.error('Error running tests:', error.error ? error.error.message : 'Unknown error');
    
    return {
      success: false,
      output: error.stdout || '',
      errors: error.stderr || (error.error ? error.error.message : 'Unknown error'),
      exitCode: error.code || 1
    };
  }
}

/**
 * Example: Execute a Node.js script with complex logic
 * @param {string} scriptLogic - JavaScript code to execute
 * @returns {Promise<object>} - Script execution results
 */
async function executeNodeScript(scriptLogic) {
  console.log('Executing Node.js script...');
  
  try {
    // Use runNodeScript for complex JavaScript execution
    const result = await runNodeScript(scriptLogic, {
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log(`Script completed with exit code: ${result.code}`);
    console.log(`Output logs: ${result.stdoutFile}`);
    
    return {
      success: result.code === 0,
      output: result.stdout,
      errors: result.stderr,
      exitCode: result.code
    };
  } catch (error) {
    console.error('Error executing script:', error.error ? error.error.message : 'Unknown error');
    
    return {
      success: false,
      output: error.stdout || '',
      errors: error.stderr || (error.error ? error.error.message : 'Unknown error'),
      exitCode: error.code || 1
    };
  }
}

/**
 * Example: Run ESLint with proper error handling
 * @param {string} targetPath - Path to lint
 * @returns {Promise<object>} - Lint results
 */
async function runESLint(targetPath) {
  console.log(`Running ESLint on ${targetPath}...`);
  
  try {
    // Use the robust command runner to execute ESLint
    const result = await runCommand('npx', ['eslint', targetPath], {
      cwd: process.cwd(),
      timeout: 60000 // 1 minute timeout
    });
    
    console.log(`ESLint completed with exit code: ${result.code}`);
    console.log(`Output logs: ${result.stdoutFile}`);
    
    return {
      success: result.code === 0,
      output: result.stdout,
      errors: result.stderr,
      exitCode: result.code
    };
  } catch (error) {
    console.error('Error running ESLint:', error.error ? error.error.message : 'Unknown error');
    
    return {
      success: false,
      output: error.stdout || '',
      errors: error.stderr || (error.error ? error.error.message : 'Unknown error'),
      exitCode: error.code || 1
    };
  }
}

// Export the example functions
module.exports = {
  runJestTests,
  executeNodeScript,
  runESLint
};

// If run directly from command line, show usage examples
if (require.main === module) {
  console.log('Integration Example for Robust Command Runner');
  console.log('===========================================');
  console.log('');
  console.log('This module provides example functions for using the robust command runner:');
  console.log('');
  console.log('1. runJestTests(testPattern) - Run Jest tests with proper error handling');
  console.log('2. executeNodeScript(scriptLogic) - Execute a Node.js script with complex logic');
  console.log('3. runESLint(targetPath) - Run ESLint with proper error handling');
  console.log('');
  console.log('Import this module to use these functions in your code:');
  console.log('');
  console.log('const { runJestTests, executeNodeScript, runESLint } = require(\'./scripts/integration-example\');');
  console.log('');
  console.log('Example usage:');
  console.log('');
  console.log('runJestTests().then(result => console.log(result));');
}
