/**
 * Diagnostic script to analyze run_command tool failures
 * Fixed version with proper shell escaping
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import our robust command runner
const { runCommand, escapeShellArg, escapeNodeEval } = require('./robust-command-runner');

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
      args: ['-e', escapeNodeEval('for(let i=0; i<10; i++) { console.log("Line " + i + ": " + "X".repeat(50)); }')],
      expectedExitCode: 0
    },
    {
      name: 'Long-running command (3 seconds)',
      command: 'node',
      args: ['-e', escapeNodeEval('setTimeout(() => { console.log("Done"); }, 3000)')],
      expectedExitCode: 0
    },
    {
      name: 'Command with error exit code',
      command: 'node',
      args: ['-e', escapeNodeEval('process.exit(1)')],
      expectedExitCode: 1
    },
    {
      name: 'Command with stderr output',
      command: 'node',
      args: ['-e', escapeNodeEval('console.error("This is an error message")')],
      expectedExitCode: 0
    },
    {
      name: 'Command with mixed stdout/stderr',
      command: 'node',
      args: ['-e', escapeNodeEval('console.log("Standard output"); console.error("Error output"); console.log("More standard output")')],
      expectedExitCode: 0
    },
    {
      name: 'Command with special characters',
      command: 'echo',
      args: [escapeShellArg('Special chars: !@#$%^&*()_+{}[]|:;"\'<>,.?/')],
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
      const result = await runCommand(test.command, test.args, { timeout: 10000 });
      
      // Check if exit code matches expected
      const exitCodeMatch = result.code === test.expectedExitCode;
      log(`Exit code: ${result.code} (Expected: ${test.expectedExitCode}) - ${exitCodeMatch ? 'PASS' : 'FAIL'}`);
      
      // Log output sizes
      log(`stdout size: ${result.stdout.length} characters`);
      log(`stderr size: ${result.stderr.length} characters`);
      log(`Total execution time: ${result.duration}ms`);
      log(`Output files: ${result.stdoutFile}, ${result.stderrFile}`);
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
