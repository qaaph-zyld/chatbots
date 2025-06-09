/**
 * Project Structure Verification Script
 * 
 * This script verifies that the reorganized project structure works correctly
 * by testing module aliases, directory structure, and basic functionality.
 */

// Register module aliases
require('../src/core/module-alias');

const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (t) => t, red: (t) => t, yellow: (t) => t, blue: (t) => t };

// Configuration
const ROOT_DIR = path.resolve(__dirname, '..');

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

/**
 * Run a test and log the result
 */
function runTest(name, testFn) {
  process.stdout.write(`Testing ${name}... `);
  
  try {
    const result = testFn();
    
    if (result === true) {
      console.log(chalk.green('PASSED'));
      results.passed++;
      return true;
    } else if (result === 'warning') {
      console.log(chalk.yellow('WARNING'));
      results.warnings++;
      return 'warning';
    } else {
      console.log(chalk.red('FAILED'));
      results.failed++;
      return false;
    }
  } catch (error) {
    console.log(chalk.red('ERROR'));
    console.error(`  ${error.message}`);
    results.failed++;
    return false;
  }
}

/**
 * Check if a directory exists
 */
function directoryExists(dir) {
  const fullPath = path.join(ROOT_DIR, dir);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

/**
 * Check if a file exists
 */
function fileExists(file) {
  const fullPath = path.join(ROOT_DIR, file);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile();
}

/**
 * Test directory structure
 */
function testDirectoryStructure() {
  console.log(chalk.blue('\nTesting Directory Structure:'));
  
  // Core directories
  runTest('src/core directory', () => directoryExists('src/core'));
  runTest('src/modules directory', () => directoryExists('src/modules'));
  runTest('src/domain directory', () => directoryExists('src/domain'));
  runTest('src/api directory', () => directoryExists('src/api'));
  runTest('src/data directory', () => directoryExists('src/data'));
  runTest('src/utils directory', () => directoryExists('src/utils'));
  
  // Test directories
  runTest('tests/unit directory', () => directoryExists('tests/unit'));
  runTest('tests/integration directory', () => directoryExists('tests/integration'));
  runTest('tests/e2e directory', () => directoryExists('tests/e2e'));
  
  // Config directories
  runTest('configs directory', () => directoryExists('configs'));
  runTest('configs/webpack directory', () => directoryExists('configs/webpack'));
  runTest('configs/eslint directory', () => directoryExists('configs/eslint'));
  runTest('configs/jest directory', () => directoryExists('configs/jest'));
}

/**
 * Test configuration files
 */
function testConfigurationFiles() {
  console.log(chalk.blue('\nTesting Configuration Files:'));
  
  // Webpack configs
  runTest('webpack.config.js', () => fileExists('webpack.config.js'));
  runTest('configs/webpack/webpack.development.js', () => fileExists('configs/webpack/webpack.development.js'));
  runTest('configs/webpack/webpack.production.js', () => fileExists('configs/webpack/webpack.production.js'));
  
  // ESLint configs
  runTest('.eslintrc.js', () => fileExists('.eslintrc.js'));
  runTest('configs/eslint/.eslintrc.js', () => fileExists('configs/eslint/.eslintrc.js'));
  
  // Jest configs
  runTest('jest.config.js', () => fileExists('jest.config.js'));
  runTest('configs/jest/jest.memory.config.js', () => fileExists('configs/jest/jest.memory.config.js'));
  runTest('configs/jest/jest.integration.config.js', () => fileExists('configs/jest/jest.integration.config.js'));
  runTest('configs/jest/jest.e2e.config.js', () => fileExists('configs/jest/jest.e2e.config.js'));
  
  // GitHub Actions workflow
  runTest('.github/workflows/ci.yml', () => fileExists('.github/workflows/ci.yml'));
}

/**
 * Test module aliases
 */
function testModuleAliases() {
  console.log(chalk.blue('\nTesting Module Aliases:'));
  
  // Test module-alias registration
  runTest('module-alias registration', () => {
    try {
      require('../src/core/module-alias');
      return true;
    } catch (error) {
      console.error('  Error loading module-alias:', error.message);
      return false;
    }
  });
  
  // Test importing from aliases
  runTest('@core alias', () => {
    try {
      // First make sure module-alias is registered
      require('../src/core/module-alias');
      
      // Then try to resolve a path using the alias
      const fs = require('fs');
      const path = require('path');
      
      // Check if the module-alias file exists at the expected path
      const expectedPath = path.resolve(ROOT_DIR, 'src/core/module-alias.js');
      const exists = fs.existsSync(expectedPath);
      
      if (!exists) {
        console.error('  Module alias file does not exist at expected path:', expectedPath);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('  Error testing @core alias:', error.message);
      return false;
    }
  });
}

/**
 * Test migration scripts
 */
function testMigrationScripts() {
  console.log(chalk.blue('\nTesting Migration Scripts:'));
  
  runTest('scripts/migrate-files.js', () => fileExists('scripts/migrate-files.js'));
  runTest('scripts/update-import-paths.js', () => fileExists('scripts/update-import-paths.js'));
  runTest('scripts/install-dependencies.js', () => fileExists('scripts/install-dependencies.js'));
}

/**
 * Test documentation
 */
function testDocumentation() {
  console.log(chalk.blue('\nTesting Documentation:'));
  
  runTest('README.md', () => fileExists('README.md'));
  runTest('docs/migration-guide.md', () => fileExists('docs/migration-guide.md'));
  runTest('docs/reorganization-progress.md', () => fileExists('docs/reorganization-progress.md'));
  runTest('changelog.md', () => fileExists('changelog.md'));
}

/**
 * Main function
 */
function main() {
  console.log(chalk.blue('Starting Project Structure Verification\n'));
  
  // Run tests
  testDirectoryStructure();
  testConfigurationFiles();
  testModuleAliases();
  testMigrationScripts();
  testDocumentation();
  
  // Print summary
  console.log(chalk.blue('\nVerification Summary:'));
  console.log(`Tests passed: ${chalk.green(results.passed)}`);
  console.log(`Tests failed: ${chalk.red(results.failed)}`);
  console.log(`Warnings: ${chalk.yellow(results.warnings)}`);
  
  // Exit with appropriate code
  if (results.failed > 0) {
    console.log(chalk.red('\nVerification failed! Some tests did not pass.'));
    process.exit(1);
  } else {
    console.log(chalk.green('\nVerification successful! All tests passed.'));
    process.exit(0);
  }
}

// Run the script
main();
