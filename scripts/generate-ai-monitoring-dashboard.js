/**
 * AI Fix Monitoring Dashboard Generator
 * 
 * This script analyzes AI fix data and generates a dashboard to monitor
 * the effectiveness of the AI fix pipeline over time.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert fs functions to promises
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);

// Configuration
const config = {
  knowledgeBasePath: process.env.KNOWLEDGE_BASE_PATH || path.join(__dirname, '..', 'test-results', 'ai-knowledge-base'),
  outputDir: process.env.DASHBOARD_OUTPUT_DIR || path.join(__dirname, '..', 'test-results', 'ai-dashboard'),
  feedbackPath: process.env.FEEDBACK_PATH || path.join(__dirname, '..', 'test-results', 'ai-knowledge-base', 'feedback'),
  historyDays: parseInt(process.env.HISTORY_DAYS || '30', 10)
};

/**
 * Main function to generate the AI monitoring dashboard
 */
async function generateDashboard() {
  console.log('Generating AI Fix Monitoring Dashboard...');
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(config.outputDir)) {
      await mkdir(config.outputDir, { recursive: true });
    }
    
    // Load knowledge base and feedback data
    const knowledgeBase = await loadKnowledgeBase();
    const feedbackData = await loadFeedbackData();
    
    // Generate metrics
    const metrics = calculateMetrics(knowledgeBase, feedbackData);
    
    // Generate dashboard HTML
    const dashboardHtml = generateDashboardHtml(metrics);
    
    // Write dashboard files
    await writeFile(path.join(config.outputDir, 'dashboard.html'), dashboardHtml);
    await writeFile(path.join(config.outputDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
    
    console.log(`Dashboard generated successfully at: ${path.join(config.outputDir, 'dashboard.html')}`);
  } catch (error) {
    console.error('Error generating dashboard:', error);
    process.exit(1);
  }
}

/**
 * Load knowledge base data
 * @returns {Object} Knowledge base data
 */
