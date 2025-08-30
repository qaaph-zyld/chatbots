/**
 * Simple validation script for robust-command-runner.js
 * 
 * This script directly tests the robust-command-runner.js module
 * without any additional wrappers to simplify debugging.
 */

const path = require('path');
const fs = require('fs');
const { runCommand } = require('./robust-command-runner');

// Create output directory for test results
const outputDir = path.join(process.cwd(), 'test-results', 'validation');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create test results file
const resultsFile = path.join(outputDir, 'validation-results.txt');

/**
 * Write test results to file
 * @param {string} message - Message to write
 */
function writeResult(message) {
  console.log(message);
  fs.appendFileSync(resultsFile, message + '\n');
}

/**
 * Run validation tests
 */
async function runValidation() {
  // Initialize the test results file
  fs.writeFileSync(resultsFile, `Command Runner Validation\n${'-'.repeat(30)}\n`);
  writeResult(`Test started at: ${new Date().toISOString()}`);
  writeResult(`Node version: ${process.version}`);
  writeResult(`Platform: ${process.platform}`);
  writeResult(`Working directory: ${process.cwd()}`);
  writeResult('-'.repeat(50) + '\n');
  
  const results = [];
  
  // Test 1: Simple echo command
  writeResult('1. Testing simple echo command');
  try {
    const echoResult = await runCommand('echo', ['Hello, World!'], {
      cwd: process.cwd(),
      timeout: 10000
    });
    
    writeResult(`   Exit code: ${echoResult.code}`);
    writeResult(`   Output: ${echoResult.stdout.trim()}`);
    writeResult(`   Status: ${echoResult.code === 0 ? 'PASSED' : 'FAILED'}`);
    results.push({ name: 'echo', success: echoResult.code === 0 });
  } catch (error) {
    writeResult(`   Error: ${error.message || error}`);
    writeResult('   Status: FAILED');
    results.push({ name: 'echo', success: false });
  }
  writeResult('');
  
  // Test 2: Directory listing
  writeResult('2. Testing directory listing');
  try {
    const dirResult = await runCommand('dir', ['/b'], {
      cwd: process.cwd(),
      timeout: 10000
    });
    
    writeResult(`   Exit code: ${dirResult.code}`);
    writeResult(`   Files found: ${dirResult.stdout.split('\n').filter(Boolean).length} files`);
    writeResult(`   Status: ${dirResult.code === 0 ? 'PASSED' : 'FAILED'}`);
    results.push({ name: 'dir', success: dirResult.code === 0 });
  } catch (error) {
    writeResult(`   Error: ${error.message || error}`);
    writeResult('   Status: FAILED');
    results.push({ name: 'dir', success: false });
  }
  writeResult('');
  
  // Test 3: Node version
  writeResult('3. Testing node version');
  try {
    const nodeResult = await runCommand('node', ['--version'], {
      cwd: process.cwd(),
      timeout: 10000
    });
    
    writeResult(`   Exit code: ${nodeResult.code}`);
    writeResult(`   Node version: ${nodeResult.stdout.trim()}`);
    writeResult(`   Status: ${nodeResult.code === 0 ? 'PASSED' : 'FAILED'}`);
    results.push({ name: 'node', success: nodeResult.code === 0 });
  } catch (error) {
    writeResult(`   Error: ${error.message || error}`);
    writeResult('   Status: FAILED');
    results.push({ name: 'node', success: false });
  }
  writeResult('');
  
  // Test 4: npm version
  writeResult('4. Testing npm version');
  try {
    const npmResult = await runCommand('npm', ['--version'], {
      cwd: process.cwd(),
      timeout: 10000
    });
    
    writeResult(`   Exit code: ${npmResult.code}`);
    writeResult(`   npm version: ${npmResult.stdout.trim()}`);
    writeResult(`   Status: ${npmResult.code === 0 ? 'PASSED' : 'FAILED'}`);
    results.push({ name: 'npm', success: npmResult.code === 0 });
  } catch (error) {
    writeResult(`   Error: ${error.message || error}`);
    writeResult('   Status: FAILED');
    results.push({ name: 'npm', success: false });
  }
  writeResult('');
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  writeResult('Test Summary:');
  writeResult(`Total tests: ${results.length}`);
  writeResult(`Successful: ${successful}`);
  writeResult(`Failed: ${failed}`);
  
  // Overall result
  const overallSuccess = failed === 0;
  writeResult(`\nOverall validation result: ${overallSuccess ? 'PASSED' : 'FAILED'}`);
  writeResult(`Test completed at: ${new Date().toISOString()}`);
  
  return overallSuccess;
}

// Run validation and exit with appropriate code
runValidation()
  .then(success => {
    console.log(`\nValidation ${success ? 'PASSED' : 'FAILED'}`);
    console.log(`Results written to: ${resultsFile}`);
    
    // Copy results to the standard test results file per user requirements
    const standardResultsFile = path.join(process.cwd(), 'test-results', 'manual-test-results.txt');
    try {
      fs.copyFileSync(resultsFile, standardResultsFile);
      console.log(`Results also copied to: ${standardResultsFile}`);
    } catch (error) {
      console.error(`Failed to copy results to standard file: ${error.message}`);
    }
    
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation script error:', error);
    fs.appendFileSync(resultsFile, `\nUnhandled error: ${error.message}\n`);
    process.exit(1);
  });
