/**
 * ReportGenerator.js
 * 
 * This module provides functionality for generating HTML reports from test run analytics data.
 * It creates visualizations and summaries of test run history, fix success rates, and common failures.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Class responsible for generating HTML reports from test run analytics
 */
class ReportGenerator {
  /**
   * Creates a new ReportGenerator instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.outputDir - Directory to output reports
   * @param {Object} options.logger - Logger instance
   */
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(process.cwd(), 'reports');
    this.logger = options.logger;
  }

  /**
   * Initializes the report generator
   * Ensures the output directory exists
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Create output directory if it doesn't exist
      await fs.mkdir(this.outputDir, { recursive: true });
      
      if (this.logger) {
        this.logger.info(`Report generator initialized with output directory: ${this.outputDir}`);
      } else {
        console.log(`Report generator initialized with output directory: ${this.outputDir}`);
      }
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to initialize report generator', { error: error.message });
      } else {
        console.error('Failed to initialize report generator:', error.message);
      }
      throw error;
    }
  }

  /**
   * Generates an HTML report from test run history
   * 
   * @param {Array} testRuns - Array of test run data
   * @param {Object} options - Report options
   * @param {string} options.title - Report title
   * @param {string} options.filename - Output filename (without extension)
   * @returns {Promise<string>} Path to the generated report
   */
  async generateReport(testRuns, options = {}) {
    if (!testRuns || !Array.isArray(testRuns)) {
      throw new Error('Invalid test run data. Expected an array of test runs.');
    }
    
    const title = options.title || 'Test Run Analytics Report';
    const filename = options.filename || `test-report-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    
    // Calculate summary statistics
    const stats = this._calculateStats(testRuns);
    
    // Generate HTML content
    const html = this._generateHtml(testRuns, stats, title);
    
    // Ensure output directory exists
    await this.initialize();
    
    // Write HTML to file
    const outputPath = path.join(this.outputDir, `${filename}.html`);
    await fs.writeFile(outputPath, html, 'utf8');
    
    if (this.logger) {
      this.logger.info(`Generated HTML report`, { outputPath });
    } else {
      console.log(`Generated HTML report: ${outputPath}`);
    }
    
    return outputPath;
  }

  /**
   * Calculates summary statistics from test run data
   * 
   * @param {Array} testRuns - Array of test run data
   * @returns {Object} Summary statistics
   * @private
   */
  _calculateStats(testRuns) {
    if (!testRuns || testRuns.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        averageDuration: 0,
        fixSuccessRate: 0,
        commonFailures: []
      };
    }
    
    // Calculate basic stats
    const totalRuns = testRuns.length;
    const successfulRuns = testRuns.filter(run => run.success).length;
    const successRate = (successfulRuns / totalRuns) * 100;
    
    // Calculate average duration
    const totalDuration = testRuns.reduce((sum, run) => sum + (run.duration || 0), 0);
    const averageDuration = totalDuration / totalRuns;
    
    // Calculate fix success rate
    const runsWithFixes = testRuns.filter(run => run.fixes && run.fixes.length > 0);
    const successfulFixes = runsWithFixes.filter(run => run.success).length;
    const fixSuccessRate = runsWithFixes.length > 0 
      ? (successfulFixes / runsWithFixes.length) * 100 
      : 0;
    
    // Identify common failures
    const failureCounts = {};
    testRuns.forEach(run => {
      if (run.failures) {
        run.failures.forEach(failure => {
          const key = failure.testName || failure.message || 'Unknown';
          failureCounts[key] = (failureCounts[key] || 0) + 1;
        });
      }
    });
    
    const commonFailures = Object.entries(failureCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalRuns,
      successRate,
      averageDuration,
      fixSuccessRate,
      commonFailures
    };
  }

  /**
   * Generates HTML content for the report
   * 
   * @param {Array} testRuns - Array of test run data
   * @param {Object} stats - Summary statistics
   * @param {string} title - Report title
   * @returns {string} HTML content
   * @private
   */
  _generateHtml(testRuns, stats, title) {
    // Convert test run data to JSON for chart data
    const chartData = {
      dates: testRuns.map(run => run.timestamp),
      success: testRuns.map(run => run.success ? 1 : 0),
      duration: testRuns.map(run => run.duration || 0),
      failedTests: testRuns.map(run => run.stats?.failedTests || 0),
      passedTests: testRuns.map(run => run.stats?.passedTests || 0)
    };
    
    // Format dates for better display
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };
    
    // Create HTML with embedded charts using Chart.js
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .stat-card {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      flex: 1 1 200px;
      margin-right: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-card h3 {
      margin-top: 0;
      color: #555;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2c3e50;
    }
    .chart-container {
      margin-bottom: 40px;
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .table-container {
      margin-top: 30px;
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
    }
    tr:hover {
      background-color: #f1f1f1;
    }
    .success {
      color: #28a745;
    }
    .failure {
      color: #dc3545;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      color: #777;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
      <div class="stat-card">
        <h3>Total Runs</h3>
        <div class="stat-value">${stats.totalRuns}</div>
      </div>
      <div class="stat-card">
        <h3>Success Rate</h3>
        <div class="stat-value">${stats.successRate.toFixed(1)}%</div>
      </div>
      <div class="stat-card">
        <h3>Avg Duration</h3>
        <div class="stat-value">${(stats.averageDuration / 1000).toFixed(2)}s</div>
      </div>
      <div class="stat-card">
        <h3>Fix Success Rate</h3>
        <div class="stat-value">${stats.fixSuccessRate.toFixed(1)}%</div>
      </div>
    </div>
    
    <div class="chart-container">
      <h2>Test Pass/Fail Over Time</h2>
      <canvas id="passFailChart"></canvas>
    </div>
    
    <div class="chart-container">
      <h2>Test Duration Over Time</h2>
      <canvas id="durationChart"></canvas>
    </div>
    
    <div class="chart-container">
      <h2>Common Test Failures</h2>
      <canvas id="failuresChart"></canvas>
    </div>
    
    <div class="table-container">
      <h2>Recent Test Runs</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Fixes Applied</th>
          </tr>
        </thead>
        <tbody>
          ${testRuns.slice(-10).reverse().map(run => `
            <tr>
              <td>${formatDate(run.timestamp)}</td>
              <td class="${run.success ? 'success' : 'failure'}">${run.success ? 'Success' : 'Failure'}</td>
              <td>${((run.duration || 0) / 1000).toFixed(2)}s</td>
              <td>${run.stats?.passedTests || 0}</td>
              <td>${run.stats?.failedTests || 0}</td>
              <td>${(run.fixes || []).length}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="footer">
      <p>Generated by Test Automation Framework</p>
    </div>
  </div>
  
  <script>
    // Chart.js initialization
    document.addEventListener('DOMContentLoaded', function() {
      // Test pass/fail chart
      const passFailCtx = document.getElementById('passFailChart').getContext('2d');
      new Chart(passFailCtx, {
        type: 'line',
        data: {
          labels: ${JSON.stringify(chartData.dates.map(d => formatDate(d)))},
          datasets: [
            {
              label: 'Passed Tests',
              data: ${JSON.stringify(chartData.passedTests)},
              backgroundColor: 'rgba(40, 167, 69, 0.2)',
              borderColor: 'rgba(40, 167, 69, 1)',
              borderWidth: 2,
              tension: 0.1
            },
            {
              label: 'Failed Tests',
              data: ${JSON.stringify(chartData.failedTests)},
              backgroundColor: 'rgba(220, 53, 69, 0.2)',
              borderColor: 'rgba(220, 53, 69, 1)',
              borderWidth: 2,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Tests'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          }
        }
      });
      
      // Duration chart
      const durationCtx = document.getElementById('durationChart').getContext('2d');
      new Chart(durationCtx, {
        type: 'line',
        data: {
          labels: ${JSON.stringify(chartData.dates.map(d => formatDate(d)))},
          datasets: [{
            label: 'Test Duration (seconds)',
            data: ${JSON.stringify(chartData.duration.map(d => d / 1000))},
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Duration (seconds)'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          }
        }
      });
      
      // Common failures chart
      const failuresCtx = document.getElementById('failuresChart').getContext('2d');
      new Chart(failuresCtx, {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(stats.commonFailures.map(f => f.name))},
          datasets: [{
            label: 'Failure Count',
            data: ${JSON.stringify(stats.commonFailures.map(f => f.count))},
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Count'
              }
            }
          }
        }
      });
    });
  </script>
</body>
</html>`;
  }
}

module.exports = ReportGenerator;
