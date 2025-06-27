/**
 * Syntax Validator Script
 * 
 * This script validates the syntax of JavaScript files without executing them.
 * It's designed to be more reliable than using `node -c` or `node --check`.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Get the file to validate from command line arguments
const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node validate-syntax.js <file-path>');
  process.exit(1);
}

const filePath = args[0];

try {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Read the file content
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Try to compile the code without executing it
  try {
    new vm.Script(fileContent, { filename: filePath });
    console.log(`✓ Syntax validation passed for: ${filePath}`);
    process.exit(0);
  } catch (error) {
    console.error(`✗ Syntax validation failed for: ${filePath}`);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
} catch (error) {
  console.error(`Error reading or processing file: ${error.message}`);
  process.exit(1);
}
