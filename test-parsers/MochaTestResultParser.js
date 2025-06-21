/**
 * @fileoverview Mocha test result parser implementation.
 * 
 * This parser handles Mocha's JSON reporter output format and converts it to
 * our standardized test result format.
 */

const ITestResultParser = require('./ITestResultParser');
const path = require('path');

/**
 * Parser for Mocha test results
 */
class MochaTestResultParser extends ITestResultParser {
  /**
   * Creates a new MochaTestResultParser
   * 
   * @param {Object} options - Parser options
   */
  constructor(options = {}) {
    super();
    this.options = {
      normalizeFilePaths: true,
      includeConsoleOutput: true,
      ...options
    };
  }
  
  /**
   * Parse raw Mocha test output into standardized format
   * 
   * @param {string} rawOutput - Raw output from Mocha test execution
   * @param {Object} options - Parser-specific options
   * @returns {Object} Standardized test result object
   */
  parse(rawOutput, options = {}) {
    const mergedOptions = { ...this.options, ...options };
    
    try {
      // Try to find and parse JSON output from Mocha
      // Mocha's JSON reporter outputs a complete JSON object
      const jsonMatch = rawOutput.match(/({[\s\S]*"stats"[\s\S]*})/);
      
      if (!jsonMatch) {
        // If no JSON found, create a basic error result
        return this._createErrorResult('Failed to parse Mocha output: No JSON data found', rawOutput);
      }
      
      const mochaResults = JSON.parse(jsonMatch[1]);
      return this._convertMochaResults(mochaResults, mergedOptions);
    } catch (error) {
      return this._createErrorResult(`Failed to parse Mocha output: ${error.message}`, rawOutput);
    }
  }
  
  /**
   * Extract failed tests from parsed results
   * 
   * @param {Object} parsedResults - Results from parse() method
   * @returns {Array<Object>} Array of failed test objects
   */
  getFailedTests(parsedResults) {
    if (!parsedResults || !parsedResults.testSuites) {
      return [];
    }
    
    const failedTests = [];
    
    parsedResults.testSuites.forEach(suite => {
      if (suite.tests) {
        suite.tests.forEach(test => {
          if (test.status === 'failed') {
            failedTests.push({
              ...test,
              suiteName: suite.name,
              filePath: suite.filePath
            });
          }
        });
      }
    });
    
    return failedTests;
  }
  
  /**
   * Extract passed tests from parsed results
   * 
   * @param {Object} parsedResults - Results from parse() method
   * @returns {Array<Object>} Array of passed test objects
   */
  getPassedTests(parsedResults) {
    if (!parsedResults || !parsedResults.testSuites) {
      return [];
    }
    
    const passedTests = [];
    
    parsedResults.testSuites.forEach(suite => {
      if (suite.tests) {
        suite.tests.forEach(test => {
          if (test.status === 'passed') {
            passedTests.push({
              ...test,
              suiteName: suite.name,
              filePath: suite.filePath
            });
          }
        });
      }
    });
    
    return passedTests;
  }
  
  /**
   * Extract skipped tests from parsed results
   * 
   * @param {Object} parsedResults - Results from parse() method
   * @returns {Array<Object>} Array of skipped test objects
   */
  getSkippedTests(parsedResults) {
    if (!parsedResults || !parsedResults.testSuites) {
      return [];
    }
    
    const skippedTests = [];
    
    parsedResults.testSuites.forEach(suite => {
      if (suite.tests) {
        suite.tests.forEach(test => {
          if (test.status === 'pending') {
            skippedTests.push({
              ...test,
              suiteName: suite.name,
              filePath: suite.filePath
            });
          }
        });
      }
    });
    
    return skippedTests;
  }
  
  /**
   * Get summary statistics from parsed results
   * 
   * @param {Object} parsedResults - Results from parse() method
   * @returns {Object} Summary statistics object
   */
  getSummary(parsedResults) {
    if (!parsedResults || !parsedResults.summary) {
      return {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0
      };
    }
    
    return { ...parsedResults.summary };
  }
  
  /**
   * Check if the test run was successful overall
   * 
   * @param {Object} parsedResults - Results from parse() method
   * @returns {boolean} True if all tests passed, false otherwise
   */
  isSuccessful(parsedResults) {
    return parsedResults && 
           parsedResults.summary && 
           parsedResults.summary.success === true;
  }
  
  /**
   * Get detailed error information for a specific test
   * 
   * @param {Object} test - Test object from getFailedTests()
   * @param {Object} parsedResults - Results from parse() method
   * @returns {Object} Detailed error information
   */
  getErrorDetails(test, parsedResults) {
    if (!test || !test.error) {
      return null;
    }
    
    return { ...test.error };
  }
  
  /**
   * Get file path information for a specific test
   * 
   * @param {Object} test - Test object from any get*Tests() method
   * @param {Object} parsedResults - Results from parse() method
   * @returns {string} File path where the test is defined
   */
  getTestFilePath(test, parsedResults) {
    return test.filePath || '';
  }
  
