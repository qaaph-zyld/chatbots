#!/usr/bin/env node

/**
 * Test Results Analysis Script
 * 
 * This script analyzes test results from the test-results directory,
 * identifies patterns, and generates a comprehensive analysis report.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert fs functions to promises
const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
const stat = util.promisify(fs.stat);

// Configuration
const config = {
  testResultsDir: path.resolve(process.cwd(), 'test-results'),
  analysisDir: path.resolve(process.cwd(), 'test-results', 'analysis'),
  reportFile: 'analysis-report.md',
  jsonReportFile: 'analysis-data.json',
  historyFile: 'test-history.json',
  maxHistoryEntries: 50
};

/**
 * Main function to analyze test results
 */
async function analyzeTestResults() {
  console.log('Starting test results analysis...');
  
  try {
    // Ensure analysis directory exists
    await ensureDirectoryExists(config.analysisDir);
    
    // Get all test result files
    const resultFiles = await findTestResultFiles(config.testResultsDir);
    console.log(`Found ${resultFiles.length} test result files`);
    
    if (resultFiles.length === 0) {
      console.log('No test result files found. Exiting.');
      return;
    }
    
    // Parse test results
    const testResults = await parseTestResults(resultFiles);
    
    // Analyze results
    const analysis = analyzeResults(testResults);
    
    // Update test history
    await updateTestHistory(analysis);
    
    // Generate report
    await generateReport(analysis);
    
    console.log('Test results analysis completed successfully.');
  } catch (error) {
    console.error('Error analyzing test results:', error);
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
      await mkdir(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } else {
      throw error;
    }
  }
}

/**
 * Find all test result files in the specified directory
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} - Array of file paths
 */
async function findTestResultFiles(dir) {
  const files = [];
  
  async function scanDirectory(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip the analysis directory to avoid recursion
        if (entry.name !== 'analysis' && entry.name !== 'report') {
          await scanDirectory(fullPath);
        }
      } else if (entry.isFile() && 
                (entry.name.endsWith('.json') || 
                 entry.name.endsWith('.txt') || 
                 entry.name.includes('test') || 
                 entry.name.includes('result'))) {
        files.push(fullPath);
      }
    }
  }
  
  await scanDirectory(dir);
  return files;
}

/**
 * Parse test result files
 * @param {string[]} files - Array of file paths
 * @returns {Promise<Object[]>} - Array of parsed test results
 */
async function parseTestResults(files) {
  const results = [];
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf8');
      const fileExt = path.extname(file);
      
      if (fileExt === '.json') {
        try {
          const jsonData = JSON.parse(content);
          results.push({
            file,
            type: 'json',
            data: jsonData,
            timestamp: await getFileTimestamp(file)
          });
        } catch (e) {
          console.warn(`Failed to parse JSON file ${file}: ${e.message}`);
        }
      } else {
        // For text files, extract basic information
        results.push({
          file,
          type: 'text',
          data: {
            content,
            lines: content.split('\n').length,
            hasErrors: /error|fail|exception/i.test(content)
          },
          timestamp: await getFileTimestamp(file)
        });
      }
    } catch (error) {
      console.warn(`Error reading file ${file}: ${error.message}`);
    }
  }
  
  return results;
}

/**
 * Get file timestamp
 * @param {string} file - File path
 * @returns {Promise<Date>} - File timestamp
 */
async function getFileTimestamp(file) {
  const stats = await stat(file);
  return stats.mtime;
}

/**
 * Analyze test results
 * @param {Object[]} results - Array of parsed test results
 * @returns {Object} - Analysis results
 */
