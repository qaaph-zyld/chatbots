/**
 * Bug Sweep Utility
 * 
 * A utility for identifying potential bugs and issues in the codebase.
 * This tool performs static analysis and runtime checks to find common issues.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const { logger } = require('./logger');

/**
 * Bug sweep configuration
 */
const config = {
  // Directories to scan
  includeDirs: [
    'src/api',
    'src/models',
    'src/services',
    'src/controllers',
    'src/middleware',
    'src/utils',
    'src/integrations',
    'src/analytics',
    'src/scaling',
    'src/nlp',
    'src/multimodal',
    'src/context'
  ],
  
  // Directories to exclude
  excludeDirs: [
    'node_modules',
    'dist',
    'coverage',
    'src/tests'
  ],
  
  // File patterns to include
  includePatterns: [
    /\.js$/,
    /\.jsx$/
  ],
  
  // Patterns that might indicate bugs
  bugPatterns: [
    {
      pattern: /console\.log/g,
      description: 'Console.log statement found (should use logger)',
      severity: 'warning'
    },
    {
      pattern: /TODO|FIXME/g,
      description: 'TODO or FIXME comment found',
      severity: 'info'
    },
    {
      pattern: /catch\s*\([^)]*\)\s*{\s*}/g,
      description: 'Empty catch block',
      severity: 'error'
    },
    {
      pattern: /catch\s*\([^)]*\)\s*{\s*\/\/[^\n]*\s*}/g,
      description: 'Catch block with only comments',
      severity: 'warning'
    },
    {
      pattern: /\.then\(\s*\)\s*\.catch\(/g,
      description: 'Empty then() block in promise chain',
      severity: 'warning'
    },
    {
      pattern: /setTimeout\(\s*[^,]+\s*\)/g,
      description: 'setTimeout without timeout value',
      severity: 'error'
    },
    {
      pattern: /==[^=]/g,
      description: 'Non-strict equality (==) used',
      severity: 'warning'
    },
    {
      pattern: /!=[^=]/g,
      description: 'Non-strict inequality (!=) used',
      severity: 'warning'
    },
    {
      pattern: /new\s+Array\(/g,
      description: 'Using new Array() instead of []',
      severity: 'info'
    },
    {
      pattern: /new\s+Object\(/g,
      description: 'Using new Object() instead of {}',
      severity: 'info'
    },
    {
      pattern: /\.forEach\(async/g,
      description: 'Using async in forEach (will not wait for promises)',
      severity: 'error'
    },
    {
      pattern: /for\s*\([^;]*;\s*;[^)]*\)/g,
      description: 'For loop with missing condition',
      severity: 'error'
    },
    {
      pattern: /if\s*\(\s*([a-zA-Z0-9_$]+)\s*=\s*[^=]/g,
      description: 'Assignment in if condition (possible typo)',
      severity: 'error'
    },
    {
      pattern: /require\([^)]+\)\(/g,
      description: 'Immediately invoked require',
      severity: 'warning'
    }
  ],
  
  // Security vulnerability patterns
  securityPatterns: [
    {
      pattern: /eval\s*\(/g,
      description: 'Use of eval() (security risk)',
      severity: 'critical'
    },
    {
      pattern: /exec\s*\(\s*['"`][^'"`]*\$\{/g,
      description: 'Potential command injection',
      severity: 'critical'
    },
    {
      pattern: /\.innerHTML\s*=/g,
      description: 'Direct innerHTML assignment (XSS risk)',
      severity: 'high'
    },
    {
      pattern: /document\.write\s*\(/g,
      description: 'Use of document.write (XSS risk)',
      severity: 'high'
    },
    {
      pattern: /\.createAttribute\s*\(\s*['"`]on/g,
      description: 'Creating event handler attributes (XSS risk)',
      severity: 'high'
    },
    {
      pattern: /mongoose\.connect\([^,]*,\s*{\s*useNewUrlParser:\s*false/g,
      description: 'MongoDB connection with useNewUrlParser: false',
      severity: 'medium'
    },
    {
      pattern: /jwt\.sign\([^,]*,\s*['"`].*['"`],\s*{\s*expiresIn:\s*(?:false|null|undefined|0)/g,
      description: 'JWT without expiration',
      severity: 'high'
    }
  ]
};

/**
 * Result object for bug sweep
 */
class BugSweepResult {
  constructor() {
    this.issues = [];
    this.stats = {
      filesScanned: 0,
      issuesFound: 0,
      bySeverity: {
        critical: 0,
        high: 0,
        error: 0,
        warning: 0,
        info: 0,
        medium: 0
      }
    };
  }
  
  /**
   * Add an issue to the results
   * @param {Object} issue - Issue details
   */
  addIssue(issue) {
    this.issues.push(issue);
    this.stats.issuesFound++;
    this.stats.bySeverity[issue.severity]++;
  }
  
  /**
   * Get issues filtered by severity
   * @param {string} severity - Severity level
   * @returns {Array} - Filtered issues
   */
  getIssuesBySeverity(severity) {
    return this.issues.filter(issue => issue.severity === severity);
  }
  
  /**
   * Get issues for a specific file
   * @param {string} filePath - File path
   * @returns {Array} - Issues for the file
   */
  getIssuesForFile(filePath) {
    return this.issues.filter(issue => issue.file === filePath);
  }
  
  /**
   * Generate a summary report
   * @returns {string} - Summary report
   */
  generateSummary() {
    let summary = '\n=== BUG SWEEP SUMMARY ===\n\n';
    summary += `Files scanned: ${this.stats.filesScanned}\n`;
    summary += `Total issues found: ${this.stats.issuesFound}\n\n`;
    
    summary += 'Issues by severity:\n';
    for (const [severity, count] of Object.entries(this.stats.bySeverity)) {
      if (count > 0) {
        summary += `  ${severity}: ${count}\n`;
      }
    }
    
    if (this.stats.bySeverity.critical > 0) {
      summary += '\n⚠️ CRITICAL ISSUES FOUND! These should be fixed immediately.\n';
    }
    
    return summary;
  }
  
  /**
   * Generate a detailed report
   * @returns {string} - Detailed report
   */
  generateDetailedReport() {
    let report = this.generateSummary();
    
    // Group issues by file
    const issuesByFile = {};
    this.issues.forEach(issue => {
      if (!issuesByFile[issue.file]) {
        issuesByFile[issue.file] = [];
      }
      issuesByFile[issue.file].push(issue);
    });
    
    // Add detailed issues
    report += '\n=== DETAILED ISSUES ===\n\n';
    
    // First list critical and high severity issues
    const criticalIssues = this.getIssuesBySeverity('critical');
    const highIssues = this.getIssuesBySeverity('high');
    
    if (criticalIssues.length > 0 || highIssues.length > 0) {
      report += '🚨 CRITICAL AND HIGH SEVERITY ISSUES:\n\n';
      
      [...criticalIssues, ...highIssues].forEach(issue => {
        report += `[${issue.severity.toUpperCase()}] ${issue.file}:${issue.line} - ${issue.description}\n`;
        report += `  Code: ${issue.code.trim()}\n\n`;
      });
    }
    
    // Then list all issues by file
    report += 'ALL ISSUES BY FILE:\n\n';
    for (const [file, issues] of Object.entries(issuesByFile)) {
      report += `FILE: ${file}\n`;
      
      // Sort issues by line number
      issues.sort((a, b) => a.line - b.line);
      
      issues.forEach(issue => {
        report += `  [${issue.severity.toUpperCase()}] Line ${issue.line}: ${issue.description}\n`;
        report += `    Code: ${issue.code.trim()}\n`;
      });
      
      report += '\n';
    }
    
    return report;
  }
}

/**
 * Scan a file for potential bugs
 * @param {string} filePath - Path to the file
 * @param {BugSweepResult} result - Result object
 */
async function scanFile(filePath, result) {
  try {
    const content = await readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    result.stats.filesScanned++;
    
    // Check for bug patterns
    [...config.bugPatterns, ...config.securityPatterns].forEach(({ pattern, description, severity }) => {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      
      // Check each line
      lines.forEach((line, lineIndex) => {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          result.addIssue({
            file: filePath,
            line: lineIndex + 1,
            description,
            severity,
            code: line
          });
        }
      });
    });
  } catch (error) {
    logger.error(`Error scanning file ${filePath}:`, error);
  }
}

/**
 * Recursively scan directories for files to check
 * @param {string} dir - Directory to scan
 * @param {BugSweepResult} result - Result object
 */
async function scanDirectory(dir, result) {
  try {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = await stat(fullPath);
      
      // Skip excluded directories
      if (stats.isDirectory() && config.excludeDirs.includes(entry)) {
        continue;
      }
      
      if (stats.isDirectory()) {
        await scanDirectory(fullPath, result);
      } else if (stats.isFile() && config.includePatterns.some(pattern => pattern.test(entry))) {
        await scanFile(fullPath, result);
      }
    }
  } catch (error) {
    logger.error(`Error scanning directory ${dir}:`, error);
  }
}

/**
 * Run the bug sweep
 * @param {Object} options - Options for the bug sweep
 * @returns {Promise<BugSweepResult>} - Bug sweep results
 */
async function runBugSweep(options = {}) {
  const result = new BugSweepResult();
  const rootDir = path.resolve(process.cwd());
  
  logger.info('Starting bug sweep...');
  
  // Merge options with default config
  const mergedConfig = { ...config, ...options };
  
  // Scan included directories
  for (const dir of mergedConfig.includeDirs) {
    const fullPath = path.join(rootDir, dir);
    await scanDirectory(fullPath, result);
  }
  
  logger.info('Bug sweep completed.');
  logger.info(result.generateSummary());
  
  return result;
}

/**
 * Save bug sweep results to a file
 * @param {BugSweepResult} result - Bug sweep results
 * @param {string} outputPath - Path to save the report
 */
async function saveReport(result, outputPath) {
  try {
    const report = result.generateDetailedReport();
    await promisify(fs.writeFile)(outputPath, report, 'utf8');
    logger.info(`Bug sweep report saved to ${outputPath}`);
  } catch (error) {
    logger.error('Error saving bug sweep report:', error);
  }
}

// Export functions
module.exports = {
  runBugSweep,
  saveReport,
  BugSweepResult
};

// Run directly if called from command line
if (require.main === module) {
  (async () => {
    try {
      const result = await runBugSweep();
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      await saveReport(result, `bug-sweep-report-${timestamp}.txt`);
    } catch (error) {
      logger.error('Error running bug sweep:', error);
      process.exit(1);
    }
  })();
}
