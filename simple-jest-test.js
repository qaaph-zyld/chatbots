/**
 * Simple Jest execution test script
 * This script attempts to run Jest directly using child_process.exec
 * which is more appropriate for executing shell commands and scripts
 */
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create a synchronous log file at the start to confirm script execution
const startLogFile = path.join(process.cwd(), 'test-results', 'script-start-log.txt');
fs.writeFileSync(startLogFile, `Script started at ${new Date().toISOString()}\n`, { flag: 'a' });

console.log('=== SIMPLE JEST TEST SCRIPT ===');
console.log(`Current working directory: ${process.cwd()}`);

// Define paths - use .cmd extension on Windows
const isWindows = process.platform === 'win32';
const jestExecutable = isWindows ? 'jest.cmd' : 'jest';
const jestPath = path.join(process.cwd(), 'node_modules', '.bin', jestExecutable);
const outputDir = path.join(process.cwd(), 'test-results');
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
const stdoutFile = path.join(outputDir, `jest-stdout-${timestamp}.txt`);
const stderrFile = path.join(outputDir, `jest-stderr-${timestamp}.txt`);

// Log the platform and executable information
fs.writeFileSync(startLogFile, `Platform: ${process.platform}, using executable: ${jestExecutable}\n`, { flag: 'a' });

// Log the script execution to the synchronous log file
fs.writeFileSync(startLogFile, `Defined paths at ${new Date().toISOString()}\n`, { flag: 'a' });

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}
fs.writeFileSync(startLogFile, `Ensured output directory exists at ${new Date().toISOString()}\n`, { flag: 'a' });

console.log(`Using Jest path: ${jestPath}`);
console.log(`Will save stdout to: ${stdoutFile}`);
console.log(`Will save stderr to: ${stderrFile}`);

// Execute Jest using exec
console.log('Executing Jest...');
fs.writeFileSync(startLogFile, `About to execute Jest at ${new Date().toISOString()}\n`, { flag: 'a' });

try {
  // Use exec with the full command instead of execFile
  // Add --showConfig to force Jest to output its configuration
  const jestCommand = `"${jestPath}" --showConfig`;
  fs.writeFileSync(startLogFile, `Jest command: ${jestCommand}\n`, { flag: 'a' });
  
  const jestProcess = exec(jestCommand, { 
    cwd: process.cwd(),
    timeout: 60000, // 60 seconds timeout
    maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
  }, (error, stdout, stderr) => {
    // This callback runs when the process completes
    fs.writeFileSync(startLogFile, `Jest callback executed at ${new Date().toISOString()}\n`, { flag: 'a' });
    fs.writeFileSync(startLogFile, `Error: ${error ? JSON.stringify(error) : 'none'}\n`, { flag: 'a' });
    
    console.log(`Jest process completed with ${error ? `error: ${error.message}` : 'no errors'}`);
    console.log(`Exit code: ${error ? error.code : 0}`);
    
    // Write output to files
    fs.writeFileSync(startLogFile, `Writing output files at ${new Date().toISOString()}\n`, { flag: 'a' });
    fs.writeFileSync(stdoutFile, stdout || 'No stdout output');
    fs.writeFileSync(stderrFile, stderr || 'No stderr output');
    fs.writeFileSync(startLogFile, `Finished writing output files at ${new Date().toISOString()}\n`, { flag: 'a' });
    
    // Log summary of output
    console.log(`\nStdout summary (first 500 chars):\n${stdout ? stdout.substring(0, 500) : 'No stdout'}`);
    console.log(`\nStderr summary (first 500 chars):\n${stderr ? stderr.substring(0, 500) : 'No stderr'}`);
    
    // Print the full paths to the output files
    console.log(`\nFull output saved to:\n- ${stdoutFile}\n- ${stderrFile}`);
  });
  
  fs.writeFileSync(startLogFile, `Jest process initiated at ${new Date().toISOString()}\n`, { flag: 'a' });
} catch (err) {
  fs.writeFileSync(startLogFile, `ERROR executing Jest: ${err.message} at ${new Date().toISOString()}\n`, { flag: 'a' });
  console.error(`Error executing Jest: ${err.message}`);
}

// Log that the process has been started
console.log('Jest process started, waiting for completion...');
fs.writeFileSync(startLogFile, `Process started message logged at ${new Date().toISOString()}\n`, { flag: 'a' });

// Keep the script running for a while to ensure Jest completes
setTimeout(() => {
  fs.writeFileSync(startLogFile, `Timeout reached at ${new Date().toISOString()}\n`, { flag: 'a' });
  console.log('Script timeout reached, exiting...');
}, 30000); // Wait 30 seconds
