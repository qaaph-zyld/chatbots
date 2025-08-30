#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * 
 * This script runs all tests and generates a comprehensive coverage report.
 * It helps identify testing gaps and ensures we maintain 99% test coverage.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const config = {
  testCommands: [
    { name: 'Unit Tests', command: 'npm run test:unit -- --coverage' },
    { name: 'Integration Tests', command: 'npm run test:integration' },
    { name: 'E2E Tests', command: 'npm run test:e2e' },
    { name: 'UI Tests', command: 'npm run test:ui' }
  ],
  reportDir: './test-reports',
  coverageDir: './coverage'
};

// Create report directory if it doesn't exist
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
}

/**
 * Run a command and log output
 * 
 * @param {string} command - Command to run
 * @returns {Promise<{exitCode: number, output: string}>}
 */
function runCommand(command) {
  console.log(`\n🚀 Running: ${command}\n`);
  
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    
    return { exitCode: 0, output };
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return { exitCode: 1, output: error.stdout || '' };
  }
}

/**
 * Generate a summary report
 * 
 * @param {Array} results - Test results
 */
function generateSummaryReport(results) {
  console.log('\n📊 Generating test summary report...');
  
  const reportPath = path.join(config.reportDir, 'test-summary.md');
  
  let report = '# Test Coverage Summary\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Add test results
  report += '## Test Results\n\n';
  report += '| Test Type | Status |\n';
  report += '|-----------|--------|\n';
  
  results.forEach(result => {
    const { name, exitCode } = result;
    const status = exitCode === 0 ? '✅ PASS' : '❌ FAIL';
    report += `| ${name} | ${status} |\n`;
  });
  
  report += '\n';
  
  // Add coverage summary if available
  if (fs.existsSync(path.join(config.coverageDir, 'coverage-summary.json'))) {
    try {
      const coverageSummary = JSON.parse(
        fs.readFileSync(path.join(config.coverageDir, 'coverage-summary.json'), 'utf8')
      );
      
      const total = coverageSummary.total;
      
      report += '## Coverage Summary\n\n';
      report += '| Type | Coverage | Target |\n';
      report += '|------|----------|--------|\n';
      report += `| Statements | ${total.statements.pct.toFixed(2)}% | 99% |\n`;
      report += `| Branches | ${total.branches.pct.toFixed(2)}% | 95% |\n`;
      report += `| Functions | ${total.functions.pct.toFixed(2)}% | 99% |\n`;
      report += `| Lines | ${total.lines.pct.toFixed(2)}% | 99% |\n\n`;
      
      // Identify files with low coverage
      report += '## Files Needing Improvement\n\n';
      report += '| File | Statements | Branches | Functions | Lines |\n';
      report += '|------|------------|----------|-----------|-------|\n';
      
      let lowCoverageFiles = [];
      
      Object.entries(coverageSummary).forEach(([file, coverage]) => {
        if (file === 'total') return;
        
        const { statements, branches, functions, lines } = coverage;
        
        if (
          statements.pct < 90 || 
          branches.pct < 85 || 
          functions.pct < 90 || 
          lines.pct < 90
        ) {
          lowCoverageFiles.push({
            file,
            statements: statements.pct.toFixed(2),
            branches: branches.pct.toFixed(2),
            functions: functions.pct.toFixed(2),
            lines: lines.pct.toFixed(2)
          });
        }
      });
      
      // Sort by statement coverage
      lowCoverageFiles.sort((a, b) => parseFloat(a.statements) - parseFloat(b.statements));
      
      lowCoverageFiles.forEach(file => {
        report += `| ${file.file} | ${file.statements}% | ${file.branches}% | ${file.functions}% | ${file.lines}% |\n`;
      });
      
      report += '\n';
    } catch (error) {
      console.error('Error parsing coverage summary:', error);
      report += '## Coverage Summary\n\nError parsing coverage data.\n\n';
    }
  }
  
  // Add next steps
  report += '## Next Steps\n\n';
  report += '1. Focus on improving test coverage for the files listed above\n';
  report += '2. Add more edge case tests for complex functions\n';
  report += '3. Improve branch coverage with conditional test cases\n';
  report += '4. Add more integration tests for service interactions\n';
  report += '5. Expand E2E test scenarios for critical user flows\n';
  
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Report saved to ${reportPath}`);
}

/**
 * Check if dependency installation is needed
 * 
 * @returns {Promise<boolean>} True if installation is needed
 */
async function checkDependencies() {
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    return true;
  }
  
  // Check if package.json is newer than node_modules
  const packageJsonStat = fs.statSync('package.json');
  const nodeModulesStat = fs.statSync('node_modules');
  
  return packageJsonStat.mtime > nodeModulesStat.mtime;
}

/**
 * Ask user for confirmation
 * 
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} User response
 */
async function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(`${question} (y/n) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Install dependencies with proxy if needed
 */
async function installDependencies() {
  console.log('\n📦 Checking dependencies...');
  
  const needsInstallation = await checkDependencies();
  
  if (needsInstallation) {
    console.log('Dependencies need to be installed or updated.');
    
    try {
      console.log('\n🔄 Installing dependencies...');
      runCommand('npm install');
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error.message);
      
      const useProxy = await askForConfirmation('Would you like to try installing with proxy?');
      
      if (useProxy) {
        console.log('\n🔄 Setting proxy and installing dependencies...');
        runCommand('npm config set proxy http://104.129.196.38:10563');
        runCommand('npm config set https-proxy http://104.129.196.38:10563');
        runCommand('npm install');
        
        const resetProxy = await askForConfirmation('Would you like to reset proxy settings?');
        
        if (resetProxy) {
          console.log('\n🔄 Resetting proxy settings...');
          runCommand('npm config delete proxy');
          runCommand('npm config delete https-proxy');
        }
      }
    }
  } else {
    console.log('Dependencies are up to date.');
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🧪 Comprehensive Test Runner');
  console.log('===========================');
  
  // Check and install dependencies if needed
  await installDependencies();
  
  // Run test gap analysis
  console.log('\n🔍 Running test gap analysis...');
  runCommand('node scripts/test-gap-analyzer.js');
  
  // Run all test commands
  console.log('\n🧪 Running all tests...');
  
  const results = [];
  
  for (const { name, command } of config.testCommands) {
    console.log(`\n📋 ${name}`);
    console.log('------------------');
    
    const result = runCommand(command);
    results.push({ name, exitCode: result.exitCode });
  }
  
  // Generate summary report
  generateSummaryReport(results);
  
  console.log('\n✅ All tests completed!');
  console.log('\n📊 Check the test reports in the test-reports directory.');
}

// Run the script
main().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
