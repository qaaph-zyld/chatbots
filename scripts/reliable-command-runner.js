/**
 * Reliable Command Runner
 * 
 * This script provides a more reliable way to execute commands from our AI assistant.
 * It addresses issues with the run_command tool that occasionally fails silently or gets canceled.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get command from arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node reliable-command-runner.js <command> [args...]');
  process.exit(1);
}

// Parse command and arguments
const command = args[0];
const commandArgs = args.slice(1);

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '..', 'test-results');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate timestamp for log files
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const stdoutFile = path.join(outputDir, `stdout-${timestamp}.txt`);
const stderrFile = path.join(outputDir, `stderr-${timestamp}.txt`);

// Execute command
console.log(`Executing command: ${command} ${commandArgs.join(' ')}`);

const childProcess = spawn(command, commandArgs, {
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe']
});

// Collect stdout
let stdout = '';
childProcess.stdout.on('data', (data) => {
  const chunk = data.toString();
  stdout += chunk;
  process.stdout.write(chunk); // Echo to console in real-time
  
  // Write to file
  try {
    fs.appendFileSync(stdoutFile, chunk);
  } catch (error) {
    console.error(`Failed to write stdout: ${error.message}`);
  }
});

// Collect stderr
let stderr = '';
childProcess.stderr.on('data', (data) => {
  const chunk = data.toString();
  stderr += chunk;
  process.stderr.write(chunk); // Echo to console in real-time
  
  // Write to file
  try {
    fs.appendFileSync(stderrFile, chunk);
  } catch (error) {
    console.error(`Failed to write stderr: ${error.message}`);
  }
});

// Handle process completion
childProcess.on('close', (code) => {
  console.log(`Command exited with code ${code}`);
  process.exit(code);
});

// Handle process errors
childProcess.on('error', (error) => {
  console.error(`Command execution error: ${error.message}`);
  process.exit(1);
});
