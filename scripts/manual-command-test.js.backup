/**
 * Manual Command Execution Test Script
 * 
 * This script tests the CommandExecutor class directly without relying on the run_command tool.
 * To run this script, manually execute: node scripts/manual-command-test.js
 */

const path = require('path');
const fs = require('fs');

// Import the CommandExecutor class
let CommandExecutor;
try {
  CommandExecutor = require('../test-utils/command-executor');
  console.log('Successfully imported CommandExecutor');
} catch (error) {
  console.error('Failed to import CommandExecutor:', error.message);
  process.exit(1);
}

// Create output directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'test-results', 'manual-test');
try {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  console.log(`Created output directory: ${outputDir}`);
} catch (error) {
  console.error('Failed to create output directory:', error.message);
}

// Write test output to file
function writeTestOutput(content) {
  const outputFile = path.join(outputDir, 'manual-test-results.txt');
  try {
    fs.appendFileSync(outputFile, content + '\n');
    console.log('Test output written to:', outputFile);
  } catch (error) {
    console.error('Failed to write test output:', error.message);
  }
}

// Test function to run a simple command
async function testSimpleCommand() {
  console.log('\n=== Testing Simple Command ===');
  writeTestOutput('\n=== Testing Simple Command ===');
  
  try {
    const executor = new CommandExecutor({
      outputDir,
      verbose: true
    });
    
    console.log('Running echo command...');
    writeTestOutput('Running echo command...');
    
    const result = await executor.runCommand('echo', ['Hello, CommandExecutor!']);
    
    console.log(`Exit code: ${result.code}`);
    console.log(`Output: ${result.stdout.trim()}`);
    console.log(`Error: ${result.stderr.trim() || 'None'}`);
    console.log(`Output files: ${result.stdoutFile}, ${result.stderrFile}, ${result.statusFile}`);
    
    writeTestOutput(`Exit code: ${result.code}`);
    writeTestOutput(`Output: ${result.stdout.trim()}`);
    writeTestOutput(`Error: ${result.stderr.trim() || 'None'}`);
    writeTestOutput(`Output files: ${result.stdoutFile}, ${result.stderrFile}, ${result.statusFile}`);
    
    return true;
  } catch (error) {
    console.error('Command test failed:', error);
    writeTestOutput(`Command test failed: ${error.message}`);
    return false;
  }
}

// Test function to run a Node.js script
async function testNodeScript() {
  console.log('\n=== Testing Node.js Script Execution ===');
  writeTestOutput('\n=== Testing Node.js Script Execution ===');
  
  try {
    const executor = new CommandExecutor({
      outputDir,
      verbose: true
    });
    
    // First check if hello.js exists
    const scriptPath = path.join(process.cwd(), 'scripts', 'hello.js');
    if (!fs.existsSync(scriptPath)) {
      console.error(`Script not found: ${scriptPath}`);
      writeTestOutput(`Script not found: ${scriptPath}`);
      return false;
    }
    
    console.log(`Running script: ${scriptPath}`);
    writeTestOutput(`Running script: ${scriptPath}`);
    
    const result = await executor.runCommand('node', [scriptPath]);
    
    console.log(`Exit code: ${result.code}`);
    console.log(`Output: ${result.stdout.trim()}`);
    console.log(`Error: ${result.stderr.trim() || 'None'}`);
    
    writeTestOutput(`Exit code: ${result.code}`);
    writeTestOutput(`Output: ${result.stdout.trim()}`);
    writeTestOutput(`Error: ${result.stderr.trim() || 'None'}`);
    
    return true;
  } catch (error) {
    console.error('Node script test failed:', error);
    writeTestOutput(`Node script test failed: ${error.message}`);
    return false;
  }
}

// Test function to run npm commands
async function testNpmCommand() {
  console.log('\n=== Testing npm Command Execution ===');
  writeTestOutput('\n=== Testing npm Command Execution ===');
  
  try {
    const executor = new CommandExecutor({
      outputDir,
      verbose: true
    });
    
    console.log('Running npm --version command...');
    writeTestOutput('Running npm --version command...');
    
    const result = await executor.runCommand('npm', ['--version']);
    
    console.log(`Exit code: ${result.code}`);
    console.log(`npm version: ${result.stdout.trim()}`);
    
    writeTestOutput(`Exit code: ${result.code}`);
    writeTestOutput(`npm version: ${result.stdout.trim()}`);
    
    return true;
  } catch (error) {
    console.error('npm command test failed:', error);
    writeTestOutput(`npm command test failed: ${error.message}`);
    return false;
  }
}

// Main function to run all tests
async function runAllTests() {
  console.log('Starting manual command execution tests...');
  writeTestOutput('Starting manual command execution tests...');
  writeTestOutput(`Test time: ${new Date().toISOString()}`);
  
  // Run the tests
  const simpleCommandResult = await testSimpleCommand();
  const nodeScriptResult = await testNodeScript();
  const npmCommandResult = await testNpmCommand();
  
  // Report overall results
  console.log('\n=== Test Summary ===');
  console.log(`Simple command test: ${simpleCommandResult ? 'PASSED' : 'FAILED'}`);
  console.log(`Node.js script test: ${nodeScriptResult ? 'PASSED' : 'FAILED'}`);
  console.log(`npm command test: ${npmCommandResult ? 'PASSED' : 'FAILED'}`);
  
  writeTestOutput('\n=== Test Summary ===');
  writeTestOutput(`Simple command test: ${simpleCommandResult ? 'PASSED' : 'FAILED'}`);
  writeTestOutput(`Node.js script test: ${nodeScriptResult ? 'PASSED' : 'FAILED'}`);
  writeTestOutput(`npm command test: ${npmCommandResult ? 'PASSED' : 'FAILED'}`);
  
  const overallResult = simpleCommandResult && nodeScriptResult && npmCommandResult;
  console.log(`\nOverall test result: ${overallResult ? 'PASSED' : 'FAILED'}`);
  writeTestOutput(`\nOverall test result: ${overallResult ? 'PASSED' : 'FAILED'}`);
  
  return overallResult;
}

// Run the tests and exit with appropriate code
runAllTests()
  .then(success => {
    console.log(`\nTests completed. Exit code: ${success ? 0 : 1}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test script error:', error);
    writeTestOutput(`Test script error: ${error.message}`);
    process.exit(1);
  });
