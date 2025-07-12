/**
 * Refactor getParsedResults Method Script
 * 
 * This script refactors the getParsedResults method in TestAutomationRunner
 * to delegate to the ResultAnalyzer helper class.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// File paths
const projectRoot = path.join(__dirname, '..');
const targetFile = path.join(projectRoot, 'auto-test-runner.js');
const backupFile = `${targetFile}.bak`;
const changelogFile = path.join(projectRoot, 'changelog.md');

// Create backup
console.log(`Creating backup of ${targetFile}`);
fs.copyFileSync(targetFile, backupFile);
console.log(`Backup created at ${backupFile}`);

// Read file content
console.log(`Reading ${targetFile}`);
const fileContent = fs.readFileSync(targetFile, 'utf8');

// Find the getParsedResults method (including JSDoc and closing brace)
const methodPattern = /\/\*\*\s*\n\s*\*\s*Gets parsed test results[\s\S]*?getParsedResults\s*\(\s*testResult\s*\)\s*\{[\s\S]*?\n\s*\}/;
const match = fileContent.match(methodPattern);

if (!match) {
  console.error('Could not find getParsedResults method in the file');
  process.exit(1);
}

// Original method content
const originalMethod = match[0];
console.log('Found getParsedResults method');

// Create the delegated version
const delegatedMethod = `/**
   * Gets parsed test results using the configured parser
   * 
   * @param {Object} testResult - Raw test execution result
   * @returns {Object|null} - Parsed test results or null if parsing failed
   */
  getParsedResults(testResult) {
    // If ResultAnalyzer is available, delegate to it
    if (this.resultAnalyzer) {
      try {
        return this.resultAnalyzer.getParsedResults(testResult, this.parser);
      } catch (error) {
        console.warn('ResultAnalyzer.getParsedResults failed, falling back to built-in implementation:', error.message);
        // Fall through to built-in implementation
      }
    }
    
    // Original implementation
    if (!this.parser || !testResult || !testResult.stdout) {
      return null;
    }
    
    try {
      return this.parser.parse(testResult.stdout);
    } catch (error) {
      console.error('Failed to parse test results:', error.message);
      return null;
    }
  }`;

// Replace the method in the file content
const updatedContent = fileContent.replace(methodPattern, delegatedMethod);

// Validate the updated content
console.log('Validating updated content...');
try {
  new vm.Script(updatedContent, { filename: targetFile });
  console.log('✓ Syntax validation passed');
} catch (error) {
  console.error(`✗ Syntax validation failed: ${error.message}`);
  console.log('Restoring from backup...');
  fs.copyFileSync(backupFile, targetFile);
  console.log('Restored from backup');
  process.exit(1);
}

// Write the updated content
console.log(`Writing updated content to ${targetFile}`);
fs.writeFileSync(targetFile, updatedContent);

// Update changelog
console.log('Updating changelog');
const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
const changelogEntry = `
## ${timestamp}
- Refactored \`getParsedResults\` method in \`TestAutomationRunner\` to delegate to \`ResultAnalyzer\`
- Added fallback to original implementation if delegation fails
`;

if (fs.existsSync(changelogFile)) {
  fs.appendFileSync(changelogFile, changelogEntry);
} else {
  fs.writeFileSync(changelogFile, `# Changelog\n${changelogEntry}`);
}

console.log('✓ Refactoring completed successfully');

// Write a verification report to help track changes
const reportFile = path.join(projectRoot, 'test-results', 'refactoring-report.txt');
const reportDir = path.dirname(reportFile);

if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

const report = `
Refactoring Report - ${timestamp}
================================

Method: getParsedResults
Status: Successfully refactored
Delegated to: ResultAnalyzer.getParsedResults

Previous refactorings:
- runCommand -> TestExecutor.runCommand
- isNetworkBlockedError -> ResultAnalyzer.isNetworkBlockedError

Pending refactorings:
- getTestSummary -> ResultAnalyzer.getTestSummary
- extractFailedTests -> ResultAnalyzer.extractFailedTests
- createAIFixEngine -> FixApplier.createAIFixEngine
- analyzeTestFailures -> FixApplier.analyzeTestFailures
- applyAIFixes -> FixApplier.applyAIFixes
- runTestsWithAutoFix -> Orchestration of helper classes
`;

fs.writeFileSync(reportFile, report);
console.log(`Refactoring report written to: ${reportFile}`);
