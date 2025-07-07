#!/usr/bin/env node

/**
 * Automated Jest Path Resolution Fix
 * Systematically corrects module import paths across codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  rootDir: process.cwd(),
  backupDir: path.join(process.cwd(), '.backup'),
  pathPatterns: [
    { pattern: /@src\/([^\\]+)\\(.+)/g, replacement: '@src/$1/$2' },
    { pattern: /@src\\([^\\]+)\\(.+)/g, replacement: '@src/$1/$2' },
    { pattern: /@src\\(.+)/g, replacement: '@src/$1' },
    { pattern: /require\('@src\/([^']+)'\)/g, replacement: "require('@src/$1')" },
    { pattern: /require\("@src\/([^"]+)"\)/g, replacement: 'require("@src/$1")' }
  ],
  fileExtensions: ['.js', '.test.js', '.spec.js'],
  excludePatterns: [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.backup'
  ]
};

class PathResolver {
  constructor() {
    this.processedFiles = new Set();
    this.backupCreated = false;
  }

  /**
   * Initialize automated fix process
   */
  async execute() {
    console.log('🔧 Jest Path Resolution Fix - Starting...\n');
    
    try {
      await this.createBackup();
      await this.processFiles();
      await this.runTests();
      
      console.log('\n✅ Fix implementation completed successfully');
      console.log('📋 Summary:');
      console.log(`   - Files processed: ${this.processedFiles.size}`);
      console.log(`   - Backup created: ${this.backupCreated}`);
      
    } catch (error) {
      console.error('\n❌ Fix implementation failed:', error.message);
      await this.rollback();
      process.exit(1);
    }
  }

  /**
   * Create backup of current state
   */
  async createBackup() {
    if (!fs.existsSync(CONFIG.backupDir)) {
      fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(CONFIG.backupDir, `pre-fix-${timestamp}`);
    
    try {
      fs.mkdirSync(backupPath, { recursive: true });
      
      // Copy src directory
      if (fs.existsSync(path.join(CONFIG.rootDir, 'src'))) {
        this.copyDirectory(
          path.join(CONFIG.rootDir, 'src'),
          path.join(backupPath, 'src')
        );
      }
      
      // Copy tests directory
      if (fs.existsSync(path.join(CONFIG.rootDir, 'tests'))) {
        this.copyDirectory(
          path.join(CONFIG.rootDir, 'tests'),
          path.join(backupPath, 'tests')
        );
      }
      
      // Copy jest.config.js
      if (fs.existsSync(path.join(CONFIG.rootDir, 'jest.config.js'))) {
        fs.copyFileSync(
          path.join(CONFIG.rootDir, 'jest.config.js'),
          path.join(backupPath, 'jest.config.js')
        );
      }
      
      this.backupCreated = true;
      console.log(`📦 Backup created: ${backupPath}`);
    } catch (error) {
      console.log('⚠️  Backup creation failed - proceeding without backup');
    }
  }

  /**
   * Copy directory recursively
   */
  copyDirectory(source, destination) {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    
    const entries = fs.readdirSync(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      
      if (entry.isDirectory()) {
        if (!CONFIG.excludePatterns.includes(entry.name)) {
          this.copyDirectory(srcPath, destPath);
        }
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Process all relevant files
   */
  async processFiles() {
    console.log('🔄 Processing files...');
    
    const directories = ['src', 'tests'];
    
    for (const dir of directories) {
      const dirPath = path.join(CONFIG.rootDir, dir);
      if (fs.existsSync(dirPath)) {
        await this.processDirectory(dirPath);
      }
    }
  }

  /**
   * Process directory recursively
   */
  async processDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!CONFIG.excludePatterns.includes(entry.name)) {
          await this.processDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        if (CONFIG.fileExtensions.some(ext => entry.name.endsWith(ext))) {
          await this.processFile(fullPath);
        }
      }
    }
  }

  /**
   * Process individual file
   */
  async processFile(filePath) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Apply path pattern fixes
      for (const { pattern, replacement } of CONFIG.pathPatterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        this.processedFiles.add(filePath);
        console.log(`   ✓ ${path.relative(CONFIG.rootDir, filePath)}`);
      }
    } catch (error) {
      console.error(`   ✗ ${path.relative(CONFIG.rootDir, filePath)}: ${error.message}`);
    }
  }

  /**
   * Run tests to verify fix
   */
  async runTests() {
    console.log('🧪 Running tests...');
    
    try {
      const testCommand = 'npx jest tests/unit/api/controllers/conversation.controller.test.js --verbose';
      const output = execSync(testCommand, { 
        stdio: 'pipe',
        cwd: CONFIG.rootDir 
      }).toString();
      
      console.log('   ✓ Tests executed successfully');
      console.log('\n📊 Test Results:');
      console.log(output);
      
      // Save test results to file
      const resultsPath = path.join(CONFIG.rootDir, 'test-results', 'conversation-controller-test-results.txt');
      fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
      fs.writeFileSync(resultsPath, output, 'utf8');
      console.log(`   ✓ Test results saved to: ${path.relative(CONFIG.rootDir, resultsPath)}`);
      
    } catch (error) {
      console.log('   ⚠️  Tests failed - manual verification required');
      console.log('\n🔍 Test Output:');
      console.log(error.stdout?.toString() || error.message);
      
      // Save error output to file
      const errorPath = path.join(CONFIG.rootDir, 'test-results', 'conversation-controller-test-errors.txt');
      fs.mkdirSync(path.dirname(errorPath), { recursive: true });
      fs.writeFileSync(errorPath, error.stdout?.toString() || error.message, 'utf8');
      console.log(`   ✓ Error output saved to: ${path.relative(CONFIG.rootDir, errorPath)}`);
      
      throw new Error('Test execution failed');
    }
  }

  /**
   * Rollback changes if fix fails
   */
  async rollback() {
    if (!this.backupCreated) return;
    
    console.log('🔄 Rolling back changes...');
    
    try {
      const backupDirs = fs.readdirSync(CONFIG.backupDir)
        .filter(dir => dir.startsWith('pre-fix-'))
        .sort()
        .reverse();
      
      if (backupDirs.length > 0) {
        const latestBackup = path.join(CONFIG.backupDir, backupDirs[0]);
        
        // Restore src directory
        if (fs.existsSync(path.join(latestBackup, 'src'))) {
          this.copyDirectory(
            path.join(latestBackup, 'src'),
            path.join(CONFIG.rootDir, 'src')
          );
        }
        
        // Restore tests directory
        if (fs.existsSync(path.join(latestBackup, 'tests'))) {
          this.copyDirectory(
            path.join(latestBackup, 'tests'),
            path.join(CONFIG.rootDir, 'tests')
          );
        }
        
        // Restore jest.config.js
        if (fs.existsSync(path.join(latestBackup, 'jest.config.js'))) {
          fs.copyFileSync(
            path.join(latestBackup, 'jest.config.js'),
            path.join(CONFIG.rootDir, 'jest.config.js')
          );
        }
        
        console.log('   ✓ Rollback completed');
      }
    } catch (error) {
      console.error('   ✗ Rollback failed:', error.message);
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const resolver = new PathResolver();
  resolver.execute();
}

module.exports = PathResolver;
