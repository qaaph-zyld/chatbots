/**
 * Code Context Generator
 * 
 * This module provides functionality to extract relevant code context from files
 * based on test failure data. It helps the AI model better understand the code
 * structure and relationships when generating fixes.
 * 
 * @author Testing Engineer
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Generates code context for AI analysis based on test failures
 */
class CodeContextGenerator {
  /**
   * Creates a new CodeContextGenerator instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.codebasePath - Root path of the codebase
   * @param {number} options.contextLines - Number of context lines to include before and after error (default: 10)
   * @param {number} options.maxFileSize - Maximum file size in bytes to process (default: 1MB)
   * @param {Array<string>} options.excludePatterns - Patterns to exclude from context generation
   * @param {Object} options.logger - Logger instance
   */
  constructor(options = {}) {
    this.codebasePath = options.codebasePath || process.cwd();
    this.contextLines = options.contextLines || 10;
    this.maxFileSize = options.maxFileSize || 1024 * 1024; // 1MB default
    this.excludePatterns = options.excludePatterns || [
      'node_modules',
      '.git',
      'dist',
      'build',
      'coverage'
    ];
    this.logger = options.logger;
  }

  /**
   * Extracts context from a test file and its implementation
   * 
   * @param {Object} test - Test object with file and line information
   * @param {Object} parsedResults - Parsed test results
   * @returns {Promise<Object>} - Context information
   */
  async extractTestContext(test, parsedResults) {
    if (!test || !test.file) {
      return { error: 'No test file information available' };
    }

    try {
      const testContext = await this.extractFileContext(test.file, test.line);
      
      // Try to find implementation file based on test file naming conventions
      const implFile = this.guessImplementationFile(test.file);
      let implContext = null;
      
      if (implFile) {
        implContext = await this.extractFileContext(implFile, null);
      }
      
      return {
        test: testContext,
        implementation: implContext,
        errorMessage: test.message || null,
        errorStack: test.stack || null
      };
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to extract test context', { error: error.message });
      }
      return { error: error.message };
    }
  }

  /**
   * Extracts context from a file around a specific line
   * 
   * @param {string} filePath - Path to the file
   * @param {number|null} lineNumber - Line number to focus on, or null for whole file
   * @returns {Promise<Object>} - File context information
   */
  async extractFileContext(filePath, lineNumber) {
    // Resolve the absolute path
    const absPath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(this.codebasePath, filePath);
    
    try {
      // Check if file exists and is not too large
      const stats = await fs.stat(absPath);
      
      if (stats.size > this.maxFileSize) {
        return {
          file: filePath,
          error: `File too large (${Math.round(stats.size / 1024)}KB)`,
          size: stats.size
        };
      }
      
      // Read file content
      const content = await fs.readFile(absPath, 'utf8');
      const lines = content.split('\n');
      
      // If no line number specified, return the whole file
      if (!lineNumber) {
        return {
          file: filePath,
          content,
          lineCount: lines.length,
          size: stats.size
        };
      }
      
      // Extract context around the specified line
      const startLine = Math.max(0, lineNumber - this.contextLines - 1);
      const endLine = Math.min(lines.length - 1, lineNumber + this.contextLines - 1);
      
      const contextLines = lines.slice(startLine, endLine + 1);
      const contextContent = contextLines.join('\n');
      
      return {
        file: filePath,
        lineNumber,
        startLine: startLine + 1, // Convert to 1-indexed
        endLine: endLine + 1,     // Convert to 1-indexed
        contextContent,
        fullContent: content,
        lineCount: lines.length,
        size: stats.size
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return {
          file: filePath,
          error: 'File not found'
        };
      }
      
      return {
        file: filePath,
        error: error.message
      };
    }
  }

  /**
   * Attempts to guess the implementation file path based on a test file path
   * 
   * @param {string} testFilePath - Path to the test file
   * @returns {string|null} - Guessed implementation file path or null if not found
   */
  guessImplementationFile(testFilePath) {
    if (!testFilePath) return null;
    
    // Common test file patterns and their replacements
    const patterns = [
      // Jest/React style: Component.test.js -> Component.js
      { regex: /(.+)\.test\.(js|ts|jsx|tsx)$/, replacement: '$1.$2' },
      
      // Suffix style: file_test.js -> file.js
      { regex: /(.+)_test\.(js|ts|jsx|tsx)$/, replacement: '$1.$2' },
      
      // Test directory style: test/file.js -> src/file.js
      { regex: /test\/(.+\.(js|ts|jsx|tsx))$/, replacement: 'src/$1' },
      
      // Tests directory style: tests/file.js -> src/file.js
      { regex: /tests\/(.+\.(js|ts|jsx|tsx))$/, replacement: 'src/$1' },
      
      // __tests__ directory style: __tests__/file.js -> file.js
      { regex: /__tests__\/(.+\.(js|ts|jsx|tsx))$/, replacement: '$1' }
    ];
    
    // Try each pattern
    for (const pattern of patterns) {
      if (pattern.regex.test(testFilePath)) {
        const implPath = testFilePath.replace(pattern.regex, pattern.replacement);
        
        // Don't return the same path
        if (implPath !== testFilePath) {
          return implPath;
        }
      }
    }
    
    return null;
  }

  /**
   * Analyzes stack trace to extract relevant file paths and line numbers
   * 
   * @param {string} stackTrace - Error stack trace
   * @returns {Array<Object>} - Array of file locations from stack trace
   */
  extractLocationsFromStack(stackTrace) {
    if (!stackTrace) return [];
    
    const locations = [];
    const stackLines = stackTrace.split('\n');
    
    // Common stack trace patterns
    const patterns = [
      // Node.js style: at Function.module.exports.func (/path/to/file.js:123:45)
      /at\s+.+\s+\((.+):(\d+):(\d+)\)/,
      
      // Simple style: at /path/to/file.js:123:45
      /at\s+(.+):(\d+):(\d+)/
    ];
    
    for (const line of stackLines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        
        if (match) {
          const [, filePath, lineNumber, columnNumber] = match;
          
          // Skip node_modules and internal files
          if (filePath.includes('node_modules') || filePath.includes('internal/')) {
            continue;
          }
          
          locations.push({
            file: filePath,
            line: parseInt(lineNumber, 10),
            column: parseInt(columnNumber, 10)
          });
          
          break; // Found a match for this line, move to next line
        }
      }
    }
    
    return locations;
  }

  /**
   * Builds a comprehensive context object for AI analysis
   * 
   * @param {Object} failedTest - Failed test object
   * @param {Object} parsedResults - Parsed test results
   * @returns {Promise<Object>} - Comprehensive context object
   */
  async buildComprehensiveContext(failedTest, parsedResults) {
    // Start with basic test context
    const context = await this.extractTestContext(failedTest, parsedResults);
    
    // Add stack trace analysis if available
    if (failedTest.stack) {
      const stackLocations = this.extractLocationsFromStack(failedTest.stack);
      
      // Extract context for each unique file in the stack trace
      const stackContext = [];
      const processedFiles = new Set();
      
      for (const location of stackLocations) {
        // Skip if we've already processed this file
        if (processedFiles.has(location.file)) continue;
        
        processedFiles.add(location.file);
        
        // Get context for this location
        const fileContext = await this.extractFileContext(location.file, location.line);
        stackContext.push(fileContext);
        
        // Limit the number of files to avoid excessive context
        if (stackContext.length >= 3) break;
      }
      
      context.stackContext = stackContext;
    }
    
    // Add related files based on imports/requires in the test file
    if (context.test && context.test.fullContent) {
      const relatedFiles = this.extractRelatedFiles(context.test.fullContent, failedTest.file);
      
      if (relatedFiles.length > 0) {
        context.relatedFiles = relatedFiles;
      }
    }
    
    return context;
  }

  /**
   * Extracts related files based on import/require statements
   * 
   * @param {string} fileContent - Content of the file
   * @param {string} sourceFile - Source file path
   * @returns {Array<string>} - Array of related file paths
   */
  extractRelatedFiles(fileContent, sourceFile) {
    const relatedFiles = [];
    
    // Match import statements: import X from 'path'
    const importRegex = /import\s+.+\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(fileContent)) !== null) {
      relatedFiles.push(this.resolveRelativePath(match[1], sourceFile));
    }
    
    // Match require statements: require('path')
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    
    while ((match = requireRegex.exec(fileContent)) !== null) {
      relatedFiles.push(this.resolveRelativePath(match[1], sourceFile));
    }
    
    return relatedFiles;
  }

  /**
   * Resolves a relative import path to an absolute file path
   * 
   * @param {string} importPath - Import path from import/require statement
   * @param {string} sourceFile - Source file path
   * @returns {string} - Resolved file path
   */
  resolveRelativePath(importPath, sourceFile) {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const sourceDir = path.dirname(sourceFile);
      return path.join(sourceDir, importPath);
    }
    
    // For non-relative imports, just return as is
    return importPath;
  }
}

module.exports = { CodeContextGenerator };
