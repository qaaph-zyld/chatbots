/**
 * Diagnostic script to analyze run_command tool failures
 * 
 * This script runs a series of test commands with different characteristics
 * to help identify patterns in run_command failures.
 */
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const outputDir = path.join(__dirname, '../test-results/command-diagnostics');
const timestamp = new Date().toISOString().replace(/:/g, '-');
const logFile = path.join(outputDir, `diagnostics-${timestamp}.log`);

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Initialize log file
fs.writeFileSync(logFile, `# Command Execution Diagnostics\nTimestamp: ${timestamp}\nOS: ${os.platform()} ${os.release()}\n\n`);

/**
 * Log a message to both console and log file
 * @param {string} message - Message to log
 */
function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, `${message}\n`);
}

/**
 * Run a command using child_process.spawn with proper output handling
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @param {object} options - Spawn options
 * @returns {Promise<object>} - Promise resolving to result object
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const stdoutChunks = [];
    const stderrChunks = [];
    
    log(`[${new Date().toISOString()}] Running: ${command} ${args.join(' ')}`);
    
    // Default options
    const spawnOptions = {
      shell: true,
      stdio: 'pipe',
      ...options
    };
    
    // Spawn process
    const childProcess = spawn(command, args, spawnOptions);
    
    // Collect stdout
    childProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdoutChunks.push(chunk);
      process.stdout.write(chunk);
    });
    
    // Collect stderr
    childProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderrChunks.push(chunk);
      process.stderr.write(chunk);
    });
    
    // Handle process completion
    childProcess.on('close', (code, signal) => {
      const duration = Date.now() - startTime;
      const stdout = stdoutChunks.join('');
      const stderr = stderrChunks.join('');
      
      log(`[${new Date().toISOString()}] Command completed in ${duration}ms with exit code: ${code}`);
      
      resolve({
        code,
        signal,
        stdout,
        stderr,
        duration
      });
    });
    
    // Handle process errors
    childProcess.on('error', (error) => {
      const duration = Date.now() - startTime;
      log(`[${new Date().toISOString()}] Command failed with error: ${error.message}`);
      
      reject({
        error,
        duration
      });
    });
  });
}

/**
 * Run a series of diagnostic tests
 */
async function runDiagnostics() {
  const tests = [
    {
      name: 'Simple echo command',
      command: 'echo',
      args: ['Hello, world!'],
      expectedExitCode: 0
    },
    {
      name: 'Command with large output',
      command: 'node',
      args: ['-e', 'for(let i=0; i<1000; i++) console.log(`Line ${i}: ${"X".repeat(100)}`)'],
      expectedExitCode: 0
    },
    {
      name: 'Long-running command (3 seconds)',
      command: 'node',
      args: ['-e', 'setTimeout(() => console.log("Done"), 3000)'],
      expectedExitCode: 0
    },
    {
      name: 'Command with error exit code',
      command: 'node',
      args: ['-e', 'process.exit(1)'],
      expectedExitCode: 1
    },
    {
      name: 'Command with stderr output',
      command: 'node',
      args: ['-e', 'console.error("This is an error message")'],
      expectedExitCode: 0
    },
    {
      name: 'Command with mixed stdout/stderr',
      command: 'node',
      args: ['-e', 'console.log("Standard output"); console.error("Error output"); console.log("More standard output")'],
      expectedExitCode: 0
    },
    {
      name: 'Command with special characters',
      command: 'echo',
      args: ['Special chars: !@#$%^&*()_+{}[]|\\:;"\'<>,.?/'],
      expectedExitCode: 0
    },
    {
      name: 'Command with spaces in arguments',
      command: 'echo',
      args: ['This argument has spaces'],
      expectedExitCode: 0
    }
  ];
  
  log('Starting diagnostic tests...\n');
  
  // Run each test and record results
  for (const test of tests) {
    log(`\n## Test: ${test.name}`);
    
    try {
      const result = await runCommand(test.command, test.args);
      
      // Check if exit code matches expected
      const exitCodeMatch = result.code === test.expectedExitCode;
      log(`Exit code: ${result.code} (Expected: ${test.expectedExitCode}) - ${exitCodeMatch ? 'PASS' : 'FAIL'}`);
      
      // Log output sizes
      log(`stdout size: ${result.stdout.length} characters`);
      log(`stderr size: ${result.stderr.length} characters`);
      log(`Total execution time: ${result.duration}ms`);
    } catch (error) {
      log(`Test failed with error: ${error.error ? error.error.message : 'Unknown error'}`);
      log(`Duration before failure: ${error.duration}ms`);
    }
  }
  
  log('\nDiagnostic tests completed.');
}

// Run the diagnostics
runDiagnostics().catch(error => {
  log(`Fatal error in diagnostics: ${error.message}`);
  process.exit(1);
});
