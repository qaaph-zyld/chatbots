/**
 * AI Fix Engine
 * 
 * A lightweight AI-powered test fix generator that uses open-source models
 * to analyze test failures and generate appropriate fixes.
 * 
 * Integrates with LLMModelConnector for AI model interaction and
 * AIFeedbackLoop for continuous learning from fix attempts.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const LLMModelConnector = require('./LLMModelConnector');
const AIFeedbackLoop = require('./AIFeedbackLoop');

// Convert fs functions to promises
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const mkdir = util.promisify(fs.mkdir);
const access = util.promisify(fs.access);

/**
 * AI Fix Engine class
 */
class AIFixEngine {
  /**
   * Constructor for the AIFixEngine
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      knowledgeBasePath: options.knowledgeBasePath || path.join(process.cwd(), 'test-results', 'ai-knowledge-base'),
      modelType: options.modelType || 'local', // 'local', 'huggingface', or 'custom'
      modelEndpoint: options.modelEndpoint || process.env.AI_MODEL_ENDPOINT || 'http://localhost:8080/generate',
      huggingFaceToken: options.huggingFaceToken || process.env.HUGGINGFACE_TOKEN || '',
      modelName: options.modelName || 'codellama/CodeLlama-7b-Instruct-hf',
      maxTokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.2,
      enableCache: options.enableCache !== false,
      learningRate: options.learningRate || 0.1,
      logger: options.logger || console
    };

    this.knowledgeBase = {
      fixes: [],
      statistics: {
        totalAttempts: 0,
        successfulFixes: 0
      }
    };
    
    // Initialize model connector and feedback loop
    this.modelConnector = options.modelConnector || new LLMModelConnector({
      modelType: this.options.modelType,
      modelEndpoint: this.options.modelEndpoint,
      huggingFaceToken: this.options.huggingFaceToken,
      modelName: this.options.modelName,
      maxTokens: this.options.maxTokens,
      temperature: this.options.temperature,
      enableCache: this.options.enableCache,
      cachePath: path.join(this.options.knowledgeBasePath, 'model-cache'),
      logger: this.options.logger
    });
    
    this.feedbackLoop = options.feedbackLoop || new AIFeedbackLoop({
      feedbackPath: path.join(this.options.knowledgeBasePath, 'feedback'),
      learningRate: this.options.learningRate,
      logger: this.options.logger
    });
  }
  
  /**
   * Initialize the AI Fix Engine
   */
  async initialize() {
    try {
      await this.ensureKnowledgeBaseDirectory();
      await this.loadKnowledgeBase();
      
      // Initialize model connector and feedback loop
      await Promise.all([
        this.modelConnector.initializeCache && this.modelConnector.initializeCache(),
        this.feedbackLoop.initialize && this.feedbackLoop.initialize()
      ]);
      
      this.options.logger.info('AI Fix Engine initialized successfully');
      return true;
    } catch (error) {
      this.options.logger.error('Failed to initialize AI Fix Engine:', error);
      return false;
    }
  }
  
