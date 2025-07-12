/**
 * AI Fix Dashboard Trend Analyzer
 * 
 * This script analyzes metrics from the AI Fix Monitoring Dashboard
 * to identify trends and generate reports for CI/CD pipelines.
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
  metricsPath: process.env.METRICS_PATH || path.join(__dirname, '..', 'test-results', 'ai-dashboard', 'metrics.json'),
  reportOutputPath: process.env.REPORT_OUTPUT_PATH || path.join(__dirname, '..', 'test-results', 'ai-dashboard', 'trend-report.md'),
  thresholds: {
    successRateDecline: 5, // Percentage points decline to trigger alert
    fixTimeIncrease: 20, // Percentage increase to trigger alert
    consecutiveDeclines: 3 // Number of consecutive declines to trigger alert
  }
};

/**
 * Main function to analyze trends and generate report
 */
async function analyzeTrends() {
  console.log('Analyzing AI Fix Dashboard trends...');
  
  try {
    // Load metrics data
    const metrics = await loadMetrics();
    
    // Analyze trends
    const trends = identifyTrends(metrics);
    
    // Generate report
    const report = generateReport(trends, metrics);
    
    // Ensure output directory exists
    const outputDir = path.dirname(config.reportOutputPath);
    if (!fs.existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }
    
    // Write report
    await writeFile(config.reportOutputPath, report);
    
    // Set environment variable for CI/CD pipeline if negative trends detected
    if (trends.negativeDetected) {
      console.log('Negative trends detected - setting environment variable');
      // In GitHub Actions, we can set env vars for subsequent steps
      if (process.env.GITHUB_ENV) {
        fs.appendFileSync(process.env.GITHUB_ENV, `NEGATIVE_TRENDS=true\n`);
      } else {
        // For other CI systems or local runs
        process.env.NEGATIVE_TRENDS = 'true';
      }
    }
    
    console.log(`Trend analysis report generated at: ${config.reportOutputPath}`);
  } catch (error) {
    console.error('Error analyzing trends:', error);
    process.exit(1);
  }
}

/**
 * Load metrics data from JSON file
 * @returns {Object} Metrics data
 */
async function loadMetrics() {
  try {
    const data = await readFile(config.metricsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading metrics:', error);
    return {
      overall: { totalFixes: 0, successfulFixes: 0, successRate: 0 },
      history: []
    };
  }
}

/**
 * Identify trends in metrics data
 * @param {Object} metrics - Metrics data
 * @returns {Object} Identified trends
 */
function identifyTrends(metrics) {
  const trends = {
    successRate: {
      current: metrics.overall.successRate,
      trend: 'stable',
      change: 0,
      consecutive: 0
    },
    fixVolume: {
      current: metrics.overall.totalFixes,
      trend: 'stable',
      change: 0,
      consecutive: 0
    },
    timeToFix: {
      current: metrics.timeToFix?.average || 0,
      trend: 'stable',
      change: 0
    },
    errorTypes: {
      mostCommon: [],
      improving: [],
      declining: []
    },
    negativeDetected: false
  };
  
  // Analyze success rate trend
  if (metrics.history && metrics.history.length >= 7) {
    // Get last 7 days
    const recentHistory = metrics.history.slice(-7);
    
    // Calculate average success rate for first 3 days and last 3 days
    const firstThreeDays = recentHistory.slice(0, 3);
    const lastThreeDays = recentHistory.slice(-3);
    
    const firstThreeAvg = firstThreeDays.reduce((sum, day) => sum + day.rate, 0) / firstThreeDays.length;
    const lastThreeAvg = lastThreeDays.reduce((sum, day) => sum + day.rate, 0) / lastThreeDays.length;
    
    trends.successRate.change = lastThreeAvg - firstThreeAvg;
    
    if (trends.successRate.change > 2) {
      trends.successRate.trend = 'improving';
    } else if (trends.successRate.change < -config.thresholds.successRateDecline) {
      trends.successRate.trend = 'declining';
      trends.negativeDetected = true;
    }
    
    // Check for consecutive declines
    let consecutiveDeclines = 0;
    for (let i = 1; i < recentHistory.length; i++) {
      if (recentHistory[i].rate < recentHistory[i-1].rate) {
        consecutiveDeclines++;
      } else {
        consecutiveDeclines = 0;
      }
    }
    
    trends.successRate.consecutive = consecutiveDeclines;
    if (consecutiveDeclines >= config.thresholds.consecutiveDeclines) {
      trends.negativeDetected = true;
    }
  }
  
  // Analyze fix volume trend
  if (metrics.history && metrics.history.length >= 7) {
    // Get last 7 days
    const recentHistory = metrics.history.slice(-7);
    
    // Calculate average volume for first 3 days and last 3 days
    const firstThreeDays = recentHistory.slice(0, 3);
    const lastThreeDays = recentHistory.slice(-3);
    
    const firstThreeAvg = firstThreeDays.reduce((sum, day) => sum + day.total, 0) / firstThreeDays.length;
    const lastThreeAvg = lastThreeDays.reduce((sum, day) => sum + day.total, 0) / lastThreeDays.length;
    
    if (firstThreeAvg > 0) {
      trends.fixVolume.change = ((lastThreeAvg - firstThreeAvg) / firstThreeAvg) * 100;
    }
    
    if (trends.fixVolume.change > 20) {
      trends.fixVolume.trend = 'increasing';
    } else if (trends.fixVolume.change < -20) {
      trends.fixVolume.trend = 'decreasing';
    }
  }
  
  // Analyze error types
  if (metrics.byErrorType) {
    // Sort error types by frequency
    const errorTypes = Object.keys(metrics.byErrorType).map(type => ({
      type,
      total: metrics.byErrorType[type].total,
      rate: metrics.byErrorType[type].rate
    }));
    
    // Get most common error types
    trends.errorTypes.mostCommon = errorTypes
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)
      .map(item => ({
        type: item.type,
        total: item.total,
        rate: item.rate
      }));
    
    // Get improving and declining error types
    // (only consider types with at least 5 occurrences)
    const significantTypes = errorTypes.filter(item => item.total >= 5);
    
    trends.errorTypes.improving = significantTypes
      .filter(item => item.rate >= 75)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3)
      .map(item => ({
        type: item.type,
        rate: item.rate
      }));
    
    trends.errorTypes.declining = significantTypes
      .filter(item => item.rate < 50)
      .sort((a, b) => a.rate - b.rate)
      .slice(0, 3)
      .map(item => ({
        type: item.type,
        rate: item.rate
      }));
    
    // Flag negative trend if there are declining error types
    if (trends.errorTypes.declining.length > 0) {
      trends.negativeDetected = true;
    }
  }
  
  return trends;
}

