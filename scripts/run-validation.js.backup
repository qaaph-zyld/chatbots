/**
 * Run Validation Script
 * 
 * This script provides a reliable way to run the validation script for refactoring.
 * It addresses issues with the run_command tool failing silently.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if backup file exists
const originalFile = 'auto-test-runner.js.bak';
const refactoredFile = 'auto-test-runner.js';
const validationScript = path.join(__dirname, 'validate-refactoring.js');

// Verify files exist
if (!fs.existsSync(path.join(process.cwd(), originalFile))) {
  console.error(`Error: Original file not found: ${originalFile}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(process.cwd(), refactoredFile))) {
  console.error(`Error: Refactored file not found: ${refactoredFile}`);
  process.exit(1);
}

if (!fs.existsSync(validationScript)) {
  console.error(`Error: Validation script not found: ${validationScript}`);
  process.exit(1);
}

console.log(`Running validation: ${validationScript} ${originalFile} ${refactoredFile}`);

// Execute the validation script
const childProcess = spawn('node', [validationScript, originalFile, refactoredFile], {
  shell: true,
  stdio: 'inherit'
});

// Handle process completion
childProcess.on('close', (code) => {
  console.log(`\nValidation completed with exit code: ${code}`);
  process.exit(code);
});

// Handle errors
childProcess.on('error', (error) => {
  console.error(`Error executing validation: ${error.message}`);
  process.exit(1);
});
