/**
 * Integration Tests for AI Fix Pipeline
 * 
 * These tests validate the complete AI fix pipeline, including:
 * - AIFixEngine
 * - LLMModelConnector
 * - AIFeedbackLoop
 * 
 * The tests ensure that all components work together correctly to analyze
 * test failures, generate fixes, and learn from feedback.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const util = require('util');

// Import the components
const AIFixEngine = require('../../test-utils/AIFixEngine');
const LLMModelConnector = require('../../test-utils/LLMModelConnector');
const AIFeedbackLoop = require('../../test-utils/AIFeedbackLoop');

// Mock implementations
jest.mock('../../test-utils/LLMModelConnector');
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    promises: {
      ...originalFs.promises,
      writeFile: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockImplementation((path) => {
        if (path.includes('knowledge-base.json')) {
          return Promise.resolve(JSON.stringify({
            fixes: [],
            statistics: { totalAttempts: 0, successfulFixes: 0 }
          }));
        }
        if (path.includes('feedback-data.json')) {
          return Promise.resolve(JSON.stringify({
            fixes: [],
            patterns: {},
            metrics: { totalFixes: 0, successfulFixes: 0, successRate: 0 }
          }));
        }
        return Promise.reject(new Error('File not found'));
      }),
      access: jest.fn().mockResolvedValue(undefined),
      mkdir: jest.fn().mockResolvedValue(undefined)
    },
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn()
  };
});

describe('AI Fix Pipeline Integration', () => {
  // Setup temporary directory for test files and results
  const tempDir = path.join(os.tmpdir(), 'ai-fix-pipeline-' + Date.now());
  const testResultsDir = path.join(tempDir, 'test-results');
  
  beforeAll(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock LLMModelConnector implementation
    LLMModelConnector.mockImplementation(() => {
      return {
        initializeCache: jest.fn().mockResolvedValue(undefined),
        generateFix: jest.fn().mockImplementation((failure) => {
          const fixType = failure.errorType || 'unknown';
          return Promise.resolve({
            code: `// Generated fix for ${fixType}\nfunction fixedCode() {\n  return true;\n}`,
            confidence: 0.8
          });
        })
      };
    });
  });
  
  afterAll(() => {
    jest.restoreAllMocks();
  });
  
  test('should initialize all components correctly', async () => {
    // Create AIFixEngine with mocked dependencies
    const fixEngine = new AIFixEngine({
      knowledgeBasePath: path.join(testResultsDir, 'ai-knowledge-base'),
      modelType: 'local',
      modelEndpoint: 'http://localhost:8080/generate',
      logger: { info: jest.fn(), error: jest.fn() }
    });
    
    // Initialize the engine
    const initResult = await fixEngine.initialize();
    
    // Verify initialization was successful
    expect(initResult).toBe(true);
    
    // Verify model connector and feedback loop were initialized
    expect(fixEngine.modelConnector).toBeDefined();
    expect(fixEngine.feedbackLoop).toBeDefined();
  });
  
  test('should analyze problem and generate fix', async () => {
    // Create AIFixEngine with mocked dependencies
    const fixEngine = new AIFixEngine({
      knowledgeBasePath: path.join(testResultsDir, 'ai-knowledge-base'),
      modelType: 'local',
      modelEndpoint: 'http://localhost:8080/generate',
      logger: { info: jest.fn(), error: jest.fn() }
    });
    
    await fixEngine.initialize();
    
    // Create a test failure
    const testFailure = {
      testName: 'TestSuite.failingTest',
      filePath: '/path/to/test.js',
      errorMessage: 'Expected 2 to be 3',
      stackTrace: 'Error: Expected 2 to be 3\n    at Object.<anonymous> (/path/to/test.js:3:20)',
      testCode: 'test("failing test", () => {\n  expect(1 + 1).toBe(3);\n});'
    };
    
    // Analyze the problem
    const fix = await fixEngine.analyzeProblem(testFailure);
    
    // Verify fix was generated
    expect(fix).toBeDefined();
    expect(fix.fixStrategy).toBeDefined();
    expect(fix.fixCode).toBeDefined();
    expect(fix.confidence).toBeGreaterThan(0);
    expect(fix.source).toBeDefined();
    
    // Verify model connector was called
    expect(fixEngine.modelConnector.generateFix).toHaveBeenCalled();
  });
  
  test('should record feedback and update knowledge base', async () => {
    // Create AIFixEngine with mocked dependencies
    const fixEngine = new AIFixEngine({
      knowledgeBasePath: path.join(testResultsDir, 'ai-knowledge-base'),
      modelType: 'local',
      modelEndpoint: 'http://localhost:8080/generate',
      logger: { info: jest.fn(), error: jest.fn() }
    });
    
    await fixEngine.initialize();
    
    // Create a test fix
    const testFix = {
      fixStrategy: 'assertion-failure',
      fixCode: 'test("fixed test", () => {\n  expect(1 + 1).toBe(2);\n});',
      confidence: 0.8,
      source: 'ai-generated',
      errorType: 'assertion-failure',
      testName: 'TestSuite.failingTest',
      filePath: '/path/to/test.js'
    };
    
    // Create test result
    const testResult = {
      executionTime: 123,
      output: 'Test passed'
    };
    
    // Record feedback
    await fixEngine.recordFixFeedback(testFix, true, testResult);
    
    // Verify knowledge base was updated
    expect(fs.promises.writeFile).toHaveBeenCalled();
  });
  
  test('should handle different failure types correctly', async () => {
    // Create AIFixEngine with mocked dependencies
    const fixEngine = new AIFixEngine({
      knowledgeBasePath: path.join(testResultsDir, 'ai-knowledge-base'),
      modelType: 'local',
      modelEndpoint: 'http://localhost:8080/generate',
      logger: { info: jest.fn(), error: jest.fn() }
    });
    
    await fixEngine.initialize();
    
    // Test different failure types
    const failureTypes = [
      {
        errorMessage: 'SyntaxError: Unexpected token',
        expectedType: 'syntax-error'
      },
      {
        errorMessage: 'AssertionError: expected 2 to equal 3',
        expectedType: 'assertion-failure'
      },
      {
        errorMessage: 'Timeout - Async callback was not invoked within the 5000ms timeout',
        expectedType: 'timeout'
      },
      {
        errorMessage: 'Cannot find module \'missing-module\'',
        expectedType: 'dependency-error'
      },
      {
        errorMessage: 'ECONNREFUSED: Connection refused',
        expectedType: 'network-error'
      }
    ];
    
    for (const { errorMessage, expectedType } of failureTypes) {
      const testFailure = {
        testName: `TestSuite.${expectedType}Test`,
        filePath: '/path/to/test.js',
        errorMessage,
        stackTrace: `Error: ${errorMessage}\n    at Object.<anonymous> (/path/to/test.js:3:20)`
      };
      
      // Determine failure type
      const failureType = fixEngine.determineFailureType(testFailure);
      
      // Verify correct failure type was determined
      expect(failureType).toBe(expectedType);
      
      // Analyze the problem
      const fix = await fixEngine.analyzeProblem(testFailure);
      
      // Verify fix was generated with correct strategy
      expect(fix.fixStrategy).toBe(expectedType);
    }
  });
  
  test('should integrate with feedback loop for continuous learning', async () => {
    // Create AIFixEngine with mocked dependencies
    const fixEngine = new AIFixEngine({
      knowledgeBasePath: path.join(testResultsDir, 'ai-knowledge-base'),
      modelType: 'local',
      modelEndpoint: 'http://localhost:8080/generate',
      logger: { info: jest.fn(), error: jest.fn() }
    });
    
    // Mock feedback loop methods
    fixEngine.feedbackLoop = {
      initialize: jest.fn().mockResolvedValue(undefined),
      recordFeedback: jest.fn().mockResolvedValue(undefined),
      getPatternWeight: jest.fn().mockReturnValue(0.9),
      getSimilarSuccessfulFixes: jest.fn().mockReturnValue([]),
      saveMetricsReport: jest.fn().mockResolvedValue(undefined)
    };
    
    await fixEngine.initialize();
    
    // Create a test failure
    const testFailure = {
      testName: 'TestSuite.failingTest',
      filePath: '/path/to/test.js',
      errorMessage: 'Expected 2 to be 3',
      stackTrace: 'Error: Expected 2 to be 3\n    at Object.<anonymous> (/path/to/test.js:3:20)',
      testCode: 'test("failing test", () => {\n  expect(1 + 1).toBe(3);\n});'
    };
    
    // Analyze the problem
    const fix = await fixEngine.analyzeProblem(testFailure);
    
    // Record feedback
    await fixEngine.recordFixFeedback(fix, true, { executionTime: 123, output: 'Test passed' });
    
    // Verify feedback loop methods were called
    expect(fixEngine.feedbackLoop.getPatternWeight).toHaveBeenCalled();
    expect(fixEngine.feedbackLoop.getSimilarSuccessfulFixes).toHaveBeenCalled();
    expect(fixEngine.feedbackLoop.recordFeedback).toHaveBeenCalled();
    expect(fixEngine.feedbackLoop.saveMetricsReport).toHaveBeenCalled();
  });
  
  test('should handle errors gracefully', async () => {
    // Create AIFixEngine with mocked dependencies
    const fixEngine = new AIFixEngine({
      knowledgeBasePath: path.join(testResultsDir, 'ai-knowledge-base'),
      modelType: 'local',
      modelEndpoint: 'http://localhost:8080/generate',
      logger: { info: jest.fn(), error: jest.fn() }
    });
    
    await fixEngine.initialize();
    
    // Mock model connector to throw an error
    fixEngine.modelConnector.generateFix = jest.fn().mockRejectedValue(new Error('Model error'));
    
    // Create a test failure
    const testFailure = {
      testName: 'TestSuite.failingTest',
      filePath: '/path/to/test.js',
      errorMessage: 'Expected 2 to be 3',
      stackTrace: 'Error: Expected 2 to be 3\n    at Object.<anonymous> (/path/to/test.js:3:20)',
      testCode: 'test("failing test", () => {\n  expect(1 + 1).toBe(3);\n});'
    };
    
    // Analyze the problem
    const fix = await fixEngine.analyzeProblem(testFailure);
    
    // Verify fallback fix was generated
    expect(fix).toBeDefined();
    expect(fix.fixCode).toBeDefined();
    expect(fix.confidence).toBeLessThan(0.5); // Lower confidence for fallback fix
  });
});
