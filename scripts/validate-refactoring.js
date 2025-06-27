/**
 * Refactoring Validation Script
 * 
 * This script validates that refactored code maintains the same functionality
 * by comparing the exports and public API surface of the original and refactored files.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Get the file paths from command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node validate-refactoring.js <original-file> <refactored-file>');
  process.exit(1);
}

const originalFilePath = args[0];
const refactoredFilePath = args[1];

// Check if files exist
if (!fs.existsSync(originalFilePath)) {
  console.error(`Error: Original file not found: ${originalFilePath}`);
  process.exit(1);
}

if (!fs.existsSync(refactoredFilePath)) {
  console.error(`Error: Refactored file not found: ${refactoredFilePath}`);
  process.exit(1);
}

// Function to extract exported members from a file
function getExportedMembers(filePath) {
  try {
    // Create a sandbox context
    const sandbox = {
      module: { exports: {} },
      exports: {},
      require: require,
      console: console,
      process: process,
      __filename: filePath,
      __dirname: path.dirname(filePath)
    };
    
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Execute the code in the sandbox
    vm.runInNewContext(fileContent, sandbox);
    
    // Get the exports
    const moduleExports = sandbox.module.exports;
    
    // Analyze the exports
    const exportedMembers = {};
    
    if (typeof moduleExports === 'function') {
      exportedMembers['default'] = {
        type: 'function',
        name: moduleExports.name || 'anonymous'
      };
    } else if (typeof moduleExports === 'object') {
      for (const key in moduleExports) {
        const member = moduleExports[key];
        const memberType = typeof member;
        
        if (memberType === 'function') {
          exportedMembers[key] = {
            type: 'function',
            name: member.name || 'anonymous',
            parameters: getFunctionParameters(member)
          };
        } else if (memberType === 'object' && member !== null) {
          if (member.constructor && member.constructor.name !== 'Object') {
            exportedMembers[key] = {
              type: 'class',
              name: member.constructor.name,
              methods: getObjectMethods(member)
            };
          } else {
            exportedMembers[key] = {
              type: 'object',
              properties: Object.keys(member)
            };
          }
        } else {
          exportedMembers[key] = {
            type: memberType,
            value: member
          };
        }
      }
    }
    
    return exportedMembers;
  } catch (error) {
    console.error(`Error analyzing ${filePath}: ${error.message}`);
    return null;
  }
}

// Helper function to get function parameters
function getFunctionParameters(func) {
  const funcStr = func.toString();
  const paramStr = funcStr.substring(funcStr.indexOf('(') + 1, funcStr.indexOf(')'));
  return paramStr.split(',').map(param => param.trim()).filter(param => param);
}

// Helper function to get object methods
function getObjectMethods(obj) {
  const methods = {};
  const prototype = Object.getPrototypeOf(obj);
  
  // Get own methods
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (typeof obj[prop] === 'function') {
      methods[prop] = {
        parameters: getFunctionParameters(obj[prop])
      };
    }
  });
  
  // Get prototype methods
  if (prototype && prototype !== Object.prototype) {
    Object.getOwnPropertyNames(prototype).forEach(prop => {
      if (typeof prototype[prop] === 'function' && prop !== 'constructor') {
        methods[prop] = {
          parameters: getFunctionParameters(prototype[prop])
        };
      }
    });
  }
  
  return methods;
}

// Compare the exported members
function compareExports(original, refactored) {
  if (!original || !refactored) {
    return false;
  }
  
  const originalKeys = Object.keys(original);
  const refactoredKeys = Object.keys(refactored);
  
  // Check if all original exports are present in the refactored version
  const missingExports = originalKeys.filter(key => !refactoredKeys.includes(key));
  if (missingExports.length > 0) {
    console.error(`Missing exports in refactored file: ${missingExports.join(', ')}`);
    return false;
  }
  
  // Check if the types match for each export
  for (const key of originalKeys) {
    const originalType = original[key].type;
    const refactoredType = refactored[key].type;
    
    if (originalType !== refactoredType) {
      console.error(`Export type mismatch for ${key}: ${originalType} vs ${refactoredType}`);
      return false;
    }
    
    // For functions, check if the parameters match
    if (originalType === 'function') {
      const originalParams = original[key].parameters;
      const refactoredParams = refactored[key].parameters;
      
      if (originalParams.length !== refactoredParams.length) {
        console.error(`Parameter count mismatch for function ${key}: ${originalParams.length} vs ${refactoredParams.length}`);
        return false;
      }
    }
    
    // For classes, check if the methods match
    if (originalType === 'class') {
      const originalMethods = Object.keys(original[key].methods);
      const refactoredMethods = Object.keys(refactored[key].methods);
      
      const missingMethods = originalMethods.filter(method => !refactoredMethods.includes(method));
      if (missingMethods.length > 0) {
        console.error(`Missing methods in refactored class ${key}: ${missingMethods.join(', ')}`);
        return false;
      }
    }
  }
  
  return true;
}

// Main validation logic
try {
  console.log(`Validating refactoring: ${originalFilePath} -> ${refactoredFilePath}`);
  
  const originalExports = getExportedMembers(originalFilePath);
  const refactoredExports = getExportedMembers(refactoredFilePath);
  
  if (!originalExports || !refactoredExports) {
    console.error('Failed to analyze exports');
    process.exit(1);
  }
  
  console.log('\nOriginal exports:');
  console.log(JSON.stringify(originalExports, null, 2));
  
  console.log('\nRefactored exports:');
  console.log(JSON.stringify(refactoredExports, null, 2));
  
  const isValid = compareExports(originalExports, refactoredExports);
  
  if (isValid) {
    console.log('\n✓ Refactoring validation passed! The public API is preserved.');
    process.exit(0);
  } else {
    console.error('\n✗ Refactoring validation failed! The public API has changed.');
    process.exit(1);
  }
} catch (error) {
  console.error(`Validation error: ${error.message}`);
  process.exit(1);
}
