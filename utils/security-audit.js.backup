/**
 * Security Audit Utility
 * 
 * This utility performs security checks on the voice interface components
 * to identify potential vulnerabilities and security issues.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuration
const config = {
  scanDirectories: [
    'src/utils',
    'src/controllers',
    'src/services',
    'src/routes'
  ],
  excludePatterns: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage'
  ],
  securityRules: {
    // File system access
    unsafeFileOperations: {
      pattern: /fs\.(write|append|unlink|rm|chmod|chown|symlink|truncate|open)/g,
      description: 'Potentially unsafe file system operations',
      severity: 'medium'
    },
    // Command execution
    commandExecution: {
      pattern: /(exec|spawn|execFile|fork|system|popen|shelljs)/g,
      description: 'Command execution functions that could lead to command injection',
      severity: 'high'
    },
    // Eval and similar
    codeEvaluation: {
      pattern: /(eval|new\s+Function|setTimeout\([^)]*function|\)\.constructor\()/g,
      description: 'Dynamic code evaluation that could lead to code injection',
      severity: 'critical'
    },
    // SQL injection
    sqlInjection: {
      pattern: /execute\s*\(\s*["'`].*?\$\{/g,
      description: 'Potential SQL injection vulnerability',
      severity: 'critical'
    },
    // Hardcoded secrets
    hardcodedSecrets: {
      pattern: /(password|secret|key|token|credential)s?\s*[:=]\s*["'`][^"'`]{8,}["'`]/gi,
      description: 'Potentially hardcoded secrets',
      severity: 'high'
    },
    // Insecure random values
    insecureRandom: {
      pattern: /Math\.random\(\)/g,
      description: 'Insecure random number generation',
      severity: 'medium'
    },
    // Insecure HTTP
    insecureHttp: {
      pattern: /http:\/\//g,
      description: 'Insecure HTTP protocol usage',
      severity: 'medium'
    },
    // Insecure cookie settings
    insecureCookies: {
      pattern: /cookie.*?secure:\s*false|cookie.*?httpOnly:\s*false/g,
      description: 'Insecure cookie settings',
      severity: 'medium'
    },
    // Path traversal
    pathTraversal: {
      pattern: /\.\.\/|\.\.\\|\.\./g,
      description: 'Potential path traversal vulnerability',
      severity: 'high'
    },
    // Weak encryption
    weakEncryption: {
      pattern: /(md5|sha1|des|rc4)/gi,
      description: 'Weak encryption algorithm usage',
      severity: 'high'
    }
  }
};

// Results storage
const auditResults = {
  summary: {
    filesScanned: 0,
    issuesFound: 0,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0
  },
  issues: []
};

/**
 * Main audit function
 */
async function runSecurityAudit() {
  console.log('Starting security audit...');
  
  // Scan directories
  for (const dir of config.scanDirectories) {
    await scanDirectory(dir);
  }
  
  // Generate report
  generateReport();
  
  return auditResults;
}

/**
 * Scan a directory for security issues
 * @param {string} directory - Directory to scan
 */
