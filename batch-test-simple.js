#!/usr/bin/env node

/**
 * Batch Test Simple Files
 * 
 * Tests multiple simple test files to identify working patterns
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// List of simple test files to try (no complex dependencies)
const simpleTests = [
  'tests/emergency/simple.test.js',
  'tests/basic.test.js',
  'tests/src/index.test.js',
  'tests/webpack.config.test.js'
];

// Results tracking
const results = {
  passed: [],
  failed: [],
  errors: []
};

console.log('🧪 Batch Testing Simple Test Files');
console.log('=====================================\n');

for (const testFile of simpleTests) {
  const fullPath = path.join(__dirname, testFile);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  SKIP: ${testFile} (file not found)`);
    results.errors.push({ file: testFile, error: 'File not found' });
    continue;
  }

  console.log(`🔍 Testing: ${testFile}`);
  
  try {
    // Run the test
    const output = execSync(`npm test ${testFile}`, { 
      encoding: 'utf8',
      timeout: 60000,
      stdio: 'pipe'
    });
    
    // Check if it passed
    if (output.includes('Test Suites: 1 passed') || output.includes('Tests:') && output.includes('passed')) {
      console.log(`✅ PASS: ${testFile}`);
      results.passed.push(testFile);
    } else {
      console.log(`❌ FAIL: ${testFile}`);
      results.failed.push(testFile);
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${testFile}`);
    console.log(`   ${error.message.split('\n')[0]}`);
    results.failed.push(testFile);
  }
  
  console.log(''); // Empty line for readability
}

// Summary
console.log('\n📊 BATCH TEST SUMMARY');
console.log('=====================');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Errors: ${results.errors.length}`);
console.log(`📈 Success Rate: ${((results.passed.length / simpleTests.length) * 100).toFixed(1)}%`);

if (results.passed.length > 0) {
  console.log('\n✅ WORKING TESTS:');
  results.passed.forEach(test => console.log(`   - ${test}`));
}

if (results.failed.length > 0) {
  console.log('\n❌ FAILED TESTS:');
  results.failed.forEach(test => console.log(`   - ${test}`));
}

// Save results
const resultsFile = 'batch-test-results.json';
fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
console.log(`\n💾 Results saved to: ${resultsFile}`);

process.exit(results.passed.length > 0 ? 0 : 1);
