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
    const { errorMessage, stackTrace, testName, filePath } = failure;
    
    // Error patterns organized by type for better maintainability
    const errorPatterns = {
      'syntax-error': [
        { pattern: 'SyntaxError', weight: 1.0 },
        { pattern: 'Unexpected token', weight: 1.0 },
        { pattern: 'Unexpected identifier', weight: 1.0 },
        { pattern: 'Invalid or unexpected token', weight: 1.0 },
        { pattern: 'Missing', weight: 0.8 },
        { pattern: 'Unterminated', weight: 0.9 }
      ],
      'reference-error': [
        { pattern: 'ReferenceError', weight: 1.0 },
        { pattern: 'is not defined', weight: 1.0 },
        { pattern: 'Cannot access', weight: 0.9 },
        { pattern: 'before initialization', weight: 0.9 }
      ],
      'type-error': [
        { pattern: 'TypeError', weight: 1.0 },
        { pattern: 'is not a function', weight: 1.0 },
        { pattern: 'is not iterable', weight: 1.0 },
        { pattern: 'Cannot read property', weight: 1.0 },
        { pattern: 'Cannot read properties', weight: 1.0 },
        { pattern: 'null', weight: 0.7 },
        { pattern: 'undefined', weight: 0.7 }
      ],
      'timeout': [
        { pattern: 'timeout', weight: 0.9 },
        { pattern: 'Timeout', weight: 0.9 },
        { pattern: 'timed out', weight: 1.0 },
        { pattern: 'Async callback was not invoked', weight: 0.8 },
        { pattern: 'Jest did not exit', weight: 0.7 }
      ],
      'dependency-error': [
        { pattern: 'Cannot find module', weight: 1.0 },
        { pattern: 'Module not found', weight: 1.0 },
        { pattern: 'Failed to resolve', weight: 0.8 },
        { pattern: 'ERR_REQUIRE_ESM', weight: 0.9 },
        { pattern: 'ERR_MODULE_NOT_FOUND', weight: 1.0 },
        { pattern: 'package.json', weight: 0.6 }
      ],
      'network-error': [
        { pattern: 'ECONNREFUSED', weight: 1.0 },
        { pattern: 'ENOTFOUND', weight: 1.0 },
        { pattern: 'network error', weight: 0.9 },
        { pattern: 'fetch failed', weight: 0.8 },
        { pattern: 'socket hang up', weight: 0.8 },
        { pattern: 'ETIMEDOUT', weight: 0.9 },
        { pattern: 'ECONNRESET', weight: 0.9 }
      ],
      'assertion-failure': [
        { pattern: 'expect(', weight: 0.9 },
        { pattern: 'Expected', weight: 0.8 },
        { pattern: 'AssertionError', weight: 1.0 },
        { pattern: 'to be', weight: 0.7 },
        { pattern: 'to equal', weight: 0.8 },
        { pattern: 'to have been called', weight: 0.9 },
        { pattern: 'to contain', weight: 0.8 },
        { pattern: 'to match', weight: 0.8 },
        { pattern: 'to throw', weight: 0.9 },
        { pattern: 'to have length', weight: 0.9 },
        { pattern: 'to have property', weight: 0.9 },
        { pattern: 'to be truthy', weight: 0.9 },
        { pattern: 'to be falsy', weight: 0.9 },
        { pattern: 'to be null', weight: 0.9 },
        { pattern: 'to be undefined', weight: 0.9 },
        { pattern: 'to be NaN', weight: 0.9 },
        { pattern: 'received', weight: 0.6 }
      ],
      'permission-error': [
        { pattern: 'EACCES', weight: 1.0 },
        { pattern: 'permission denied', weight: 1.0 },
        { pattern: 'EPERM', weight: 1.0 }
      ],
      'file-system-error': [
        { pattern: 'ENOENT', weight: 1.0 },
        { pattern: 'no such file', weight: 1.0 },
        { pattern: 'directory', weight: 0.6 },
        { pattern: 'EISDIR', weight: 0.9 },
        { pattern: 'ENOTDIR', weight: 0.9 },
        { pattern: 'EMFILE', weight: 0.9 }
      ],
      'memory-error': [
        { pattern: 'heap', weight: 0.8 },
        { pattern: 'memory', weight: 0.7 },
        { pattern: 'stack overflow', weight: 1.0 },
        { pattern: 'allocation failed', weight: 0.9 },
        { pattern: 'FATAL ERROR: Ineffective mark-compacts', weight: 1.0 }
      ],
      'runtime-error': [
        { pattern: 'Runtime error', weight: 0.9 },
        { pattern: 'Uncaught exception', weight: 0.8 }
      ]
    };
    
    // No error message to analyze
    if (!errorMessage) {
      return this.inferErrorTypeFromContext(failure);
    }
    
    // Calculate scores for each error type
    const scores = {};
    
    for (const [errorType, patterns] of Object.entries(errorPatterns)) {
      scores[errorType] = 0;
      
      for (const { pattern, weight } of patterns) {
        if (errorMessage.includes(pattern)) {
          scores[errorType] += weight;
        }
      }
      
      // Check stack trace for additional clues if available
      if (stackTrace) {
        for (const { pattern, weight } of patterns) {
          if (stackTrace.includes(pattern)) {
            // Stack trace matches are weighted less than error message matches
            scores[errorType] += weight * 0.5;
          }
        }
      }
    }
    
    // Find the error type with the highest score
    let highestScore = 0;
    let detectedErrorType = 'unknown';
    
    for (const [errorType, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        detectedErrorType = errorType;
      }
    }
    
    // If score is too low, try to infer from context
    if (highestScore < 0.5) {
      const inferredType = this.inferErrorTypeFromContext(failure);
      if (inferredType !== 'unknown') {
        return inferredType;
      }
    }
    
    return detectedErrorType;
  }
  
  /**
   * Infer error type from test context when error message is ambiguous
   * @param {Object} failure - The test failure object
   * @returns {string} - The inferred failure type
   */
  inferErrorTypeFromContext(failure) {
    const { testName, filePath, testCode } = failure;
    
    // Check test name for clues
    if (testName) {
      const testNameLower = testName.toLowerCase();
      
      if (testNameLower.includes('api') || testNameLower.includes('http') || 
          testNameLower.includes('request') || testNameLower.includes('fetch')) {
        return 'network-error';
      }
      
      if (testNameLower.includes('timeout') || testNameLower.includes('async') || 
          testNameLower.includes('wait') || testNameLower.includes('delay')) {
        return 'timeout';
      }
      
      if (testNameLower.includes('file') || testNameLower.includes('path') || 
          testNameLower.includes('directory') || testNameLower.includes('fs')) {
        return 'file-system-error';
      }
      
      if (testNameLower.includes('assert') || testNameLower.includes('expect') || 
          testNameLower.includes('should') || testNameLower.includes('must')) {
        return 'assertion-failure';
      }
    }
    
    // Check file path for clues
    if (filePath) {
      const filePathLower = filePath.toLowerCase();
      
      if (filePathLower.includes('api') || filePathLower.includes('http') || 
          filePathLower.includes('request') || filePathLower.includes('client')) {
        return 'network-error';
      }
      
      if (filePathLower.includes('fs') || filePathLower.includes('file') || 
          filePathLower.includes('storage')) {
        return 'file-system-error';
      }
    }
    
    // Check test code for clues if available
    if (testCode) {
      if (testCode.includes('expect(') || testCode.includes('assert.') || 
          testCode.includes('should.') || testCode.includes('test(')) {
        return 'assertion-failure';
      }
      
      if (testCode.includes('setTimeout') || testCode.includes('setInterval') || 
          testCode.includes('await') || testCode.includes('async')) {
        return 'timeout';
      }
      
      if (testCode.includes('require(') || testCode.includes('import ')) {
        return 'dependency-error';
      }
    }
    
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
      const similarFixes = this.feedbackLoop.getSimilarSuccessfulFixes(failureType, 5);
      
      // Get historical fix success rates for this error type
      const historicalSuccessRates = this.getHistoricalSuccessRates(failureType);
      
      // Extract code patterns from the test and implementation files
      const codePatterns = this.extractCodePatterns(failure);
      
      // Determine the best fix strategy based on failure type and historical data
      const fixStrategy = this.determineBestFixStrategy(failureType, historicalSuccessRates, failure);
      
      // Enhance failure object with additional context for the model
      const enhancedFailure = {
        ...failure,
        failureType,
        fixStrategy,
        similarFixes: similarFixes.map(fix => fix.fixCode).join('\n\n'),
        patternWeight,
        codePatterns,
        historicalSuccessRates: JSON.stringify(historicalSuccessRates)
      };
      
      // Use the model connector to generate a fix
      const generatedFix = await this.modelConnector.generateFix(enhancedFailure);
      
      // Apply post-processing to improve the generated fix
      const processedFix = this.postProcessFix(generatedFix.code, failure, failureType);
      
      // Validate the fix syntax before returning
      const validatedFix = await this.validateFixSyntax(processedFix, failure.filePath);
      
      // Adjust confidence based on pattern weight and validation results
      let adjustedConfidence = generatedFix.confidence * patternWeight;
      if (!validatedFix.valid) {
        adjustedConfidence *= 0.5; // Reduce confidence for invalid syntax
      }
      
      return {
        code: validatedFix.valid ? processedFix : validatedFix.safeCode,
        confidence: adjustedConfidence,
        fixStrategy,
        validationMessages: validatedFix.messages || [],
        appliedStrategies: validatedFix.valid ? ['ai-generated', fixStrategy] : ['ai-generated', 'syntax-corrected', fixStrategy]
      };
    } catch (error) {
      this.options.logger.error('Error generating fix with AI model:', error);
      
      // Try to generate a fallback fix based on similar patterns
      const fallbackFix = this.generateFallbackFix(failure, failureType);
      
      if (fallbackFix) {
        return {
          code: fallbackFix.code,
          confidence: fallbackFix.confidence,
          fixStrategy: 'fallback-pattern',
          appliedStrategies: ['fallback-pattern', failureType]
        };
      }
      
      // Last resort fallback to a simple placeholder fix
      return {
        code: `// Auto-generated fix for ${failureType}\n// TODO: Implement actual fix\n// Error occurred: ${error.message}\n`,
        confidence: 0.1,
        fixStrategy: failureType,
        appliedStrategies: ['placeholder', failureType]
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
   * Get historical success rates for a specific failure type
   * @param {string} failureType - Type of failure
   * @returns {Object} - Historical success rates
   */
  getHistoricalSuccessRates(failureType) {
    const rates = {};
    
    // Get all fixes for this failure type
    const relevantFixes = this.knowledgeBase.fixes.filter(fix => fix.errorType === failureType);
    
    // Calculate success rates by strategy
    relevantFixes.forEach(fix => {
      if (!rates[fix.fixStrategy]) {
        rates[fix.fixStrategy] = {
          attempts: 0,
          successes: 0,
          successRate: 0
        };
      }
      
      rates[fix.fixStrategy].attempts += fix.attempts || 0;
      rates[fix.fixStrategy].successes += fix.successes || 0;
      
      if (rates[fix.fixStrategy].attempts > 0) {
        rates[fix.fixStrategy].successRate = 
          rates[fix.fixStrategy].successes / rates[fix.fixStrategy].successRate;
      }
    });
    
    return rates;
  }
  
  /**
   * Extract code patterns from test failure
   * @param {Object} failure - Test failure information
   * @returns {Array} - Extracted code patterns
   */
  extractCodePatterns(failure) {
    const patterns = [];
    
    // Extract patterns from test code if available
    if (failure.testCode) {
      // Extract import/require statements
      const importMatches = failure.testCode.match(/import\s+.*?from\s+['"].*?['"];?|require\(['"].*?['"]\)/g) || [];
      patterns.push(...importMatches);
      
      // Extract function/class definitions
      const functionMatches = failure.testCode.match(/function\s+\w+\s*\(.*?\)\s*\{|class\s+\w+\s*(extends\s+\w+)?\s*\{/g) || [];
      patterns.push(...functionMatches);
      
      // Extract assertion patterns
      const assertionMatches = failure.testCode.match(/expect\(.*?\)\.\w+\(.*?\)/g) || [];
      patterns.push(...assertionMatches);
    }
    
    // Extract patterns from error message if available
    if (failure.errorMessage) {
      // Extract line references
      const lineMatches = failure.errorMessage.match(/line\s+\d+/g) || [];
      patterns.push(...lineMatches);
      
      // Extract quoted code snippets
      const snippetMatches = failure.errorMessage.match(/['"].*?['"]|`.*?`/g) || [];
      patterns.push(...snippetMatches);
    }
    
    return patterns;
  }
  
  /**
   * Determine the best fix strategy based on failure type and historical data
   * @param {string} failureType - Type of failure
   * @param {Object} historicalRates - Historical success rates
   * @param {Object} failure - Test failure information
   * @returns {string} - Best fix strategy
   */
  determineBestFixStrategy(failureType, historicalRates, failure) {
    // Default strategy is the failure type itself
    let bestStrategy = failureType;
    let highestRate = 0;
    
    // Find strategy with highest success rate
    for (const [strategy, stats] of Object.entries(historicalRates)) {
      if (stats.attempts >= 3 && stats.successRate > highestRate) {
        highestRate = stats.successRate;
        bestStrategy = strategy;
      }
    }
    
    // Special case handling based on failure type
    switch (failureType) {
      case 'syntax-error':
        if (failure.errorMessage && failure.errorMessage.includes('unexpected token')) {
          return 'syntax-correction';
        }
        break;
      case 'reference-error':
        if (failure.errorMessage && failure.errorMessage.includes('is not defined')) {
          return 'variable-definition';
        }
        break;
      case 'assertion-failure':
        if (failure.errorMessage && failure.errorMessage.includes('expected') && failure.errorMessage.includes('received')) {
          return 'assertion-adjustment';
        }
        break;
    }
    
    return bestStrategy;
  }
  
  /**
   * Post-process a generated fix to improve its quality
   * @param {string} fixCode - Generated fix code
   * @param {Object} failure - Test failure information
   * @param {string} failureType - Type of failure
   * @returns {string} - Processed fix code
   */
  postProcessFix(fixCode, failure, failureType) {
    // Don't process empty fixes
    if (!fixCode) return fixCode;
    
    let processedCode = fixCode;
    
    // Remove unnecessary comments
    processedCode = processedCode.replace(/\/\/\s*Auto-generated fix.*?\n/g, '');
    
    // Ensure proper indentation
    if (failure.testCode) {
      const indentMatch = failure.testCode.match(/^(\s+)/);
      if (indentMatch && indentMatch[1]) {
        const lines = processedCode.split('\n');
        processedCode = lines.map(line => line.trim() ? indentMatch[1] + line : line).join('\n');
      }
    }
    
    // Add specific improvements based on failure type
    switch (failureType) {
      case 'syntax-error':
        // Ensure all brackets are balanced
        const openBrackets = (processedCode.match(/\{/g) || []).length;
        const closeBrackets = (processedCode.match(/\}/g) || []).length;
        if (openBrackets > closeBrackets) {
          processedCode += '\n'.repeat(openBrackets - closeBrackets) + '}'.repeat(openBrackets - closeBrackets);
        }
        break;
      case 'assertion-failure':
        // Ensure assertions are properly formatted
        if (processedCode.includes('expect(') && !processedCode.includes('.to') && !processedCode.includes('.not')) {
          processedCode = processedCode.replace(/expect\(([^)]+)\)/, 'expect($1).toBe(');
        }
        break;
    }
    
    return processedCode;
  }
  
  /**
   * Validate the syntax of a fix
   * @param {string} fixCode - Fix code to validate
   * @param {string} filePath - Path to the file being fixed
   * @returns {Promise<Object>} - Validation result
   */
  async validateFixSyntax(fixCode, filePath) {
    try {
      // Basic validation - check for balanced brackets
      const openBrackets = (fixCode.match(/\{/g) || []).length;
      const closeBrackets = (fixCode.match(/\}/g) || []).length;
      const openParens = (fixCode.match(/\(/g) || []).length;
      const closeParens = (fixCode.match(/\)/g) || []).length;
      
      const messages = [];
      let valid = true;
      let safeCode = fixCode;
      
      if (openBrackets !== closeBrackets) {
        valid = false;
        messages.push(`Unbalanced curly brackets: ${openBrackets} open vs ${closeBrackets} close`);
        
        // Try to fix it
        if (openBrackets > closeBrackets) {
          safeCode += '\n' + '}'.repeat(openBrackets - closeBrackets);
        } else {
          // Remove extra closing brackets
          safeCode = safeCode.split('\n')
            .filter(line => !line.trim().startsWith('}')).join('\n');
        }
      }
      
      if (openParens !== closeParens) {
        valid = false;
        messages.push(`Unbalanced parentheses: ${openParens} open vs ${closeParens} close`);
        
        // Try to fix it
        if (openParens > closeParens) {
          safeCode += ')'.repeat(openParens - closeParens);
        }
      }
      
      // Check for missing semicolons at the end of statements
      const lines = safeCode.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.endsWith(';') && !line.endsWith('{') && !line.endsWith('}') && 
            !line.endsWith(':') && !line.startsWith('//') && !line.startsWith('/*') && 
            !line.startsWith('*') && !line.startsWith('import') && !line.startsWith('export')) {
          lines[i] = lines[i] + ';';
          valid = false;
          messages.push(`Missing semicolon at line ${i + 1}`);
        }
      }
      safeCode = lines.join('\n');
      
      return {
        valid,
        messages,
        safeCode
      };
    } catch (error) {
      return {
        valid: false,
        messages: [error.message],
        safeCode: fixCode
      };
    }
  }
  
  /**
   * Generate a fallback fix based on similar patterns
   * @param {Object} failure - Test failure information
   * @param {string} failureType - Type of failure
   * @returns {Object|null} - Fallback fix or null if not possible
   */
  generateFallbackFix(failure, failureType) {
    try {
      // Get similar fixes from knowledge base
      const similarFixes = this.knowledgeBase.fixes
        .filter(fix => fix.errorType === failureType && fix.successRate > 0.5)
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 3);
      
      if (similarFixes.length === 0) {
        return null;
      }
      
      // Use the most successful fix as template
      const bestFix = similarFixes[0];
      if (!bestFix.lastSuccessfulFix || !bestFix.lastSuccessfulFix.code) {
        return null;
      }
      
      // Extract patterns from the error message
      const errorPatterns = this.extractPatterns(failure.errorMessage || '');
      
      // Simple template-based fix generation
      let fixCode = bestFix.lastSuccessfulFix.code;
      
      // Try to adapt the fix to the current context
      if (failure.errorMessage && bestFix.errorPattern) {
        const commonParts = this.findCommonSubstrings(failure.errorMessage, bestFix.errorPattern);
        if (commonParts.length > 0) {
          // Replace variable names or specific values
          for (const part of commonParts) {
            if (part.length < 3) continue; // Skip very short matches
            
            const regex = new RegExp(part.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            fixCode = fixCode.replace(regex, part);
          }
        }
      }
      
      return {
        code: fixCode,
        confidence: bestFix.successRate * 0.7, // Reduce confidence for fallback
        fixStrategy: 'fallback-pattern'
      };
    } catch (error) {
      this.options.logger.error('Error generating fallback fix:', error);
      return null;
    }
  }
  
  /**
   * Extract patterns from a string
   * @param {string} text - Text to extract patterns from
   * @returns {Array} - Extracted patterns
   */
  extractPatterns(text) {
    if (!text) return [];
    
    const patterns = [];
    
    // Extract variable names
    const varMatches = text.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g) || [];
    patterns.push(...varMatches);
    
    // Extract quoted strings
    const stringMatches = text.match(/['"].*?['"]|`.*?`/g) || [];
    patterns.push(...stringMatches);
    
    // Extract numbers
    const numberMatches = text.match(/\b\d+(\.\d+)?\b/g) || [];
    patterns.push(...numberMatches);
    
    return Array.from(new Set(patterns)); // Remove duplicates
  }
  
  /**
   * Find common substrings between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {Array} - Common substrings
   */
  findCommonSubstrings(str1, str2) {
    if (!str1 || !str2) return [];
    
    const common = [];
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    // Find common words
    for (const word1 of words1) {
      if (word1.length < 3) continue; // Skip very short words
      
      if (words2.includes(word1)) {
        common.push(word1);
      }
    }
    
    return common;
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
  
  try {
    // Find existing fix in knowledge base
    const existingFixIndex = this.knowledgeBase.fixes.findIndex(f => 
      f.errorType === fix.errorType && 
      f.fixStrategy === fix.fixStrategy
    );
    
    // Extract code patterns for better matching in future
    const codePatterns = fix.fixCode ? this.extractPatterns(fix.fixCode) : [];
    
    if (existingFixIndex >= 0) {
      // Update existing fix
      const existingFix = this.knowledgeBase.fixes[existingFixIndex];
      existingFix.attempts = (existingFix.attempts || 0) + 1;
      existingFix.successes = (existingFix.successes || 0) + (wasSuccessful ? 1 : 0);
      existingFix.successRate = existingFix.successes / existingFix.attempts;
      existingFix.lastUpdated = new Date().toISOString();
      
      // Update patterns with new information
      existingFix.patterns = Array.from(new Set([...(existingFix.patterns || []), ...codePatterns]));
      
      // Track execution time and performance metrics if available
      if (testResult.executionTime) {
        existingFix.averageExecutionTime = existingFix.averageExecutionTime 
          ? (existingFix.averageExecutionTime * (existingFix.attempts - 1) + testResult.executionTime) / existingFix.attempts
          : testResult.executionTime;
      }
      
      if (wasSuccessful) {
        existingFix.lastSuccessfulFix = {
          code: fix.fixCode,
          timestamp: new Date().toISOString(),
          appliedStrategies: fix.appliedStrategies || [fix.fixStrategy],
          executionTime: testResult.executionTime || null
        };
        
        // Store the context that led to success
        if (fix.contextFeatures) {
          existingFix.successContexts = existingFix.successContexts || [];
          existingFix.successContexts.push(fix.contextFeatures);
          
          // Keep only the last 5 success contexts to avoid bloat
          if (existingFix.successContexts.length > 5) {
            existingFix.successContexts.shift();
          }
        }
      } else {
        // Track failed strategies to avoid repeating them
        existingFix.failedStrategies = existingFix.failedStrategies || [];
        existingFix.failedStrategies.push({
          strategy: fix.fixStrategy,
          timestamp: new Date().toISOString(),
          errorMessage: testResult.errorMessage || 'Unknown error'
        });
        
        // Keep only the last 10 failed strategies
        if (existingFix.failedStrategies.length > 10) {
          existingFix.failedStrategies.shift();
        }
      }
    } else {
      // Add new fix to knowledge base
      this.knowledgeBase.fixes.push({
        errorType: fix.errorType,
        errorPattern: fix.errorType === 'syntax-error' ? 
          (fix.errorMessage || '').substring(0, 50) : 
          null,
        fixStrategy: fix.fixStrategy,
        attempts: 1,
        successes: wasSuccessful ? 1 : 0,
        successRate: wasSuccessful ? 1 : 0,
        patterns: codePatterns,
        created: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        averageExecutionTime: testResult.executionTime || null,
        lastSuccessfulFix: wasSuccessful ? {
          code: fix.fixCode,
          timestamp: new Date().toISOString(),
          appliedStrategies: fix.appliedStrategies || [fix.fixStrategy],
          executionTime: testResult.executionTime || null
        } : null,
        failedStrategies: !wasSuccessful ? [{
          strategy: fix.fixStrategy,
          timestamp: new Date().toISOString(),
          errorMessage: testResult.errorMessage || 'Unknown error'
        }] : [],
        successContexts: wasSuccessful && fix.contextFeatures ? [fix.contextFeatures] : []
      });
    }
    
    // Update overall statistics
    this.knowledgeBase.statistics.totalAttempts++;
    if (wasSuccessful) {
      this.knowledgeBase.statistics.successfulFixes++;
    }
    
    // Save the updated knowledge base
    this.saveKnowledgeBase();
    
    // Record feedback in feedback loop
    this.feedbackLoop.recordFeedback({
      errorType: fix.errorType,
      errorMessage: fix.errorMessage,
      fixStrategy: fix.fixStrategy,
      fixCode: fix.fixCode,
      wasSuccessful,
      testResult,
      patterns: codePatterns,
      appliedStrategies: fix.appliedStrategies || [fix.fixStrategy],
      contextFeatures: fix.contextFeatures || {}
    });
  } catch (error) {
    this.options.logger.error('Error recording fix feedback:', error);
  }
}

module.exports = AIFixEngine;
