#!/usr/bin/env node

/**
 * Deployment Verification Test Runner
 * 
 * This script runs the deployment verification tests and reports results.
 * It's designed to be used in CI/CD pipelines to verify deployments before
 * routing traffic to them.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_TIMEOUT = 60000; // 60 seconds
const REPORT_DIR = path.join(__dirname, '../test-results/verification');
const TEST_DIR = path.join(__dirname, '../tests/verification');

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Get target host from environment or use default
const TEST_HOST = process.env.TEST_HOST || 'localhost:3000';
console.log(`Running verification tests against: ${TEST_HOST}`);

// Generate timestamp for reports
const timestamp = new Date().toISOString().replace(/:/g, '-');
const reportFile = path.join(REPORT_DIR, `verification-${timestamp}.json`);

// Run tests using Mocha
const mochaArgs = [
  '--require', 'chai',
  '--reporter', 'json',
  '--reporter-options', `output=${reportFile}`,
  '--timeout', TEST_TIMEOUT.toString(),
  TEST_DIR
];

console.log('Starting verification tests...');
const testProcess = spawn('mocha', mochaArgs, {
  env: {
    ...process.env,
    TEST_HOST
  },
  stdio: 'inherit'
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Verification tests passed successfully!');
    console.log(`Full report available at: ${reportFile}`);
    
    // Read the report to display a summary
    try {
      const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      console.log('\nTest Summary:');
      console.log(`- Passing: ${report.stats.passes}`);
      console.log(`- Failing: ${report.stats.failures}`);
      console.log(`- Duration: ${report.stats.duration}ms`);
    } catch (err) {
      console.error('Error reading test report:', err);
    }
    
    process.exit(0);
  } else {
    console.error('❌ Verification tests failed!');
    console.error(`See report at: ${reportFile} for details`);
    
    // Try to read the report to show failures
    try {
      const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      console.error('\nFailures:');
      const failures = report.failures || [];
      failures.forEach((failure, index) => {
        console.error(`${index + 1}. ${failure.fullTitle}`);
        console.error(`   ${failure.err.message}`);
      });
    } catch (err) {
      console.error('Error reading test report:', err);
    }
    
    process.exit(1);
  }
});
