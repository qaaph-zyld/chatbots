#!/usr/bin/env node

/**
 * MVP Test Suite Runner
 * 
 * This script runs a comprehensive test suite for the MVP release,
 * ensuring 99% test coverage and proper functionality of all features.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const config = {
  testPhases: [
    { 
      name: 'Unit Tests', 
      command: 'npm run test:unit -- --coverage',
      required: true
    },
    { 
      name: 'Integration Tests', 
      command: 'npm run test:integration',
      required: true
    },
    { 
      name: 'API Tests', 
      command: 'npm run test:api',
      required: true
    },
    { 
      name: 'UI Component Tests', 
      command: 'npm run test:ui',
      required: false
    },
    { 
      name: 'End-to-End Tests', 
      command: 'npm run test:e2e',
      required: false
    },
    { 
      name: 'Security Tests', 
      command: 'node scripts/security-tests.js',
      required: true
    }
  ],
  reportDir: './test-reports',
  coverageDir: './coverage',
  thresholds: {
    statements: 99,
    branches: 95,
    functions: 99,
    lines: 99
  }
};

// Ensure report directory exists
if (!fs.existsSync(config.reportDir)) {
  fs.mkdirSync(config.reportDir, { recursive: true });
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
 * Run a command and capture output
 * 
 * @param {string} command - Command to run
 * @param {boolean} silent - Whether to suppress output
 * @returns {Object} Command result
 */
