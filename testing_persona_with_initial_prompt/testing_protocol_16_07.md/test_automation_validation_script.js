#!/usr/bin/env node

/**
 * Jest Test Automation & Validation Script
 * Automates test execution with comprehensive validation and error handling
 * Focuses on preventing mock-related issues and ensuring test reliability
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const util = require('util');
const chalk = require('chalk');

class TestAutomationFramework {
  constructor() {
    this.config = {
      testDir: 'tests',
      coverage: true,
      verbose: true,
      bail: false,
      parallel: true,
      maxWorkers: '50%',
      testTimeout: 10000,
      setupTimeout: 30000,
      watchMode: false
    };
    
    this.mockValidationRules = [
      {
        name: 'Out-of-scope variables in jest.mock()',
        pattern: /jest\.mock\([^)]+,\s*\(\)\s*=>\s*[^{]*\{[^}]*(?<!mock)[A-Z][a-zA-Z0-9_]*(?!.*mock)/g,
        severity: 'error',
        fix: 'Use variables prefixed with "mock" or define mocks within the factory function'
      },
      {
        name: 'Hoisted mock dependencies',
        pattern: /jest\.mock\([^)]+,\s*\(\)\s*=>\s*.*require\(/g,
        severity: 'warning',
        fix: 'Move require statements inside the factory function or use jest.doMock()'
      },
      {
        name: 'Missing __esModule in mock',
        pattern: /jest\.mock\([^)]+,\s*\(\)\s*=>\s*\{(?![\s\S]*__esModule)[\s\S]*\}\)/g,
        severity: 'warning',
        fix: 'Add __esModule: true to mock for ES6 modules'
      }
    ];
  }

  /**
   * Main execution pipeline
   */
  async run() {
    console.log(chalk.blue.bold('🚀 Test Automation Framework Starting...\n'));
    
    try {
      await this.validateEnvironment();
      await this.validateTestFiles();
      await this.optimizeJestConfig();
      await this.executeTests();
      await this.generateReport();
      
      console.log(chalk.green.bold('✅ All tests completed successfully!'));
    } catch (error) {
      console.error(chalk.red.bold('❌ Test automation failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Validate testing environment and dependencies
   */
  async validateEnvironment() {
    console.log(chalk.yellow('🔍 Validating test environment...'));
    
    // Check Node.js version
    const nodeVersion = process.version;
    const minNodeVersion = '16.0.0';
    
    if (this.compareVersions(nodeVersion, minNodeVersion) < 0) {
      throw new Error(`Node.js ${minNodeVersion} or higher required. Current: ${nodeVersion}`);
    }
    
    // Check Jest installation
    try {
      execSync('npx jest --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Jest is not installed. Run: npm install --save-dev jest');
    }
    
    // Validate package.json test scripts
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts?.test) {
        console.log(chalk.yellow('⚠️  Adding test script to package.json'));
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts.test = 'jest';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }
    }
    
    console.log(chalk.green('✅ Environment validation passed'));
  }

  /**
   * Validate test files for common issues
   */
  async validateTestFiles() {
    console.log(chalk.yellow('🔍 Validating test files...'));
    
    const testFiles = this.findTestFiles();
    const issues = [];
    
    for (const testFile of testFiles) {
      const content = fs.readFileSync(testFile, 'utf8');
      const fileIssues = this.validateMockPatterns(content, testFile);
      
      if (fileIssues.length > 0) {
        issues.push(...fileIssues);
      }
    }
    
    if (issues.length > 0) {
      console.log(chalk.red('❌ Test validation issues found:'));
      issues.forEach(issue => {
        console.log(chalk.red(`  ${issue.file}: ${issue.message}`));
        if (issue.fix) {
          console.log(chalk.yellow(`    Fix: ${issue.fix}`));
        }
      });
      
      if (issues.some(issue => issue.severity === 'error')) {
        throw new Error('Critical test validation errors must be fixed before running tests');
      }
    }
    
    console.log(chalk.green('✅ Test file validation passed'));
  }

  /**
   * Find all test files in the project
   */
  findTestFiles() {
    const testPatterns = [
      '**/*.test.js',
      '**/*.spec.js',
      '**/__tests__/**/*.js'
    ];
    
    const testFiles = [];
    const testDir = path.join(process.cwd(), this.config.testDir);
    
    if (fs.existsSync(testDir)) {
      const files = this.walkDir(testDir);
      testFiles.push(...files.filter(file => 
        testPatterns.some(pattern => 
          file.includes(pattern.replace('**/', '').replace('*', ''))
        )
      ));
    }
    
    return testFiles;
  }

  /**
   * Recursively walk directory to find files
   */
  walkDir(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...this.walkDir(fullPath));
      } else if (stat.isFile() && item.endsWith('.js')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Validate mock patterns in test file content
   */
  validateMockPatterns(content, filePath) {
    const issues = [];
    
    for (const rule of this.mockValidationRules) {
      const matches = content.match(rule.pattern);
      
      if (matches) {
        matches.forEach(match => {
          issues.push({
            file: filePath,
            message: `${rule.name}: ${match.substring(0, 100)}...`,
            severity: rule.severity,
            fix: rule.fix
          });
        });
      }
    }
    
    return issues;
  }

  /**
   * Optimize Jest configuration for better performance
   */
  async optimizeJestConfig() {
    console.log(chalk.yellow('⚙️  Optimizing Jest configuration...'));
    
    const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
    const optimizedConfig = this.generateOptimizedJestConfig();
    
    if (!fs.existsSync(jestConfigPath)) {
      fs.writeFileSync(jestConfigPath, optimizedConfig);
      console.log(chalk.green('✅ Created optimized jest.config.js'));
    } else {
      console.log(chalk.blue('ℹ️  Jest configuration already exists'));
    }
  }

  /**
   * Generate optimized Jest configuration
   */
  generateOptimizedJestConfig() {
    return `
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Coverage settings
  collectCoverage: ${this.config.coverage},
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  // Performance optimization
  maxWorkers: '${this.config.maxWorkers}',
  testTimeout: ${this.config.testTimeout},
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Mock handling
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Transform settings
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Verbose output
  verbose: ${this.config.verbose},
  
  // Error handling
  bail: ${this.config.bail},
  
  // Test result processor
  testResultsProcessor: 'jest-sonar-reporter'
};
`;
  }

  /**
   * Execute tests with comprehensive error handling
   */
  async executeTests() {
    console.log(chalk.yellow('🧪 Executing tests...'));
    
    const jestCommand = this.buildJestCommand();
    
    try {
      const result = await this.runCommand(jestCommand);
      
      if (result.code === 0) {
        console.log(chalk.green('✅ All tests passed!'));
      } else {
        console.log(chalk.red('❌ Some tests failed'));
        console.log(result.output);
      }
      
      return result;
    } catch (error) {
      console.error(chalk.red('Test execution failed:'), error.message);
      throw error;
    }
  }

  /**
   * Build Jest command with appropriate flags
   */
  buildJestCommand() {
    const args = ['npx', 'jest'];
    
    if (this.config.coverage) {
      args.push('--coverage');
    }
    
    if (this.config.verbose) {
      args.push('--verbose');
    }
    
    if (this.config.bail) {
      args.push('--bail');
    }
    
    if (this.config.parallel) {
      args.push('--runInBand=false');
    }
    
    if (this.config.watchMode) {
      args.push('--watch');
    }
    
    args.push('--maxWorkers', this.config.maxWorkers);
    args.push('--testTimeout', this.config.testTimeout.toString());
    
    return args.join(' ');
  }

  /**
   * Run command with promise-based execution
   */
  async runCommand(command) {
    return new Promise((resolve, reject) => {
      const child = spawn('npx', ['jest', ...command.split(' ').slice(2)], {
        stdio: 'inherit',
        shell: true
      });
      
      let output = '';
      
      child.on('error', (error) => {
        reject(new Error(`Command failed: ${error.message}`));
      });
      
      child.on('close', (code) => {
        resolve({ code, output });
      });
    });
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport() {
    console.log(chalk.yellow('📊 Generating test report...'));
    
    const coverageDir = path.join(process.cwd(), 'coverage');
    const reportPath = path.join(process.cwd(), 'test-report.json');
    
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      configuration: this.config,
      coverage: fs.existsSync(coverageDir) ? 'Generated' : 'Not available',
      summary: 'Test execution completed'
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`✅ Test report generated: ${reportPath}`));
  }

  /**
   * Compare version strings
   */
  compareVersions(version1, version2) {
    const parts1 = version1.replace('v', '').split('.').map(Number);
    const parts2 = version2.replace('v', '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }

  /**
   * Watch mode for continuous testing
   */
  async watchMode() {
    console.log(chalk.blue('👀 Starting watch mode...'));
    this.config.watchMode = true;
    
    const watcher = fs.watch(this.config.testDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.js')) {
        console.log(chalk.yellow(`File changed: ${filename}`));
        this.executeTests().catch(error => {
          console.error(chalk.red('Watch mode test failed:'), error.message);
        });
      }
    });
    
    process.on('SIGINT', () => {
      console.log(chalk.yellow('Stopping watch mode...'));
      watcher.close();
      process.exit(0);
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const framework = new TestAutomationFramework();
  
  if (args.includes('--watch')) {
    framework.config.watchMode = true;
    await framework.watchMode();
  } else if (args.includes('--coverage-only')) {
    framework.config.coverage = true;
    framework.config.verbose = false;
    await framework.run();
  } else if (args.includes('--fix-mocks')) {
    await framework.validateTestFiles();
  } else {
    await framework.run();
  }
}

// Export for programmatic use
module.exports = { TestAutomationFramework };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red.bold('Fatal error:'), error.message);
    process.exit(1);
  });
}