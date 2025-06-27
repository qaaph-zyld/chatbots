/**
 * Refactoring Workflow Helper
 * 
 * This script provides a reliable workflow for refactoring operations,
 * combining multiple steps into a single execution to avoid tool call failures.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.error('Usage: node refactoring-workflow.js <command>');
  console.error('Available commands:');
  console.error('  validate-syntax <file>       - Validate syntax of a JavaScript file');
  console.error('  backup <file>                - Create a backup of a file');
  console.error('  restore <file>               - Restore a file from its backup');
  console.error('  update-changelog <message>   - Update the changelog.md file');
  process.exit(1);
}

// File paths
const projectRoot = path.join(__dirname, '..');
const changelogPath = path.join(projectRoot, 'changelog.md');

/**
 * Validates JavaScript syntax
 * 
 * @param {string} filePath - Path to the JavaScript file
 * @returns {boolean} - True if syntax is valid
 */
function validateSyntax(filePath) {
  try {
    const fullPath = path.resolve(projectRoot, filePath);
    console.log(`Validating syntax for: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return false;
    }
    
    const code = fs.readFileSync(fullPath, 'utf8');
    
    // Use vm to check syntax without executing the code
    try {
      new vm.Script(code, { filename: fullPath });
      console.log(`✓ Syntax validation passed for: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`✗ Syntax validation failed for: ${filePath}`);
      console.error(`Error: ${error.message}`);
      
      // Extract line and column information
      const match = error.message.match(/at\s+(\d+):(\d+)/);
      if (match) {
        const line = parseInt(match[1]);
        const column = parseInt(match[2]);
        
        // Show the problematic code with context
        const lines = code.split('\n');
        const start = Math.max(0, line - 3);
        const end = Math.min(lines.length, line + 2);
        
        console.error('\nCode context:');
        for (let i = start; i < end; i++) {
          const lineNum = i + 1;
          const prefix = lineNum === line ? '> ' : '  ';
          console.error(`${prefix}${lineNum}: ${lines[i]}`);
          
          if (lineNum === line) {
            console.error(`   ${' '.repeat(column)}^`);
          }
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error(`Error validating syntax: ${error.message}`);
    return false;
  }
}

/**
 * Creates a backup of a file
 * 
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if backup was successful
 */
function backupFile(filePath) {
  try {
    const fullPath = path.resolve(projectRoot, filePath);
    const backupPath = `${fullPath}.bak`;
    
    console.log(`Creating backup of ${fullPath} to ${backupPath}`);
    
    if (!fs.existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      return false;
    }
    
    fs.copyFileSync(fullPath, backupPath);
    console.log(`✓ Backup created: ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`Error creating backup: ${error.message}`);
    return false;
  }
}

/**
 * Restores a file from its backup
 * 
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if restore was successful
 */
function restoreFile(filePath) {
  try {
    const fullPath = path.resolve(projectRoot, filePath);
    const backupPath = `${fullPath}.bak`;
    
    console.log(`Restoring ${fullPath} from ${backupPath}`);
    
    if (!fs.existsSync(backupPath)) {
      console.error(`Backup file not found: ${backupPath}`);
      return false;
    }
    
    fs.copyFileSync(backupPath, fullPath);
    console.log(`✓ File restored from backup: ${fullPath}`);
    return true;
  } catch (error) {
    console.error(`Error restoring file: ${error.message}`);
    return false;
  }
}

/**
 * Updates the changelog.md file
 * 
 * @param {string} message - Message to add to the changelog
 * @returns {boolean} - True if update was successful
 */
function updateChangelog(message) {
  try {
    console.log(`Updating changelog at: ${changelogPath}`);
    
    if (!fs.existsSync(changelogPath)) {
      console.log('Changelog file not found, creating it');
      fs.writeFileSync(changelogPath, '# Changelog\n\n');
    }
    
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const entry = `\n## ${timestamp}\n${message}\n`;
    
    fs.appendFileSync(changelogPath, entry);
    console.log('✓ Changelog updated');
    return true;
  } catch (error) {
    console.error(`Error updating changelog: ${error.message}`);
    return false;
  }
}

// Execute the requested command
switch (command) {
  case 'validate-syntax':
    const file = args[1];
    if (!file) {
      console.error('Error: No file specified for syntax validation');
      process.exit(1);
    }
    process.exit(validateSyntax(file) ? 0 : 1);
    break;
    
  case 'backup':
    const backupTarget = args[1];
    if (!backupTarget) {
      console.error('Error: No file specified for backup');
      process.exit(1);
    }
    process.exit(backupFile(backupTarget) ? 0 : 1);
    break;
    
  case 'restore':
    const restoreTarget = args[1];
    if (!restoreTarget) {
      console.error('Error: No file specified for restore');
      process.exit(1);
    }
    process.exit(restoreFile(restoreTarget) ? 0 : 1);
    break;
    
  case 'update-changelog':
    const message = args.slice(1).join(' ');
    if (!message) {
      console.error('Error: No message provided for changelog update');
      process.exit(1);
    }
    process.exit(updateChangelog(message) ? 0 : 1);
    break;
    
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
