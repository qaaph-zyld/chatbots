/**
 * AI Feedback Loop
 * 
 * Implements a feedback loop system for the AI Fix Engine to learn from
 * successful and unsuccessful fixes, improving accuracy over time.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Convert fs functions to promises
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
const access = util.promisify(fs.access);

/**
 * AI Feedback Loop class
 */
class AIFeedbackLoop {
  /**
   * Constructor for the AIFeedbackLoop
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      feedbackPath: options.feedbackPath || path.join(process.cwd(), 'test-results', 'ai-feedback'),
      historyLimit: options.historyLimit || 100,
      learningRate: options.learningRate || 0.1,
      logger: options.logger || console
    };
    
    this.feedbackData = {
      fixes: [],
      patterns: {},
      metrics: {
        totalFixes: 0,
        successfulFixes: 0,
        successRate: 0
      }
    };
    
    this.initialize();
  }
  
  /**
   * Initialize the feedback loop
   */
  async initialize() {
    try {
      await this.ensureFeedbackDirectory();
      await this.loadFeedbackData();
      this.options.logger.info('AI Feedback Loop initialized successfully');
    } catch (error) {
      this.options.logger.error('Failed to initialize AI Feedback Loop:', error);
    }
  }
  
  /**
   * Ensure the feedback directory exists
   */
  async ensureFeedbackDirectory() {
    try {
      await access(this.options.feedbackPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await mkdir(this.options.feedbackPath, { recursive: true });
        this.options.logger.info(`Created feedback directory: ${this.options.feedbackPath}`);
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Load feedback data from disk
   */
  async loadFeedbackData() {
    const feedbackPath = path.join(this.options.feedbackPath, 'feedback-data.json');
    
    try {
      await access(feedbackPath);
      const data = await readFile(feedbackPath, 'utf8');
      this.feedbackData = JSON.parse(data);
      this.options.logger.info(`Loaded feedback data with ${this.feedbackData.fixes.length} entries`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.options.logger.info('No existing feedback data found, creating a new one');
        await this.saveFeedbackData();
      } else {
        this.options.logger.error('Error loading feedback data:', error);
      }
    }
  }
  
  /**
   * Save feedback data to disk
   */
  async saveFeedbackData() {
    const feedbackPath = path.join(this.options.feedbackPath, 'feedback-data.json');
    
    try {
      await writeFile(feedbackPath, JSON.stringify(this.feedbackData, null, 2));
      this.options.logger.info('Feedback data saved successfully');
    } catch (error) {
      this.options.logger.error('Error saving feedback data:', error);
    }
  }
  
  /**
   * Record feedback for a fix
   * @param {Object} fix - Fix information
   * @param {boolean} wasSuccessful - Whether the fix was successful
   * @param {Object} testResult - Test result after applying the fix
   */
  async recordFeedback(fix, wasSuccessful, testResult = {}) {
    this.options.logger.info(`Recording feedback: ${wasSuccessful ? 'successful' : 'failed'}`);
    
    // Create feedback entry
    const feedbackEntry = {
      fixId: `fix_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fixStrategy: fix.fixStrategy,
      fixCode: fix.fixCode,
      wasSuccessful,
      testName: fix.testName || 'unknown',
      errorType: fix.errorType || 'unknown',
      timestamp: new Date().toISOString(),
      executionTime: testResult.executionTime || 0,
      testOutput: testResult.output || ''
    };
    
    // Add to fixes array
    this.feedbackData.fixes.unshift(feedbackEntry);
    
    // Limit the history size
    if (this.feedbackData.fixes.length > this.options.historyLimit) {
      this.feedbackData.fixes = this.feedbackData.fixes.slice(0, this.options.historyLimit);
    }
    
    // Update metrics
    this.feedbackData.metrics.totalFixes++;
    if (wasSuccessful) {
      this.feedbackData.metrics.successfulFixes++;
    }
    this.feedbackData.metrics.successRate = 
      this.feedbackData.metrics.successfulFixes / this.feedbackData.metrics.totalFixes;
    
    // Update patterns
    this.updatePatterns(fix, wasSuccessful);
    
    // Save updated feedback data
    await this.saveFeedbackData();
    
    return feedbackEntry;
  }
  
  /**
   * Update pattern recognition based on feedback
   * @param {Object} fix - Fix information
   * @param {boolean} wasSuccessful - Whether the fix was successful
   */
  updatePatterns(fix, wasSuccessful) {
    const { fixStrategy, errorType } = fix;
    
    // Create pattern key
    const patternKey = `${fixStrategy}_${errorType}`;
    
    // Initialize pattern if it doesn't exist
    if (!this.feedbackData.patterns[patternKey]) {
      this.feedbackData.patterns[patternKey] = {
        attempts: 0,
        successes: 0,
        successRate: 0,
        weight: 1.0
      };
    }
    
    // Update pattern statistics
    const pattern = this.feedbackData.patterns[patternKey];
    pattern.attempts++;
    if (wasSuccessful) {
      pattern.successes++;
    }
    pattern.successRate = pattern.successes / pattern.attempts;
    
    // Adjust weight based on success rate and learning rate
    const targetWeight = wasSuccessful ? 1.0 : 0.5;
    pattern.weight += this.options.learningRate * (targetWeight - pattern.weight);
  }
  
  /**
   * Get pattern weight for a specific fix strategy and error type
   * @param {string} fixStrategy - Fix strategy
   * @param {string} errorType - Error type
   * @returns {number} - Pattern weight
   */
  getPatternWeight(fixStrategy, errorType) {
    const patternKey = `${fixStrategy}_${errorType}`;
    
    if (this.feedbackData.patterns[patternKey]) {
      return this.feedbackData.patterns[patternKey].weight;
    }
    
    return 1.0; // Default weight
  }
  
  /**
   * Get similar successful fixes for a given error type
   * @param {string} errorType - Error type
   * @param {number} limit - Maximum number of fixes to return
   * @returns {Array} - Similar successful fixes
   */
  getSimilarSuccessfulFixes(errorType, limit = 5) {
    return this.feedbackData.fixes
      .filter(fix => fix.wasSuccessful && fix.errorType === errorType)
      .slice(0, limit);
  }
  
  /**
   * Generate a report of feedback metrics
   * @returns {Object} - Feedback metrics report
   */
  generateMetricsReport() {
    const { metrics, patterns } = this.feedbackData;
    
    // Calculate pattern success rates
    const patternStats = Object.entries(patterns).map(([key, pattern]) => {
      const [fixStrategy, errorType] = key.split('_');
      return {
        fixStrategy,
        errorType,
        attempts: pattern.attempts,
        successes: pattern.successes,
        successRate: pattern.successRate,
        weight: pattern.weight
      };
    }).sort((a, b) => b.attempts - a.attempts);
    
    // Calculate recent success rate (last 20 fixes)
    const recentFixes = this.feedbackData.fixes.slice(0, 20);
    const recentSuccesses = recentFixes.filter(fix => fix.wasSuccessful).length;
    const recentSuccessRate = recentFixes.length > 0 ? recentSuccesses / recentFixes.length : 0;
    
    return {
      overall: {
        totalFixes: metrics.totalFixes,
        successfulFixes: metrics.successfulFixes,
        successRate: metrics.successRate,
        recentSuccessRate
      },
      patterns: patternStats,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Save metrics report to disk
   */
  async saveMetricsReport() {
    const report = this.generateMetricsReport();
    const reportPath = path.join(this.options.feedbackPath, 'metrics-report.json');
    
    try {
      await writeFile(reportPath, JSON.stringify(report, null, 2));
      
      // Also generate a markdown report for human readability
      const markdownReport = this.generateMarkdownReport(report);
      const markdownPath = path.join(this.options.feedbackPath, 'metrics-report.md');
      await writeFile(markdownPath, markdownReport);
      
      this.options.logger.info('Metrics report saved successfully');
    } catch (error) {
      this.options.logger.error('Error saving metrics report:', error);
    }
  }
  
  /**
   * Generate a markdown report from metrics
   * @param {Object} report - Metrics report
   * @returns {string} - Markdown report
   */
  generateMarkdownReport(report) {
    const { overall, patterns, timestamp } = report;
    
    return `# AI Fix Engine Metrics Report

Generated: ${timestamp}

## Overall Metrics

- **Total Fixes**: ${overall.totalFixes}
- **Successful Fixes**: ${overall.successfulFixes}
- **Overall Success Rate**: ${(overall.successRate * 100).toFixed(2)}%
- **Recent Success Rate**: ${(overall.recentSuccessRate * 100).toFixed(2)}%

## Pattern Success Rates

| Fix Strategy | Error Type | Attempts | Successes | Success Rate | Weight |
|--------------|------------|----------|-----------|--------------|--------|
${patterns.map(p => `| ${p.fixStrategy} | ${p.errorType} | ${p.attempts} | ${p.successes} | ${(p.successRate * 100).toFixed(2)}% | ${p.weight.toFixed(2)} |`).join('\n')}

## Recommendations

${this.generateRecommendations(report)}
`;
  }
  
  /**
   * Generate recommendations based on metrics
   * @param {Object} report - Metrics report
   * @returns {string} - Recommendations
   */
  generateRecommendations(report) {
    const { overall, patterns } = report;
    const recommendations = [];
    
    // Check overall success rate
    if (overall.successRate < 0.5) {
      recommendations.push('- Overall success rate is low. Consider reviewing the fix generation strategies.');
    }
    
    // Check for patterns with low success rates
    const lowSuccessPatterns = patterns.filter(p => p.attempts > 5 && p.successRate < 0.4);
    if (lowSuccessPatterns.length > 0) {
      recommendations.push('- The following patterns have low success rates and should be improved:');
      lowSuccessPatterns.forEach(p => {
        recommendations.push(`  - ${p.fixStrategy} for ${p.errorType}: ${(p.successRate * 100).toFixed(2)}% success rate`);
      });
    }
    
    // Check for patterns with high success rates
    const highSuccessPatterns = patterns.filter(p => p.attempts > 5 && p.successRate > 0.8);
    if (highSuccessPatterns.length > 0) {
      recommendations.push('- The following patterns are performing well:');
      highSuccessPatterns.forEach(p => {
        recommendations.push(`  - ${p.fixStrategy} for ${p.errorType}: ${(p.successRate * 100).toFixed(2)}% success rate`);
      });
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : 'No specific recommendations at this time.';
  }
}

module.exports = AIFeedbackLoop;
