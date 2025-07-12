/**
 * FixApplier - Responsible for applying fixes to test failures
 * 
 * This class extracts the fix application logic from TestAutomationRunner
 * to improve maintainability and separation of concerns.
 */

const path = require('path');
const fs = require('fs');

class FixApplier {
  /**
   * Creates a new FixApplier instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.fixManager - Fix manager instance (optional)
   * @param {boolean} options.dryRun - Whether to perform a dry run without making changes
   * @param {boolean} options.autoRevertFailedFixes - Whether to auto-revert failed fixes
   * @param {Object} options.logger - Logger instance (optional)
   */
  constructor(options = {}) {
    this.fixManager = options.fixManager;
    this.dryRun = options.dryRun || false;
    this.autoRevertFailedFixes = options.autoRevertFailedFixes !== false;
    this.logger = options.logger;
  }
  
  /**
   * Applies fixes to test failures
   * 
   * @param {Object} analysis - Analysis results from AI fix engine
   * @param {Array} fixes - Array of fix objects
   * @returns {Promise<Object>} - Results of applying fixes
   */
  async applyFixes(analysis, fixes) {
    if (!fixes || fixes.length === 0) {
      if (this.logger) {
        this.logger.info('No fixes to apply');
      } else {
        console.log('No fixes to apply');
      }
      
      return {
        applied: false,
        reason: 'No fixes available'
      };
    }
    
    if (this.dryRun) {
      if (this.logger) {
        this.logger.info('Dry run mode - not applying fixes', { fixCount: fixes.length });
      } else {
        console.log(`Dry run mode - would apply ${fixes.length} fixes`);
      }
      
      return {
        applied: false,
        dryRun: true,
        fixCount: fixes.length,
        fixes
      };
    }
    
    const results = {
      applied: true,
      successful: [],
      failed: [],
      skipped: []
    };
    
    for (const fix of fixes) {
      try {
        // Skip fixes without required information
        if (!fix.file || !fix.changes) {
          results.skipped.push({
            fix,
            reason: 'Missing required information (file or changes)'
          });
          continue;
        }
        
        // Apply the fix
        const backupPath = await this.applyFix(fix);
        
        results.successful.push({
          fix,
          backupPath
        });
        
        if (this.logger) {
          this.logger.info(`Applied fix to ${fix.file}`, {
            file: fix.file,
            backupPath
          });
        } else {
          console.log(`Applied fix to ${fix.file}`);
        }
      } catch (error) {
        results.failed.push({
          fix,
          error: error.message
        });
        
        if (this.logger) {
          this.logger.error(`Failed to apply fix to ${fix.file}`, {
            file: fix.file,
            error: error.message
          });
        } else {
          console.error(`Failed to apply fix to ${fix.file}: ${error.message}`);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Applies a single fix to a file
   * 
   * @param {Object} fix - Fix object
   * @returns {Promise<string>} - Path to backup file
   * @private
   */
  async applyFix(fix) {
    // Use fix manager if available
    if (this.fixManager) {
      return this.fixManager.applyFix(fix);
    }
    
    // Fallback implementation if fix manager is not available
    const filePath = fix.file;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    // Create backup
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    
    try {
      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Apply changes
      let newContent = content;
      
      if (fix.changes.type === 'replace') {
        // Simple find and replace
        newContent = content.replace(fix.changes.find, fix.changes.replace);
      } else if (fix.changes.type === 'line') {
        // Line-based replacement
        const lines = content.split('\n');
        
        for (const change of fix.changes.lines) {
          if (change.line >= 0 && change.line < lines.length) {
            lines[change.line] = change.content;
          }
        }
        
        newContent = lines.join('\n');
      } else if (fix.changes.type === 'full') {
        // Full file replacement
        newContent = fix.changes.content;
      }
      
      // Write updated content
      fs.writeFileSync(filePath, newContent, 'utf8');
      
      return backupPath;
    } catch (error) {
      // Restore backup on error if auto-revert is enabled
      if (this.autoRevertFailedFixes) {
        try {
          fs.copyFileSync(backupPath, filePath);
          
          if (this.logger) {
            this.logger.info(`Reverted failed fix for ${filePath}`);
          } else {
            console.log(`Reverted failed fix for ${filePath}`);
          }
        } catch (revertError) {
          if (this.logger) {
            this.logger.error(`Failed to revert fix for ${filePath}`, {
              error: revertError.message
            });
          } else {
            console.error(`Failed to revert fix for ${filePath}: ${revertError.message}`);
          }
        }
      }
      
      throw error;
    }
  }
  
  /**
   * Reverts applied fixes
   * 
   * @param {Array} appliedFixes - Array of successfully applied fixes
   * @returns {Promise<Object>} - Results of reverting fixes
   */
  async revertFixes(appliedFixes) {
    if (!appliedFixes || appliedFixes.length === 0) {
      return {
        reverted: false,
        reason: 'No fixes to revert'
      };
    }
    
    const results = {
      reverted: true,
      successful: [],
      failed: []
    };
    
    for (const applied of appliedFixes) {
      try {
        const { fix, backupPath } = applied;
        
        // Skip if missing backup path
        if (!backupPath) {
          results.failed.push({
            fix,
            reason: 'Missing backup path'
          });
          continue;
        }
        
        // Check if backup exists
        if (!fs.existsSync(backupPath)) {
          results.failed.push({
            fix,
            reason: 'Backup file not found'
          });
          continue;
        }
        
        // Restore from backup
        fs.copyFileSync(backupPath, fix.file);
        
        results.successful.push({
          fix,
          backupPath
        });
        
        if (this.logger) {
          this.logger.info(`Reverted fix for ${fix.file}`, {
            file: fix.file,
            backupPath
          });
        } else {
          console.log(`Reverted fix for ${fix.file}`);
        }
      } catch (error) {
        results.failed.push({
          fix: applied.fix,
          error: error.message
        });
        
        if (this.logger) {
          this.logger.error(`Failed to revert fix for ${applied.fix.file}`, {
            file: applied.fix.file,
            error: error.message
          });
        } else {
          console.error(`Failed to revert fix for ${applied.fix.file}: ${error.message}`);
        }
      }
    }
    
    return results;
  }
}

module.exports = FixApplier;