/**
 * Generate markdown report from trends
 * @param {Object} trends - Identified trends
 * @param {Object} metrics - Original metrics data
 * @returns {string} Markdown report
 */
function generateReport(trends, metrics) {
  const now = new Date();
  
  // Create trend indicators
  const getTrendIndicator = (trend) => {
    switch (trend) {
      case 'improving': return '📈 Improving';
      case 'declining': return '📉 Declining';
      case 'increasing': return '📈 Increasing';
      case 'decreasing': return '📉 Decreasing';
      default: return '📊 Stable';
    }
  };
  
  // Format success rate with color based on value
  const formatSuccessRate = (rate) => {
    if (rate >= 80) return `**${rate.toFixed(1)}%** 🟢`;
    if (rate >= 60) return `**${rate.toFixed(1)}%** 🟡`;
    return `**${rate.toFixed(1)}%** 🔴`;
  };
  
  // Generate report
  let report = `---
title: AI Fix Engine Trend Report
labels: ai-monitoring, ${trends.negativeDetected ? 'alert' : 'info'}
---

# AI Fix Engine Trend Report
**Generated:** ${now.toISOString()}

## Summary

${trends.negativeDetected ? '⚠️ **ALERT:** Negative trends detected in AI fix performance.' : '✅ AI fix performance is within expected parameters.'}

### Key Metrics

- **Success Rate:** ${formatSuccessRate(trends.successRate.current)} ${getTrendIndicator(trends.successRate.trend)}
  ${trends.successRate.change > 0 ? `(+${trends.successRate.change.toFixed(1)}%)` : `(${trends.successRate.change.toFixed(1)}%)`}
- **Fix Volume:** ${trends.fixVolume.current} fixes ${getTrendIndicator(trends.fixVolume.trend)}
- **Average Time to Fix:** ${metrics.timeToFix?.average?.toFixed(2) || 'N/A'} ms

## Detailed Analysis

### Success Rate Trend

${
  trends.successRate.trend === 'declining' 
    ? `⚠️ **Success rate is declining.** The 3-day average has decreased by ${Math.abs(trends.successRate.change).toFixed(1)}% points.`
    : trends.successRate.trend === 'improving'
      ? `✅ Success rate is improving. The 3-day average has increased by ${trends.successRate.change.toFixed(1)}% points.`
      : `✅ Success rate is stable.`
}

${
  trends.successRate.consecutive >= config.thresholds.consecutiveDeclines
    ? `⚠️ **Alert:** Success rate has declined for ${trends.successRate.consecutive} consecutive days.`
    : ''
}

### Error Type Analysis

#### Most Common Error Types
${
  trends.errorTypes.mostCommon.length > 0
    ? trends.errorTypes.mostCommon.map(item => 
        `- **${item.type}**: ${item.total} occurrences, ${formatSuccessRate(item.rate)}`
      ).join('\n')
    : '- No significant error types found'
}

#### Best Performing Error Types
${
  trends.errorTypes.improving.length > 0
    ? trends.errorTypes.improving.map(item => 
        `- **${item.type}**: ${formatSuccessRate(item.rate)}`
      ).join('\n')
    : '- No consistently well-performing error types found'
}

#### Problematic Error Types
${
  trends.errorTypes.declining.length > 0
    ? trends.errorTypes.declining.map(item => 
        `- **${item.type}**: ${formatSuccessRate(item.rate)} ⚠️`
      ).join('\n')
    : '- No consistently problematic error types found'
}

## Recommendations

${
  trends.negativeDetected
    ? `
### Priority Actions

1. **Review AI fix strategies** for ${
      trends.errorTypes.declining.length > 0
        ? `problematic error types: ${trends.errorTypes.declining.map(item => item.type).join(', ')}`
        : 'declining performance areas'
    }
2. **Analyze recent test failures** to identify new patterns
3. **Update knowledge base** with improved fix patterns
4. **Consider model retraining** if decline persists
`
    : `
- Continue monitoring performance
- Consider expanding test coverage for less common error types
- Maintain current knowledge base update frequency
`
}

## Historical Data

[View Full Dashboard](${process.env.GITHUB_SERVER_URL ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/workflows/ai-dashboard.yml` : '#'})
`;

  return report;
}

// Run the trend analyzer if this script is executed directly
if (require.main === module) {
  analyzeTrends();
}

module.exports = {
  analyzeTrends,
  identifyTrends
};
