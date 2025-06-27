/**
 * TestRunAnalytics.js
 * 
 * This module provides functionality for storing, retrieving, and analyzing
 * test run data over time. It implements a persistent storage solution for
 * test run metrics, AI fix attempts, and validation results.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Class responsible for storing and analyzing test run data
 */
class TestRunAnalytics {
  /**
   * Creates a new TestRunAnalytics instance
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.storageDir - Directory to store analytics data
   * @param {Object} options.logger - Logger instance
   */
  constructor(options = {}) {
    this.storageDir = options.storageDir || path.join(process.cwd(), 'analytics-data');
    this.dataFile = path.join(this.storageDir, 'test-run-history.json');
    this.logger = options.logger;
    this.history = [];
    this.initialized = false;
  }
  
  /**
   * Sets the logger instance for this analytics module
   * 
   * @param {Object} logger - Logger instance
   */
  setLogger(logger) {
    if (logger && typeof logger === 'object') {
      this.logger = logger;
      return true;
    }
    return false;
  }

  /**
   * Initializes the analytics module
   * Ensures the storage directory exists and loads existing data
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Create storage directory if it doesn't exist
      await fs.mkdir(this.storageDir, { recursive: true });
      
      // Try to load existing data
      try {
        const data = await fs.readFile(this.dataFile, 'utf8');
        this.history = JSON.parse(data);
        
        if (this.logger) {
          this.logger.info(`Loaded ${this.history.length} historical test runs`);
        } else {
          console.log(`Loaded ${this.history.length} historical test runs`);
        }
      } catch (err) {
        // If file doesn't exist or is invalid, start with empty history
        if (err.code !== 'ENOENT') {
          if (this.logger) {
            this.logger.warn(`Error loading analytics data: ${err.message}`);
          } else {
            console.warn(`Error loading analytics data: ${err.message}`);
          }
        }
        this.history = [];
      }
      
      this.initialized = true;
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to initialize analytics module', { error: error.message });
      } else {
        console.error('Failed to initialize analytics module:', error.message);
      }
      throw error;
    }
  }

  /**
   * Records a test run in the analytics history
   * 
   * @param {Object} testRun - Test run data to record
   * @param {string} testRun.id - Unique identifier for this test run
   * @param {string} testRun.timestamp - ISO timestamp when the test run started
   * @param {number} testRun.duration - Duration of the test run in milliseconds
   * @param {Object} testRun.stats - Test statistics
   * @param {number} testRun.stats.totalTests - Total number of tests executed
   * @param {number} testRun.stats.passedTests - Number of passed tests
   * @param {number} testRun.stats.failedTests - Number of failed tests
   * @param {number} testRun.stats.skippedTests - Number of skipped tests
   * @param {Array} testRun.failures - Array of test failures
   * @param {Array} testRun.fixes - Array of applied fixes
   * @param {boolean} testRun.success - Whether the test run was ultimately successful
   * @param {number} testRun.attempts - Number of test run attempts
   * @param {Object} testRun.validation - Validation results for applied fixes
   * @returns {Promise<void>}
   */
  async recordTestRun(testRun) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Ensure required fields are present
    const requiredFields = ['id', 'timestamp', 'duration', 'stats'];
    for (const field of requiredFields) {
      if (!testRun[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Add the test run to history
    this.history.push(testRun);
    
    // Save to disk
    await this.saveHistory();
    
    if (this.logger) {
      this.logger.info('Recorded test run in analytics history', { 
        id: testRun.id,
        success: testRun.success,
        failedTests: testRun.stats.failedTests
      });
    }
  }

  /**
   * Saves the current history to disk
   * 
   * @returns {Promise<void>}
   * @private
   */
  async saveHistory() {
    try {
      await fs.writeFile(this.dataFile, JSON.stringify(this.history, null, 2), 'utf8');
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to save analytics history', { error: error.message });
      } else {
        console.error('Failed to save analytics history:', error.message);
      }
      throw error;
    }
  }

  /**
   * Retrieves test run history, optionally filtered
   * 
   * @param {Object} filters - Optional filters to apply
   * @param {string} filters.startDate - ISO date string for start date
   * @param {string} filters.endDate - ISO date string for end date
   * @param {boolean} filters.successOnly - If true, only return successful runs
   * @param {boolean} filters.failureOnly - If true, only return failed runs
   * @param {number} filters.limit - Maximum number of records to return
   * @returns {Array} Filtered test run history
   */
  getHistory(filters = {}) {
    if (!this.initialized) {
      throw new Error('Analytics module not initialized. Call initialize() first.');
    }
    
    let filteredHistory = [...this.history];
    
    // Apply date filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate).getTime();
      filteredHistory = filteredHistory.filter(run => 
        new Date(run.timestamp).getTime() >= startDate
      );
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate).getTime();
      filteredHistory = filteredHistory.filter(run => 
        new Date(run.timestamp).getTime() <= endDate
      );
    }
    
    // Apply success/failure filters
    if (filters.successOnly) {
      filteredHistory = filteredHistory.filter(run => run.success === true);
    }
    
    if (filters.failureOnly) {
      filteredHistory = filteredHistory.filter(run => run.success === false);
    }
    
    // Apply limit
    if (filters.limit && typeof filters.limit === 'number') {
      filteredHistory = filteredHistory.slice(-filters.limit);
    }
    
    return filteredHistory;
  }

  /**
   * Calculates summary statistics from test run history
   * 
   * @param {Array} history - Optional history array to use (defaults to this.history)
   * @returns {Object} Summary statistics
   */
  calculateStats(history = null) {
    const data = history || this.history;
    
    if (!data || data.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        averageDuration: 0,
        fixSuccessRate: 0,
        commonFailures: []
      };
    }
    
    // Calculate basic stats
    const totalRuns = data.length;
    const successfulRuns = data.filter(run => run.success).length;
    const successRate = (successfulRuns / totalRuns) * 100;
    
    // Calculate average duration
    const totalDuration = data.reduce((sum, run) => sum + (run.duration || 0), 0);
    const averageDuration = totalDuration / totalRuns;
    
    // Calculate fix success rate
    const runsWithFixes = data.filter(run => run.fixes && run.fixes.length > 0);
    const successfulFixes = runsWithFixes.filter(run => run.success).length;
    const fixSuccessRate = runsWithFixes.length > 0 
      ? (successfulFixes / runsWithFixes.length) * 100 
      : 0;
    
    // Identify common failures
    const failureCounts = {};
    data.forEach(run => {
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
}

module.exports = TestRunAnalytics;
