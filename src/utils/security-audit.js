/**
 * Security Audit Utility
 * 
 * A utility for performing security audits on the codebase and configuration.
 * Identifies potential security vulnerabilities and provides recommendations.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const { logger } = require('./logger');
const dotenv = require('dotenv');

/**
 * Security audit configuration
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
    /\.jsx$/,
    /\.json$/,
    /\.env$/,
    /\.env\..+$/
  ],
  
  // Security vulnerability patterns
  vulnerabilityPatterns: [
    // Injection vulnerabilities
    {
      pattern: /eval\s*\(/g,
      description: 'Use of eval() (potential code injection)',
      severity: 'critical',
      recommendation: 'Avoid using eval(). Use safer alternatives like JSON.parse() for JSON data.'
    },
    {
      pattern: /exec\s*\(\s*['"`][^'"`]*\$\{/g,
      description: 'Potential command injection vulnerability',
      severity: 'critical',
      recommendation: 'Use child_process.execFile() or sanitize inputs before using in exec().'
    },
    {
      pattern: /new\s+Function\s*\(/g,
      description: 'Use of new Function() (potential code injection)',
      severity: 'critical',
      recommendation: 'Avoid using new Function(). Use safer alternatives.'
    },
    
    // XSS vulnerabilities
    {
      pattern: /\.innerHTML\s*=/g,
      description: 'Direct innerHTML assignment (XSS risk)',
      severity: 'high',
      recommendation: 'Use textContent or innerText instead, or sanitize HTML with a library like DOMPurify.'
    },
    {
      pattern: /document\.write\s*\(/g,
      description: 'Use of document.write (XSS risk)',
      severity: 'high',
      recommendation: 'Avoid document.write(). Use safer DOM manipulation methods.'
    },
    {
      pattern: /\$\(['"]\s*\#[^'"]+['"]\s*\)\.html\s*\(/g,
      description: 'jQuery html() method usage (XSS risk)',
      severity: 'high',
      recommendation: 'Use text() instead, or sanitize HTML with a library like DOMPurify.'
    },
    
    // Authentication issues
    {
      pattern: /jwt\.sign\([^,]*,\s*['"`].*['"`],\s*{\s*expiresIn:\s*(?:false|null|undefined|0)/g,
      description: 'JWT without expiration',
      severity: 'high',
      recommendation: 'Always set an appropriate expiration time for JWTs.'
    },
    {
      pattern: /bcrypt\.hash\([^,]*,\s*(?:5|6|7|8|9)\s*\)/g,
      description: 'Weak bcrypt rounds (< 10)',
      severity: 'medium',
      recommendation: 'Use at least 10 rounds for bcrypt hashing in production.'
    },
    {
      pattern: /createHash\s*\(\s*['"]md5['"]\s*\)/g,
      description: 'Use of weak hash algorithm (MD5)',
      severity: 'high',
      recommendation: 'Use a strong hashing algorithm like SHA-256 or better.'
    },
    {
      pattern: /createHash\s*\(\s*['"]sha1['"]\s*\)/g,
      description: 'Use of weak hash algorithm (SHA-1)',
      severity: 'medium',
      recommendation: 'Use a strong hashing algorithm like SHA-256 or better.'
    },
    
    // Database issues
    {
      pattern: /mongoose\.connect\([^,]*,\s*{\s*useNewUrlParser:\s*false/g,
      description: 'MongoDB connection with useNewUrlParser: false',
      severity: 'medium',
      recommendation: 'Set useNewUrlParser to true for MongoDB connections.'
    },
    {
      pattern: /mongoose\.connect\([^,]*,\s*[^)]*\)(?!.*useCreateIndex)/g,
      description: 'MongoDB connection without useCreateIndex',
      severity: 'low',
      recommendation: 'Set useCreateIndex to true for MongoDB connections.'
    },
    {
      pattern: /find\s*\(\s*{\s*\$where\s*:/g,
      description: 'MongoDB $where operator usage (injection risk)',
      severity: 'high',
      recommendation: 'Avoid using the $where operator. Use standard query operators instead.'
    },
    
    // Sensitive data exposure
    {
      pattern: /(const|let|var)\s+(\w+)\s*=\s*['"](?:password|secret|api[_-]?key|access[_-]?token|auth[_-]?token)['"]/gi,
      description: 'Hardcoded credentials or secrets',
      severity: 'critical',
      recommendation: 'Use environment variables or a secure vault for secrets.'
    },
    {
      pattern: /console\.log\s*\(\s*(?:.*password|.*secret|.*token|.*key)/gi,
      description: 'Logging sensitive data',
      severity: 'high',
      recommendation: 'Avoid logging sensitive information. Redact or mask sensitive data before logging.'
    },
    
    // Insecure headers
    {
      pattern: /helmet\s*\(\s*{\s*contentSecurityPolicy\s*:\s*false/g,
      description: 'Content Security Policy disabled',
      severity: 'medium',
      recommendation: 'Enable Content Security Policy for better protection against XSS attacks.'
    },
    {
      pattern: /helmet\s*\(\s*{\s*xssFilter\s*:\s*false/g,
      description: 'XSS Protection header disabled',
      severity: 'medium',
      recommendation: 'Enable XSS Protection header for better protection against XSS attacks.'
    },
    
    // CSRF issues
    {
      pattern: /app\.use\s*\(\s*csrf\s*\(\s*{\s*cookie\s*:\s*true/g,
      description: 'CSRF protection with cookies without SameSite attribute',
      severity: 'medium',
      recommendation: 'Set SameSite attribute for cookies used in CSRF protection.'
    },
    
    // Miscellaneous
    {
      pattern: /nosniff\s*:\s*false/g,
      description: 'X-Content-Type-Options: nosniff disabled',
      severity: 'low',
      recommendation: 'Enable nosniff header to prevent MIME type sniffing.'
    },
    {
      pattern: /frameguard\s*:\s*false/g,
      description: 'X-Frame-Options header disabled',
      severity: 'medium',
      recommendation: 'Enable frameguard to prevent clickjacking attacks.'
    }
  ],
  
  // Environment variable checks
  envChecks: [
    {
      name: 'NODE_ENV',
      recommendation: 'Should be set to "production" in production environments',
      severity: 'medium'
    },
    {
      name: 'JWT_SECRET',
      recommendation: 'Should be a strong, unique value at least 32 characters long',
      severity: 'high',
      validator: (value) => value && value.length >= 32
    },
    {
      name: 'API_KEY_SECRET',
      recommendation: 'Should be a strong, unique value at least 32 characters long',
      severity: 'high',
      validator: (value) => value && value.length >= 32
    },
    {
      name: 'SESSION_SECRET',
      recommendation: 'Should be a strong, unique value at least 32 characters long',
      severity: 'high',
      validator: (value) => value && value.length >= 32
    },
    {
      name: 'MONGODB_URI',
      recommendation: 'Should not contain credentials in the URI, use separate environment variables',
      severity: 'medium',
      validator: (value) => value && !value.includes('@')
    }
  ],
  
  // Dependency checks
  dependencyChecks: [
    {
      name: 'express-rate-limit',
      recommendation: 'Should be used to prevent brute force attacks',
      severity: 'medium'
    },
    {
      name: 'helmet',
      recommendation: 'Should be used to set secure HTTP headers',
      severity: 'high'
    },
    {
      name: 'cors',
      recommendation: 'Should be configured with restrictive options',
      severity: 'medium'
    },
    {
      name: 'csurf',
      recommendation: 'Should be used to prevent CSRF attacks',
      severity: 'high'
    }
  ]
};

/**
 * Result object for security audit
 */
