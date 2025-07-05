/**
 * Custom Jest reporter for deployment tests
 * 
 * This reporter creates a JSON summary of test results that can be easily
 * parsed by CI/CD tools to make deployment decisions.
 */

const fs = require('fs');
const path = require('path');

class DeploymentReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options || {};
    
    // Ensure we have an output file
    this._outputFile = this._options.outputFile || 'deployment-test-results.json';
    
    // Create directory if it doesn't exist
    const outputDir = path.dirname(this._outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Initialize results
    this._results = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      target: process.env.TEST_HOST || 'unknown',
      summary: {
        numTotalTests: 0,
        numPassedTests: 0,
        numFailedTests: 0,
        numPendingTests: 0,
        numTodoTests: 0,
        startTime: 0,
        endTime: 0,
        duration: 0
      },
      testSuites: [],
      consoleOutput: []
    };
    
    // Capture console output if requested
    if (this._options.includeConsoleOutput) {
      this._captureConsoleOutput();
    }
  }
  
  _captureConsoleOutput() {
    // Store original console methods
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };
    
    // Override console methods to capture output
    console.log = (...args) => {
      this._results.consoleOutput.push({ type: 'log', message: args.join(' ') });
      originalConsole.log(...args);
    };
    
    console.warn = (...args) => {
      this._results.consoleOutput.push({ type: 'warn', message: args.join(' ') });
      originalConsole.warn(...args);
    };
    
    console.error = (...args) => {
      this._results.consoleOutput.push({ type: 'error', message: args.join(' ') });
      originalConsole.error(...args);
    };
    
    console.info = (...args) => {
      this._results.consoleOutput.push({ type: 'info', message: args.join(' ') });
      originalConsole.info(...args);
    };
  }
  
  onRunStart(aggregatedResults, options) {
    this._results.summary.startTime = new Date().getTime();
  }
  
  onTestResult(test, testResult, aggregatedResults) {
    const { numFailingTests, numPassingTests, numPendingTests, numTodoTests, testResults } = testResult;
    
    // Update summary
    this._results.summary.numTotalTests += numFailingTests + numPassingTests + numPendingTests + numTodoTests;
    this._results.summary.numPassedTests += numPassingTests;
    this._results.summary.numFailedTests += numFailingTests;
    this._results.summary.numPendingTests += numPendingTests;
    this._results.summary.numTodoTests += numTodoTests;
    
    // If any test fails, mark the overall result as failed
    if (numFailingTests > 0) {
      this._results.success = false;
    }
    
    // Add test suite details
    const testSuite = {
      name: testResult.testFilePath,
      numPassingTests,
      numFailingTests,
      numPendingTests,
      numTodoTests,
      tests: testResults.map(result => ({
        title: result.fullName,
        status: result.status,
        duration: result.duration,
        failureMessages: result.failureMessages
      }))
    };
    
    this._results.testSuites.push(testSuite);
  }
  
  onRunComplete(contexts, results) {
    this._results.summary.endTime = new Date().getTime();
    this._results.summary.duration = this._results.summary.endTime - this._results.summary.startTime;
    
    // Add deployment decision recommendation
    this._results.deploymentRecommendation = {
      shouldProceed: this._results.success,
      reason: this._results.success 
        ? 'All tests passed successfully' 
        : `${this._results.summary.numFailedTests} tests failed`
    };
    
    // Add git information if available
    try {
      const execSync = require('child_process').execSync;
      this._results.git = {
        commit: execSync('git rev-parse HEAD').toString().trim(),
        branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
        author: execSync('git log -1 --pretty=format:%an').toString().trim(),
        message: execSync('git log -1 --pretty=format:%s').toString().trim()
      };
    } catch (error) {
      this._results.git = { error: 'Unable to retrieve git information' };
    }
    
    // Write results to file
    fs.writeFileSync(
      this._outputFile,
      JSON.stringify(this._results, null, 2)
    );
    
    // Log summary
    console.log('\nDeployment Test Summary:');
    console.log(`Total: ${this._results.summary.numTotalTests}`);
    console.log(`Passed: ${this._results.summary.numPassedTests}`);
    console.log(`Failed: ${this._results.summary.numFailedTests}`);
    console.log(`Duration: ${this._results.summary.duration}ms`);
    console.log(`Recommendation: ${this._results.deploymentRecommendation.shouldProceed ? 'PROCEED' : 'ABORT'}`);
    console.log(`Results written to: ${this._outputFile}`);
  }
}

module.exports = DeploymentReporter;