async function loadKnowledgeBase() {
  try {
    const knowledgeBasePath = path.join(config.knowledgeBasePath, 'knowledge-base.json');
    if (!fs.existsSync(knowledgeBasePath)) {
      return { fixes: [], statistics: { totalAttempts: 0, successfulFixes: 0 } };
    }
    
    const data = await readFile(knowledgeBasePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return { fixes: [], statistics: { totalAttempts: 0, successfulFixes: 0 } };
  }
}

/**
 * Load feedback data
 * @returns {Object} Feedback data
 */
async function loadFeedbackData() {
  try {
    const feedbackPath = path.join(config.feedbackPath, 'feedback-data.json');
    if (!fs.existsSync(feedbackPath)) {
      return { fixes: [], patterns: {}, metrics: { totalFixes: 0, successfulFixes: 0, successRate: 0 } };
    }
    
    const data = await readFile(feedbackPath, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Log feedback data for debugging
    console.log(`Loaded feedback data with ${parsedData.fixes?.length || 0} fixes`);
    if (parsedData.fixes?.length > 0) {
      console.log('Sample fix:', JSON.stringify(parsedData.fixes[0], null, 2));
    }
    
    return parsedData;
  } catch (error) {
    console.error('Error loading feedback data:', error);
    return { fixes: [], patterns: {}, metrics: { totalFixes: 0, successfulFixes: 0, successRate: 0 } };
  }
}

/**
 * Calculate metrics from knowledge base and feedback data
 * @param {Object} knowledgeBase - Knowledge base data
 * @param {Object} feedbackData - Feedback data
 * @returns {Object} Calculated metrics
 */
function calculateMetrics(knowledgeBase, feedbackData) {
  const metrics = {
    overall: {
      totalFixes: knowledgeBase.statistics?.totalAttempts || 0,
      successfulFixes: knowledgeBase.statistics?.successfulFixes || 0,
      successRate: 0
    },
    byErrorType: {},
    byFixSource: {},
    byConfidence: {
      high: { total: 0, successful: 0, rate: 0 },
      medium: { total: 0, successful: 0, rate: 0 },
      low: { total: 0, successful: 0, rate: 0 }
    },
    timeToFix: {
      average: 0,
      min: Infinity,
      max: 0
    },
    history: []
  };
  
  // Calculate overall success rate
  if (metrics.overall.totalFixes > 0) {
    metrics.overall.successRate = (metrics.overall.successfulFixes / metrics.overall.totalFixes) * 100;
  }
  
  // Process fixes from knowledge base
  if (knowledgeBase.fixes && knowledgeBase.fixes.length > 0) {
    // Update overall metrics from actual fixes array length
    metrics.overall.totalFixes = knowledgeBase.fixes.length;
    
    // Count successful fixes using either 'successful' property or infer from 'successes' or 'successRate'
    metrics.overall.successfulFixes = knowledgeBase.fixes.filter(fix => {
      // Check for direct successful property
      if (typeof fix.successful === 'boolean') {
        return fix.successful;
      }
      
      // Infer from successes property
      if (typeof fix.successes === 'number') {
        return fix.successes > 0;
      }
      
      // Infer from successRate property
      if (typeof fix.successRate === 'number') {
        return fix.successRate > 0;
      }
      
      // Default to false if no success indicators
      return false;
    }).length;
    
    // Recalculate success rate
    if (metrics.overall.totalFixes > 0) {
      metrics.overall.successRate = (metrics.overall.successfulFixes / metrics.overall.totalFixes) * 100;
    }
    // Group by error type
    knowledgeBase.fixes.forEach(fix => {
      // By error type - use fixStrategy if errorType is not available
      const errorType = fix.errorType || fix.fixStrategy || 'unknown';
      if (!metrics.byErrorType[errorType]) {
        metrics.byErrorType[errorType] = { total: 0, successful: 0, rate: 0 };
      }
      metrics.byErrorType[errorType].total++;
      
      // Determine if fix was successful using the same logic as for overall metrics
      const isSuccessful = 
        (typeof fix.successful === 'boolean' && fix.successful) ||
        (typeof fix.successes === 'number' && fix.successes > 0) ||
        (typeof fix.successRate === 'number' && fix.successRate > 0);
        
      if (isSuccessful) {
        metrics.byErrorType[errorType].successful++;
      }
      
      // By fix source - default to 'ai-generated' if not specified (for backward compatibility)
      const source = fix.source || 'ai-generated';
      if (!metrics.byFixSource[source]) {
        metrics.byFixSource[source] = { total: 0, successful: 0, rate: 0 };
      }
      metrics.byFixSource[source].total++;
      
      // Use the same success determination logic
      if (isSuccessful) {
        metrics.byFixSource[source].successful++;
      }
      
      // By confidence
      // Use successRate as confidence if confidence is not available
      const confidence = fix.confidence || fix.successRate || 0;
      let confidenceCategory;
      if (confidence >= 0.7) {
        confidenceCategory = 'high';
      } else if (confidence >= 0.4) {
        confidenceCategory = 'medium';
      } else {
        confidenceCategory = 'low';
      }
      
      metrics.byConfidence[confidenceCategory].total++;
      if (isSuccessful) {
        metrics.byConfidence[confidenceCategory].successful++;
      }
      
      // Time to fix
      if (fix.executionTime) {
        metrics.timeToFix.average += fix.executionTime;
        metrics.timeToFix.min = Math.min(metrics.timeToFix.min, fix.executionTime);
        metrics.timeToFix.max = Math.max(metrics.timeToFix.max, fix.executionTime);
      }
    });
    
    // Calculate rates
    Object.keys(metrics.byErrorType).forEach(type => {
      const data = metrics.byErrorType[type];
      if (data.total > 0) {
        data.rate = (data.successful / data.total) * 100;
      }
    });
    
    Object.keys(metrics.byFixSource).forEach(source => {
      const data = metrics.byFixSource[source];
      if (data.total > 0) {
        data.rate = (data.successful / data.total) * 100;
      }
    });
    
    Object.keys(metrics.byConfidence).forEach(level => {
      const data = metrics.byConfidence[level];
      if (data.total > 0) {
        data.rate = (data.successful / data.total) * 100;
      }
    });
    
    // Calculate average time to fix
    if (knowledgeBase.fixes.length > 0) {
      metrics.timeToFix.average /= knowledgeBase.fixes.length;
    }
    
    // Generate historical data (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (config.historyDays * 24 * 60 * 60 * 1000));
    
    // Group fixes by date
    const fixesByDate = {};
    knowledgeBase.fixes.forEach(fix => {
      if (fix.timestamp) {
        const fixDate = new Date(fix.timestamp);
        if (fixDate >= thirtyDaysAgo) {
          const dateKey = fixDate.toISOString().split('T')[0];
          if (!fixesByDate[dateKey]) {
            fixesByDate[dateKey] = { total: 0, successful: 0 };
          }
          fixesByDate[dateKey].total++;
          if (fix.successful) {
            fixesByDate[dateKey].successful++;
          }
        }
      }
    });
    
    // Fill in missing dates and sort
    for (let i = 0; i < config.historyDays; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().split('T')[0];
      if (!fixesByDate[dateKey]) {
        fixesByDate[dateKey] = { total: 0, successful: 0 };
      }
      metrics.history.push({
        date: dateKey,
        total: fixesByDate[dateKey].total,
        successful: fixesByDate[dateKey].successful,
        rate: fixesByDate[dateKey].total > 0 ? 
          (fixesByDate[dateKey].successful / fixesByDate[dateKey].total) * 100 : 0
      });
    }
    
    // Sort history by date
    metrics.history.sort((a, b) => a.date.localeCompare(b.date));
  }
  
  return metrics;
}

/**
 * Generate dashboard HTML
 * @param {Object} metrics - Calculated metrics
 * @returns {string} Dashboard HTML
 */
function generateDashboardHtml(metrics) {
  // Prepare data for charts
  const errorTypeLabels = Object.keys(metrics.byErrorType);
  const errorTypeSuccessRates = errorTypeLabels.map(type => metrics.byErrorType[type].rate.toFixed(1));
  
  const sourceLabels = Object.keys(metrics.byFixSource);
  const sourceSuccessRates = sourceLabels.map(source => metrics.byFixSource[source].rate.toFixed(1));
  
  const confidenceLabels = Object.keys(metrics.byConfidence);
  const confidenceSuccessRates = confidenceLabels.map(level => metrics.byConfidence[level].rate.toFixed(1));
  
  const historyDates = metrics.history.map(item => item.date);
  const historyRates = metrics.history.map(item => item.rate.toFixed(1));
  const historyTotals = metrics.history.map(item => item.total);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Fix Monitoring Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .metrics-summary {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .metric-card {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      flex: 1;
      margin: 0 10px;
      text-align: center;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      margin: 10px 0;
    }
    .chart-container {
      background-color: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    .chart-row {
      display: flex;
      margin-bottom: 30px;
    }
    .chart-col {
      flex: 1;
      margin: 0 10px;
    }
    h2 {
      margin-top: 0;
      color: #333;
    }
    .success-rate {
      color: #28a745;
    }
    .warning {
      color: #ffc107;
    }
    .danger {
      color: #dc3545;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="header">
      <h1>AI Fix Monitoring Dashboard</h1>
      <p>Generated: ${new Date().toISOString()}</p>
    </div>
    
    <div class="metrics-summary">
      <div class="metric-card">
        <h3>Total Fixes</h3>
        <div class="metric-value">${metrics.overall.totalFixes}</div>
      </div>
      <div class="metric-card">
        <h3>Successful Fixes</h3>
        <div class="metric-value">${metrics.overall.successfulFixes}</div>
      </div>
      <div class="metric-card">
        <h3>Success Rate</h3>
        <div class="metric-value ${metrics.overall.successRate >= 80 ? 'success-rate' : metrics.overall.successRate >= 50 ? 'warning' : 'danger'}">
          ${metrics.overall.successRate.toFixed(1)}%
        </div>
      </div>
      <div class="metric-card">
        <h3>Avg. Time to Fix</h3>
        <div class="metric-value">${metrics.timeToFix.average.toFixed(0)} ms</div>
      </div>
    </div>
    
    <div class="chart-row">
      <div class="chart-col">
        <div class="chart-container">
          <h2>Success Rate by Error Type</h2>
          <canvas id="errorTypeChart"></canvas>
        </div>
      </div>
      <div class="chart-col">
        <div class="chart-container">
          <h2>Success Rate by Fix Source</h2>
          <canvas id="fixSourceChart"></canvas>
        </div>
      </div>
    </div>
    
    <div class="chart-row">
      <div class="chart-col">
        <div class="chart-container">
          <h2>Success Rate by Confidence Level</h2>
          <canvas id="confidenceChart"></canvas>
        </div>
      </div>
      <div class="chart-col">
        <div class="chart-container">
          <h2>Historical Success Rate</h2>
          <canvas id="historyChart"></canvas>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Error Type Chart
    new Chart(document.getElementById('errorTypeChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(errorTypeLabels)},
        datasets: [{
          label: 'Success Rate (%)',
          data: ${JSON.stringify(errorTypeSuccessRates)},
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    
    // Fix Source Chart
    new Chart(document.getElementById('fixSourceChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(sourceLabels)},
        datasets: [{
          label: 'Success Rate (%)',
          data: ${JSON.stringify(sourceSuccessRates)},
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    
    // Confidence Chart
    new Chart(document.getElementById('confidenceChart'), {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(confidenceLabels)},
        datasets: [{
          label: 'Success Rate (%)',
          data: ${JSON.stringify(confidenceSuccessRates)},
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    
    // History Chart
    new Chart(document.getElementById('historyChart'), {
      type: 'line',
      data: {
        labels: ${JSON.stringify(historyDates)},
        datasets: [
          {
            label: 'Success Rate (%)',
            data: ${JSON.stringify(historyRates)},
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Total Fixes',
            data: ${JSON.stringify(historyTotals)},
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderDash: [5, 5],
            type: 'bar',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            position: 'left',
            title: {
              display: true,
              text: 'Success Rate (%)'
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: 'Total Fixes'
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;
}

// Run the dashboard generator if this script is executed directly
if (require.main === module) {
  generateDashboard();
}

module.exports = { generateDashboard };
