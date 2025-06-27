#!/usr/bin/env node

/**
 * Check Recurring Test Failures
 * 
 * This script analyzes test history to identify recurring failures
 * and creates GitHub issues for persistent problems.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert fs functions to promises
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const stat = util.promisify(fs.stat);

// Configuration
const config = {
  analysisDir: path.resolve(process.cwd(), 'test-results', 'analysis'),
  historyFile: 'test-history.json',
  recurringFailuresFile: 'recurring-failures.json',
  issuesDir: path.resolve(process.cwd(), 'test-results', 'issues'),
  // Thresholds for considering a failure as recurring
  minOccurrences: 3,
  minFailureRate: 50, // percentage
  lookbackRuns: 10,
  // GitHub integration (optional)
  createGitHubIssues: false,
  gitHubToken: process.env.GITHUB_TOKEN,
  gitHubRepo: process.env.GITHUB_REPOSITORY
};

/**
 * Main function to check for recurring failures
 */
async function checkRecurringFailures() {
  console.log('Checking for recurring test failures...');
  
  try {
    // Ensure directories exist
    await ensureDirectoryExists(config.issuesDir);
    
    // Load test history
    const history = await loadTestHistory();
    
    if (!history || !history.entries || history.entries.length === 0) {
      console.log('No test history found. Exiting.');
      return;
    }
    
    console.log(`Loaded test history with ${history.entries.length} entries`);
    
    // Identify recurring failures
    const recurringFailures = identifyRecurringFailures(history);
    
    // Save recurring failures
    await saveRecurringFailures(recurringFailures);
    
    // Create issues for recurring failures
    if (recurringFailures.length > 0) {
      await createIssuesForRecurringFailures(recurringFailures);
      console.log(`Found ${recurringFailures.length} recurring failures`);
    } else {
      console.log('No recurring failures detected');
    }
    
    console.log('Recurring failures check completed successfully');
  } catch (error) {
    console.error('Error checking recurring failures:', error);
    process.exit(1);
  }
}

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dir - Directory path
 */
async function ensureDirectoryExists(dir) {
  try {
    await stat(dir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } else {
      throw error;
    }
  }
}

/**
 * Load test history from file
 * @returns {Promise<Object>} - Test history object
 */
async function loadTestHistory() {
  const historyPath = path.join(config.analysisDir, config.historyFile);
  
  try {
    const historyContent = await readFile(historyPath, 'utf8');
    return JSON.parse(historyContent);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`History file not found: ${historyPath}`);
      return { entries: [] };
    }
    throw error;
  }
}

/**
 * Identify recurring failures in test history
 * @param {Object} history - Test history object
 * @returns {Array} - Array of recurring failures
 */
