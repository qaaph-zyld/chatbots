/**
 * Reliable Command Runner
 * 
 * This script provides a reliable way to execute commands and capture their output,
 * addressing issues with command cancellation and path resolution.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate unique output files
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const stdoutFile = path.join(outputDir, `stdout-${timestamp}.txt`);
const stderrFile = path.join(outputDir, `stderr-${timestamp}.txt`);
const resultFile = path.join(outputDir, `result-${timestamp}.json`);

// Parse command line arguments
const fullCommand = process.argv.slice(2).join(' ');
if (!fullCommand) {
  console.error('Usage: node command-runner.js <full command>');
  process.exit(1);
}

// Execute the command with proper shell handling
const childProcess = spawn(fullCommand, [], {
  shell: true,
  cwd: process.cwd(),
  env: process.env,
  stdio: 'pipe'
});

// Create write streams for output files
const stdoutStream = fs.createWriteStream(stdoutFile);
const stderrStream = fs.createWriteStream(stderrFile);

// Pipe process output to files and console
childProcess.stdout.pipe(stdoutStream);
childProcess.stderr.pipe(stderrStream);

childProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

childProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle process completion
childProcess.on('close', (code) => {
  const result = {
    command: fullCommand,
    exitCode: code,
    stdoutFile,
    stderrFile,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
  console.log(`Command execution completed with exit code: ${code}`);
  console.log(`Results saved to: ${resultFile}`);
  
  process.exit(code);
});

// Handle process errors
childProcess.on('error', (error) => {
  fs.appendFileSync(stderrFile, `Process error: ${error.message}\n`);
  console.error(`Process error: ${error.message}`);
  
  const result = {
    command: fullCommand,
    error: error.message,
    stdoutFile,
    stderrFile,
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
  process.exit(1);
});
