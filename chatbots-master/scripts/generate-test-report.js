#!/usr/bin/env node

/**
 * Test Coverage Report Generator
 * 
 * This script analyzes test coverage and generates a detailed report
 * to help identify areas needing improvement to reach 99% coverage.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  coverageDir: './coverage',
  reportDir: './test-reports',
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
 * Run a command and capture output
 * 
 * @param {string} command - Command to run
 * @returns {string} Command output
 */
function runCommand(command) {
  console.log(`\n🚀 Running: ${command}\n`);
  
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return error.stdout || '';
  }
}

/**
 * Generate a coverage report
 */
function generateCoverageReport() {
  console.log('\n📊 Generating coverage report...');
  
  // Run tests with coverage
  runCommand('npm run test:coverage:json');
  
  // Check if coverage data exists
  const coverageSummaryPath = path.join(config.coverageDir, 'coverage-summary.json');
  
  if (!fs.existsSync(coverageSummaryPath)) {
    console.error('❌ No coverage data found. Run tests with coverage first.');
    return;
  }
  
  // Parse coverage data
  const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
  const total = coverageSummary.total;
  
  // Generate report
  const reportPath = path.join(config.reportDir, 'coverage-analysis.md');
  
  let report = '# Test Coverage Analysis\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Add coverage summary
  report += '## Coverage Summary\n\n';
  report += '| Type | Current | Target | Status |\n';
  report += '|------|---------|--------|--------|\n';
  
  const statementStatus = total.statements.pct >= config.thresholds.statements ? '✅' : '❌';
  const branchStatus = total.branches.pct >= config.thresholds.branches ? '✅' : '❌';
  const functionStatus = total.functions.pct >= config.thresholds.functions ? '✅' : '❌';
  const lineStatus = total.lines.pct >= config.thresholds.lines ? '✅' : '❌';
  
  report += `| Statements | ${total.statements.pct.toFixed(2)}% | ${config.thresholds.statements}% | ${statementStatus} |\n`;
  report += `| Branches | ${total.branches.pct.toFixed(2)}% | ${config.thresholds.branches}% | ${branchStatus} |\n`;
  report += `| Functions | ${total.functions.pct.toFixed(2)}% | ${config.thresholds.functions}% | ${functionStatus} |\n`;
  report += `| Lines | ${total.lines.pct.toFixed(2)}% | ${config.thresholds.lines}% | ${lineStatus} |\n\n`;
  
  // Calculate overall status
  const overallStatus = 
    total.statements.pct >= config.thresholds.statements &&
    total.branches.pct >= config.thresholds.branches &&
    total.functions.pct >= config.thresholds.functions &&
    total.lines.pct >= config.thresholds.lines;
  
  report += `## Overall Status: ${overallStatus ? '✅ PASS' : '❌ FAIL'}\n\n`;
  
  // Add files with low coverage
  report += '## Files Needing Improvement\n\n';
  
  const lowCoverageFiles = [];
  
  Object.entries(coverageSummary).forEach(([file, coverage]) => {
    if (file === 'total') return;
    
    const { statements, branches, functions, lines } = coverage;
    
    // Calculate how far each metric is from the threshold
    const statementGap = config.thresholds.statements - statements.pct;
    const branchGap = config.thresholds.branches - branches.pct;
    const functionGap = config.thresholds.functions - functions.pct;
    const lineGap = config.thresholds.lines - lines.pct;
    
    // Calculate a priority score based on the gaps
    const priorityScore = Math.max(statementGap, branchGap, functionGap, lineGap);
    
    if (priorityScore > 0) {
      lowCoverageFiles.push({
        file,
        statements: statements.pct.toFixed(2),
        branches: branches.pct.toFixed(2),
        functions: functions.pct.toFixed(2),
        lines: lines.pct.toFixed(2),
        priorityScore
      });
    }
  });
  
  // Sort by priority score (highest first)
  lowCoverageFiles.sort((a, b) => b.priorityScore - a.priorityScore);
  
  if (lowCoverageFiles.length === 0) {
    report += 'All files meet coverage thresholds! 🎉\n\n';
  } else {
    report += '| Priority | File | Statements | Branches | Functions | Lines |\n';
    report += '|----------|------|------------|----------|-----------|-------|\n';
    
    lowCoverageFiles.forEach((file, index) => {
      const priority = index < 5 ? 'High' : index < 10 ? 'Medium' : 'Low';
      report += `| ${priority} | ${file.file} | ${file.statements}% | ${file.branches}% | ${file.functions}% | ${file.lines}% |\n`;
    });
    
    report += '\n';
  }
  
  // Add recommendations
  report += '## Recommendations\n\n';
  
  if (lowCoverageFiles.length > 0) {
    report += '### High Priority Files\n\n';
    
    lowCoverageFiles.slice(0, 5).forEach(file => {
      report += `#### ${file.file}\n\n`;
      
      if (parseFloat(file.branches) < config.thresholds.branches) {
        report += '- **Add branch coverage tests**: Focus on conditional logic and error handling\n';
      }
      
      if (parseFloat(file.functions) < config.thresholds.functions) {
        report += '- **Add function tests**: Ensure all exported functions have tests\n';
      }
      
      if (parseFloat(file.statements) < config.thresholds.statements) {
        report += '- **Increase statement coverage**: Add tests for untested code paths\n';
      }
      
      report += '\n';
    });
  }
  
  report += '### General Recommendations\n\n';
  report += '1. **Run the test gap analyzer** to identify untested functions\n';
  report += '2. **Focus on branch coverage** by testing conditional logic and error handling\n';
  report += '3. **Add integration tests** for complex interactions between components\n';
  report += '4. **Improve E2E test coverage** for critical user flows\n';
  report += '5. **Add performance and security tests** to ensure robustness\n\n';
  
  // Save report
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Report saved to ${reportPath}`);
  
  // Print summary to console
  console.log('\n📊 Coverage Summary:');
  console.log(`Statements: ${total.statements.pct.toFixed(2)}% (Target: ${config.thresholds.statements}%) ${statementStatus}`);
  console.log(`Branches: ${total.branches.pct.toFixed(2)}% (Target: ${config.thresholds.branches}%) ${branchStatus}`);
  console.log(`Functions: ${total.functions.pct.toFixed(2)}% (Target: ${config.thresholds.functions}%) ${functionStatus}`);
  console.log(`Lines: ${total.lines.pct.toFixed(2)}% (Target: ${config.thresholds.lines}%) ${lineStatus}`);
  console.log(`\nOverall Status: ${overallStatus ? '✅ PASS' : '❌ FAIL'}`);
  
  if (lowCoverageFiles.length > 0) {
    console.log(`\n❗ ${lowCoverageFiles.length} files need improvement to reach coverage targets.`);
    console.log('Check the report for details.');
  } else {
    console.log('\n🎉 All files meet coverage thresholds!');
  }
}

/**
 * Main function
 */
function main() {
  console.log('📊 Test Coverage Report Generator');
  console.log('================================');
  
  generateCoverageReport();
  
  console.log('\n✅ Done!');
}

// Run the script
main();
