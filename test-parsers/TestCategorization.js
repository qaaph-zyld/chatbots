/**
 * @fileoverview Test categorization and prioritization module.
 * 
 * This module provides functionality for categorizing and prioritizing tests
 * based on metadata, patterns, and execution history.
 */

/**
 * Test priority levels
 * @enum {string}
 */
const TestPriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Test category types
 * @enum {string}
 */
const TestCategory = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  FUNCTIONAL: 'functional',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  ACCESSIBILITY: 'accessibility',
  REGRESSION: 'regression'
};

/**
 * Test categorization and prioritization manager
 */
class TestCategorization {
  /**
   * Creates a new TestCategorization instance
   * 
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      historyFile: options.historyFile || './test-results/test-history.json',
      priorityPatterns: options.priorityPatterns || this._getDefaultPriorityPatterns(),
      categoryPatterns: options.categoryPatterns || this._getDefaultCategoryPatterns(),
      ...options
    };
    
    this.testHistory = {};
    this.testMetadata = {};
  }
  
  /**
   * Initializes the test categorization by loading history and metadata
   * 
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load test history if available
      if (require('fs').existsSync(this.options.historyFile)) {
        this.testHistory = JSON.parse(
          require('fs').readFileSync(this.options.historyFile, 'utf8')
        );
      }
    } catch (error) {
      console.warn(`Failed to load test history: ${error.message}`);
    }
  }
  
  /**
   * Categorizes a test based on its name, path, and content
   * 
   * @param {Object} test - Test object
   * @param {string} test.name - Test name
   * @param {string} test.fullName - Full test name/path
   * @param {string} test.filePath - Test file path
   * @returns {Array<string>} - Array of categories
   */
  categorizeTest(test) {
    if (!test) return [];
    
    // Check if we already have metadata for this test
    const testId = this._getTestId(test);
    if (this.testMetadata[testId] && this.testMetadata[testId].categories) {
      return this.testMetadata[testId].categories;
    }
    
    const categories = [];
    const patterns = this.options.categoryPatterns;
    
    // Check name, fullName, and filePath against patterns
    Object.keys(patterns).forEach(category => {
      const categoryPatterns = patterns[category];
      
      // Check if any pattern matches
      const matches = categoryPatterns.some(pattern => {
        if (test.name && pattern.test(test.name)) return true;
        if (test.fullName && pattern.test(test.fullName)) return true;
        if (test.filePath && pattern.test(test.filePath)) return true;
        return false;
      });
      
      if (matches) {
        categories.push(category);
      }
    });
    
    // Store in metadata
    this._updateTestMetadata(testId, { categories });
    
    return categories;
  }
  
  /**
   * Determines the priority of a test based on its name, path, and history
   * 
   * @param {Object} test - Test object
   * @param {string} test.name - Test name
   * @param {string} test.fullName - Full test name/path
   * @param {string} test.filePath - Test file path
   * @returns {string} - Priority level
   */
  getPriority(test) {
    if (!test) return TestPriority.MEDIUM;
    
    // Check if we already have metadata for this test
    const testId = this._getTestId(test);
    if (this.testMetadata[testId] && this.testMetadata[testId].priority) {
      return this.testMetadata[testId].priority;
    }
    
    // Check explicit priority patterns
    const priorityPatterns = this.options.priorityPatterns;
    
    for (const priority of Object.keys(priorityPatterns)) {
      const patterns = priorityPatterns[priority];
      
      // Check if any pattern matches
      const matches = patterns.some(pattern => {
        if (test.name && pattern.test(test.name)) return true;
        if (test.fullName && pattern.test(test.fullName)) return true;
        if (test.filePath && pattern.test(test.filePath)) return true;
        return false;
      });
      
      if (matches) {
        this._updateTestMetadata(testId, { priority });
        return priority;
      }
    }
    
    // Check test history for failures
    if (this.testHistory[testId]) {
      const history = this.testHistory[testId];
      
      // Tests that have failed recently are higher priority
      if (history.recentFailures > 2) {
        this._updateTestMetadata(testId, { priority: TestPriority.HIGH });
        return TestPriority.HIGH;
      }
      
      // Tests that are flaky (alternating between pass/fail) are higher priority
      if (history.flakyScore > 0.3) {
        this._updateTestMetadata(testId, { priority: TestPriority.HIGH });
        return TestPriority.HIGH;
      }
    }
    
    // Default priority
    this._updateTestMetadata(testId, { priority: TestPriority.MEDIUM });
    return TestPriority.MEDIUM;
  }
  
  /**
   * Filters tests based on categories
   * 
   * @param {Array<Object>} tests - Array of test objects
   * @param {Array<string>} categories - Categories to include
   * @returns {Array<Object>} - Filtered tests
   */
  filterByCategory(tests, categories) {
    if (!categories || categories.length === 0) return tests;
    
    return tests.filter(test => {
      const testCategories = this.categorizeTest(test);
      return categories.some(category => testCategories.includes(category));
    });
  }
  
  /**
   * Filters tests based on priority
   * 
   * @param {Array<Object>} tests - Array of test objects
   * @param {Array<string>} priorities - Priorities to include
   * @returns {Array<Object>} - Filtered tests
   */
  filterByPriority(tests, priorities) {
    if (!priorities || priorities.length === 0) return tests;
    
    return tests.filter(test => {
      const priority = this.getPriority(test);
      return priorities.includes(priority);
    });
  }
  
