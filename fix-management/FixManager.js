/**
 * FixManager.js
 * 
 * This module provides functionality for managing code fixes applied by the AI system.
 * It includes capabilities for:
 * - Creating backups of files before applying fixes
 * - Reverting failed fixes to restore original code
 * - Maintaining a feedback loop for improving AI fix generation
 * - Validating fixes before applying them
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Class responsible for managing code fixes
 */
class FixManager {
  /**
   * Creates a new FixManager instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.backupDir - Directory to store backups
   * @param {Object} options.logger - Logger instance
   * @param {boolean} options.dryRun - Whether to run in dry run mode (don't actually apply fixes)
   */
  constructor(options = {}) {
    this.backupDir = options.backupDir || path.join(process.cwd(), 'backups');
    this.logger = options.logger;
    this.dryRun = options.dryRun || false;
    this.feedbackStore = options.feedbackStore || path.join(process.cwd(), 'fix-feedback.json');
    this.feedback = {
      fixes: [],
      patterns: {
        successful: {},
        failed: {}
      }
    };
  }

  /**
   * Initializes the fix manager
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Create backup directory if it doesn't exist
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Load existing feedback data if available
      await this.loadFeedback();
      
      if (this.logger) {
        this.logger.info(`Fix manager initialized`, {
          backupDir: this.backupDir,
          dryRun: this.dryRun
        });
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to initialize fix manager', { error: error.message });
      } else {
        console.error('Failed to initialize fix manager:', error.message);
      }
      throw error;
    }
  }

  /**
   * Creates a backup of a file before applying a fix
   * 
   * @param {string} filePath - Path to the file to backup
   * @returns {Promise<string>} Path to the backup file
   */
  async createBackup(filePath) {
    try {
      // Read the original file
      const content = await fs.readFile(filePath, 'utf8');
      
      // Create a hash of the content for the backup filename
      const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = path.basename(filePath);
      const backupPath = path.join(this.backupDir, `${fileName}.${timestamp}.${hash}.bak`);
      
      // Write the backup file
      await fs.writeFile(backupPath, content, 'utf8');
      
      if (this.logger) {
        this.logger.info(`Created backup for ${filePath}`, { backupPath });
      }
      
      return backupPath;
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Failed to create backup for ${filePath}`, { error: error.message });
      }
      throw error;
    }
  }

  /**
   * Applies a fix to a file with backup and validation
   * 
   * @param {Object} fix - Fix details
   * @param {string} fix.file - Path to the file to fix
   * @param {string} fix.original - Original code to replace
   * @param {string} fix.replacement - Replacement code
   * @param {string} fix.testName - Name of the test that triggered the fix
   * @returns {Promise<Object>} Result of the fix application
   */
  async applyFix(fix) {
    if (!fix || !fix.file || !fix.original || !fix.replacement) {
      throw new Error('Invalid fix object. Must include file, original, and replacement.');
    }
    
    try {
      // Log the fix attempt
      if (this.logger) {
        this.logger.info(`Attempting to apply fix to ${fix.file}`, {
          testName: fix.testName,
          originalLength: fix.original.length,
          replacementLength: fix.replacement.length
        });
      }
      
      // In dry run mode, just return success without making changes
      if (this.dryRun) {
        if (this.logger) {
          this.logger.info(`[DRY RUN] Would apply fix to ${fix.file}`);
        }
        return {
          success: true,
          backupPath: null,
          dryRun: true,
          file: fix.file,
          testName: fix.testName
        };
      }
      
      // Read the file content
      const content = await fs.readFile(fix.file, 'utf8');
      
      // Verify the original code exists in the file
      if (!content.includes(fix.original)) {
        throw new Error(`Original code not found in ${fix.file}`);
      }
      
      // Create a backup before applying the fix
      const backupPath = await this.createBackup(fix.file);
      
      // Apply the fix
      const newContent = content.replace(fix.original, fix.replacement);
      
      // Validate the fix (basic syntax check)
      const isValid = await this.validateFix(fix.file, newContent);
      
      if (!isValid) {
        // Revert to backup if validation fails
        if (this.logger) {
          this.logger.warn(`Fix validation failed for ${fix.file}, reverting to backup`);
        }
        await this.revertToBackup(backupPath, fix.file);
        
        // Record feedback for failed fix
        await this.recordFixFeedback(fix, false);
        
        return {
          success: false,
          backupPath,
          error: 'Fix validation failed',
          file: fix.file,
          testName: fix.testName
        };
      }
      
      // Write the fixed content to the file
      await fs.writeFile(fix.file, newContent, 'utf8');
      
      if (this.logger) {
        this.logger.info(`Successfully applied fix to ${fix.file}`);
      }
      
      // Record feedback for successful fix
      await this.recordFixFeedback(fix, true);
      
      return {
        success: true,
        backupPath,
        file: fix.file,
        testName: fix.testName
      };
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Failed to apply fix to ${fix.file}`, { error: error.message });
      }
      
