/**
 * @fileoverview Simplified version of EnhancedAIFixEngine for syntax error debugging
 */

class EnhancedAIFixEngine {
  /**
   * Constructor for EnhancedAIFixEngine
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.logger = options.logger;
    this.parser = options.parser;
    this.aiServiceConnector = options.aiServiceConnector;
    this.fixManager = options.fixManager;
    this.codebasePath = options.codebasePath || process.cwd();
    this.dryRun = options.dryRun || false;
    
    // Validate required options
    if (!this.aiServiceConnector) {
      throw new Error('AIServiceConnector is required');
    }
    
    // Log initialization
    if (this.logger) {
      this.logger.info('EnhancedAIFixEngine initialized');
    }
  }

  /**
   * Analyzes test failures and generates potential fixes using AI
   * 
   * @param {string} testOutput - Raw test output
   * @param {Array} failedTests - Array of failed test objects
   * @param {Object} parsedResults - Optional parsed test results for additional context
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeProblem(testOutput, failedTests = [], parsedResults = null) {
    try {
      if (!failedTests || failedTests.length === 0) {
        return { success: false, reason: 'No failed tests to analyze' };
      }
      
      if (this.logger) {
        this.logger.info(`Analyzing ${failedTests.length} failed tests`);
      }
      
      // Get feedback from fix manager if available
      let feedback = null;
      if (this.fixManager) {
        feedback = await this.fixManager.getFeedback(failedTests);
      }
      
      // Construct prompt for AI service
      const prompt = await this._constructPrompt(testOutput, failedTests, parsedResults, feedback);
      
      // Send request to AI service
      const aiResponse = await this.aiServiceConnector.sendRequest(prompt);
      
      // Parse AI response to extract recommendations
      const recommendations = this._parseAIResponse(aiResponse, failedTests, parsedResults);
      
      return {
        success: true,
        recommendations,
        rawResponse: aiResponse
      };
    } catch (error) {
      if (this.logger) {
        this.logger.error('Error analyzing test failures', { error: error.message });
      }
      
      return {
        success: false,
        error: error.message,
        recommendations: this._generateMockRecommendations(failedTests, parsedResults)
      };
    }
  }

  /**
   * Constructs a prompt for the AI service using test failure data
   * 
   * @param {string} testOutput - Raw test output
   * @param {Array} failedTests - Array of failed test objects
   * @param {Object} parsedResults - Optional parsed test results for additional context
   * @param {Object} feedback - Optional feedback from previous fix attempts
   * @returns {Promise<string>} - Constructed prompt
   * @private
   */
  async _constructPrompt(testOutput, failedTests, parsedResults, feedback = null) {
    // Initialize prompt sections
    const promptSections = [];
    
    // Add introduction
    promptSections.push('# Test Failure Analysis Request');
    promptSections.push('I need help fixing the following test failures. Please analyze each issue and suggest specific code fixes.');
    
    // Add instructions
    promptSections.push('## Instructions');
    promptSections.push('For each failed test, please provide:');
    promptSections.push('1. A clear explanation of what\'s causing the failure');
    promptSections.push('2. A specific code fix with the exact file path, line numbers, and code to change');
    promptSections.push('3. An explanation of why your fix will work');
    
    // Add format instructions
    promptSections.push('Format your response as follows for each test:');
    promptSections.push('### Test: [test name]');
    promptSections.push('**Problem**: [explanation of the issue]');
    promptSections.push('**Fix**: [code fix with file path and line numbers]');
    promptSections.push('**Explanation**: [why this fix works]');
    
    // Add feedback if available
    if (feedback) {
      promptSections.push('## Previous Fix Attempts');
      promptSections.push(this._formatFeedback(feedback));
    }
    
    // Add failed tests information
    promptSections.push('## Failed Tests');
    
    for (const test of failedTests) {
      promptSections.push(`### ${test.fullName || test.name || 'Unknown test'}`);
      
      // Add test details
      const details = [];
      if (test.message) details.push(`Error: ${test.message}`);
      if (test.path) details.push(`File: ${test.path}`);
      
      promptSections.push(details.join('\n'));
      
      // Add code context if available
      if (this.codeContextGenerator) {
        try {
          const context = await this.codeContextGenerator.buildComprehensiveContext(test, parsedResults);
          
          if (context.testCode) {
            promptSections.push('#### Test Code');
            promptSections.push('```javascript');
            promptSections.push(context.testCode);
            promptSections.push('```');
          }
          
          if (context.implementationCode) {
            promptSections.push('#### Implementation Code');
            promptSections.push('```javascript');
            promptSections.push(context.implementationCode);
            promptSections.push('```');
          }
        } catch (error) {
          if (this.logger) {
            this.logger.warn('Failed to build code context', { error: error.message });
          }
        }
      }
    }
    
    // Add raw test output (truncated if necessary)
    if (testOutput) {
      const maxOutputLength = 2000;
      const truncatedOutput = testOutput.length > maxOutputLength
        ? testOutput.substring(0, maxOutputLength) + '... [truncated]'
        : testOutput;
      
      promptSections.push('# Raw Test Output');
      promptSections.push('```');
      promptSections.push(truncatedOutput);
      promptSections.push('```');
    }
    
    // Join all sections and return the complete prompt
    return promptSections.join('\n\n');
  }
  
