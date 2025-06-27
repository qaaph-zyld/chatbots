/**
 * Validation script for the robust command runner
 * This script automatically runs tests and verifies the output
 */
const path = require('path');
const fs = require('fs');
const { runCommand, runNodeScript } = require('./robust-command-runner');

// Test case structure
class TestCase {
  constructor(name, testFn) {
    this.name = name;
    this.testFn = testFn;
    this.result = null;
    this.error = null;
    this.duration = 0;
  }

  async run() {
    console.log(`\n==== Running Test: ${this.name} ====`);
    const startTime = Date.now();
    
    try {
      this.result = await this.testFn();
      this.duration = Date.now() - startTime;
      console.log(`✅ PASS: ${this.name} (${this.duration}ms)`);
      return true;
    } catch (error) {
      this.error = error;
      this.duration = Date.now() - startTime;
      console.error(`❌ FAIL: ${this.name} (${this.duration}ms)`);
      console.error(`Error: ${error.message || JSON.stringify(error)}`);
      return false;
    }
  }
}

// Test suite for robust command runner
async function runValidationTests() {
  console.log('Starting robust command runner validation tests');
  console.log('=============================================');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
  };
  
  // Define test cases
  const testCases = [
    new TestCase('Simple echo command', async () => {
      const result = await runCommand('echo', ['Hello, world!'], { timeout: 5000 });
      
      if (result.code !== 0) throw new Error(`Expected exit code 0, got ${result.code}`);
      if (!result.stdout.includes('Hello, world!')) throw new Error('Expected output not found');
      if (!fs.existsSync(result.stdoutFile)) throw new Error('stdout file not created');
      if (!fs.existsSync(result.stderrFile)) throw new Error('stderr file not created');
      if (!fs.existsSync(result.statusFile)) throw new Error('status file not created');
      
      // Verify status file content
      const status = JSON.parse(fs.readFileSync(result.statusFile, 'utf8'));
      if (status.status !== 'success') throw new Error(`Expected status 'success', got '${status.status}'`);
      
      return result;
    }),
    
    new TestCase('Node.js script execution', async () => {
      const scriptContent = `
        console.log('Hello from Node.js script!');
        console.log('Current timestamp:', new Date().toISOString());
        console.log('Arguments:', process.argv.slice(2));
        process.exit(0);
      `;
      
      const result = await runNodeScript(scriptContent, { timeout: 5000 });
      
      if (result.code !== 0) throw new Error(`Expected exit code 0, got ${result.code}`);
      if (!result.stdout.includes('Hello from Node.js script!')) throw new Error('Expected output not found');
      
      // Verify status file content
      const status = JSON.parse(fs.readFileSync(result.statusFile, 'utf8'));
      if (status.status !== 'success') throw new Error(`Expected status 'success', got '${status.status}'`);
      
      return result;
    }),
    
    new TestCase('Command with special characters', async () => {
      const specialChars = 'Special chars: !@#$%^&*()_+{}[]|:;"\'<>,.?/';
      const result = await runCommand('echo', [specialChars], { timeout: 5000 });
      
      if (result.code !== 0) throw new Error(`Expected exit code 0, got ${result.code}`);
      if (!result.stdout.includes(specialChars)) throw new Error('Expected special characters not found in output');
      
      return result;
    }),
    
    new TestCase('Timeout detection', async () => {
      try {
        // This should timeout after 1 second
        if (process.platform === 'win32') {
          // Windows version
          await runCommand('timeout', ['2'], { timeout: 1000 });
        } else {
          // Unix version
          await runCommand('sleep', ['2'], { timeout: 1000 });
        }
        throw new Error('Expected timeout error was not thrown');
      } catch (error) {
        if (!error.error || error.error.code !== 'TIMEOUT') {
          throw new Error(`Expected TIMEOUT error, got: ${error.error ? error.error.code : 'unknown'}`);
        }
        
        // Verify status file content
        const status = JSON.parse(fs.readFileSync(error.statusFile, 'utf8'));
        if (status.status !== 'timeout') throw new Error(`Expected status 'timeout', got '${status.status}'`);
        
        return true; // This is actually a success for this test
      }
    }),
    
    new TestCase('Progress monitoring', async () => {
      // Create a script that outputs slowly
      const slowScript = `
        console.log('Starting slow script...');
        setTimeout(() => {
          console.log('First output after delay');
          setTimeout(() => {
            console.log('Second output after another delay');
            process.exit(0);
          }, 3000);
        }, 3000);
      `;
      
      const result = await runNodeScript(slowScript, { 
        timeout: 10000,
        progressTimeout: 2000 // Should trigger progress warning
      });
      
      if (result.code !== 0) throw new Error(`Expected exit code 0, got ${result.code}`);
      
      // Check if warning was logged
      const stderrContent = fs.readFileSync(result.stderrFile, 'utf8');
      if (!stderrContent.includes('[WARNING] No output received for')) {
        throw new Error('Expected progress warning not found in stderr');
      }
      
      return result;
    }),
    
    new TestCase('Exit code handling', async () => {
      // Create a script that exits with non-zero code
      const errorScript = `
        console.log('This script will exit with code 2');
        process.exit(2);
      `;
      
      const result = await runNodeScript(errorScript, { timeout: 5000 }).catch(err => err);
      
      if (result.code !== 2) throw new Error(`Expected exit code 2, got ${result.code}`);
      
      // Verify status file content
      const status = JSON.parse(fs.readFileSync(result.statusFile, 'utf8'));
      if (status.status !== 'failed') throw new Error(`Expected status 'failed', got '${status.status}'`);
      
      return result;
    })
  ];
  
  // Run all test cases
  results.total = testCases.length;
  
  for (const testCase of testCases) {
    try {
      const passed = await testCase.run();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(`Unexpected error running test ${testCase.name}:`, error);
      results.failed++;
    }
    
    results.tests.push({
      name: testCase.name,
      passed: !testCase.error,
      duration: testCase.duration,
      error: testCase.error ? (testCase.error.message || JSON.stringify(testCase.error)) : null
    });
  }
  
  // Print summary
  console.log('\n=============================================');
  console.log('Test Summary:');
  console.log(`Total: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log('=============================================');
  
  // Write results to file
  const resultsFile = path.join(process.cwd(), 'test-results', 'validation-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`Results written to: ${resultsFile}`);
  
  return results;
}

// Run the validation tests
runValidationTests().then(results => {
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('Fatal error running validation tests:', error);
  process.exit(1);
});
