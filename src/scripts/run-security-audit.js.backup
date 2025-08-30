/**
 * Run Security Audit Script
 * 
 * This script runs the security audit utility and generates a comprehensive report.
 */

const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);
require('@src/utils\security-audit');
require('@src/utils\logger');

// Configuration
const REPORTS_DIR = path.join(process.cwd(), 'reports', 'security-audit');

/**
 * Main function to run security audit
 */
async function main() {
  try {
    // Ensure reports directory exists
    await mkdir(REPORTS_DIR, { recursive: true });
    
    logger.info('Starting comprehensive security audit...');
    
    // Run security audit
    const result = await runSecurityAudit();
    
    // Generate timestamp for report filename
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(REPORTS_DIR, `security-audit-report-${timestamp}.txt`);
    
    // Save detailed report
    await saveReport(result, reportPath);
    
    // Log summary
    logger.info(`Security audit completed. Found ${result.stats.vulnerabilitiesFound} potential vulnerabilities.`);
    logger.info(`Critical vulnerabilities: ${result.stats.bySeverity.critical}`);
    logger.info(`High severity vulnerabilities: ${result.stats.bySeverity.high}`);
    logger.info(`Environment issues: ${result.stats.envIssuesFound}`);
    logger.info(`Dependency issues: ${result.stats.dependencyIssuesFound}`);
    logger.info(`Full report saved to: ${reportPath}`);
    
    // Return exit code based on critical vulnerabilities
    if (result.stats.bySeverity.critical > 0) {
      logger.error('Critical vulnerabilities found! Please fix them immediately.');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('Error running security audit:', error);
    process.exit(1);
  }
}

// Run the script
main();