class SecurityAuditResult {
  constructor() {
    this.vulnerabilities = [];
    this.envIssues = [];
    this.dependencyIssues = [];
    this.stats = {
      filesScanned: 0,
      vulnerabilitiesFound: 0,
      envIssuesFound: 0,
      dependencyIssuesFound: 0,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };
  }
  
  /**
   * Add a vulnerability to the results
   * @param {Object} vulnerability - Vulnerability details
   */
  addVulnerability(vulnerability) {
    this.vulnerabilities.push(vulnerability);
    this.stats.vulnerabilitiesFound++;
    this.stats.bySeverity[vulnerability.severity]++;
  }
  
  /**
   * Add an environment issue to the results
   * @param {Object} issue - Environment issue details
   */
  addEnvIssue(issue) {
    this.envIssues.push(issue);
    this.stats.envIssuesFound++;
    this.stats.bySeverity[issue.severity]++;
  }
  
  /**
   * Add a dependency issue to the results
   * @param {Object} issue - Dependency issue details
   */
  addDependencyIssue(issue) {
    this.dependencyIssues.push(issue);
    this.stats.dependencyIssuesFound++;
    this.stats.bySeverity[issue.severity]++;
  }
  
  /**
   * Get vulnerabilities filtered by severity
   * @param {string} severity - Severity level
   * @returns {Array} - Filtered vulnerabilities
   */
  getVulnerabilitiesBySeverity(severity) {
    return this.vulnerabilities.filter(v => v.severity === severity);
  }
  
