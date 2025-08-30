/**
 * Test script for the robust command runner
 * This script runs a series of simple commands to validate the robust command runner
 */
const path = require('path');
const { runCommand, runNodeScript } = require('./robust-command-runner');

// Run a series of test commands
async function runTests() {
  console.log('Testing robust command runner...\n');
  
  try {
    // Test 1: Simple echo command
    console.log('Test 1: Simple echo command');
    const result1 = await runCommand('echo', ['Hello, world!'], { timeout: 5000 });
    console.log(`Exit code: ${result1.code}`);
    console.log(`stdout: ${result1.stdout.trim()}`);
    console.log(`stderr: ${result1.stderr.trim() || '(none)'}`);
    console.log(`Duration: ${result1.duration}ms`);
    console.log('Test 1: PASS\n');
    
    // Test 2: Node.js script execution
    console.log('Test 2: Node.js script execution');
    const scriptContent = `
      console.log('Hello from Node.js script!');
      console.log('Current timestamp:', new Date().toISOString());
      console.log('Arguments:', process.argv.slice(2));
      process.exit(0);
    `;
    
    const result2 = await runNodeScript(scriptContent, { timeout: 5000 });
    console.log(`Exit code: ${result2.code}`);
    console.log(`stdout: ${result2.stdout.trim()}`);
    console.log(`stderr: ${result2.stderr.trim() || '(none)'}`);
    console.log(`Duration: ${result2.duration}ms`);
    console.log('Test 2: PASS\n');
    
    // Test 3: Command with special characters
    console.log('Test 3: Command with special characters');
    const result3 = await runCommand('echo', ['Special chars: !@#$%^&*()_+{}[]|:;"\'<>,.?/'], { timeout: 5000 });
    console.log(`Exit code: ${result3.code}`);
    console.log(`stdout: ${result3.stdout.trim()}`);
    console.log(`stderr: ${result3.stderr.trim() || '(none)'}`);
    console.log(`Duration: ${result3.duration}ms`);
    console.log('Test 3: PASS\n');
    
    // Test 4: Run npm command
    console.log('Test 4: Run npm version command');
    const result4 = await runCommand('npm', ['--version'], { timeout: 10000 });
    console.log(`Exit code: ${result4.code}`);
    console.log(`stdout: ${result4.stdout.trim()}`);
    console.log(`stderr: ${result4.stderr.trim() || '(none)'}`);
    console.log(`Duration: ${result4.duration}ms`);
    console.log('Test 4: PASS\n');
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
