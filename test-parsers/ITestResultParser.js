/**
 * @fileoverview Interface definition for test result parsers.
 * 
 * This file defines the interface that all test result parsers must implement.
 * Each test framework (Jest, Mocha, etc.) will have its own implementation
 * that conforms to this interface.
 */

/**
 * Interface for test result parsers.
 * All test framework parsers must implement these methods.
 */
class ITestResultParser {
  /**
   * Parse raw test output into a standardized format
   * 
   * @param {string} rawOutput - Raw output from test execution
   * @param {Object} options - Parser-specific options
   * @returns {Object} Standardized test result object
   */
  parse(rawOutput, options = {}) {
    throw new Error('Method not implemented: parse()');
  }
  
  /**
   * Extract failed tests from parsed results
   * 
   * @param {Object} parsedResults - Results from parse() method
   * @returns {Array<Object>} Array of failed test objects
   */
  getFailedTests(parsedResults) {
    throw new Error('Method not implemented: getFailedTests()');
  }
  
  /**
   * Extract passed tests from parsed results
   * 
   * @param {Object} parsedResults - Results from parse() method
   * @returns {Array<Object>} Array of passed test objects
   */
  getPassedTests(parsedResults) {
    throw new Error('Method not implemented: getPassedTests()');
  }
  
  /**
   * Extract skipped tests from parsed results
   * 
   * @param {Object} parsedResults - Results from parse() method
   * @returns {Array<Object>} Array of skipped test objects
   */
  getSkippedTests(parsedResults) {
    throw new Error('Method not implemented: getSkippedTests()');
  }
  
  /**
   * Get summary statistics from parsed results
   * 
   * @param {Object} parsedResults - Results from parse() method
   * @returns {Object} Summary statistics object
   */
  getSummary(parsedResults) {
    throw new Error('Method not implemented: getSummary()');
  }
  
  /**
   * Check if the test run was successful overall
   * 
   * @param {Object} parsedResults - Results from parse() method
   * @returns {boolean} True if all tests passed, false otherwise
   */
  isSuccessful(parsedResults) {
    throw new Error('Method not implemented: isSuccessful()');
  }
  
  /**
   * Get detailed error information for a specific test
   * 
   * @param {Object} test - Test object from getFailedTests()
   * @param {Object} parsedResults - Results from parse() method
   * @returns {Object} Detailed error information
   */
  getErrorDetails(test, parsedResults) {
    throw new Error('Method not implemented: getErrorDetails()');
  }
  
  /**
   * Get file path information for a specific test
   * 
   * @param {Object} test - Test object from any get*Tests() method
   * @param {Object} parsedResults - Results from parse() method
   * @returns {string} File path where the test is defined
   */
  getTestFilePath(test, parsedResults) {
    throw new Error('Method not implemented: getTestFilePath()');
  }
}

module.exports = ITestResultParser;