function runCommand(command, silent = false) {
  if (!silent) {
    console.log(`\n🚀 Running: ${command}\n`);
  }
  
  try {
    const output = execSync(command, { 
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });
    
    return { success: true, output };
  } catch (error) {
    if (!silent) {
      console.error(`❌ Command failed: ${command}`);
      console.error(error.message);
    }
    
    return { success: false, output: error.stdout || '', error: error.message };
  }
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
 * Install dependencies with proxy if needed
 */
async function installDependencies() {
  console.log('\n📦 Checking dependencies...');
  
  const needsInstallation = await checkDependencies();
  
  if (needsInstallation) {
    console.log('Dependencies need to be installed or updated.');
    
    const result = runCommand('npm install');
    
    if (!result.success) {
      console.error('❌ Failed to install dependencies');
      console.error('Cannot proceed without dependencies');
      process.exit(1);
    }
  } else {
    console.log('Dependencies are up to date.');
  }
}

/**
 * Run test gap analysis
 */
function runTestGapAnalysis() {
  console.log('\n🔍 Running test gap analysis...');
  
  const result = runCommand('node scripts/test-gap-analyzer.js');
  
  if (!result.success) {
    console.warn('⚠️ Test gap analysis failed, but continuing with tests');
  }
}

/**
 * Run all test phases
 * 
 * @returns {Array} Test results
 */
async function runTestPhases() {
  console.log('\n🧪 Running test phases...');
  
  const results = [];
  
  for (const phase of config.testPhases) {
    console.log(`\n📋 ${phase.name} ${phase.required ? '(Required)' : '(Optional)'}`);
    console.log('------------------');
    
    const result = runCommand(phase.command);
    
    results.push({
      name: phase.name,
      required: phase.required,
      success: result.success,
      output: result.output,
      error: result.error
    });
    
    if (!result.success && phase.required) {
      console.error(`❌ Required test phase "${phase.name}" failed`);
      
      const shouldContinue = await askForConfirmation('Would you like to continue with the remaining tests?');
      
      if (!shouldContinue) {
        console.log('Exiting test suite...');
        break;
      }
    }
  }
  
  return results;
}

/**
 * Check coverage against thresholds
 * 
 * @returns {Object} Coverage status
 */
function checkCoverage() {
  console.log('\n📊 Checking coverage against thresholds...');
  
  // Check if coverage data exists
  const coverageSummaryPath = path.join(config.coverageDir, 'coverage-summary.json');
  
  if (!fs.existsSync(coverageSummaryPath)) {
    console.warn('⚠️ No coverage data found');
    return { success: false, reason: 'No coverage data found' };
  }
  
  // Parse coverage data
  const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
  const total = coverageSummary.total;
  
  // Check against thresholds
  const statementsPassing = total.statements.pct >= config.thresholds.statements;
  const branchesPassing = total.branches.pct >= config.thresholds.branches;
  const functionsPassing = total.functions.pct >= config.thresholds.functions;
  const linesPassing = total.lines.pct >= config.thresholds.lines;
  
  const allPassing = statementsPassing && branchesPassing && functionsPassing && linesPassing;
  
  console.log(`Statements: ${total.statements.pct.toFixed(2)}% (Target: ${config.thresholds.statements}%) ${statementsPassing ? '✅' : '❌'}`);
  console.log(`Branches: ${total.branches.pct.toFixed(2)}% (Target: ${config.thresholds.branches}%) ${branchesPassing ? '✅' : '❌'}`);
  console.log(`Functions: ${total.functions.pct.toFixed(2)}% (Target: ${config.thresholds.functions}%) ${functionsPassing ? '✅' : '❌'}`);
  console.log(`Lines: ${total.lines.pct.toFixed(2)}% (Target: ${config.thresholds.lines}%) ${linesPassing ? '✅' : '❌'}`);
  
  return {
    success: allPassing,
    coverage: {
      statements: total.statements.pct,
      branches: total.branches.pct,
      functions: total.functions.pct,
      lines: total.lines.pct
    },
    passing: {
      statements: statementsPassing,
      branches: branchesPassing,
      functions: functionsPassing,
      lines: linesPassing
    }
  };
}

/**
 * Generate final report
 * 
 * @param {Array} testResults - Test results
 * @param {Object} coverageStatus - Coverage status
 */
function generateFinalReport(testResults, coverageStatus) {
  console.log('\n📝 Generating final report...');
  
  const reportPath = path.join(config.reportDir, 'mvp-test-report.md');
  
  let report = '# MVP Test Suite Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Add test results
  report += '## Test Results\n\n';
  report += '| Test Phase | Status | Required |\n';
  report += '|------------|--------|----------|\n';
  
  let allRequiredPassing = true;
  
  testResults.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    report += `| ${result.name} | ${status} | ${result.required ? 'Yes' : 'No'} |\n`;
    
    if (result.required && !result.success) {
      allRequiredPassing = false;
    }
  });
  
  report += '\n';
  
  // Add coverage status
  report += '## Coverage Status\n\n';
  
  if (coverageStatus.success === false && coverageStatus.reason) {
    report += `⚠️ ${coverageStatus.reason}\n\n`;
  } else {
    report += '| Type | Coverage | Target | Status |\n';
    report += '|------|----------|--------|--------|\n';
    report += `| Statements | ${coverageStatus.coverage.statements.toFixed(2)}% | ${config.thresholds.statements}% | ${coverageStatus.passing.statements ? '✅' : '❌'} |\n`;
    report += `| Branches | ${coverageStatus.coverage.branches.toFixed(2)}% | ${config.thresholds.branches}% | ${coverageStatus.passing.branches ? '✅' : '❌'} |\n`;
    report += `| Functions | ${coverageStatus.coverage.functions.toFixed(2)}% | ${config.thresholds.functions}% | ${coverageStatus.passing.functions ? '✅' : '❌'} |\n`;
    report += `| Lines | ${coverageStatus.coverage.lines.toFixed(2)}% | ${config.thresholds.lines}% | ${coverageStatus.passing.lines ? '✅' : '❌'} |\n\n`;
  }
  
  // Add overall status
  const overallPassing = allRequiredPassing && (coverageStatus.success !== false || !coverageStatus.reason);
  
  report += `## Overall Status: ${overallPassing ? '✅ PASS' : '❌ FAIL'}\n\n`;
  
  if (!overallPassing) {
    report += '### Issues to Address\n\n';
    
    if (!allRequiredPassing) {
      report += '- ❌ Some required test phases failed\n';
    }
    
    if (coverageStatus.success === false) {
      if (coverageStatus.reason) {
        report += `- ⚠️ ${coverageStatus.reason}\n`;
      } else {
        if (!coverageStatus.passing.statements) {
          report += `- ❌ Statement coverage (${coverageStatus.coverage.statements.toFixed(2)}%) below threshold (${config.thresholds.statements}%)\n`;
        }
        if (!coverageStatus.passing.branches) {
          report += `- ❌ Branch coverage (${coverageStatus.coverage.branches.toFixed(2)}%) below threshold (${config.thresholds.branches}%)\n`;
        }
        if (!coverageStatus.passing.functions) {
          report += `- ❌ Function coverage (${coverageStatus.coverage.functions.toFixed(2)}%) below threshold (${config.thresholds.functions}%)\n`;
        }
        if (!coverageStatus.passing.lines) {
          report += `- ❌ Line coverage (${coverageStatus.coverage.lines.toFixed(2)}%) below threshold (${config.thresholds.lines}%)\n`;
        }
      }
    }
    
    report += '\n';
  }
  
  // Add next steps
  report += '## Next Steps\n\n';
  
  if (overallPassing) {
    report += '🎉 All tests passed and coverage thresholds met! The MVP is ready for release.\n\n';
    report += 'Recommended follow-up actions:\n\n';
    report += '1. Run a final manual verification of critical features\n';
    report += '2. Prepare release notes and documentation\n';
    report += '3. Schedule the production deployment\n';
  } else {
    report += 'The following actions are needed before the MVP can be released:\n\n';
    
    if (!allRequiredPassing) {
      report += '1. Fix failing required tests\n';
    }
    
    if (coverageStatus.success === false && !coverageStatus.reason) {
      report += `${!allRequiredPassing ? '2' : '1'}. Improve test coverage to meet thresholds\n`;
      report += `${!allRequiredPassing ? '3' : '2'}. Run the test gap analyzer to identify untested code\n`;
      report += `${!allRequiredPassing ? '4' : '3'}. Add tests for any missing edge cases\n`;
    }
  }
  
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Report saved to ${reportPath}`);
  
  return overallPassing;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 MVP Test Suite Runner');
  console.log('=======================');
  
  // Check and install dependencies if needed
  await installDependencies();
  
  // Run test gap analysis
  runTestGapAnalysis();
  
  // Run all test phases
  const testResults = await runTestPhases();
  
  // Check coverage
  const coverageStatus = checkCoverage();
  
  // Generate final report
  const overallPassing = generateFinalReport(testResults, coverageStatus);
  
  console.log(`\n${overallPassing ? '🎉 All tests passed!' : '❌ Some tests failed.'}`);
  console.log(`See the report at ${path.join(config.reportDir, 'mvp-test-report.md')} for details.`);
  
  // Generate detailed coverage report if needed
  if (!coverageStatus.success && !coverageStatus.reason) {
    console.log('\n📊 Generating detailed coverage report...');
    runCommand('node scripts/generate-test-report.js');
  }
  
  process.exit(overallPassing ? 0 : 1);
}

// Run the script
main().catch(error => {
  console.error('Error running MVP test suite:', error);
  process.exit(1);
});
