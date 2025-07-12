/**
 * ResultAnalyzer - Responsible for parsing and analyzing test execution results
 * 
 * This class extracts the test result analysis logic from TestAutomationRunner
 * to improve maintainability and separation of concerns.
 */

const path = require('path');
const fs = require('fs');
const stripAnsi = require('strip-ansi');

class ResultAnalyzer {
  /**
   * Creates a new ResultAnalyzer instance
   * 
   * @param {Object} options - Configuration options
   * @param {Object} options.parser - Test result parser instance
   * @param {Object} options.logger - Logger instance (optional)
   */
  constructor(options = {}) {
    this.parser = options.parser;
    this.logger = options.logger;
    this.networkErrorPatterns = [
      /ENOTFOUND/i,
      /ECONNREFUSED/i,
      /ETIMEDOUT/i,
      /ECONNRESET/i,
      /network\s+error/i,
      /certificate\s+has\s+expired/i,
      /unable\s+to\s+resolve\s+host/i,
      /proxy\s+connection\s+failed/i,
      /socket\s+hang\s+up/i,
      /TLS\s+handshake\s+timeout/i
    ];
    
    this.corporateProxyPatterns = [
      /proxy\s+authentication\s+required/i,
      /407\s+proxy\s+authentication\s+required/i,
      /blocked\s+by\s+network\s+policy/i,
      /firewall\s+block/i
    ];
  }
  
  /**
   * Gets parsed test results using the configured parser
   * 
   * @param {Object} testResult - Raw test execution result
   * @returns {Object|null} - Parsed test results or null if parsing failed
   */
  getParsedResults(testResult) {
    if (!this.parser) {
      if (this.logger) {
        this.logger.warn('No test parser configured');
      } else {
        console.warn('No test parser configured');
      }
      return null;
    }
    
    try {
      const output = testResult.stdout || '';
      const results = this.parser.parse(output);
      
      if (this.logger) {
        this.logger.info('Test results parsed successfully', {
          totalTests: results.totalTests,
          passedTests: results.passedTests?.length || 0,
          failedTests: results.failedTests?.length || 0,
          skippedTests: results.skippedTests?.length || 0
        });
      }
      
      return results;
    } catch (error) {
      if (this.logger) {
        this.logger.error('Failed to parse test results', { error: error.toString() });
      } else {
        console.error('Failed to parse test results:', error.message);
      }
      
      return null;
    }
  }
  
  /**
   * Gets test summary information
   * 
   * @param {Object} testResult - Raw test execution result
   * @returns {Object} - Test summary information
   */
  getTestSummary(testResult) {
    const parsedResults = this.getParsedResults(testResult);
    
    if (parsedResults) {
      return {
        totalTests: parsedResults.totalTests || 0,
        passedTests: parsedResults.passedTests?.length || 0,
        failedTests: parsedResults.failedTests?.length || 0,
        skippedTests: parsedResults.skippedTests?.length || 0,
        duration: parsedResults.duration || testResult.duration || 0
      };
    }
    
    // If parsing failed, try to extract basic information from stdout
    const output = stripAnsi(testResult.stdout || '');
    const failedMatch = output.match(/(\d+)\s+failed/i);
    const passedMatch = output.match(/(\d+)\s+passed/i);
    const skippedMatch = output.match(/(\d+)\s+skipped/i);
    const totalMatch = output.match(/(\d+)\s+total/i);
    
    return {
      totalTests: totalMatch ? parseInt(totalMatch[1], 10) : 0,
      passedTests: passedMatch ? parseInt(passedMatch[1], 10) : 0,
      failedTests: failedMatch ? parseInt(failedMatch[1], 10) : 0,
      skippedTests: skippedMatch ? parseInt(skippedMatch[1], 10) : 0,
      duration: testResult.duration || 0
    };
  }
  
  /**
   * Extracts failed tests from test execution result
   * 
   * @param {Object} testResult - Test execution result
   * @returns {Array} - Array of failed test objects
   */
  extractFailedTests(testResult) {
    const parsedResults = this.getParsedResults(testResult);
    
    if (parsedResults && parsedResults.failedTests) {
      return parsedResults.failedTests;
    }
    
    // If parsing failed or no failed tests were found, return empty array
    return [];
  }
  
  /**
   * Detects if an error is related to network or corporate proxy blocks
   * 
   * @param {Error|Object} errorObj - Error object to analyze
   * @returns {boolean} - True if the error is network-related
   */
  isNetworkBlockedError(errorObj) {
    if (!errorObj) {
      return false;
    }
    
    const errorString = errorObj.error?.toString() || 
                        errorObj.stderr || 
                        errorObj.stdout || 
                        errorObj.message || 
                        errorObj.toString();
    
    // Check for network error patterns
    for (const pattern of this.networkErrorPatterns) {
      if (pattern.test(errorString)) {
        return true;
      }
    }
    
    // Check for corporate proxy block patterns
    for (const pattern of this.corporateProxyPatterns) {
      if (pattern.test(errorString)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Extracts error message for a test failure
   * 
   * @param {string} stdout - Test output
   * @param {number} failureIndex - Index of failure in stdout
   * @returns {string} - Extracted error message
   */
  extractErrorMessage(stdout, failureIndex) {
    if (!stdout) {
      return 'No output available';
    }
    
    // Clean ANSI color codes
    const cleanOutput = stripAnsi(stdout);
    
    // Try to find error messages using common patterns
    const errorPatterns = [
      /Error:\s*(.*?)(?:\n|$)/i,
      /AssertionError:\s*(.*?)(?:\n|$)/i,
      /FAIL\s*(.*?)(?:\n|$)/i,
      /failed:?\s*(.*?)(?:\n|$)/i
    ];
    
    // Split output into lines
    const lines = cleanOutput.split('\n');
    
    // Start searching from the beginning if failureIndex is not provided
    const startIndex = failureIndex && failureIndex > 0 ? failureIndex : 0;
    
    // Look for error patterns in lines starting from failureIndex
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of errorPatterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }
    
    // If no specific error message found, return a generic message
    return 'Test failed without specific error message';
  }
  
  /**
   * Categorizes test failures by type
   * 
   * @param {Array} failedTests - Array of failed test objects
   * @returns {Object} - Categorized failures
   */
  categorizeFailures(failedTests) {
    if (!failedTests || failedTests.length === 0) {
      return {
        syntaxErrors: [],
        assertionFailures: [],
        timeouts: [],
        networkErrors: [],
        other: []
      };
    }
    
    const categories = {
      syntaxErrors: [],
      assertionFailures: [],
      timeouts: [],
      networkErrors: [],
      other: []
    };
    
    for (const test of failedTests) {
      const errorMessage = test.errorMessage || test.message || '';
      
      if (/syntax\s+error|unexpected\s+token|cannot\s+read\s+property|is\s+not\s+defined|is\s+not\s+a\s+function/i.test(errorMessage)) {
        categories.syntaxErrors.push(test);
      } else if (/assert|expect|should|to\s+be|to\s+equal|to\s+have|to\s+contain/i.test(errorMessage)) {
        categories.assertionFailures.push(test);
      } else if (/timeout|timed\s+out|took\s+longer\s+than/i.test(errorMessage)) {
        categories.timeouts.push(test);
      } else if (this.isNetworkBlockedError({ message: errorMessage })) {
        categories.networkErrors.push(test);
      } else {
        categories.other.push(test);
      }
    }
    
    return categories;
  }
}

module.exports = ResultAnalyzer;