  /**
   * Ensure the knowledge base directory exists
   */
  async ensureKnowledgeBaseDirectory() {
    try {
      await access(this.options.knowledgeBasePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await mkdir(this.options.knowledgeBasePath, { recursive: true });
        this.options.logger.info(`Created knowledge base directory: ${this.options.knowledgeBasePath}`);
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Load the knowledge base from disk
   */
  async loadKnowledgeBase() {
    const knowledgeBasePath = path.join(this.options.knowledgeBasePath, 'knowledge-base.json');
    
    try {
      await access(knowledgeBasePath);
      const data = await readFile(knowledgeBasePath, 'utf8');
      this.knowledgeBase = JSON.parse(data);
      this.options.logger.info(`Loaded knowledge base with ${this.knowledgeBase.fixes.length} fixes`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.options.logger.info('No existing knowledge base found, creating a new one');
        await this.saveKnowledgeBase();
      } else {
        this.options.logger.error('Error loading knowledge base:', error);
      }
    }
  }
  
  /**
   * Save the knowledge base to disk
   */
  async saveKnowledgeBase() {
    const knowledgeBasePath = path.join(this.options.knowledgeBasePath, 'knowledge-base.json');
    
    try {
      await writeFile(knowledgeBasePath, JSON.stringify(this.knowledgeBase, null, 2));
      this.options.logger.info('Knowledge base saved successfully');
    } catch (error) {
      this.options.logger.error('Error saving knowledge base:', error);
    }
  }
  
  /**
   * Determine the type of failure based on error message and stack trace
   * @param {Object} failure - The test failure object
   * @returns {string} - The failure type
   */
  determineFailureType(failure) {
    const { errorMessage, stackTrace } = failure;
    
    // Check for syntax errors
    if (errorMessage && errorMessage.includes('SyntaxError')) {
      return 'syntax-error';
    }
    
    // Check for timeout errors
    if (errorMessage && (
      errorMessage.includes('timeout') || 
      errorMessage.includes('Timeout') ||
      errorMessage.includes('timed out')
    )) {
      return 'timeout';
    }
    
    // Check for dependency errors
    if (errorMessage && (
      errorMessage.includes('Cannot find module') ||
      errorMessage.includes('Module not found')
    )) {
      return 'dependency-error';
    }
    
    // Check for network errors
    if (errorMessage && (
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('network error')
    )) {
      return 'network-error';
    }
    
    // Check for assertion failures
    if (errorMessage && (
      errorMessage.includes('expect(') ||
      errorMessage.includes('Expected') ||
      errorMessage.includes('AssertionError') ||
      errorMessage.includes('to be') ||
      errorMessage.includes('to equal') ||
      errorMessage.includes('to have been called') ||
      errorMessage.includes('to contain') ||
      errorMessage.includes('to match')
    )) {
      return 'assertion-failure';
    }
    
    // Default to unknown
    return 'unknown';
  }
  
  /**
   * Analyze a test failure and generate a fix
   * @param {Object} failure - Test failure information
   * @returns {Promise<Object>} - Generated fix information
   */
  async analyzeProblem(failure) {
    this.options.logger.info(`Analyzing problem for test: ${failure.testName}`);
    
    try {
      // Determine the failure type
      const failureType = this.determineFailureType(failure);
      this.options.logger.info(`Determined failure type: ${failureType}`);
      
      // Add failure type to the failure object for context
      failure.errorType = failureType;
      
      // Check if we have a similar failure in the knowledge base
      const existingFix = this.findSimilarFix(failure, failureType);
      
      if (existingFix && existingFix.successRate > 0.7) {
        this.options.logger.info('Found high-confidence fix in knowledge base');
        return {
          fixStrategy: existingFix.fixStrategy,
          fixCode: existingFix.fixCode,
          confidence: existingFix.successRate,
          source: 'knowledge-base',
          errorType: failureType,
          testName: failure.testName,
          filePath: failure.filePath
        };
      }
      
      // Get similar successful fixes from feedback loop
      const similarFixes = this.feedbackLoop.getSimilarSuccessfulFixes(failureType, 1);
      if (similarFixes.length > 0 && !existingFix) {
        this.options.logger.info('Found similar successful fix in feedback history');
        const bestFix = similarFixes[0];
        return {
          fixStrategy: bestFix.fixStrategy || failureType,
          fixCode: bestFix.fixCode,
          confidence: 0.8,
          source: 'feedback-history',
          errorType: failureType,
          testName: failure.testName,
          filePath: failure.filePath
        };
      }
      
      // Generate a fix using the AI model
      const fix = await this.generateFix(failure, failureType);
      
      return {
        fixStrategy: failureType,
        fixCode: fix.code,
        confidence: fix.confidence,
        source: 'ai-generated',
        errorType: failureType,
        testName: failure.testName,
        filePath: failure.filePath
      };
    } catch (error) {
      this.options.logger.error('Error analyzing problem:', error);
      return {
        fixStrategy: 'error',
        fixCode: null,
        confidence: 0,
        source: 'error',
        error: error.message,
        errorType: 'analysis-error',
        testName: failure.testName,
        filePath: failure.filePath
      };
    }
  }
  
  /**
   * Find a similar fix in the knowledge base
   * @param {Object} failure - Test failure information
   * @param {string} failureType - Type of failure
   * @returns {Object|null} - Similar fix or null if not found
   */
  findSimilarFix(failure, failureType) {
    // Simple implementation for now
    return this.knowledgeBase.fixes.find(fix => 
      fix.failureType === failureType && 
      fix.errorPattern && 
      failure.errorMessage && 
      failure.errorMessage.includes(fix.errorPattern)
    );
  }
  
  /**
   * Generate a fix for a test failure
   * @param {Object} failure - Test failure information
   * @param {string} failureType - Type of failure
   * @returns {Promise<Object>} - Generated fix
   */
  async generateFix(failure, failureType) {
    this.options.logger.info(`Generating fix for ${failureType} failure`);
    
    try {
      // Get pattern weight from feedback loop for this failure type and strategy
      const patternWeight = this.feedbackLoop.getPatternWeight(failureType, failure.errorMessage || 'unknown');
      
      // Get similar successful fixes from feedback loop
      const similarFixes = this.feedbackLoop.getSimilarSuccessfulFixes(failureType, 3);
      
      // Enhance failure object with additional context for the model
      const enhancedFailure = {
        ...failure,
        failureType,
        similarFixes: similarFixes.map(fix => fix.fixCode).join('\n\n'),
        patternWeight
      };
      
      // Use the model connector to generate a fix
      const generatedFix = await this.modelConnector.generateFix(enhancedFailure);
      
      // Adjust confidence based on pattern weight
      const adjustedConfidence = generatedFix.confidence * patternWeight;
      
      return {
        code: generatedFix.code,
        confidence: adjustedConfidence,
        fixStrategy: failureType
      };
    } catch (error) {
      this.options.logger.error('Error generating fix with AI model:', error);
      
      // Fallback to a simple placeholder fix
      return {
        code: `// Auto-generated fix for ${failureType}\n// TODO: Implement actual fix\n// Error occurred: ${error.message}\n`,
        confidence: 0.1,
        fixStrategy: failureType
      };
    }
  }
  
  /**
   * Apply a fix to a failing test
   * @param {Object} fix - Fix information
   * @returns {Promise<Object>} - Result of applying the fix
   */
  async applyFix(fix) {
    this.options.logger.info(`Applying fix to file: ${fix.filePath}`);
    
    try {
      // Read the current file content
      const currentContent = await readFile(fix.filePath, 'utf8');
      
      // Apply the fix (simple implementation)
      let updatedContent;
      
      if (fix.lineNumber) {
        // If we have a specific line number, replace that line
        const lines = currentContent.split('\n');
        lines[fix.lineNumber - 1] = fix.fixCode;
        updatedContent = lines.join('\n');
      } else if (fix.pattern) {
        // If we have a pattern, replace that pattern
        updatedContent = currentContent.replace(fix.pattern, fix.fixCode);
      } else {
        // Otherwise, just append the fix at the end
        updatedContent = currentContent + '\n' + fix.fixCode;
      }
      
      // Write the updated content back to the file
      await writeFile(fix.filePath, updatedContent);
      
      // Update knowledge base statistics
      this.knowledgeBase.statistics.totalAttempts++;
      
      return {
        success: true,
        filePath: fix.filePath,
        message: 'Fix applied successfully'
      };
    } catch (error) {
      this.options.logger.error('Error applying fix:', error);
      return {
        success: false,
        filePath: fix.filePath,
        error: error.message
      };
    }
  }
  
  /**
   * Record feedback on a fix
   * @param {Object} fix - Fix information
   * @param {boolean} wasSuccessful - Whether the fix was successful
   * @param {Object} testResult - Test result after applying the fix
   */
  async recordFixFeedback(fix, wasSuccessful, testResult = {}) {
    this.options.logger.info(`Recording fix feedback: ${wasSuccessful ? 'successful' : 'failed'}`);
    
    // Record feedback in the feedback loop system
    await this.feedbackLoop.recordFeedback({
      fixStrategy: fix.fixStrategy,
      fixCode: fix.fixCode,
      errorType: fix.errorType || 'unknown',
      testName: fix.testName || 'unknown',
      errorPattern: fix.errorPattern || null
    }, wasSuccessful, testResult);
    
    // Find if we already have this fix in the knowledge base
    const existingFixIndex = this.knowledgeBase.fixes.findIndex(
      f => f.fixStrategy === fix.fixStrategy && f.fixCode === fix.fixCode
    );
    
    if (existingFixIndex >= 0) {
      // Update existing fix statistics
      const existingFix = this.knowledgeBase.fixes[existingFixIndex];
      existingFix.attempts++;
      if (wasSuccessful) {
        existingFix.successes++;
      }
      existingFix.successRate = existingFix.successes / existingFix.attempts;
    } else {
      // Add new fix to knowledge base
      this.knowledgeBase.fixes.push({
        fixStrategy: fix.fixStrategy,
        fixCode: fix.fixCode,
        errorPattern: fix.errorPattern || null,
        attempts: 1,
        successes: wasSuccessful ? 1 : 0,
        successRate: wasSuccessful ? 1 : 0,
        timestamp: new Date().toISOString()
      });
    }
    
    // Update overall statistics
    if (wasSuccessful) {
      this.knowledgeBase.statistics.successfulFixes++;
    }
    
    // Save the updated knowledge base
    await this.saveKnowledgeBase();
    
    // Generate and save metrics report if successful
    if (wasSuccessful) {
      await this.feedbackLoop.saveMetricsReport();
    }
  }
}

module.exports = AIFixEngine;
