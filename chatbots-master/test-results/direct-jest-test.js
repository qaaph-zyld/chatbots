/**
 * Direct Jest execution test
 * This script directly executes Jest using child_process.spawn to avoid any issues with the test runner
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create a timestamp for the JSON output file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const jsonOutputFile = path.join(__dirname, `direct-jest-results-${timestamp}.json`);

console.log('Starting direct Jest execution test...');
console.log(`JSON output will be saved to: ${jsonOutputFile}`);

// Ensure output directory exists
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Log file paths
const stdoutFile = path.join(outputDir, `direct-stdout-${timestamp}.txt`);
const stderrFile = path.join(outputDir, `direct-stderr-${timestamp}.txt`);

// Create write streams for stdout and stderr
const stdoutStream = fs.createWriteStream(stdoutFile);
const stderrStream = fs.createWriteStream(stderrFile);

// Build the Jest command
const args = [
  'jest',
  'test-results/sample-tests/baseline.test.js',
  '--config=test-results/baseline-jest.config.js',
  '--json',
  `--outputFile=${jsonOutputFile}`
];

console.log(`Running command: npx ${args.join(' ')}`);

// Spawn the Jest process
const jestProcess = spawn('npx', args, {
  cwd: process.cwd(),
  shell: true,
  stdio: 'pipe'
});

// Pipe stdout and stderr to both console and files
jestProcess.stdout.on('data', (data) => {
  const chunk = data.toString();
  process.stdout.write(chunk);
  stdoutStream.write(chunk);
});

jestProcess.stderr.on('data', (data) => {
  const chunk = data.toString();
  process.stderr.write(chunk);
  stderrStream.write(chunk);
});

// Handle process completion
jestProcess.on('close', (code) => {
  console.log(`Jest process exited with code: ${code}`);
  
  // Close the file streams
  stdoutStream.end();
  stderrStream.end();
  
  // Check if the JSON file was created
  if (fs.existsSync(jsonOutputFile)) {
    console.log(`✅ JSON output file was successfully created at: ${jsonOutputFile}`);
    
    // Read and parse the JSON file to verify its contents
    try {
      const jsonContent = fs.readFileSync(jsonOutputFile, 'utf8');
      const parsedResults = JSON.parse(jsonContent);
      console.log('JSON file contents are valid.');
      console.log(`Test summary: ${parsedResults.numPassedTests} passed, ${parsedResults.numFailedTests} failed`);
    } catch (error) {
      console.error(`Error parsing JSON file: ${error.message}`);
    }
  } else {
    console.error('❌ JSON output file was not created!');
  }
});

// Handle process errors
jestProcess.on('error', (error) => {
  console.error(`Error running Jest: ${error.message}`);
  stderrStream.write(`Error running Jest: ${error.message}\n`);
  stderrStream.end();
});

// Set a timeout to prevent hanging
const timeout = setTimeout(() => {
  console.log('Jest process timed out after 60 seconds');
  jestProcess.kill();
}, 60000);

// Clear the timeout if the process completes
jestProcess.on('close', () => {
  clearTimeout(timeout);
});
