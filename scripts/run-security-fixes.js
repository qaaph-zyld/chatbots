/**
 * Run Security Fixes Script
 * 
 * This script runs the security fixes for voice components and generates a report
 * of fixed issues and any remaining issues that need manual attention.
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const config = {
  // Path to the fix script
  fixScriptPath: path.join(__dirname, '..', 'utils', 'fix-voice-security-issues.js'),
  
  // Path for the report
  reportPath: path.join(__dirname, '..', 'reports', 'security-fixes-report.md'),
  
  // Path for the audit results
  auditResultsPath: path.join(__dirname, '..', 'utils', 'voice-security-audit-results.json')
};

/**
 * Main function to run security fixes and generate report
 */
async function runSecurityFixes() {
  console.log('Running Voice Security Fixes');
  console.log('===========================');
  
  // Create reports directory if it doesn't exist
  const reportsDir = path.dirname(config.reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Save original audit results if they exist
  let originalIssues = [];
  if (fs.existsSync(config.auditResultsPath)) {
    try {
      const originalResults = JSON.parse(fs.readFileSync(config.auditResultsPath, 'utf8'));
      originalIssues = originalResults.issues || [];
    } catch (error) {
      console.error('Failed to read original audit results:', error.message);
    }
  }
  
  // Run the fix script
  try {
    console.log('Running fix script...');
    execSync(`node ${config.fixScriptPath}`, { stdio: 'inherit' });
    console.log('Fix script completed successfully');
  } catch (error) {
    console.error('Failed to run fix script:', error.message);
    process.exit(1);
  }
  
  // Read updated audit results
  let updatedIssues = [];
  if (fs.existsSync(config.auditResultsPath)) {
    try {
      const updatedResults = JSON.parse(fs.readFileSync(config.auditResultsPath, 'utf8'));
      updatedIssues = updatedResults.issues || [];
    } catch (error) {
      console.error('Failed to read updated audit results:', error.message);
    }
  }
  
  // Generate report
  generateReport(originalIssues, updatedIssues);
  
  console.log(`Report generated at: ${config.reportPath}`);
}

/**
 * Generate a report of fixed and remaining issues
 */
function generateReport(originalIssues, updatedIssues) {
  // Calculate fixed issues
  const fixedIssues = originalIssues.filter(original => 
    !updatedIssues.some(updated => 
      updated.file === original.file && 
      updated.line === original.line && 
      updated.type === original.type
    )
  );
  
  // Group issues by type
  const groupByType = (issues) => {
    const grouped = {};
    issues.forEach(issue => {
      if (!grouped[issue.type]) {
        grouped[issue.type] = [];
      }
      grouped[issue.type].push(issue);
    });
    return grouped;
  };
  
  const fixedByType = groupByType(fixedIssues);
  const remainingByType = groupByType(updatedIssues);
  
  // Generate report content
  let reportContent = `# Voice Security Fixes Report
Generated on: ${new Date().toISOString()}

## Summary
- **Original Issues**: ${originalIssues.length}
- **Fixed Issues**: ${fixedIssues.length}
- **Remaining Issues**: ${updatedIssues.length}
- **Fix Rate**: ${originalIssues.length > 0 ? Math.round((fixedIssues.length / originalIssues.length) * 100) : 0}%

`;

  // Add fixed issues section
  reportContent += `## Fixed Issues (${fixedIssues.length})
${fixedIssues.length === 0 ? 'No issues were fixed.' : ''}
`;

  Object.entries(fixedByType).forEach(([type, issues]) => {
    reportContent += `### ${type} (${issues.length})
| File | Line | Description |
|------|------|-------------|
`;
    
    issues.forEach(issue => {
      const fileName = path.basename(issue.file);
      reportContent += `| ${fileName} | ${issue.line} | ${issue.description} |\n`;
    });
    
    reportContent += '\n';
  });

  // Add remaining issues section
  reportContent += `## Remaining Issues (${updatedIssues.length})
${updatedIssues.length === 0 ? 'No issues remain. All security vulnerabilities have been fixed!' : ''}
`;

  Object.entries(remainingByType).forEach(([type, issues]) => {
    reportContent += `### ${type} (${issues.length})
| File | Line | Description | Manual Fix Recommendation |
|------|------|-------------|---------------------------|
`;
    
    issues.forEach(issue => {
      const fileName = path.basename(issue.file);
      const recommendation = getFixRecommendation(issue.type);
      reportContent += `| ${fileName} | ${issue.line} | ${issue.description} | ${recommendation} |\n`;
    });
    
    reportContent += '\n';
  });

  // Add next steps section
  reportContent += `## Next Steps
${updatedIssues.length === 0 ? 
  '- All security issues have been fixed automatically. No further action is required.' : 
  '- Review and fix the remaining issues manually according to the recommendations.\n- Run the security audit again after making manual fixes to verify all issues are resolved.'}

## Security Best Practices
- Always validate user input before processing
- Use parameterized commands instead of string concatenation
- Store sensitive information in environment variables, not in code
- Implement proper error handling for all operations
- Use secure random number generation for security-sensitive operations
- Validate file paths to prevent path traversal attacks
- Implement proper access controls for all resources
- Regularly update dependencies to patch security vulnerabilities
`;

  // Write report to file
  fs.writeFileSync(config.reportPath, reportContent);
}

/**
 * Get fix recommendation based on issue type
 */
function getFixRecommendation(type) {
  const recommendations = {
    'command-injection': 'Use parameterized commands or argument arrays instead of string concatenation',
    'path-traversal': 'Implement path validation to ensure paths are within allowed directories',
    'unsafe-file-operations': 'Add proper error handling and permissions checking',
    'hardcoded-secrets': 'Move secrets to environment variables',
    'insecure-random': 'Use crypto.randomBytes() instead of Math.random()',
    'buffer-overflow': 'Add bounds checking before buffer operations',
    'privacy-issue': 'Avoid logging sensitive data, implement data minimization',
    'model-validation': 'Add model integrity verification before loading'
  };
  
  return recommendations[type] || 'Review code and implement appropriate security controls';
}

// Run the script
runSecurityFixes().catch(error => {
  console.error('Failed to run security fixes:', error);
  process.exit(1);
});
