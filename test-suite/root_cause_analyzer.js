const fs = require('fs');
const path = require('path');

class RootCauseAnalyzer {
  constructor() {
    this.failurePatterns = new Map();
    this.rootCauseTemplates = new Map();
    this.initializePatterns();
  }

  initializePatterns() {
    // Database-related failures
    this.failurePatterns.set('database_timeout', {
      keywords: ['timeout', 'buffering timed out', 'MongooseError', 'connection'],
      severity: 'high',
      category: 'infrastructure'
    });

    // Mock-related failures
    this.failurePatterns.set('mock_failure', {
      keywords: ['mock', 'spy', 'Number of calls: 0', 'toHaveBeenCalled'],
      severity: 'medium',
      category: 'test_setup'
    });

    // Async/Promise failures
    this.failurePatterns.set('async_failure', {
      keywords: ['Promise', 'async', 'await', 'then', 'catch', 'rejected'],
      severity: 'high',
      category: 'logic'
    });

    // Type/undefined errors
    this.failurePatterns.set('type_error', {
      keywords: ['TypeError', 'undefined', 'null', 'Cannot read property'],
      severity: 'high',
      category: 'logic'
    });

    // Authentication/Authorization
    this.failurePatterns.set('auth_failure', {
      keywords: ['unauthorized', '401', '403', 'authentication', 'authorization'],
      severity: 'medium',
      category: 'security'
    });

    // Validation errors
    this.failurePatterns.set('validation_error', {
      keywords: ['validation', 'required', 'invalid', 'format', 'schema'],
      severity: 'medium',
      category: 'validation'
    });

    // Performance issues
    this.failurePatterns.set('performance_issue', {
      keywords: ['slow', 'timeout', 'memory', 'cpu', 'performance'],
      severity: 'low',
      category: 'performance'
    });
  }

  async analyzeFailures(testOutput, failingTests) {
    const analysis = {
      patterns: [],
      rootCauses: [],
      recommendations: [],
      confidence: 0
    };

    // Extract failure patterns
    analysis.patterns = this.extractFailurePatterns(testOutput, failingTests);
    
    // Identify root causes
    analysis.rootCauses = await this.identifyRootCauses(analysis.patterns, testOutput);
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis.rootCauses);
    
    // Calculate confidence
    analysis.confidence = this.calculateConfidence(analysis.patterns, analysis.rootCauses);