function analyzeResults(results) {
  // Sort results by timestamp
  results.sort((a, b) => b.timestamp - a.timestamp);
  
  // Extract basic statistics
  const totalFiles = results.length;
  const jsonFiles = results.filter(r => r.type === 'json').length;
  const textFiles = results.filter(r => r.type === 'text').length;
  const filesWithErrors = results.filter(r => 
    (r.type === 'text' && r.data.hasErrors) || 
    (r.type === 'json' && r.data.success === false)
  ).length;
  
  // Extract test results from JSON files
  const testData = results
    .filter(r => r.type === 'json' && r.data.tests)
    .map(r => r.data.tests)
    .flat();
  
  // Calculate test statistics
  const totalTests = testData.length;
  const passedTests = testData.filter(t => t.status === 'pass').length;
  const failedTests = testData.filter(t => t.status === 'fail').length;
  const skippedTests = testData.filter(t => t.status === 'skip').length;
  
  // Identify common failure patterns
  const failurePatterns = identifyFailurePatterns(results);
  
  // Generate recommendations
  const recommendations = generateRecommendations(failurePatterns);
  
  return {
    timestamp: new Date(),
    statistics: {
      totalFiles,
      jsonFiles,
      textFiles,
      filesWithErrors,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0
    },
    failurePatterns,
    recommendations,
    recentResults: results.slice(0, 10) // Keep only the 10 most recent results
  };
}

/**
 * Identify common failure patterns in test results
 * @param {Object[]} results - Array of parsed test results
 * @returns {Object[]} - Array of failure patterns
 */
function identifyFailurePatterns(results) {
  const patterns = [];
  const errorMessages = {};
  
  // Extract error messages from text files
  results
    .filter(r => r.type === 'text' && r.data.hasErrors)
    .forEach(r => {
      const content = r.data.content;
      const lines = content.split('\n');
      
      lines.forEach(line => {
        if (/error|fail|exception/i.test(line)) {
          const errorMessage = line.trim();
          errorMessages[errorMessage] = (errorMessages[errorMessage] || 0) + 1;
        }
      });
    });
  
  // Extract error messages from JSON files
  results
    .filter(r => r.type === 'json' && r.data.tests)
    .forEach(r => {
      const tests = r.data.tests;
      
      tests
        .filter(t => t.status === 'fail')
        .forEach(t => {
          if (t.error) {
            const errorMessage = t.error.message || JSON.stringify(t.error);
            errorMessages[errorMessage] = (errorMessages[errorMessage] || 0) + 1;
          }
        });
    });
  
  // Convert to array and sort by frequency
  Object.entries(errorMessages)
    .sort((a, b) => b[1] - a[1])
    .forEach(([message, count]) => {
      patterns.push({
        message,
        count,
        type: categorizeError(message)
      });
    });
  
  return patterns;
}

/**
 * Categorize error message
 * @param {string} message - Error message
 * @returns {string} - Error category
 */
function categorizeError(message) {
  if (/cannot find module|module not found/i.test(message)) {
    return 'dependency';
  } else if (/timeout|timed out|hang/i.test(message)) {
    return 'timeout';
  } else if (/syntax error|unexpected token|parsing error/i.test(message)) {
    return 'syntax';
  } else if (/network|connection|econnrefused|socket/i.test(message)) {
    return 'network';
  } else if (/assertion|expect|to equal|to be|to have/i.test(message)) {
    return 'assertion';
  } else if (/permission|access denied|eacces/i.test(message)) {
    return 'permission';
  } else if (/memory|heap|stack|overflow/i.test(message)) {
    return 'memory';
  } else {
    return 'other';
  }
}

/**
 * Generate recommendations based on failure patterns
 * @param {Object[]} patterns - Array of failure patterns
 * @returns {string[]} - Array of recommendations
 */
function generateRecommendations(patterns) {
  const recommendations = [];
  
  // Count errors by type
  const errorCounts = {};
  patterns.forEach(p => {
    errorCounts[p.type] = (errorCounts[p.type] || 0) + p.count;
  });
  
  // Generate recommendations based on error types
  if (errorCounts.dependency) {
    recommendations.push('Check for missing dependencies or version conflicts in package.json');
  }
  
  if (errorCounts.timeout) {
    recommendations.push('Review test timeouts and consider increasing timeout values for complex tests');
  }
  
  if (errorCounts.syntax) {
    recommendations.push('Fix syntax errors in test files or source code');
  }
  
  if (errorCounts.network) {
    recommendations.push('Ensure network services are available or properly mocked in tests');
  }
  
  if (errorCounts.assertion) {
    recommendations.push('Review test assertions and expected values');
  }
  
  if (errorCounts.permission) {
    recommendations.push('Check file permissions and ensure tests have appropriate access rights');
  }
  
  if (errorCounts.memory) {
    recommendations.push('Optimize memory usage or increase memory limits for tests');
  }
  
  return recommendations;
}