      // Record feedback for failed fix
      await this.recordFixFeedback(fix, false, error.message);
      
      return {
        success: false,
        error: error.message,
        file: fix.file,
        testName: fix.testName
      };
    }
  }

  /**
   * Validates a fix by checking for basic syntax errors
   * 
   * @param {string} filePath - Path to the file
   * @param {string} content - New content to validate
   * @returns {Promise<boolean>} Whether the fix is valid
   */
  async validateFix(filePath, content) {
    try {
      // Basic validation based on file extension
      const ext = path.extname(filePath).toLowerCase();
      
      if (ext === '.js' || ext === '.jsx') {
        // For JavaScript files, try to parse the content
        try {
          // Use Function constructor as a simple syntax validator
          // This won't catch all issues but will catch basic syntax errors
          new Function(content);
          return true;
        } catch (syntaxError) {
          if (this.logger) {
            this.logger.error(`JavaScript syntax error in fix`, { error: syntaxError.message });
          }
          return false;
        }
      } else if (ext === '.json') {
        // For JSON files, try to parse the content
        try {
          JSON.parse(content);
          return true;
        } catch (jsonError) {
          if (this.logger) {
            this.logger.error(`JSON syntax error in fix`, { error: jsonError.message });
          }
          return false;
        }
      }
      
      // For other file types, assume valid
      // In a more comprehensive implementation, you could add validators for other file types
      return true;
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Fix validation error`, { error: error.message });
      }
      return false;
    }
  }

  /**
   * Reverts a file to its backup version
   * 
   * @param {string} backupPath - Path to the backup file
   * @param {string} originalPath - Path to the original file
   * @returns {Promise<boolean>} Whether the revert was successful
   */
  async revertToBackup(backupPath, originalPath) {
    try {
      // Read the backup file
      const backupContent = await fs.readFile(backupPath, 'utf8');
      
      // Write the backup content to the original file
      await fs.writeFile(originalPath, backupContent, 'utf8');
      
      if (this.logger) {
        this.logger.info(`Reverted ${originalPath} to backup ${backupPath}`);
      }
      
      return true;
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Failed to revert ${originalPath} to backup`, { error: error.message });
      }
      return false;
    }
  }

  /**
   * Records feedback about a fix to improve future AI prompts
   * 
   * @param {Object} fix - Fix details
   * @param {boolean} success - Whether the fix was successful
   * @param {string} [errorMessage] - Error message if the fix failed
   * @returns {Promise<void>}
   */
  async recordFixFeedback(fix, success, errorMessage = null) {
    try {
      // Extract patterns from the fix
      const patterns = this.extractPatternsFromFix(fix);
      
      // Record the fix details
      this.feedback.fixes.push({
        timestamp: new Date().toISOString(),
        file: fix.file,
        testName: fix.testName,
        success,
        errorMessage,
        patterns
      });
      
      // Update pattern statistics
      patterns.forEach(pattern => {
        const target = success ? this.feedback.patterns.successful : this.feedback.patterns.failed;
        target[pattern] = (target[pattern] || 0) + 1;
      });
      
      // Save feedback to disk
      await this.saveFeedback();
      
      if (this.logger) {
        this.logger.debug(`Recorded fix feedback`, { success, file: fix.file });
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Failed to record fix feedback`, { error: error.message });
      }
    }
  }

  /**
   * Extracts patterns from a fix for feedback analysis
   * 
   * @param {Object} fix - Fix details
   * @returns {Array<string>} Extracted patterns
   */
  extractPatternsFromFix(fix) {
    const patterns = [];
    
    // Extract file extension
    const ext = path.extname(fix.file).toLowerCase();
    patterns.push(`extension:${ext}`);
    
    // Extract error patterns from test name
    if (fix.testName) {
      const errorTypes = [
        'TypeError', 'SyntaxError', 'ReferenceError', 'RangeError',
        'undefined', 'null', 'NaN', 'not a function', 'cannot read property'
      ];
      
      errorTypes.forEach(type => {
        if (fix.testName.toLowerCase().includes(type.toLowerCase())) {
          patterns.push(`error:${type.toLowerCase()}`);
        }
      });
    }
    
    // Extract code patterns from original code
    if (fix.original) {
      if (fix.original.includes('undefined')) patterns.push('code:undefined');
      if (fix.original.includes('null')) patterns.push('code:null');
      if (fix.original.includes('try') && fix.original.includes('catch')) patterns.push('code:try-catch');
      if (fix.original.includes('async') && fix.original.includes('await')) patterns.push('code:async-await');
      if (fix.original.includes('import') || fix.original.includes('require')) patterns.push('code:imports');
    }
    
    return patterns;
  }

  /**
   * Loads feedback data from disk
   * 
   * @returns {Promise<void>}
   */
  async loadFeedback() {
    try {
      const data = await fs.readFile(this.feedbackStore, 'utf8');
      this.feedback = JSON.parse(data);
      
      if (this.logger) {
        this.logger.info(`Loaded fix feedback data`, {
          fixCount: this.feedback.fixes.length,
          successfulPatterns: Object.keys(this.feedback.patterns.successful).length,
          failedPatterns: Object.keys(this.feedback.patterns.failed).length
        });
      }
    } catch (error) {
      // If the file doesn't exist or is invalid, use default empty feedback
      if (error.code !== 'ENOENT') {
        if (this.logger) {
          this.logger.warn(`Failed to load fix feedback data, using defaults`, { error: error.message });
        }
      }
    }
  }

  /**
   * Saves feedback data to disk
   * 
   * @returns {Promise<void>}
   */
  async saveFeedback() {
    try {
      await fs.writeFile(this.feedbackStore, JSON.stringify(this.feedback, null, 2), 'utf8');
      
      if (this.logger) {
        this.logger.debug(`Saved fix feedback data`);
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Failed to save fix feedback data`, { error: error.message });
      }
    }
  }

  /**
   * Generates AI prompt improvements based on feedback data
   * 
   * @returns {Object} Prompt improvement suggestions
   */
  generatePromptImprovements() {
    // Analyze patterns to find what works and what doesn't
    const successfulPatterns = Object.entries(this.feedback.patterns.successful)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    const failedPatterns = Object.entries(this.feedback.patterns.failed)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // Calculate success rates for common patterns
    const allPatterns = new Set([
      ...Object.keys(this.feedback.patterns.successful),
      ...Object.keys(this.feedback.patterns.failed)
    ]);
    
    const patternStats = Array.from(allPatterns).map(pattern => {
      const successes = this.feedback.patterns.successful[pattern] || 0;
      const failures = this.feedback.patterns.failed[pattern] || 0;
      const total = successes + failures;
      const successRate = total > 0 ? (successes / total) * 100 : 0;
      
      return {
        pattern,
        successes,
        failures,
        total,
        successRate
      };
    }).sort((a, b) => b.total - a.total);
    
    // Generate suggestions based on the analysis
    const suggestions = {
      promptAdditions: [],
      promptRemovals: [],
      focusAreas: []
    };
    
    // Suggest additions for patterns with high success rates
    patternStats
      .filter(stat => stat.total >= 5 && stat.successRate >= 70)
      .forEach(stat => {
        suggestions.promptAdditions.push({
          pattern: stat.pattern,
          successRate: stat.successRate.toFixed(1) + '%',
          occurrences: stat.total
        });
      });
    
    // Suggest removals for patterns with low success rates
    patternStats
      .filter(stat => stat.total >= 5 && stat.successRate <= 30)
      .forEach(stat => {
        suggestions.promptRemovals.push({
          pattern: stat.pattern,
          successRate: stat.successRate.toFixed(1) + '%',
          occurrences: stat.total
        });
      });
    
    // Suggest focus areas for improvement
    failedPatterns.forEach(([pattern, count]) => {
      suggestions.focusAreas.push({
        pattern,
        failureCount: count
      });
    });
    
    return suggestions;
  }
}

module.exports = FixManager;
