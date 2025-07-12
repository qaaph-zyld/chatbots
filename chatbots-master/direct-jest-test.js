/**
 * Direct Jest test script using spawn
 * This script attempts to run Jest using child_process.spawn with stdio piping
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create test-results directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create log file for synchronous logging
const logFile = path.join(outputDir, 'direct-jest-log.txt');
fs.writeFileSync(logFile, `Script started at ${new Date().toISOString()}\n`);

console.log('=== DIRECT JEST TEST SCRIPT ===');
console.log(`Current working directory: ${process.cwd()}`);

// Determine the correct Jest executable based on platform
const isWindows = process.platform === 'win32';
const jestExecutable = isWindows ? 'jest.cmd' : 'jest';
const jestPath = path.join(process.cwd(), 'node_modules', '.bin', jestExecutable);

fs.writeFileSync(logFile, `Using Jest path: ${jestPath}\n`, { flag: 'a' });
console.log(`Using Jest path: ${jestPath}`);

// Create output files
const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
const stdoutFile = path.join(outputDir, `direct-jest-stdout-${timestamp}.txt`);
const stderrFile = path.join(outputDir, `direct-jest-stderr-${timestamp}.txt`);

fs.writeFileSync(logFile, `Will save stdout to: ${stdoutFile}\n`, { flag: 'a' });
fs.writeFileSync(logFile, `Will save stderr to: ${stderrFile}\n`, { flag: 'a' });

console.log(`Will save stdout to: ${stdoutFile}`);
console.log(`Will save stderr to: ${stderrFile}`);

// Execute Jest using spawn
try {
  fs.writeFileSync(logFile, `Attempting to spawn Jest at ${new Date().toISOString()}\n`, { flag: 'a' });
  console.log('Spawning Jest process...');
  
  // Create write streams for output files
  const stdoutStream = fs.createWriteStream(stdoutFile);
  const stderrStream = fs.createWriteStream(stderrFile);
  
  // Use spawn with simple command - just get Jest version
  const jestProcess = spawn(jestPath, ['--version'], {
    cwd: process.cwd(),
    shell: true // This is important for Windows .cmd files
  });
  
  fs.writeFileSync(logFile, `Jest process spawned at ${new Date().toISOString()}\n`, { flag: 'a' });
  
  // Pipe stdout and stderr to both console and files
  jestProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`JEST STDOUT: ${output}`);
    stdoutStream.write(output);
    fs.writeFileSync(logFile, `Got stdout: ${output}\n`, { flag: 'a' });
  });
  
  jestProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.error(`JEST STDERR: ${output}`);
    stderrStream.write(output);
    fs.writeFileSync(logFile, `Got stderr: ${output}\n`, { flag: 'a' });
  });
  
  jestProcess.on('close', (code) => {
    fs.writeFileSync(logFile, `Jest process exited with code ${code} at ${new Date().toISOString()}\n`, { flag: 'a' });
    console.log(`Jest process exited with code ${code}`);
    
    // Close the write streams
    stdoutStream.end();
    stderrStream.end();
    
    fs.writeFileSync(logFile, `Script completed at ${new Date().toISOString()}\n`, { flag: 'a' });
  });
  
  jestProcess.on('error', (err) => {
    fs.writeFileSync(logFile, `ERROR: ${err.message} at ${new Date().toISOString()}\n`, { flag: 'a' });
    console.error(`Error executing Jest: ${err.message}`);
  });
  
} catch (err) {
  fs.writeFileSync(logFile, `EXCEPTION: ${err.message} at ${new Date().toISOString()}\n`, { flag: 'a' });
  console.error(`Exception executing Jest: ${err.message}`);
}

console.log('Script is running, waiting for Jest process to complete...');

// Keep the script running for a while to ensure Jest completes
setTimeout(() => {
  fs.writeFileSync(logFile, `Timeout reached at ${new Date().toISOString()}\n`, { flag: 'a' });
  console.log('Script timeout reached, exiting...');
}, 30000); // Wait 30 seconds
