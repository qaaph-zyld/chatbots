/**
 * Verify Syntax Script
 * 
 * This script verifies the syntax of a JavaScript file
 * and prints the result to the console.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Get file path from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node verify-syntax.js <file-path>');
  process.exit(1);
}

const filePath = path.resolve(args[0]);
console.log(`Verifying syntax of: ${filePath}`);

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

try {
  const code = fs.readFileSync(filePath, 'utf8');
  new vm.Script(code, { filename: filePath });
  console.log(`✓ Syntax validation passed for: ${filePath}`);
  process.exit(0);
} catch (error) {
  console.error(`✗ Syntax validation failed for: ${filePath}`);
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