    return analysis;
  }

  extractFailurePatterns(testOutput, failingTests) {
    const patterns = [];
    const lines = testOutput.split('\n');

    for (const [patternName, pattern] of this.failurePatterns) {
      const matches = this.findPatternMatches(lines, pattern, failingTests);
      if (matches.length > 0) {
        patterns.push({
          name: patternName,
          pattern: pattern,
          matches: matches,
          frequency: matches.length,
          severity: pattern.severity,
          category: pattern.category
        });
      }
    }

    // Sort by frequency and severity
    patterns.sort((a, b) => {
      const severityWeight = { high: 3, medium: 2, low: 1 };
      return (b.frequency * severityWeight[b.severity]) - (a.frequency * severityWeight[a.severity]);
    });

    return patterns;
  }

  findPatternMatches(lines, pattern, failingTests) {
    const matches = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if line contains any of the pattern keywords
      const hasKeyword = pattern.keywords.some(keyword => 
        line.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasKeyword) {
        // Extract context around the match
        const context = this.extractContext(lines, i, 3);
        
        matches.push({
          line: i + 1,
          content: line.trim(),
          context: context,
          relatedTests: this.findRelatedTests(line, failingTests)
        });
      }
    }
    
    return matches;
  }

  extractContext(lines, centerIndex, radius) {
    const start = Math.max(0, centerIndex - radius);
    const end = Math.min(lines.length, centerIndex + radius + 1);
    
    return lines.slice(start, end).map((line, index) => ({
      lineNumber: start + index + 1,
      content: line.trim(),
      isCenter: start + index === centerIndex
    }));
  }

  findRelatedTests(line, failingTests) {
    return failingTests.filter(test => 
      line.includes(test) || test.split(' › ').some(part => line.includes(part))
    );
  }

  async identifyRootCauses(patterns, testOutput) {
    const rootCauses = [];

    for (const pattern of patterns) {
      const rootCause = await this.analyzePattern(pattern, testOutput);
      if (rootCause) {
        rootCauses.push(rootCause);
      }
    }

    // Merge related root causes
    return this.mergeRelatedCauses(rootCauses);
  }

  async analyzePattern(pattern, testOutput) {
    switch (pattern.name) {
      case 'database_timeout':
        return this.analyzeDatabaseTimeout(pattern, testOutput);
      
      case 'mock_failure':
        return this.analyzeMockFailure(pattern, testOutput);
      
      case 'async_failure':
        return this.analyzeAsyncFailure(pattern, testOutput);
      
      case 'type_error':
        return this.analyzeTypeError(pattern, testOutput);
      
      case 'auth_failure':
        return this.analyzeAuthFailure(pattern, testOutput);
      
      case 'validation_error':
        return this.analyzeValidationError(pattern, testOutput);
      
      default:
        return this.analyzeGenericPattern(pattern, testOutput);
    }
  }

  analyzeDatabaseTimeout(pattern, testOutput) {
    const timeoutValue = this.extractTimeoutValue(testOutput);
    const operations = this.extractDatabaseOperations(testOutput);
    
    return {
      type: 'database_timeout',
      description: `Database operations timing out after ${timeoutValue}ms`,
      severity: 'high',
      confidence: 0.9,
      affectedOperations: operations,
      evidence: pattern.matches,
      fixes: [
        {
          type: 'increase_timeout',
          description: 'Increase database operation timeout',
          implementation: 'mongoose.set("bufferMaxEntries", 0); mongoose.set("bufferCommands", false);',
          priority: 'high',
          impact: 0.8
        },
        {
          type: 'connection_pooling',
          description: 'Optimize database connection pooling',
          implementation: 'Configure proper connection pool settings',
          priority: 'medium',
          impact: 0.6
        }
      ]
    };
  }

  analyzeMockFailure(pattern, testOutput) {
    const mockNames = this.extractMockNames(testOutput);
    
    return {
      type: 'mock_failure',
      description: 'Mock functions not being called or configured incorrectly',
      severity: 'medium',
      confidence: 0.8,
      affectedMocks: mockNames,
      evidence: pattern.matches,
      fixes: [
        {
          type: 'fix_mock_setup',
          description: 'Fix mock function setup and implementation',
          implementation: 'Ensure mocks return proper promises and values',
          priority: 'high',
          impact: 0.9
        },
        {
          type: 'mock_reset',
          description: 'Add proper mock reset between tests',
          implementation: 'Add beforeEach(() => jest.clearAllMocks())',
          priority: 'medium',
          impact: 0.7
        }
      ]
    };
  }

  analyzeAsyncFailure(pattern, testOutput) {
    return {
      type: 'async_failure',
      description: 'Async/await operations not handled correctly',
      severity: 'high',
      confidence: 0.85,
      evidence: pattern.matches,
      fixes: [
        {
          type: 'fix_async_handling',
          description: 'Add proper async/await handling',
          implementation: 'Ensure all async operations are awaited',
          priority: 'high',
          impact: 0.9
        },
        {
          type: 'promise_timeout',
          description: 'Add timeout handling for promises',
          implementation: 'Wrap promises with timeout logic',
          priority: 'medium',
          impact: 0.6
        }
      ]
    };
  }

  analyzeTypeError(pattern, testOutput) {
    const undefinedProperties = this.extractUndefinedProperties(testOutput);
    
    return {
      type: 'type_error',
      description: 'Accessing properties on undefined/null objects',
      severity: 'high',
      confidence: 0.9,
      affectedProperties: undefinedProperties,
      evidence: pattern.matches,
      fixes: [
        {
          type: 'null_checks',
          description: 'Add null/undefined checks',
          implementation: 'Add proper validation before property access',
          priority: 'high',
          impact: 0.8
        },
        {
          type: 'default_values',
          description: 'Provide default values',
          implementation: 'Use default parameters and optional chaining',
          priority: 'medium',
          impact: 0.7
        }
      ]
    };
  }

  analyzeAuthFailure(pattern, testOutput) {
    return {
      type: 'auth_failure',
      description: 'Authentication/authorization issues in tests',
      severity: 'medium',
      confidence: 0.75,
      evidence: pattern.matches,
      fixes: [
        {
          type: 'mock_auth',
          description: 'Mock authentication middleware',
          implementation: 'Add proper auth mocking in test setup',
          priority: 'high',
          impact: 0.8
        }
      ]
    };
  }

  analyzeValidationError(pattern, testOutput) {
    return {
      type: 'validation_error',
      description: 'Data validation failures',
      severity: 'medium',
      confidence: 0.8,
      evidence: pattern.matches,
      fixes: [
        {
          type: 'fix_validation',
          description: 'Fix validation logic or test data',
          implementation: 'Ensure test data matches validation schema',
          priority: 'medium',
          impact: 0.7
        }
      ]
    };
  }

  analyzeGenericPattern(pattern, testOutput) {
    return {
      type: pattern.name,
      description: `Generic failure pattern: ${pattern.name}`,
      severity: pattern.severity,
      confidence: 0.5,
      evidence: pattern.matches,
      fixes: [
        {
          type: 'investigate',
          description: 'Manual investigation required',
          implementation: 'Review failure context and implement specific fix',
          priority: 'low',
          impact: 0.5
        }
      ]
    };
  }

  generateRecommendations(rootCauses) {
    const recommendations = [];
    
    for (const cause of rootCauses) {
      for (const fix of cause.fixes) {
        recommendations.push({
          rootCause: cause.type,
          description: cause.description,
          fix: fix,
          priority: this.calculatePriority(cause, fix),
          estimatedImpact: fix.impact * cause.confidence
        });
      }
    }
    
    // Sort by priority and impact
    recommendations.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
    
    return recommendations;
  }

  calculatePriority(cause, fix) {
    const severityWeight = { high: 3, medium: 2, low: 1 };
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    
    return (severityWeight[cause.severity] + priorityWeight[fix.priority]) / 2;
  }

  calculateConfidence(patterns, rootCauses) {
    if (patterns.length === 0) return 0;
    
    const totalConfidence = rootCauses.reduce((sum, cause) => sum + cause.confidence, 0);
    return totalConfidence / rootCauses.length;
  }

  mergeRelatedCauses(rootCauses) {
    // Simple implementation - could be more sophisticated
    const merged = [];
    const processed = new Set();
    
    for (const cause of rootCauses) {
      if (!processed.has(cause.type)) {
        merged.push(cause);
        processed.add(cause.type);
      }
    }
    
    return merged;
  }

  // Utility methods for extracting specific information
  extractTimeoutValue(testOutput) {
    const match = testOutput.match(/timed out after (\\\\\\\d+)ms/);
    return match ? match[1] : '10000';
  }

  extractDatabaseOperations(testOutput) {
    const operations = [];
    const matches = testOutput.match(/Operation `([^`]+)`/g);
    if (matches) {
      operations.push(...matches.map(m => m.replace(/Operation `([^`]+)`/, '$1')));
    }
    return [...new Set(operations)];
  }

  extractMockNames(testOutput) {
    const mocks = [];
    const matches = testOutput.match(/Expected mock function to have been called/g);
    // This would need more sophisticated parsing in practice
    return mocks;
  }

  extractUndefinedProperties(testOutput) {
    const properties = [];
    const matches = testOutput.match(/Cannot read propert(?:y|ies) of undefined \\\\\\(reading '([^']+)'\\\\\\)/g);
    if (matches) {
      properties.push(...matches.map(m => m.replace(/.*reading '([^']+)'.*/, '$1')));
    }
    return [...new Set(properties)];
  }
}

module.exports = RootCauseAnalyzer;
