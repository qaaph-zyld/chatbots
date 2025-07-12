/**
 * Refactor runCommand Method Script
 * 
 * This script refactors the runCommand method in TestAutomationRunner
 * to delegate to the TestExecutor helper class.
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

// Find the runCommand method
const runCommandRegex = /async\s+runCommand\s*\(\s*command\s*,\s*options\s*=\s*\{\s*\}\s*\)\s*\{[\s\S]*?(?=\n\s*\/\*\*|\n\s*\}$)/;
const match = fileContent.match(runCommandRegex);

if (!match) {
  console.error('Could not find runCommand method in the file');
  process.exit(1);
}

// Original method content
const originalMethod = match[0];
console.log('Found runCommand method');

// Create the delegated version
const delegatedMethod = `async runCommand(command, options = {}) {
    // If TestExecutor is available, delegate to it
    if (this.testExecutor) {
      try {
        return await this.testExecutor.runCommand(command, options);
      } catch (error) {
        const logger = options.logger;
        if (logger) {
          logger.warn('TestExecutor failed, falling back to built-in implementation', { error: error.message });
        } else {
          console.warn('TestExecutor failed, falling back to built-in implementation:', error.message);
        }
        // Fall through to built-in implementation
      }
    }
    
    ${originalMethod.substring(originalMethod.indexOf('console.log'))}`;

// Replace the method in the file content
const updatedContent = fileContent.replace(runCommandRegex, delegatedMethod);

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
- Refactored \`runCommand\` method in \`TestAutomationRunner\` to delegate to \`TestExecutor\`
- Added fallback to original implementation if delegation fails
`;

if (fs.existsSync(changelogFile)) {
  fs.appendFileSync(changelogFile, changelogEntry);
} else {
  fs.writeFileSync(changelogFile, `# Changelog\n${changelogEntry}`);
}

console.log('✓ Refactoring completed successfully');
