/**
 * Refactor isNetworkBlockedError Method Script
 * 
 * This script refactors the isNetworkBlockedError method in TestAutomationRunner
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

// Find the isNetworkBlockedError method
const methodRegex = /\/\*\*\s*\n\s*\*\s*Detects if an error is related to network or corporate proxy blocks[\s\S]*?isNetworkBlockedError\s*\(\s*errorObj\s*\)\s*\{[\s\S]*?(?=\n\s*\/\*\*|\n\s*\}$)/;
const match = fileContent.match(methodRegex);

if (!match) {
  console.error('Could not find isNetworkBlockedError method in the file');
  process.exit(1);
}

// Original method content
const originalMethod = match[0];
console.log('Found isNetworkBlockedError method');

// Create the delegated version
const delegatedMethod = `/**
   * Checks if a test failure is due to network connectivity issues
   * 
   * @param {Object} errorObj - Error object to analyze
   * @returns {boolean} - True if the error is network-related
   */
  isNetworkBlockedError(errorObj) {
    // If ResultAnalyzer is available, delegate to it
    if (this.resultAnalyzer) {
      try {
        return this.resultAnalyzer.isNetworkBlockedError(errorObj);
      } catch (error) {
        console.warn('ResultAnalyzer.isNetworkBlockedError failed, falling back to built-in implementation:', error.message);
        // Fall through to built-in implementation
      }
    }
    
    // Original implementation
    const detector = new NetworkErrorDetector();
    return detector.isNetworkError(errorObj.error) || detector.isCorporateProxyBlock(errorObj.error);`;

// Replace the method in the file content
const updatedContent = fileContent.replace(methodRegex, delegatedMethod);

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
- Refactored \`isNetworkBlockedError\` method in \`TestAutomationRunner\` to delegate to \`ResultAnalyzer\`
- Added fallback to original implementation if delegation fails
`;

if (fs.existsSync(changelogFile)) {
  fs.appendFileSync(changelogFile, changelogEntry);
} else {
  fs.writeFileSync(changelogFile, `# Changelog\n${changelogEntry}`);
}

console.log('✓ Refactoring completed successfully');