/**
 * Update test history
 * @param {Object} analysis - Analysis results
 */
async function updateTestHistory(analysis) {
  const historyPath = path.join(config.analysisDir, config.historyFile);
  let history = { entries: [] };
  
  // Try to read existing history
  try {
    const historyContent = await readFile(historyPath, 'utf8');
    history = JSON.parse(historyContent);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Error reading history file: ${error.message}`);
    }
  }
  
  // Add new entry
  const historyEntry = {
    timestamp: analysis.timestamp,
    statistics: analysis.statistics,
    recommendations: analysis.recommendations
  };
  
  history.entries.unshift(historyEntry);
  
  // Limit history size
  if (history.entries.length > config.maxHistoryEntries) {
    history.entries = history.entries.slice(0, config.maxHistoryEntries);
  }
  
  // Save updated history
  await writeFile(historyPath, JSON.stringify(history, null, 2));
  console.log(`Updated test history: ${historyPath}`);
}

/**
 * Generate analysis report
 * @param {Object} analysis - Analysis results
 */
async function generateReport(analysis) {
  // Generate markdown report
  const markdown = generateMarkdownReport(analysis);
  const markdownPath = path.join(config.analysisDir, config.reportFile);
  await writeFile(markdownPath, markdown);
  console.log(`Generated markdown report: ${markdownPath}`);
  
  // Save JSON data
  const jsonPath = path.join(config.analysisDir, config.jsonReportFile);
  await writeFile(jsonPath, JSON.stringify(analysis, null, 2));
  console.log(`Saved analysis data: ${jsonPath}`);
}

/**
 * Generate markdown report
 * @param {Object} analysis - Analysis results
 * @returns {string} - Markdown report
 */
function generateMarkdownReport(analysis) {
  const { statistics, failurePatterns, recommendations } = analysis;
  
  let markdown = `# Test Results Analysis Report\n\n`;
  markdown += `**Generated:** ${analysis.timestamp.toISOString()}\n\n`;
  
  // Add statistics
  markdown += `## Statistics\n\n`;
  markdown += `- **Total Files Analyzed:** ${statistics.totalFiles}\n`;
  markdown += `- **JSON Files:** ${statistics.jsonFiles}\n`;
  markdown += `- **Text Files:** ${statistics.textFiles}\n`;
  markdown += `- **Files With Errors:** ${statistics.filesWithErrors}\n`;
  markdown += `- **Total Tests:** ${statistics.totalTests}\n`;
  markdown += `- **Passed Tests:** ${statistics.passedTests}\n`;
  markdown += `- **Failed Tests:** ${statistics.failedTests}\n`;
  markdown += `- **Skipped Tests:** ${statistics.skippedTests}\n`;
  markdown += `- **Pass Rate:** ${statistics.passRate}%\n\n`;
  
  // Add failure patterns
  markdown += `## Common Failure Patterns\n\n`;
  
  if (failurePatterns.length === 0) {
    markdown += `No failure patterns detected.\n\n`;
  } else {
    markdown += `| Error Type | Count | Message |\n`;
    markdown += `|-----------|-------|--------|\n`;
    
    failurePatterns.forEach(pattern => {
      const message = pattern.message.length > 100 
        ? pattern.message.substring(0, 100) + '...' 
        : pattern.message;
      
      markdown += `| ${pattern.type} | ${pattern.count} | ${message.replace(/\|/g, '\\|')} |\n`;
    });
    
    markdown += `\n`;
  }
  
  // Add recommendations
  markdown += `## Recommendations\n\n`;
  
  if (recommendations.length === 0) {
    markdown += `No recommendations at this time.\n\n`;
  } else {
    recommendations.forEach(recommendation => {
      markdown += `- ${recommendation}\n`;
    });
    
    markdown += `\n`;
  }
  
  return markdown;
}

// Run the analysis
analyzeTestResults();
