/**
 * Reliable Validation Script Runner
 * 
 * This script provides a reliable way to run validation scripts and capture their output,
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
const stdoutFile = path.join(outputDir, `validation-stdout-${timestamp}.txt`);
const stderrFile = path.join(outputDir, `validation-stderr-${timestamp}.txt`);
const resultFile = path.join(outputDir, `validation-result-${timestamp}.json`);

// Parse command line arguments
if (process.argv.length < 4) {
  console.error('Usage: node reliable-validation.js <validation-script> <original-file> <refactored-file>');
  process.exit(1);
}

const validationScript = process.argv[2];
const originalFile = process.argv[3];
const refactoredFile = process.argv[4];

// Validate file paths
for (const file of [validationScript, originalFile, refactoredFile]) {
  if (!fs.existsSync(file)) {
    console.error(`Error: File not found: ${file}`);
    process.exit(1);
  }
}

console.log(`Running validation: ${validationScript} ${originalFile} ${refactoredFile}`);

// Execute the command with proper shell handling
const childProcess = spawn('node', [validationScript, originalFile, refactoredFile], {
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

// Also display output in real-time
childProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

childProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle process completion
childProcess.on('close', (code) => {
  const result = {
    command: `node ${validationScript} ${originalFile} ${refactoredFile}`,
    exitCode: code,
    timestamp: new Date().toISOString(),
    stdoutFile,
    stderrFile
  };
  
  // Write result to file
  fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
  
  // Output summary
  console.log(`\nValidation completed with exit code: ${code}`);
  console.log(`Output saved to:\n- ${stdoutFile}\n- ${stderrFile}\n- ${resultFile}`);
  
  // Exit with the same code
  process.exit(code);
});

// Handle errors
childProcess.on('error', (error) => {
  console.error(`Error executing validation: ${error.message}`);
  fs.writeFileSync(resultFile, JSON.stringify({ error: error.message }, null, 2));
  process.exit(1);
});

// Set a timeout to prevent hanging
const timeoutMs = 60000; // 60 seconds
const timeout = setTimeout(() => {
  console.error(`Validation timed out after ${timeoutMs / 1000} seconds`);
  childProcess.kill();
  fs.writeFileSync(resultFile, JSON.stringify({ error: 'Timeout' }, null, 2));
  process.exit(1);
}, timeoutMs);

// Clear timeout if process completes
childProcess.on('close', () => {
  clearTimeout(timeout);
});
