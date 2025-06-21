/**
 * @fileoverview Jest test result parser implementation.
 * 
 * This parser handles Jest's JSON output format and converts it to
 * our standardized test result format.
 */

const ITestResultParser = require('./ITestResultParser');
const path = require('path');

/**
 * Parser for Jest test results
 */
class JestTestResultParser extends ITestResultParser {
  /**
   * Creates a new JestTestResultParser
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
   * Parse raw Jest test output into standardized format
   * 
   * @param {string} rawOutput - Raw output from Jest test execution
   * @param {Object} options - Parser-specific options
   * @returns {Object} Standardized test result object
   */
  parse(rawOutput, options = {}) {
    const mergedOptions = { ...this.options, ...options };
    
    try {
      // Try to find and parse JSON output from Jest
      const jsonMatch = rawOutput.match(/({[\s\S]*"numTotalTestSuites"[\s\S]*})/);
      
      if (!jsonMatch) {
        // If no JSON found, create a basic error result
        return this._createErrorResult('Failed to parse Jest output: No JSON data found', rawOutput);
      }
      
      const jestResults = JSON.parse(jsonMatch[1]);
      return this._convertJestResults(jestResults, mergedOptions);
    } catch (error) {
      return this._createErrorResult(`Failed to parse Jest output: ${error.message}`, rawOutput);
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
          if (test.status === 'skipped' || test.status === 'todo') {
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
   * Convert Jest results to our standardized format
   * 
   * @param {Object} jestResults - Jest test results
   * @param {Object} options - Parser options
   * @returns {Object} Standardized test results
   * @private
   */
  _convertJestResults(jestResults, options) {
    // Extract test suites
    const testSuites = this._extractTestSuites(jestResults, options);
    
    // Build summary
    const summary = {
      success: jestResults.success,
      totalTests: jestResults.numTotalTests,
      passedTests: jestResults.numPassedTests,
      failedTests: jestResults.numFailedTests,
      skippedTests: jestResults.numPendingTests,
      duration: jestResults.testResults.reduce((sum, suite) => sum + suite.perfStats.runtime, 0),
      startTime: new Date(jestResults.startTime).toISOString(),
      endTime: new Date(jestResults.startTime + jestResults.testResults.reduce((max, suite) => 
        Math.max(max, suite.perfStats.end - suite.perfStats.start), 0)).toISOString()
    };
    
    // Extract coverage if available
    const coverage = jestResults.coverageMap ? this._extractCoverage(jestResults.coverageMap) : null;
    
    // Build metadata
    const metadata = {
      framework: 'jest',
      version: jestResults.version || 'unknown',
      config: jestResults.config || {},
      environment: {
        node: process.version,
        os: process.platform
      },
      jest: {
        // Jest-specific metadata
        snapshots: jestResults.snapshot || {},
        testResults: jestResults.testResults.map(result => ({
          name: result.name,
          status: result.status,
          startTime: result.perfStats.start,
          endTime: result.perfStats.end,
          duration: result.perfStats.runtime
        }))
      }
    };
    
    return {
      summary,
      testSuites,
      ...(coverage ? { coverage } : {}),
      metadata
    };
  }
  
  /**
   * Extract test suites from Jest results
   * 
   * @param {Object} jestResults - Jest test results
   * @param {Object} options - Parser options
   * @returns {Array} Array of test suites
   * @private
   */
  _extractTestSuites(jestResults, options) {
    return jestResults.testResults.map(suite => {
      const filePath = options.normalizeFilePaths ? 
        this._normalizePath(suite.name) : suite.name;
      
      return {
        name: path.basename(filePath, path.extname(filePath)),
        filePath,
        duration: suite.perfStats.runtime,
        status: suite.status,
        tests: this._extractTests(suite, options)
      };
    });
  }
  
  /**
   * Extract tests from a Jest test suite
   * 
   * @param {Object} suite - Jest test suite
   * @param {Object} options - Parser options
   * @returns {Array} Array of tests
   * @private
   */
  _extractTests(suite, options) {
    return suite.assertionResults.map(test => {
      const result = {
        id: `${suite.name}:${test.fullName}`,
        name: test.title,
        fullName: test.fullName,
        status: test.status,
        duration: test.duration || 0,
        ancestorTitles: test.ancestorTitles || []
      };
      
      // Add line number if available
      if (test.location) {
        result.lineNumber = test.location.line;
      }
      
      // Add error information for failed tests
      if (test.status === 'failed' && test.failureMessages && test.failureMessages.length > 0) {
        result.error = this._parseErrorMessage(test.failureMessages[0]);
      }
      
      return result;
    });
  }
  
  /**
   * Parse error message from Jest
   * 
   * @param {string} errorMessage - Jest error message
   * @returns {Object} Parsed error object
   * @private
   */
  _parseErrorMessage(errorMessage) {
    // Extract error type
    const typeMatch = errorMessage.match(/Error: (.*?):/);
    const type = typeMatch ? typeMatch[1] : 'Error';
    
    // Extract message (remove stack trace)
    const message = errorMessage.split('\n')[0];
    
    // Extract diff if available
    const diffMatch = errorMessage.match(/- Expected([\s\S]*?)\\n/);
    const diff = diffMatch ? diffMatch[0] : null;
    
    return {
      message,
      stack: errorMessage,
      type,
      diff: diff
    };
  }
  
  /**
   * Extract coverage information from Jest coverage map
   * 
   * @param {Object} coverageMap - Jest coverage map
   * @returns {Object} Standardized coverage object
   * @private
   */
  _extractCoverage(coverageMap) {
    // This is a simplified implementation
    // A real implementation would need to process the coverage data more thoroughly
    const files = [];
    let statements = { total: 0, covered: 0, percentage: 0 };
    let branches = { total: 0, covered: 0, percentage: 0 };
    let functions = { total: 0, covered: 0, percentage: 0 };
    let lines = { total: 0, covered: 0, percentage: 0 };
    
    // Process each file in the coverage map
    Object.keys(coverageMap).forEach(filePath => {
      const fileCoverage = coverageMap[filePath];
      
      // Add file-level coverage
      files.push({
        path: this._normalizePath(filePath),
        statements: fileCoverage.statementCoverage || 0,
        branches: fileCoverage.branchCoverage || 0,
        functions: fileCoverage.functionCoverage || 0,
        lines: fileCoverage.lineCoverage || 0
      });
      
      // Aggregate totals
      statements.total += fileCoverage.statementMap ? Object.keys(fileCoverage.statementMap).length : 0;
      statements.covered += fileCoverage.s ? Object.values(fileCoverage.s).filter(v => v > 0).length : 0;
      
      branches.total += fileCoverage.branchMap ? Object.keys(fileCoverage.branchMap).length * 2 : 0;
      branches.covered += fileCoverage.b ? Object.values(fileCoverage.b).flat().filter(v => v > 0).length : 0;
      
      functions.total += fileCoverage.fnMap ? Object.keys(fileCoverage.fnMap).length : 0;
      functions.covered += fileCoverage.f ? Object.values(fileCoverage.f).filter(v => v > 0).length : 0;
      
      lines.total += fileCoverage.lineMap ? Object.keys(fileCoverage.lineMap).length : 0;
      lines.covered += fileCoverage.l ? Object.values(fileCoverage.l).filter(v => v > 0).length : 0;
    });
    
    // Calculate percentages
    statements.percentage = statements.total > 0 ? (statements.covered / statements.total) * 100 : 0;
    branches.percentage = branches.total > 0 ? (branches.covered / branches.total) * 100 : 0;
    functions.percentage = functions.total > 0 ? (functions.covered / functions.total) * 100 : 0;
    lines.percentage = lines.total > 0 ? (lines.covered / lines.total) * 100 : 0;
    
    return {
      statements,
      branches,
      functions,
      lines,
      files
    };
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
              name: 'Parse Jest Output',
              fullName: 'Parse Jest Output',
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
        framework: 'jest',
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

module.exports = JestTestResultParser;