  /**
   * Sorts tests by priority (highest to lowest)
   * 
   * @param {Array<Object>} tests - Array of test objects
   * @returns {Array<Object>} - Sorted tests
   */
  sortByPriority(tests) {
    const priorityOrder = {
      [TestPriority.CRITICAL]: 0,
      [TestPriority.HIGH]: 1,
      [TestPriority.MEDIUM]: 2,
      [TestPriority.LOW]: 3
    };
    
    return [...tests].sort((a, b) => {
      const priorityA = priorityOrder[this.getPriority(a)];
      const priorityB = priorityOrder[this.getPriority(b)];
      return priorityA - priorityB;
    });
  }
  
  /**
   * Updates test history with new test results
   * 
   * @param {Object} parsedResults - Parsed test results
   * @returns {Promise<void>}
   */
  async updateTestHistory(parsedResults) {
    if (!parsedResults || !parsedResults.testSuites) return;
    
    const now = Date.now();
    
    // Process all tests
    parsedResults.testSuites.forEach(suite => {
      if (!suite.tests) return;
      
      suite.tests.forEach(test => {
        const testId = this._getTestId(test);
        
        // Initialize history entry if it doesn't exist
        if (!this.testHistory[testId]) {
          this.testHistory[testId] = {
            totalRuns: 0,
            totalPasses: 0,
            totalFailures: 0,
            recentFailures: 0,
            lastRun: now,
            lastStatus: null,
            statusHistory: [],
            flakyScore: 0
          };
        }
        
        const history = this.testHistory[testId];
        
        // Update history
        history.totalRuns++;
        history.lastRun = now;
        
        if (test.status === 'passed') {
          history.totalPasses++;
        } else if (test.status === 'failed') {
          history.totalFailures++;
          history.recentFailures++;
        }
        
        // Keep track of last 10 runs for flaky detection
        history.statusHistory.unshift(test.status);
        if (history.statusHistory.length > 10) {
          history.statusHistory.pop();
        }
        
        // Calculate flaky score (how often the test alternates between pass/fail)
        if (history.statusHistory.length > 1) {
          let alternations = 0;
          for (let i = 1; i < history.statusHistory.length; i++) {
            if (history.statusHistory[i] !== history.statusHistory[i-1]) {
              alternations++;
            }
          }
          history.flakyScore = alternations / (history.statusHistory.length - 1);
        }
        
        // Update last status
        history.lastStatus = test.status;
      });
    });
    
    // Save updated history
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Ensure directory exists
      const dir = path.dirname(this.options.historyFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(
        this.options.historyFile,
        JSON.stringify(this.testHistory, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error(`Failed to save test history: ${error.message}`);
    }
  }
  
  /**
   * Gets a unique identifier for a test
   * 
   * @param {Object} test - Test object
   * @returns {string} - Test identifier
   * @private
   */
  _getTestId(test) {
    if (!test) return '';
    
    // Use fullName if available, otherwise combine name and filePath
    if (test.fullName) {
      return test.fullName;
    }
    
    return `${test.filePath || ''}:${test.name || ''}`;
  }
  
  /**
   * Updates test metadata
   * 
   * @param {string} testId - Test identifier
   * @param {Object} metadata - Metadata to update
   * @private
   */
  _updateTestMetadata(testId, metadata) {
    if (!testId) return;
    
    if (!this.testMetadata[testId]) {
      this.testMetadata[testId] = {};
    }
    
    Object.assign(this.testMetadata[testId], metadata);
  }
  
  /**
   * Gets default priority patterns
   * 
   * @returns {Object} - Default priority patterns
   * @private
   */
  _getDefaultPriorityPatterns() {
    return {
      [TestPriority.CRITICAL]: [
        /critical/i,
        /essential/i,
        /core/i,
        /auth/i,
        /login/i,
        /payment/i,
        /security/i
      ],
      [TestPriority.HIGH]: [
        /high/i,
        /important/i,
        /user.*data/i,
        /api/i,
        /database/i
      ],
      [TestPriority.LOW]: [
        /low/i,
        /minor/i,
        /cosmetic/i,
        /ui\.appearance/i
      ]
    };
  }
  
  /**
   * Gets default category patterns
   * 
   * @returns {Object} - Default category patterns
   * @private
   */
  _getDefaultCategoryPatterns() {
    return {
      [TestCategory.UNIT]: [
        /unit/i,
        /\.spec\./i,
        /\.test\./i,
        /\/tests\/unit\//i
      ],
      [TestCategory.INTEGRATION]: [
        /integration/i,
        /\.int\./i,
        /\/tests\/integration\//i
      ],
      [TestCategory.FUNCTIONAL]: [
        /functional/i,
        /e2e/i,
        /end.*to.*end/i,
        /\/tests\/functional\//i,
        /\/tests\/e2e\//i
      ],
      [TestCategory.PERFORMANCE]: [
        /performance/i,
        /benchmark/i,
        /speed/i,
        /load/i
      ],
      [TestCategory.SECURITY]: [
        /security/i,
        /auth/i,
        /permission/i,
        /vulnerability/i
      ],
      [TestCategory.ACCESSIBILITY]: [
        /accessibility/i,
        /a11y/i
      ],
      [TestCategory.REGRESSION]: [
        /regression/i,
        /bug.*fix/i
      ]
    };
  }
}

module.exports = {
  TestCategorization,
  TestPriority,
  TestCategory
};
