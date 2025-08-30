/**
 * Test Diagnostics Script
 * 
 * This script runs Jest tests in a controlled way to identify and diagnose test failures.
 * It captures detailed information about each test failure and generates a comprehensive report.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

// Configuration
const config = {
  outputDir: path.join(__dirname, 'test-results'),
  summaryFile: path.join(__dirname, 'test-results', 'test-summary.json'),
  detailedFile: path.join(__dirname, 'test-results', 'detailed-test-results.txt'),
  testTimeout: 30000, // 30 seconds per test
  testCategories: [
    { name: 'Unit Tests', pattern: 'src/tests/unit' },
    { name: 'Integration Tests', pattern: 'src/tests/integration' },
    { name: 'Service Tests', pattern: 'src/tests/services' },
    { name: 'Controller Tests', pattern: 'src/tests/controllers' },
    { name: 'Model Tests', pattern: 'src/tests/models' }
  ]
};

// Statistics tracking
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  timedOut: 0,
  errors: [],
  testFiles: {},
  errorPatterns: {}
};

/**
 * Run a Jest test with the specified pattern
 * @param {string} pattern - Test file pattern to run
 * @param {string} categoryName - Name of the test category
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
async function runTest(pattern, categoryName) {
  return new Promise((resolve) => {
    console.log(`Running ${categoryName}: ${pattern}`);
    
    const args = [
      'jest',
      pattern,
      '--verbose',
      '--no-coverage',
      `--testTimeout=${config.testTimeout}`,
      '--runInBand' // Run tests sequentially for better diagnostics
    ];
    
    const jestProcess = spawn('npx', args, { shell: true });
    
    let stdout = '';
    let stderr = '';
    
    jestProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });
    
    jestProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });
    
    jestProcess.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code });
    });
  });
}

/**
 * Parse test results from Jest output
 * @param {string} output - Jest output
 * @param {string} categoryName - Name of the test category
 */
function parseTestResults(output, categoryName) {
  // Extract test file paths
  const fileRegex = /FAIL\s+([\w\/\.-]+)/g;
  let match;
  
  while ((match = fileRegex.exec(output)) !== null) {
    const filePath = match[1];
    stats.testFiles[filePath] = { category: categoryName, failures: [] };
  }
  
  // Extract error messages
  const errorRegex = /● ([\w\s\d\.\-]+)([\s\S]*?)(?=●|\n\n|$)/g;
  
  while ((match = errorRegex.exec(output)) !== null) {
    const testName = match[1].trim();
    const errorMessage = match[2].trim();
    
    // Find the file this error belongs to
    for (const filePath in stats.testFiles) {
      if (output.includes(`${filePath} › ${testName}`)) {
        stats.testFiles[filePath].failures.push({
          test: testName,
          error: errorMessage
        });
        break;
      }
    }
    
    // Track error patterns
    const errorType = getErrorType(errorMessage);
    if (!stats.errorPatterns[errorType]) {
      stats.errorPatterns[errorType] = { count: 0, examples: [] };
    }
    
    stats.errorPatterns[errorType].count++;
    if (stats.errorPatterns[errorType].examples.length < 3) {
      stats.errorPatterns[errorType].examples.push({
        test: testName,
        message: errorMessage.split('\n')[0]
      });
    }
    
    stats.errors.push({ test: testName, error: errorMessage });
  }
  
  // Extract test counts
  const summaryMatch = output.match(/Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed,\s+(\d+)\s+total/);
  if (summaryMatch) {
    const failed = parseInt(summaryMatch[1], 10);
    const passed = parseInt(summaryMatch[2], 10);
    const total = parseInt(summaryMatch[3], 10);
    
    stats.failed += failed;
    stats.passed += passed;
    stats.total += total;
    stats.skipped += (total - (failed + passed));
  }
  
  // Check for timeouts
  const timeoutMatches = output.match(/Timeout - Async callback was not invoked within the (\d+)ms/g);
  if (timeoutMatches) {
    stats.timedOut += timeoutMatches.length;
  }
}

/**
 * Categorize error types based on error message patterns
 * @param {string} errorMessage - Error message to categorize
 * @returns {string} Error type
 */
function getErrorType(errorMessage) {
  if (errorMessage.includes('Cannot convert undefined or null to object')) {
    return 'NULL_OBJECT_CONVERSION';
  } else if (errorMessage.includes('OverwriteModelError')) {
    return 'OVERWRITE_MODEL_ERROR';
  } else if (errorMessage.includes('Cannot read properties of undefined')) {
    return 'UNDEFINED_PROPERTY_ACCESS';
  } else if (errorMessage.includes('Timeout - Async callback was not invoked')) {
    return 'TEST_TIMEOUT';
  } else if (errorMessage.includes('SyntaxError')) {
    return 'SYNTAX_ERROR';
  } else if (errorMessage.includes('MongoError') || errorMessage.includes('MongooseError')) {
    return 'MONGO_ERROR';
  } else if (errorMessage.includes('setInterval') || errorMessage.includes('setTimeout')) {
    return 'TIMER_ERROR';
  } else {
    return 'OTHER';
  }
}

