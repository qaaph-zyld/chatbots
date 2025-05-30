/**
 * Test Report Generator
 * 
 * Runs tests and generates a detailed report on test pass rate and coverage
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  testCommand: 'npx jest --json',
  outputFile: path.join(__dirname, 'test-report-output.json'),
  summaryFile: path.join(__dirname, 'test-report-summary.json')
};

try {
  // Run tests with JSON output
  console.log('Running tests...');
  const testOutput = execSync(config.testCommand, { encoding: 'utf-8' });
  
  // Save raw output
  fs.writeFileSync(config.outputFile, testOutput);
  console.log(`Raw test output saved to ${config.outputFile}`);
  
  // Parse test results
  const testResults = JSON.parse(testOutput);
  
  // Calculate statistics
  const totalTests = testResults.numTotalTests;
  const passedTests = testResults.numPassedTests;
  const failedTests = testResults.numFailedTests;
  const pendingTests = testResults.numPendingTests;
  const passRate = (passedTests / totalTests) * 100;
  
  // Coverage data
  const coverageData = testResults.coverageMap || {};
  
  // Create summary
  const summary = {
    timestamp: new Date().toISOString(),
    testResults: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      pending: pendingTests,
      passRate: passRate.toFixed(2) + '%'
    },
    coverage: {
      statements: testResults.coverageMap ? testResults.coverageMap.total.statements.pct + '%' : 'N/A',
      branches: testResults.coverageMap ? testResults.coverageMap.total.branches.pct + '%' : 'N/A',
      functions: testResults.coverageMap ? testResults.coverageMap.total.functions.pct + '%' : 'N/A',
      lines: testResults.coverageMap ? testResults.coverageMap.total.lines.pct + '%' : 'N/A'
    }
  };
  
  // Save summary
  fs.writeFileSync(config.summaryFile, JSON.stringify(summary, null, 2));
  
  // Print summary to console
  console.log('\n=== TEST REPORT SUMMARY ===');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed Tests: ${passedTests}`);
  console.log(`Failed Tests: ${failedTests}`);
  console.log(`Pending Tests: ${pendingTests}`);
  console.log(`Pass Rate: ${passRate.toFixed(2)}%`);
  
  if (testResults.coverageMap) {
    console.log('\n=== COVERAGE SUMMARY ===');
    console.log(`Statements: ${testResults.coverageMap.total.statements.pct}%`);
    console.log(`Branches: ${testResults.coverageMap.total.branches.pct}%`);
    console.log(`Functions: ${testResults.coverageMap.total.functions.pct}%`);
    console.log(`Lines: ${testResults.coverageMap.total.lines.pct}%`);
  }
  
  console.log(`\nDetailed summary saved to ${config.summaryFile}`);
  
} catch (error) {
  console.error('Error running tests or generating report:', error.message);
  process.exit(1);
}
