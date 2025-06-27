/**
 * Multi-File Dependency Error Test
 * 
 * This test suite demonstrates complex dependency errors that span multiple files.
 * These scenarios are more challenging for AI fix engines to resolve as they require
 * understanding context across multiple files.
 */

const path = require('path');
const fs = require('fs');

// Import a module that depends on another module
// The dependency chain will be tested for various error conditions
describe('Multi-File Dependency Tests', () => {
  
  // Setup temporary test files
  const testDir = path.join(__dirname, 'temp');
  const moduleAPath = path.join(testDir, 'moduleA.js');
  const moduleBPath = path.join(testDir, 'moduleB.js');
  const moduleCPath = path.join(testDir, 'moduleC.js');
  
  beforeAll(() => {
    // Create test directory and files
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // Create moduleC.js (base module)
    fs.writeFileSync(moduleCPath, `
      // Module C - Base functionality
      module.exports = {
        calculate: function(x, y) {
          return x + y;
        },
        format: function(value) {
          return \`Result: \${value}\`;
        }
      };
    `);
    
    // Create moduleB.js (depends on moduleC)
    fs.writeFileSync(moduleBPath, `
      // Module B - Depends on Module C
      const moduleC = require('./moduleC');
      
      module.exports = {
        process: function(a, b) {
          const result = moduleC.calculate(a, b);
          return moduleC.format(result);
        },
        // Intentional error: typo in function name
        enhancedProcess: function(a, b, multiplier) {
          const result = moduleC.calculate(a, b) * multiplier;
          // Error: calling non-existent method
          return moduleC.formatResult(result);
        }
      };
    `);
    
    // Create moduleA.js (depends on moduleB)
    fs.writeFileSync(moduleAPath, `
      // Module A - Depends on Module B
      const moduleB = require('./moduleB');
      
      module.exports = {
        run: function(x, y) {
          return moduleB.process(x, y);
        },
        runEnhanced: function(x, y, z) {
          // This will fail due to the error in moduleB
          return moduleB.enhancedProcess(x, y, z);
        }
      };
    `);
  });
  
  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });
  
  test('Basic dependency chain works correctly', () => {
    const moduleA = require('./temp/moduleA');
    expect(moduleA.run(2, 3)).toBe('Result: 5');
  });
  
  test('Complex dependency chain fails due to error in middle module', () => {
    const moduleA = require('./temp/moduleA');
    // This should fail because moduleB.enhancedProcess calls a non-existent method on moduleC
    expect(() => moduleA.runEnhanced(2, 3, 2)).toThrow();
  });
  
  test('Direct usage of faulty module method', () => {
    const moduleB = require('./temp/moduleB');
    // This should fail with a specific error about the missing method
    expect(() => moduleB.enhancedProcess(5, 5, 2)).toThrow(/formatResult is not a function/);
  });
  
  test('Fix verification - corrected module chain', () => {
    // This test will only pass after the AI fix engine correctly identifies and fixes
    // the error in moduleB by changing moduleC.formatResult to moduleC.format
    
    // First, let's modify moduleB to fix the error
    fs.writeFileSync(moduleBPath, `
      // Module B - Depends on Module C
      const moduleC = require('./moduleC');
      
      module.exports = {
        process: function(a, b) {
          const result = moduleC.calculate(a, b);
          return moduleC.format(result);
        },
        // Fixed: using correct function name
        enhancedProcess: function(a, b, multiplier) {
          const result = moduleC.calculate(a, b) * multiplier;
          // Fixed: using the correct method name 'format' instead of 'formatResult'
          return moduleC.format(result);
        }
      };
    `);
    
    // Clear the require cache to ensure we get the updated module
    delete require.cache[require.resolve('./temp/moduleB')];
    delete require.cache[require.resolve('./temp/moduleA')];
    
    const moduleA = require('./temp/moduleA');
    // Now this should work with the fixed module
    expect(moduleA.runEnhanced(2, 3, 2)).toBe('Result: 10');
  });
});
