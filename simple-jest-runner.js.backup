/**
 * Simple Jest runner script to verify our spawn with shell:true fix
 * This script directly uses child_process.spawn without the TestAutomationRunner class
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Output file path
const outputFile = path.join('./test-results', 'manual-test-results.txt');

// Ensure test-results directory exists
if (!fs.existsSync('./test-results')) {
  fs.mkdirSync('./test-results', { recursive: true });
}

console.log('Starting simple Jest execution test...');

// Run Jest version command using spawn with shell:true
// Use platform-specific path formatting
let cmd;
if (process.platform === 'win32') {
  cmd = '.\\node_modules\\.bin\\jest';
} else {
  cmd = './node_modules/.bin/jest';
}
const args = ['--version'];

console.log(`Platform: ${process.platform}`);
console.log(`Using command path: ${cmd}`);


console.log(`Executing: ${cmd} ${args.join(' ')}`);

// Spawn the process with shell:true
const childProcess = spawn(cmd, args, {
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe']
});

let stdout = '';
let stderr = '';

// Collect stdout
childProcess.stdout.on('data', (data) => {
  const chunk = data.toString();
  stdout += chunk;
  console.log(`Stdout: ${chunk}`);
});

// Collect stderr
childProcess.stderr.on('data', (data) => {
  const chunk = data.toString();
  stderr += chunk;
  console.error(`Stderr: ${chunk}`);
});

// Handle process errors
childProcess.on('error', (error) => {
  console.error('Process error:', error.message);
  
  const output = `
=== SIMPLE JEST EXECUTION TEST ERROR ===
Date: ${new Date().toISOString()}
Command: ${cmd} ${args.join(' ')}
Error: ${error.message}
Stdout: ${stdout}
Stderr: ${stderr}
===============================
`;
  
  fs.writeFileSync(outputFile, output);
  console.log(`Error written to ${outputFile}`);
});

// Handle process completion
childProcess.on('close', (code, signal) => {
  console.log(`Process exited with code: ${code}, signal: ${signal}`);
  
  const output = `
=== SIMPLE JEST EXECUTION TEST RESULTS ===
Date: ${new Date().toISOString()}
Command: ${cmd} ${args.join(' ')}
Exit code: ${code}
Signal: ${signal}
Stdout: ${stdout}
Stderr: ${stderr}
===================================
`;
  
  fs.writeFileSync(outputFile, output);
  console.log(`Results written to ${outputFile}`);
  
  // Exit with the same code as the child process
  process.exit(code);
});
