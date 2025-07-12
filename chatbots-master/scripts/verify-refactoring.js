/**
 * Script to verify the syntax of the refactored auto-test-runner.js file
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to the file to verify
const targetFile = path.resolve(__dirname, '../auto-test-runner.js');

console.log(`Verifying syntax of: ${targetFile}`);

try {
  // Check if file exists
  if (!fs.existsSync(targetFile)) {
    console.error(`Error: File not found: ${targetFile}`);
    process.exit(1);
  }

  // Use Node.js to check syntax without executing the file
  try {
    execSync(`node --check "${targetFile}"`, { stdio: 'pipe' });
    console.log('✅ Syntax validation successful!');
  } catch (checkError) {
    console.error('❌ Syntax validation failed:');
    console.error(checkError.stderr ? checkError.stderr.toString() : checkError.message);
    process.exit(1);
  }
  
  console.log('\nFile content summary:');
  
  // Read file and count lines
  const content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split('\n');
  
  console.log(`Total lines: ${lines.length}`);
  
  // Check for delegation patterns
  const delegationPatterns = [
    'this.testExecutor',
    'this.resultAnalyzer',
    'this.fixApplier'
  ];
  
  delegationPatterns.forEach(pattern => {
    const count = (content.match(new RegExp(pattern, 'g')) || []).length;
    console.log(`Occurrences of "${pattern}": ${count}`);
  });
  
  // Count delegation method patterns
  const delegationMethodPatterns = [
    'testExecutor\\.[a-zA-Z]+',
    'resultAnalyzer\\.[a-zA-Z]+',
    'fixApplier\\.[a-zA-Z]+'
  ];
  
  delegationMethodPatterns.forEach(pattern => {
    const regex = new RegExp(pattern, 'g');
    const matches = content.match(regex) || [];
    console.log(`Delegated method calls to ${pattern.split('\\')[0]}: ${matches.length}`);
    
    // Show unique method calls
    const uniqueMethods = [...new Set(matches)];
    if (uniqueMethods.length > 0) {
      console.log(`  Methods: ${uniqueMethods.join(', ')}`);
    }
  });
  
  // Look for any remaining TODO comments
  const todoCount = (content.match(/TODO/g) || []).length;
  console.log(`TODO comments remaining: ${todoCount}`);
  
  // Check for fallback implementations
  const fallbackCount = (content.match(/falling back to built-in implementation/g) || []).length;
  console.log(`Fallback implementations: ${fallbackCount}`);
  
  console.log('\n✅ Refactoring validation complete!');
} catch (error) {
  console.error(`\n❌ Error during validation: ${error.message}`);
  process.exit(1);
}
