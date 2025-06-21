const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Jest test script');
console.log(`Current working directory: ${process.cwd()}`);

// Use direct path to Jest instead of npx
const jestPath = path.join(process.cwd(), 'node_modules', '.bin', 'jest');
console.log(`Using Jest path: ${jestPath}`);

// Try to run Jest directly with stdio: 'inherit' to show output directly in the console
const jestProcess = spawn(jestPath, ['--verbose'], {
  cwd: process.cwd(),
  shell: true,
  stdio: 'inherit'
});

console.log('Jest process started with stdio: inherit');

// With stdio: 'inherit', we don't need to handle stdout/stderr events
// as they will be automatically piped to the parent process

jestProcess.on('close', (code) => {
  console.log(`Jest process exited with code: ${code}`);
});

jestProcess.on('error', (error) => {
  console.error(`Jest process error: ${error.message}`);
});

// Keep the script running until Jest completes
console.log('Waiting for Jest to complete...');
