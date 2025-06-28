/**
 * End-to-End Tests for Test Automation Framework
 * 
 * These tests validate the complete workflow of the test automation framework,
 * from test execution to result analysis and reporting.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

// Import the main test automation runner
const TestAutomationRunner = require('../../auto-test-runner');

describe('Test Automation Framework E2E', () => {
  // Setup temporary directory for test files and results
  const tempDir = path.join(os.tmpdir(), 'test-automation-e2e-' + Date.now());
  const testResultsDir = path.join(tempDir, 'test-results');
  
  beforeAll(() => {
    // Create temp directories
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    // Create sample test files
    createSampleTestFiles(tempDir);
  });
  
  afterAll(() => {
    // Clean up temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error(`Error cleaning up temp directory: ${err.message}`);
    }
  });
  
  test('should execute the complete test automation workflow', async () => {
    // Create test automation runner instance
    const runner = new TestAutomationRunner({
      maxRetries: 2,
      testCommand: `npx jest --config=${path.join(tempDir, 'jest.config.js')}`,
      outputDir: testResultsDir,
      aiEnabled: false // Disable AI for E2E tests
    });
    
    // Execute the test automation workflow
    const results = await runner.runTestsWithAutoFix();
    
    // Validate results
    expect(results).toBeDefined();
    expect(results.summary).toBeDefined();
    expect(results.summary.totalTests).toBeGreaterThan(0);
    expect(results.summary.passedTests).toBeGreaterThan(0);
    expect(results.summary.failedTests).toBeGreaterThan(0); // We expect some failures due to our sample tests
    
    // Verify result files were created
    expect(fs.existsSync(path.join(testResultsDir, 'test-results.json'))).toBe(true);
    expect(fs.existsSync(path.join(testResultsDir, 'test-summary.json'))).toBe(true);
    expect(fs.existsSync(path.join(testResultsDir, 'execution-log.txt'))).toBe(true);
  }, 60000);
  
  test('should generate analysis reports from test results', async () => {
    // Run the analyze-test-results script
    const analyzeScript = path.resolve(__dirname, '../../scripts/analyze-test-results.js');
    
    // Set environment variables for the script
    process.env.TEST_RESULTS_DIR = testResultsDir;
    process.env.ANALYSIS_DIR = path.join(testResultsDir, 'analysis');
    
    try {
      execSync(`node "${analyzeScript}"`, {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'pipe'
      });
      
      // Verify analysis files were created
      expect(fs.existsSync(path.join(testResultsDir, 'analysis'))).toBe(true);
      expect(fs.existsSync(path.join(testResultsDir, 'analysis', 'analysis-report.md'))).toBe(true);
      expect(fs.existsSync(path.join(testResultsDir, 'analysis', 'analysis-data.json'))).toBe(true);
    } catch (error) {
      console.error(`Error running analysis script: ${error.message}`);
      console.error(error.stdout?.toString() || 'No stdout');
      console.error(error.stderr?.toString() || 'No stderr');
      throw error;
    }
  }, 30000);
  
  test('should check for recurring failures', async () => {
    // Run the check-recurring-failures script
    const checkFailuresScript = path.resolve(__dirname, '../../scripts/check-recurring-failures.js');
    
    // Set environment variables for the script
    process.env.TEST_RESULTS_DIR = testResultsDir;
    process.env.ANALYSIS_DIR = path.join(testResultsDir, 'analysis');
    process.env.ISSUES_DIR = path.join(testResultsDir, 'issues');
    
    try {
      execSync(`node "${checkFailuresScript}"`, {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'pipe'
      });
      
      // Verify issues directory was created
      expect(fs.existsSync(path.join(testResultsDir, 'issues'))).toBe(true);
    } catch (error) {
      // The script might exit with non-zero if it finds issues, which is expected
      console.log(`Check failures script output: ${error.stdout?.toString() || 'No stdout'}`);
    }
  }, 30000);
  
  test('should integrate with CI/CD pipeline', async () => {
    // Simulate a CI environment
    process.env.CI = 'true';
    process.env.GITHUB_ACTIONS = 'true';
    process.env.GITHUB_WORKFLOW = 'Test Automation';
    process.env.GITHUB_RUN_ID = '12345';
    
    // Create test automation runner instance with CI-specific settings
    const runner = new TestAutomationRunner({
      maxRetries: 1,
      testCommand: `npx jest --config=${path.join(tempDir, 'jest.config.js')}`,
      outputDir: path.join(testResultsDir, 'ci-run'),
      ciMode: true
    });
    
    // Execute the test automation workflow
    const results = await runner.runTestsWithAutoFix();
    
    // Validate results
    expect(results).toBeDefined();
    expect(results.summary).toBeDefined();
    expect(results.summary.totalTests).toBeGreaterThan(0);
    
    // Verify CI-specific result files were created
    expect(fs.existsSync(path.join(testResultsDir, 'ci-run', 'test-results.json'))).toBe(true);
    expect(fs.existsSync(path.join(testResultsDir, 'ci-run', 'test-summary.json'))).toBe(true);
    
    // Clean up environment variables
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITHUB_WORKFLOW;
    delete process.env.GITHUB_RUN_ID;
  }, 60000);
});

/**
 * Create sample test files for E2E testing
 * @param {string} tempDir - Temporary directory path
 */
function createSampleTestFiles(tempDir) {
  // Create Jest config
  const jestConfig = `
    module.exports = {
      testEnvironment: 'node',
      testMatch: ['**/*.test.js'],
      verbose: true,
      testTimeout: 5000
    };
  `;
  fs.writeFileSync(path.join(tempDir, 'jest.config.js'), jestConfig);
  
  // Create a directory for sample tests
  const testsDir = path.join(tempDir, 'tests');
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir);
  }
  
  // Create a passing test
  const passingTest = `
    describe('Passing Test Suite', () => {
      test('should pass', () => {
        expect(1 + 1).toBe(2);
      });
      
      test('should also pass', () => {
        expect('hello').toContain('hell');
      });
    });
  `;
  fs.writeFileSync(path.join(testsDir, 'passing.test.js'), passingTest);
  
  // Create a failing test
  const failingTest = `
    describe('Failing Test Suite', () => {
      test('should fail', () => {
        expect(1 + 1).toBe(3);
      });
      
      test('should pass', () => {
        expect(true).toBe(true);
      });
    });
  `;
  fs.writeFileSync(path.join(testsDir, 'failing.test.js'), failingTest);
  
  // Create a test with syntax error
  const syntaxErrorTest = `
    describe('Syntax Error Test Suite', () => {
      test('has syntax error', () => {
        const x = {
          a: 1,
          b: 2,
        // Missing closing brace
        expect(x.a).toBe(1);
      });
    });
  `;
  fs.writeFileSync(path.join(testsDir, 'syntax-error.test.js'), syntaxErrorTest);
  
  // Create a test with timeout
  const timeoutTest = `
    describe('Timeout Test Suite', () => {
      test('should timeout', () => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve();
          }, 10000); // This will exceed the 5000ms timeout in Jest config
        });
      });
    });
  `;
  fs.writeFileSync(path.join(testsDir, 'timeout.test.js'), timeoutTest);
}