/**
 * Generate a detailed report of test results
 * @returns {string} Formatted report
 */
function generateReport() {
  const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(2) : '0.00';
  
  let report = `# Test Diagnostics Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total Tests**: ${stats.total}\n`;
  report += `- **Passed**: ${stats.passed} (${passRate}%)\n`;
  report += `- **Failed**: ${stats.failed}\n`;
  report += `- **Skipped**: ${stats.skipped}\n`;
  report += `- **Timed Out**: ${stats.timedOut}\n\n`;
  
  report += `## Error Patterns\n\n`;
  
  for (const [errorType, data] of Object.entries(stats.errorPatterns)) {
    report += `### ${errorType} (${data.count} occurrences)\n\n`;
    
    if (data.examples.length > 0) {
      report += `**Examples**:\n\n`;
      data.examples.forEach((example, i) => {
        report += `${i + 1}. **${example.test}**: ${example.message}\n`;
      });
      report += '\n';
    }
  }
  
  report += `## Failed Test Files\n\n`;
  
  const failedFiles = Object.entries(stats.testFiles)
    .filter(([_, data]) => data.failures.length > 0)
    .sort((a, b) => b[1].failures.length - a[1].failures.length);
  
  failedFiles.forEach(([filePath, data]) => {
    report += `### ${filePath} (${data.failures.length} failures)\n\n`;
    report += `Category: ${data.category}\n\n`;
    
    data.failures.slice(0, 3).forEach((failure, i) => {
      report += `${i + 1}. **${failure.test}**\n`;
      report += '```\n';
      report += failure.error.split('\n').slice(0, 5).join('\n');
      report += '\n```\n\n';
    });
    
    if (data.failures.length > 3) {
      report += `... and ${data.failures.length - 3} more failures\n\n`;
    }
  });
  
  report += `## Recommendations\n\n`;
  
  // Generate recommendations based on error patterns
  if (stats.errorPatterns['NULL_OBJECT_CONVERSION']?.count > 0) {
    report += `- **Fix Mongoose Model Access**: Add null checks before accessing mongoose.modelSchemas\n`;
  }
  
  if (stats.errorPatterns['OVERWRITE_MODEL_ERROR']?.count > 0) {
    report += `- **Prevent Model Recompilation**: Implement a model registry to prevent duplicate model compilation\n`;
  }
  
  if (stats.errorPatterns['UNDEFINED_PROPERTY_ACCESS']?.count > 0) {
    report += `- **Add Null Checks**: Add defensive programming with null checks for object properties\n`;
  }
  
  if (stats.errorPatterns['TEST_TIMEOUT']?.count > 0) {
    report += `- **Fix Async Tests**: Ensure all async tests properly resolve or reject their promises\n`;
    report += `- **Mock Timers**: Use Jest's fake timers to prevent hanging tests\n`;
  }
  
  if (stats.errorPatterns['TIMER_ERROR']?.count > 0) {
    report += `- **Clean Up Timers**: Ensure all setInterval/setTimeout calls are cleared after tests\n`;
  }
  
  if (stats.errorPatterns['MONGO_ERROR']?.count > 0) {
    report += `- **Mock MongoDB**: Use an in-memory MongoDB for testing or better mocks\n`;
  }
  
  return report;
}

/**
 * Main function to run all tests and generate reports
 */
async function main() {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(config.outputDir)) {
      await mkdir(config.outputDir, { recursive: true });
    }
    
    console.log('Starting test diagnostics...');
    
    // Run tests for each category
    for (const category of config.testCategories) {
      const result = await runTest(category.pattern, category.name);
      parseTestResults(result.stdout + result.stderr, category.name);
    }
    
    // Generate and save reports
    const report = generateReport();
    await writeFile(config.detailedFile, report, 'utf8');
    await writeFile(config.summaryFile, JSON.stringify(stats, null, 2), 'utf8');
    
    console.log(`\nTest diagnostics complete!`);
    console.log(`Pass rate: ${(stats.passed / stats.total * 100).toFixed(2)}%`);
    console.log(`Detailed report saved to: ${config.detailedFile}`);
    console.log(`Summary data saved to: ${config.summaryFile}`);
    
  } catch (error) {
    console.error('Error running test diagnostics:', error);
  }
}

// Run the main function
main();
