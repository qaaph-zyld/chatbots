/**
 * Run Bug Sweep Script
 * 
 * This script runs the bug sweep utility and generates a comprehensive report.
 */

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
const { runBugSweep, saveReport } = require('../utils/bug-sweep');
const { logger } = require('../utils/logger');

// Configuration
const REPORTS_DIR = path.join(process.cwd(), 'reports', 'bug-sweep');

/**
 * Main function to run bug sweep
 */
async function main() {
  try {
    // Ensure reports directory exists
    await mkdir(REPORTS_DIR, { recursive: true });
    
    logger.info('Starting comprehensive bug sweep...');
    
    // Run bug sweep
    const result = await runBugSweep();
    
    // Generate timestamp for report filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(REPORTS_DIR, `bug-sweep-report-${timestamp}.txt`);
    
    // Save detailed report
    await saveReport(result, reportPath);
    
    // Log summary
    logger.info(`Bug sweep completed. Found ${result.stats.issuesFound} potential issues.`);
    logger.info(`Critical issues: ${result.stats.bySeverity.critical}`);
    logger.info(`High severity issues: ${result.stats.bySeverity.high}`);
    logger.info(`Errors: ${result.stats.bySeverity.error}`);
    logger.info(`Warnings: ${result.stats.bySeverity.warning}`);
    logger.info(`Full report saved to: ${reportPath}`);
    
    // Return exit code based on critical issues
    if (result.stats.bySeverity.critical > 0) {
      logger.error('Critical issues found! Please fix them immediately.');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error running bug sweep:', error);
    process.exit(1);
  }
}

// Run the script
main();