async function scanDirectory(directory) {
  const fullPath = path.resolve(process.cwd(), directory);
  
  if (!fs.existsSync(fullPath)) {
    console.warn(`Directory not found: ${fullPath}`);
    return;
  }
  
  try {
    const files = fs.readdirSync(fullPath);
    
    for (const file of files) {
      const filePath = path.join(fullPath, file);
      const stat = fs.statSync(filePath);
      
      // Skip excluded patterns
      if (config.excludePatterns.some(pattern => filePath.includes(pattern))) {
        continue;
      }
      
      if (stat.isDirectory()) {
        // Recursively scan subdirectories
        await scanDirectory(filePath);
      } else if (stat.isFile() && filePath.endsWith('.js')) {
        // Scan JavaScript files
        await scanFile(filePath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${directory}:`, error);
  }
}

/**
 * Scan a file for security issues
 * @param {string} filePath - Path to the file
 */
async function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    auditResults.summary.filesScanned++;
    
    // Check for security issues
    for (const [ruleName, rule] of Object.entries(config.securityRules)) {
      const matches = content.match(rule.pattern);
      
      if (matches) {
        // Get line numbers for matches
        const lines = content.split('\n');
        const matchingLines = [];
        
        for (const match of matches) {
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(match)) {
              matchingLines.push(i + 1);
              break;
            }
          }
        }
        
        // Add issue to results
        auditResults.issues.push({
          file: filePath,
          rule: ruleName,
          description: rule.description,
          severity: rule.severity,
          lines: matchingLines,
          matches: matches.length
        });
        
        auditResults.summary.issuesFound += matches.length;
        
        // Update severity counters
        switch (rule.severity) {
          case 'critical':
            auditResults.summary.criticalIssues += matches.length;
            break;
          case 'high':
            auditResults.summary.highIssues += matches.length;
            break;
          case 'medium':
            auditResults.summary.mediumIssues += matches.length;
            break;
          case 'low':
            auditResults.summary.lowIssues += matches.length;
            break;
        }
      }
    }
    
    // Check for dependencies vulnerabilities
    if (filePath.endsWith('package.json')) {
      await checkDependencies(filePath);
    }
  } catch (error) {
    console.error(`Error scanning file ${filePath}:`, error);
  }
}

/**
 * Check dependencies for vulnerabilities
 * @param {string} packageJsonPath - Path to package.json
 */
async function checkDependencies(packageJsonPath) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const [dep, version] of Object.entries(dependencies)) {
      // Check for known vulnerable dependencies
      // This is a simplified check - in a real-world scenario, you'd use a vulnerability database
      const knownVulnerableDeps = {
        'lodash': ['<4.17.21'],
        'minimist': ['<1.2.6'],
        'node-fetch': ['<2.6.7', '<3.2.10'],
        'ws': ['<7.4.6'],
        'y18n': ['<4.0.1', '<5.0.8']
      };
      
      if (knownVulnerableDeps[dep]) {
        const versionNum = version.replace(/[^0-9.]/g, '');
        
        for (const vulnVersion of knownVulnerableDeps[dep]) {
          const comparison = vulnVersion.startsWith('<') ? 
            compareVersions(versionNum, vulnVersion.substring(1)) < 0 :
            compareVersions(versionNum, vulnVersion) === 0;
          
          if (comparison) {
            auditResults.issues.push({
              file: packageJsonPath,
              rule: 'vulnerableDependency',
              description: `Vulnerable dependency: ${dep}@${version} (${vulnVersion})`,
              severity: 'high',
              lines: [],
              matches: 1
            });
            
            auditResults.summary.issuesFound++;
            auditResults.summary.highIssues++;
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error checking dependencies in ${packageJsonPath}:`, error);
  }
}

/**
 * Compare version strings
 * @param {string} v1 - Version 1
 * @param {string} v2 - Version 2
 * @returns {number} - Comparison result (-1, 0, 1)
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

/**
 * Generate security audit report
 */
function generateReport() {
  const reportPath = path.resolve(process.cwd(), 'security-audit-report.json');
  
  // Save JSON report
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  
  // Print summary
  console.log('\nSecurity Audit Summary:');
  console.log(`Files scanned: ${auditResults.summary.filesScanned}`);
  console.log(`Issues found: ${auditResults.summary.issuesFound}`);
  console.log(`- Critical: ${auditResults.summary.criticalIssues}`);
  console.log(`- High: ${auditResults.summary.highIssues}`);
  console.log(`- Medium: ${auditResults.summary.mediumIssues}`);
  console.log(`- Low: ${auditResults.summary.lowIssues}`);
  
  console.log(`\nDetailed report saved to: ${reportPath}`);
  
  // Sort issues by severity
  auditResults.issues.sort((a, b) => {
    const severityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  // Print top issues
  if (auditResults.issues.length > 0) {
    console.log('\nTop issues:');
    
    const topIssues = auditResults.issues.slice(0, 5);
    
    for (const issue of topIssues) {
      console.log(`[${issue.severity.toUpperCase()}] ${issue.file}`);
      console.log(`  Rule: ${issue.rule}`);
      console.log(`  Description: ${issue.description}`);
      if (issue.lines.length > 0) {
        console.log(`  Lines: ${issue.lines.join(', ')}`);
      }
      console.log('');
    }
    
    if (auditResults.issues.length > 5) {
      console.log(`... and ${auditResults.issues.length - 5} more issues.`);
    }
  }
}

// Export functions
module.exports = {
  runSecurityAudit,
  scanDirectory,
  scanFile,
  checkDependencies,
  generateReport
};

// Run audit if called directly
if (require.main === module) {
  runSecurityAudit();
}