  /**
   * Get vulnerabilities for a specific file
   * @param {string} filePath - File path
   * @returns {Array} - Vulnerabilities for the file
   */
  getVulnerabilitiesForFile(filePath) {
    return this.vulnerabilities.filter(v => v.file === filePath);
  }
  
  /**
   * Generate a summary report
   * @returns {string} - Summary report
   */
  generateSummary() {
    let summary = '\n=== SECURITY AUDIT SUMMARY ===\n\n';
    summary += `Files scanned: ${this.stats.filesScanned}\n`;
    summary += `Total vulnerabilities found: ${this.stats.vulnerabilitiesFound}\n`;
    summary += `Environment issues found: ${this.stats.envIssuesFound}\n`;
    summary += `Dependency issues found: ${this.stats.dependencyIssuesFound}\n\n`;
    
    summary += 'Issues by severity:\n';
    for (const [severity, count] of Object.entries(this.stats.bySeverity)) {
      if (count > 0) {
        summary += `  ${severity}: ${count}\n`;
      }
    }
    
    if (this.stats.bySeverity.critical > 0) {
      summary += '\n⚠️ CRITICAL VULNERABILITIES FOUND! These should be fixed immediately.\n';
    }
    
    return summary;
  }
  
  /**
   * Generate a detailed report
   * @returns {string} - Detailed report
   */
  generateDetailedReport() {
    let report = this.generateSummary();
    
    // Add critical and high severity vulnerabilities first
    const criticalVulnerabilities = this.getVulnerabilitiesBySeverity('critical');
    const highVulnerabilities = this.getVulnerabilitiesBySeverity('high');
    
    if (criticalVulnerabilities.length > 0 || highVulnerabilities.length > 0) {
      report += '\n=== CRITICAL AND HIGH SEVERITY VULNERABILITIES ===\n\n';
      
      [...criticalVulnerabilities, ...highVulnerabilities].forEach(vulnerability => {
        report += `[${vulnerability.severity.toUpperCase()}] ${vulnerability.file}:${vulnerability.line} - ${vulnerability.description}\n`;
        report += `  Code: ${vulnerability.code.trim()}\n`;
        report += `  Recommendation: ${vulnerability.recommendation}\n\n`;
      });
    }
    
    // Group vulnerabilities by file
    report += '\n=== VULNERABILITIES BY FILE ===\n\n';
    const vulnerabilitiesByFile = {};
    this.vulnerabilities.forEach(vulnerability => {
      if (!vulnerabilitiesByFile[vulnerability.file]) {
        vulnerabilitiesByFile[vulnerability.file] = [];
      }
      vulnerabilitiesByFile[vulnerability.file].push(vulnerability);
    });
    
    for (const [file, vulnerabilities] of Object.entries(vulnerabilitiesByFile)) {
      report += `FILE: ${file}\n`;
      
      // Sort vulnerabilities by line number
      vulnerabilities.sort((a, b) => a.line - b.line);
      
      vulnerabilities.forEach(vulnerability => {
        report += `  [${vulnerability.severity.toUpperCase()}] Line ${vulnerability.line}: ${vulnerability.description}\n`;
        report += `    Code: ${vulnerability.code.trim()}\n`;
        report += `    Recommendation: ${vulnerability.recommendation}\n`;
      });
      
      report += '\n';
    }
    
    // Add environment issues
    if (this.envIssues.length > 0) {
      report += '\n=== ENVIRONMENT CONFIGURATION ISSUES ===\n\n';
      
      this.envIssues.forEach(issue => {
        report += `[${issue.severity.toUpperCase()}] ${issue.name}: ${issue.issue}\n`;
        report += `  Recommendation: ${issue.recommendation}\n\n`;
      });
    }
    
    // Add dependency issues
    if (this.dependencyIssues.length > 0) {
      report += '\n=== DEPENDENCY ISSUES ===\n\n';
      
      this.dependencyIssues.forEach(issue => {
        report += `[${issue.severity.toUpperCase()}] ${issue.name}: ${issue.issue}\n`;
        report += `  Recommendation: ${issue.recommendation}\n\n`;
      });
    }
    
    // Add general security recommendations
    report += '\n=== GENERAL SECURITY RECOMMENDATIONS ===\n\n';
    report += '1. Implement Content Security Policy (CSP) to mitigate XSS attacks\n';
    report += '2. Use HTTPS for all communications\n';
    report += '3. Implement proper input validation and sanitization\n';
    report += '4. Set secure and HttpOnly flags on cookies\n';
    report += '5. Implement proper authentication and authorization\n';
    report += '6. Keep dependencies up to date\n';
    report += '7. Implement rate limiting to prevent brute force attacks\n';
    report += '8. Use parameterized queries to prevent SQL injection\n';
    report += '9. Implement proper error handling to avoid information leakage\n';
    report += '10. Regularly perform security audits and penetration testing\n';
    
    return report;
  }
}

