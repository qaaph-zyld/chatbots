#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Run tests for the context module
function runTests() {
  console.log('Running context manager tests...');
  
  try {
    // Run Jest in the context of our test files
    const jestPath = path.join(__dirname, '..', 'node_modules', '.bin', 'jest');
    const testPattern = path.join('src', 'context', '__tests__');
    
    execSync(
      `node "${jestPath}" "${testPattern}" --config=jest.config.js --passWithNoTests --verbose`,
      { stdio: 'inherit' }
    );
    
    console.log('✅ All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Tests failed');
    process.exit(1);
  }
}

runTests();