function identifyRecurringFailures(history) {
  const recurringFailures = [];
  const failurePatterns = {};
  
  // Limit to the most recent runs
  const recentEntries = history.entries.slice(0, config.lookbackRuns);
  const totalRuns = recentEntries.length;
  
  if (totalRuns < 2) {
    console.log('Not enough test runs to analyze for recurring failures');
    return recurringFailures;
  }
  
  // Collect failure patterns across runs
  recentEntries.forEach((entry, index) => {
    // Skip entries without statistics
    if (!entry.statistics) return;
    
    // Track failed tests
    const failedTests = entry.statistics.failedTests || 0;
    
    // Track failure patterns if available
    if (entry.failurePatterns && Array.isArray(entry.failurePatterns)) {
      entry.failurePatterns.forEach(pattern => {
        const key = `${pattern.type}:${pattern.message}`;
        
        if (!failurePatterns[key]) {
          failurePatterns[key] = {
            type: pattern.type,
            message: pattern.message,
            occurrences: 0,
            firstSeen: entry.timestamp,
            lastSeen: entry.timestamp,
            runs: []
          };
        }
        
        failurePatterns[key].occurrences += pattern.count || 1;
        failurePatterns[key].lastSeen = entry.timestamp;
        failurePatterns[key].runs.push(index);
      });
    }
  });
  
  // Identify recurring patterns
  Object.values(failurePatterns).forEach(pattern => {
    // Calculate failure rate
    const failureRate = (pattern.runs.length / totalRuns) * 100;
    
    // Check if this is a recurring failure
    if (pattern.occurrences >= config.minOccurrences && 
        failureRate >= config.minFailureRate) {
      
      recurringFailures.push({
        ...pattern,
        failureRate: failureRate.toFixed(2)
      });
    }
  });
  
  // Sort by occurrence count (descending)
  return recurringFailures.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Save recurring failures to file
 * @param {Array} recurringFailures - Array of recurring failures
 */
async function saveRecurringFailures(recurringFailures) {
  const recurringFailuresPath = path.join(config.analysisDir, config.recurringFailuresFile);
  
  const data = {
    timestamp: new Date().toISOString(),
    failures: recurringFailures
  };
  
  await writeFile(recurringFailuresPath, JSON.stringify(data, null, 2));
  console.log(`Saved recurring failures to: ${recurringFailuresPath}`);
}

/**
 * Create issues for recurring failures
 * @param {Array} recurringFailures - Array of recurring failures
 */
async function createIssuesForRecurringFailures(recurringFailures) {
  // Create a markdown report
  const report = generateRecurringFailuresReport(recurringFailures);
  const reportPath = path.join(config.issuesDir, 'recurring-failures-report.md');
  await writeFile(reportPath, report);
  console.log(`Generated recurring failures report: ${reportPath}`);
  
  // Create individual issue files
  for (const failure of recurringFailures) {
    const issueTitle = `Recurring Test Failure: ${failure.type} (${failure.occurrences} occurrences)`;
    const issueBody = generateIssueBody(failure);
    const issueFilename = `issue-${failure.type}-${Date.now()}.md`;
    const issuePath = path.join(config.issuesDir, issueFilename);
    
    await writeFile(issuePath, `# ${issueTitle}\n\n${issueBody}`);
    console.log(`Created issue file: ${issuePath}`);
    
    // Create GitHub issue if enabled
    if (config.createGitHubIssues && config.gitHubToken && config.gitHubRepo) {
      try {
        await createGitHubIssue(issueTitle, issueBody, failure);
      } catch (error) {
        console.error(`Failed to create GitHub issue: ${error.message}`);
      }
    }
  }
}

/**
 * Generate a report for recurring failures
 * @param {Array} recurringFailures - Array of recurring failures
 * @returns {string} - Markdown report
 */
function generateRecurringFailuresReport(recurringFailures) {
  let report = `# Recurring Test Failures Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n\n`;
  
  if (recurringFailures.length === 0) {
    report += `No recurring failures detected.\n`;
    return report;
  }
  
  report += `Found ${recurringFailures.length} recurring failure patterns.\n\n`;
  
  report += `## Summary\n\n`;
  report += `| Type | Occurrences | Failure Rate | First Seen | Last Seen |\n`;
  report += `|------|------------|-------------|------------|----------|\n`;
  
  recurringFailures.forEach(failure => {
    const firstSeen = new Date(failure.firstSeen).toLocaleDateString();
    const lastSeen = new Date(failure.lastSeen).toLocaleDateString();
    
    report += `| ${failure.type} | ${failure.occurrences} | ${failure.failureRate}% | ${firstSeen} | ${lastSeen} |\n`;
  });
  
  report += `\n## Detailed Failures\n\n`;
  
  recurringFailures.forEach(failure => {
    report += `### ${failure.type} Failure\n\n`;
    report += `- **Occurrences:** ${failure.occurrences}\n`;
    report += `- **Failure Rate:** ${failure.failureRate}%\n`;
    report += `- **First Seen:** ${new Date(failure.firstSeen).toISOString()}\n`;
    report += `- **Last Seen:** ${new Date(failure.lastSeen).toISOString()}\n\n`;
    report += `**Error Message:**\n\`\`\`\n${failure.message}\n\`\`\`\n\n`;
    
    // Add recommendations based on failure type
    report += `**Recommendations:**\n`;
    
    switch (failure.type) {
      case 'dependency':
        report += `- Check for missing dependencies or version conflicts\n`;
        report += `- Verify that all required packages are installed\n`;
        report += `- Check for circular dependencies\n`;
        break;
      case 'timeout':
        report += `- Review test timeouts and consider increasing timeout values\n`;
        report += `- Check for potential infinite loops or hanging processes\n`;
        report += `- Consider optimizing slow-running tests\n`;
        break;
      case 'syntax':
        report += `- Fix syntax errors in test files or source code\n`;
        report += `- Verify compatibility with the current Node.js version\n`;
        break;
      case 'network':
        report += `- Ensure network services are available or properly mocked\n`;
        report += `- Check for firewall or proxy issues\n`;
        report += `- Consider implementing retry logic for flaky network tests\n`;
        break;
      case 'assertion':
        report += `- Review test assertions and expected values\n`;
        report += `- Check for race conditions or timing issues\n`;
        report += `- Verify that test data is consistent\n`;
        break;
      default:
        report += `- Investigate the root cause of the failure\n`;
        report += `- Consider adding more detailed error logging\n`;
    }
    
    report += `\n---\n\n`;
  });
  
  return report;
}

/**
 * Generate issue body for a recurring failure
 * @param {Object} failure - Recurring failure object
 * @returns {string} - Issue body markdown
 */
function generateIssueBody(failure) {
  let body = `## Recurring Test Failure: ${failure.type}\n\n`;
  body += `This issue was automatically created by the test automation framework.\n\n`;
  
  body += `### Failure Details\n\n`;
  body += `- **Type:** ${failure.type}\n`;
  body += `- **Occurrences:** ${failure.occurrences}\n`;
  body += `- **Failure Rate:** ${failure.failureRate}%\n`;
  body += `- **First Seen:** ${new Date(failure.firstSeen).toISOString()}\n`;
  body += `- **Last Seen:** ${new Date(failure.lastSeen).toISOString()}\n\n`;
  
  body += `### Error Message\n\n`;
  body += `\`\`\`\n${failure.message}\n\`\`\`\n\n`;
  
  body += `### Recommendations\n\n`;
  
  switch (failure.type) {
    case 'dependency':
      body += `- Check for missing dependencies or version conflicts\n`;
      body += `- Verify that all required packages are installed\n`;
      body += `- Check for circular dependencies\n`;
      break;
    case 'timeout':
      body += `- Review test timeouts and consider increasing timeout values\n`;
      body += `- Check for potential infinite loops or hanging processes\n`;
      body += `- Consider optimizing slow-running tests\n`;
      break;
    case 'syntax':
      body += `- Fix syntax errors in test files or source code\n`;
      body += `- Verify compatibility with the current Node.js version\n`;
      break;
    case 'network':
      body += `- Ensure network services are available or properly mocked\n`;
      body += `- Check for firewall or proxy issues\n`;
      body += `- Consider implementing retry logic for flaky network tests\n`;
      break;
    case 'assertion':
      body += `- Review test assertions and expected values\n`;
      body += `- Check for race conditions or timing issues\n`;
      body += `- Verify that test data is consistent\n`;
      break;
    default:
      body += `- Investigate the root cause of the failure\n`;
      body += `- Consider adding more detailed error logging\n`;
  }
  
  return body;
}

/**
 * Create a GitHub issue for a recurring failure
 * @param {string} title - Issue title
 * @param {string} body - Issue body
 * @param {Object} failure - Recurring failure object
 */
async function createGitHubIssue(title, body, failure) {
  // This is a placeholder for GitHub API integration
  // In a real implementation, this would use the GitHub API to create an issue
  console.log(`Would create GitHub issue: ${title}`);
  
  // Example implementation using GitHub API (commented out)
  /*
  const { Octokit } = require("@octokit/rest");
  const octokit = new Octokit({ auth: config.gitHubToken });
  
  const [owner, repo] = config.gitHubRepo.split('/');
  
  const response = await octokit.issues.create({
    owner,
    repo,
    title,
    body,
    labels: ['test-failure', `type:${failure.type}`, 'automated']
  });
  
  console.log(`Created GitHub issue #${response.data.number}: ${response.data.html_url}`);
  */
}

// Run the script
checkRecurringFailures();