  /**
   * Formats feedback from previous fix attempts for inclusion in the prompt
   * 
   * @param {Object} feedback - Feedback object from FixManager
   * @returns {string} - Formatted feedback string
   * @private
   */
  _formatFeedback(feedback) {
    const sections = [];
    
    // Add successful patterns if available
    if (feedback.successfulPatterns && feedback.successfulPatterns.length > 0) {
      sections.push('### Successful Fix Patterns');
      sections.push('The following approaches have worked for similar issues:');
      
      feedback.successfulPatterns.forEach((pattern, index) => {
        sections.push(`${index + 1}. ${pattern.description || 'Unknown pattern'}`);
        if (pattern.example) {
          sections.push('```javascript');
          sections.push(pattern.example);
          sections.push('```');
        }
      });
    }
    
    // Add failed attempts if available
    if (feedback.failedAttempts && feedback.failedAttempts.length > 0) {
      sections.push('### Failed Approaches');
      sections.push('The following approaches did NOT work and should be avoided:');
      
      feedback.failedAttempts.forEach((attempt, index) => {
        sections.push(`${index + 1}. ${attempt.description || 'Unknown attempt'}`);
        if (attempt.reason) {
          sections.push(`   Reason: ${attempt.reason}`);
        }
        if (attempt.code) {
          sections.push('```javascript');
          sections.push(attempt.code);
          sections.push('```');
        }
      });
    }
    
    return sections.join('\n');
  }
  
  /**
   * Parses the AI response to extract recommendations
   * 
   * @param {Object} aiResponse - The AI response object
   * @param {Array} failedTests - Array of failed test objects
   * @param {Object} parsedResults - Optional parsed test results for additional context
   * @returns {Array} - Extracted recommendations
   * @private
   */
  _parseAIResponse(aiResponse, failedTests = [], parsedResults = null) {
    if (!aiResponse || !aiResponse.text) {
      return [];
    }
    
    try {
      // Simple mock implementation for the simplified version
      return this._generateMockRecommendations(failedTests, parsedResults);
    } catch (error) {
      if (this.logger) {
        this.logger.warn('Could not extract recommendations from AI response, falling back to mock recommendations');
      }
      return this._generateMockRecommendations(failedTests, parsedResults);
    }
  }
  
  /**
   * Generates mock recommendations for testing
   * 
   * @param {Array} failedTests - Array of failed test objects
   * @param {Object} parsedResults - Optional parsed test results for additional context
   * @returns {Array} - Array of mock recommendations
   * @private
   */
  _generateMockRecommendations(failedTests, parsedResults = null) {
    const recommendations = [];
    
    for (const test of failedTests) {
      recommendations.push({
        test: test.fullName || test.name,
        problem: 'Mock problem description',
        fix: {
          filePath: test.path || 'unknown/path.js',
          lineNumber: 10,
          code: '// Fixed code would go here'
        },
        explanation: 'Mock explanation of the fix'
      });
    }
    
    return recommendations;
  }
}

module.exports = { EnhancedAIFixEngine };