/**
 * Scan a file for potential security vulnerabilities
 * @param {string} filePath - Path to the file
 * @param {SecurityAuditResult} result - Result object
 */
async function scanFile(filePath, result) {
  try {
    const content = await readFile(filePath, 'utf8');
    const lines = content.split('\n');
    
    result.stats.filesScanned++;
    
    // Check for vulnerability patterns
    config.vulnerabilityPatterns.forEach(({ pattern, description, severity, recommendation }) => {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      
      // Check each line
      lines.forEach((line, lineIndex) => {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          result.addVulnerability({
            file: filePath,
            line: lineIndex + 1,
            description,
            severity,
            recommendation,
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
 * @param {SecurityAuditResult} result - Result object
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
 * Check environment variables for security issues
 * @param {SecurityAuditResult} result - Result object
 */
function checkEnvironmentVariables(result) {
  try {
    // Load environment variables from .env files
    dotenv.config();
    
    // Check each environment variable
    config.envChecks.forEach(check => {
      const value = process.env[check.name];
      
      if (!value) {
        result.addEnvIssue({
          name: check.name,
          issue: 'Environment variable not set',
          recommendation: check.recommendation,
          severity: check.severity
        });
      } else if (check.validator && !check.validator(value)) {
        result.addEnvIssue({
          name: check.name,
          issue: 'Environment variable does not meet security requirements',
          recommendation: check.recommendation,
          severity: check.severity
        });
      }
    });
  } catch (error) {
    logger.error('Error checking environment variables:', error);
  }
}

/**
 * Check dependencies for security issues
 * @param {SecurityAuditResult} result - Result object
 */
async function checkDependencies(result) {
  try {
    // Read package.json
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
    
    // Get dependencies
    const dependencies = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    // Check each dependency
    config.dependencyChecks.forEach(check => {
      if (!dependencies[check.name]) {
        result.addDependencyIssue({
          name: check.name,
          issue: 'Dependency not found',
          recommendation: check.recommendation,
          severity: check.severity
        });
      }
    });
  } catch (error) {
    logger.error('Error checking dependencies:', error);
  }
}

/**
 * Run the security audit
 * @param {Object} options - Options for the security audit
 * @returns {Promise<SecurityAuditResult>} - Security audit results
 */
async function runSecurityAudit(options = {}) {
  const result = new SecurityAuditResult();
  const rootDir = path.resolve(process.cwd());
  
  logger.info('Starting security audit...');
  
  // Merge options with default config
  const mergedConfig = { ...config, ...options };
  
  // Scan included directories
  for (const dir of mergedConfig.includeDirs) {
    const fullPath = path.join(rootDir, dir);
    await scanDirectory(fullPath, result);
  }
  
  // Check environment variables
  checkEnvironmentVariables(result);
  
  // Check dependencies
  await checkDependencies(result);
  
  logger.info('Security audit completed.');
  logger.info(result.generateSummary());
  
  return result;
}

/**
 * Save security audit results to a file
 * @param {SecurityAuditResult} result - Security audit results
 * @param {string} outputPath - Path to save the report
 */
async function saveReport(result, outputPath) {
  try {
    const report = result.generateDetailedReport();
    await promisify(fs.writeFile)(outputPath, report, 'utf8');
    logger.info(`Security audit report saved to ${outputPath}`);
  } catch (error) {
    logger.error('Error saving security audit report:', error);
  }
}

// Export functions
module.exports = {
  runSecurityAudit,
  saveReport,
  SecurityAuditResult
};

// Run directly if called from command line
if (require.main === module) {
  (async () => {
    try {
      const result = await runSecurityAudit();
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      await saveReport(result, `security-audit-report-${timestamp}.txt`);
    } catch (error) {
      logger.error('Error running security audit:', error);
      process.exit(1);
    }
  })();
}