  /**
   * Convert Mocha results to our standardized format
   * 
   * @param {Object} mochaResults - Mocha test results
   * @param {Object} options - Parser options
   * @returns {Object} Standardized test results
   * @private
   */
  _convertMochaResults(mochaResults, options) {
    // Extract test suites and tests
    const { testSuites, allTests } = this._extractSuitesAndTests(mochaResults, options);
    
    // Build summary
    const stats = mochaResults.stats || {};
    const summary = {
      success: stats.failures === 0,
      totalTests: stats.tests || 0,
      passedTests: stats.passes || 0,
      failedTests: stats.failures || 0,
      skippedTests: stats.pending || 0,
      duration: stats.duration || 0,
      startTime: stats.start ? new Date(stats.start).toISOString() : new Date().toISOString(),
      endTime: stats.end ? new Date(stats.end).toISOString() : new Date().toISOString()
    };
    
    // Build metadata
    const metadata = {
      framework: 'mocha',
      version: mochaResults.stats?.mocha?.version || 'unknown',
      config: {},
      environment: {
        node: process.version,
        os: process.platform
      },
      mocha: {
        // Mocha-specific metadata
        stats: mochaResults.stats || {}
      }
    };
    
    return {
      summary,
      testSuites,
      metadata
    };
  }
  
  /**
   * Extract test suites and tests from Mocha results
   * 
   * @param {Object} mochaResults - Mocha test results
   * @param {Object} options - Parser options
   * @returns {Object} Object containing testSuites and allTests arrays
   * @private
   */
  _extractSuitesAndTests(mochaResults, options) {
    const suites = {};
    const allTests = [];
    
    // Process all tests and organize them into suites
    const passes = mochaResults.passes || [];
    const failures = mochaResults.failures || [];
    const pending = mochaResults.pending || [];
    
    // Process passed tests
    passes.forEach(test => {
      const testObj = this._createTestObject(test, 'passed', options);
      allTests.push(testObj);
      this._addTestToSuite(testObj, suites, options);
    });
    
    // Process failed tests
    failures.forEach(test => {
      const testObj = this._createTestObject(test, 'failed', options);
      allTests.push(testObj);
      this._addTestToSuite(testObj, suites, options);
    });
    
    // Process pending/skipped tests
    pending.forEach(test => {
      const testObj = this._createTestObject(test, 'pending', options);
      allTests.push(testObj);
      this._addTestToSuite(testObj, suites, options);
    });
    
    // Convert suites object to array
    const testSuites = Object.values(suites);
    
    return { testSuites, allTests };
  }
  
  /**
   * Create a standardized test object from a Mocha test
   * 
   * @param {Object} test - Mocha test object
   * @param {string} status - Test status ('passed', 'failed', or 'pending')
   * @param {Object} options - Parser options
   * @returns {Object} Standardized test object
   * @private
   */
  _createTestObject(test, status, options) {
    const result = {
      id: test.fullTitle || test.title,
      name: test.title,
      fullName: test.fullTitle,
      status,
      duration: test.duration || 0
    };
    
    // Extract file path if available
    if (test.file) {
      result.filePath = options.normalizeFilePaths ? 
        this._normalizePath(test.file) : test.file;
    }
    
    // Add error information for failed tests
    if (status === 'failed' && test.err) {
      result.error = {
        message: test.err.message || '',
        stack: test.err.stack || '',
        type: test.err.name || 'Error',
        diff: test.err.diff || null,
        actual: test.err.actual,
        expected: test.err.expected
      };
    }
    
    return result;
  }
  
  /**
   * Add a test to its corresponding suite
   * 
   * @param {Object} test - Standardized test object
   * @param {Object} suites - Object containing all suites
   * @param {Object} options - Parser options
   * @private
   */
  _addTestToSuite(test, suites, options) {
    // Extract suite name from full test name
    // In Mocha, fullTitle is typically "Suite Name Test Name"
    const parts = test.fullName.split(' ');
    const testName = parts.pop(); // Last part is the test name
    const suiteName = parts.join(' '); // Rest is the suite name
    
    // Create suite if it doesn't exist
    if (!suites[suiteName]) {
      suites[suiteName] = {
        name: suiteName,
        filePath: test.filePath || '',
        duration: 0,
        status: 'passed', // Will be updated if any test fails
        tests: []
      };
    }
    
    // Add test to suite
    suites[suiteName].tests.push(test);
    
    // Update suite duration
    suites[suiteName].duration += test.duration;
    
    // Update suite status if test failed
    if (test.status === 'failed') {
      suites[suiteName].status = 'failed';
    }
  }
  
  /**
   * Create an error result when parsing fails
   * 
   * @param {string} message - Error message
   * @param {string} rawOutput - Raw output that failed to parse
   * @returns {Object} Error result object
   * @private
   */
  _createErrorResult(message, rawOutput) {
    return {
      summary: {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        skippedTests: 0,
        duration: 0,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString()
      },
      testSuites: [
        {
          name: 'Parse Error',
          filePath: '',
          duration: 0,
          status: 'failed',
          tests: [
            {
              id: 'parse-error',
              name: 'Parse Mocha Output',
              fullName: 'Parse Mocha Output',
              status: 'failed',
              duration: 0,
              error: {
                message,
                stack: message,
                type: 'ParseError'
              }
            }
          ]
        }
      ],
      metadata: {
        framework: 'mocha',
        version: 'unknown',
        parseError: true,
        rawOutput: rawOutput.substring(0, 1000) + (rawOutput.length > 1000 ? '...' : '')
      }
    };
  }
  
  /**
   * Normalize file paths to use forward slashes
   * 
   * @param {string} filePath - File path to normalize
   * @returns {string} Normalized file path
   * @private
   */
  _normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
  }
}

module.exports = MochaTestResultParser;
