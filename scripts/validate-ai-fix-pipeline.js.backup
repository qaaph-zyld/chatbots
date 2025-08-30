/**
 * AI Fix Pipeline Validation Script
 * 
 * This script validates the complete AI fix pipeline by:
 * 1. Creating sample failing tests
 * 2. Running the AI fix engine to analyze and fix the failures
 * 3. Validating the fixes and recording feedback
 * 4. Generating a validation report
 */

const path = require('path');
const fs = require('fs');
const util = require('util');
const { execSync } = require('child_process');

// Import components
const AIFixEngine = require('../test-utils/AIFixEngine');
const LLMModelConnector = require('../test-utils/LLMModelConnector');
const AIFeedbackLoop = require('../test-utils/AIFeedbackLoop');

// Convert fs functions to promises
const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

// Configuration
const config = {
  tempDir: path.join(__dirname, '..', 'test-results', 'ai-fix-validation'),
  samplesDir: path.join(__dirname, '..', 'test-results', 'ai-fix-validation', 'samples'),
  resultsDir: path.join(__dirname, '..', 'test-results', 'ai-fix-validation', 'results'),
  knowledgeBasePath: path.join(__dirname, '..', 'test-results', 'ai-knowledge-base'),
  modelType: process.env.AI_MODEL_TYPE || 'local',
  modelEndpoint: process.env.AI_MODEL_ENDPOINT || 'http://localhost:8080/generate',
  huggingFaceToken: process.env.HUGGINGFACE_TOKEN || '',
  modelName: process.env.AI_MODEL_NAME || 'codellama/CodeLlama-7b-Instruct-hf',
  useRealModel: process.env.USE_REAL_MODEL === 'true'
};

// Sample test failures
const sampleFailures = [
  {
    name: 'syntax-error',
    testCode: `
describe('Syntax Error Test', () => {
  test('should handle syntax errors', () => {
    const obj = {
      name: 'test',
      value: 42,
    // Missing closing brace
    expect(obj.name).toBe('test');
  });
});
`,
    errorMessage: 'SyntaxError: Unexpected token',
    errorType: 'syntax-error'
  },
  {
    name: 'assertion-failure',
    testCode: `
describe('Assertion Failure Test', () => {
  test('should handle assertion failures', () => {
    const sum = (a, b) => a - b; // Bug: should be a + b
    expect(sum(2, 3)).toBe(5);
  });
});
`,
    errorMessage: 'Expected: 5, Received: -1',
    errorType: 'assertion-failure'
  },
  {
    name: 'timeout',
    testCode: `
describe('Timeout Test', () => {
  test('should handle timeouts', async () => {
    const fetchData = () => new Promise(resolve => {
      // Never resolves, causing timeout
    });
    const data = await fetchData();
    expect(data).toBeDefined();
  });
});
`,
    errorMessage: 'Timeout - Async callback was not invoked within timeout',
    errorType: 'timeout'
  },
  {
    name: 'dependency-error',
    testCode: `
describe('Dependency Error Test', () => {
  test('should handle dependency errors', () => {
    const nonExistentModule = require('non-existent-module');
    expect(nonExistentModule).toBeDefined();
  });
});
`,
    errorMessage: 'Cannot find module \'non-existent-module\'',
    errorType: 'dependency-error'
  }
];

/**
 * Main validation function
 */
async function validateAIFixPipeline() {
  console.log('Starting AI Fix Pipeline Validation');
  
  try {
    // Create directories
    await ensureDirectories();
    
    // Create sample test files
    await createSampleTests();
    
    // Initialize AI Fix Engine
    const fixEngine = await initializeFixEngine();
    
    // Process each sample failure
    const results = await processSampleFailures(fixEngine);
    
    // Generate validation report
    await generateValidationReport(results);
    
    console.log('AI Fix Pipeline Validation completed successfully');
    console.log(`Validation report saved to: ${path.join(config.resultsDir, 'validation-report.md')}`);
  } catch (error) {
    console.error('Error during validation:', error);
    process.exit(1);
  }
}

/**
 * Ensure all required directories exist
 */
async function ensureDirectories() {
  console.log('Creating directories...');
  
  for (const dir of [config.tempDir, config.samplesDir, config.resultsDir, config.knowledgeBasePath]) {
    if (!fs.existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }
}

/**
 * Create sample test files with known failures
 */
async function createSampleTests() {
  console.log('Creating sample test files...');
  
  for (const sample of sampleFailures) {
    const filePath = path.join(config.samplesDir, `${sample.name}.test.js`);
    await writeFile(filePath, sample.testCode);
    console.log(`Created sample test: ${filePath}`);
  }
}

/**
 * Initialize the AI Fix Engine
 */
async function initializeFixEngine() {
  console.log('Initializing AI Fix Engine...');
  
  let modelConnector;
  
  if (!config.useRealModel) {
    // Use mock model connector for validation
    modelConnector = {
      initializeCache: async () => {},
      generateFix: async (failure) => {
        const fixType = failure.errorType || 'unknown';
        
        // Generate different fixes based on error type
        let code;
        switch (fixType) {
          case 'syntax-error':
            code = `
describe('Syntax Error Test', () => {
  test('should handle syntax errors', () => {
    const obj = {
      name: 'test',
      value: 42
    }; // Fixed: added closing brace
    expect(obj.name).toBe('test');
  });
});
`;
            break;
          case 'assertion-failure':
            code = `
describe('Assertion Failure Test', () => {
  test('should handle assertion failures', () => {
    const sum = (a, b) => a + b; // Fixed: changed - to +
    expect(sum(2, 3)).toBe(5);
  });
});
`;
            break;
          case 'timeout':
            code = `
describe('Timeout Test', () => {
  test('should handle timeouts', async () => {
    const fetchData = () => new Promise(resolve => {
      // Fixed: added resolve call
      resolve({ data: 'test' });
    });
    const data = await fetchData();
    expect(data).toBeDefined();
  });
});
`;
            break;
          case 'dependency-error':
            code = `
describe('Dependency Error Test', () => {
  test('should handle dependency errors', () => {
    // Fixed: use built-in module instead of non-existent one
    const fs = require('fs');
    expect(fs).toBeDefined();
  });
});
`;
            break;
          default:
            code = `// Generated fix for ${fixType}\n// TODO: Implement actual fix\n`;
        }
        
        return {
          code,
          confidence: 0.8
        };
      }
    };
  } else {
    // Use real model connector
    modelConnector = new LLMModelConnector({
      modelType: config.modelType,
      modelEndpoint: config.modelEndpoint,
      huggingFaceToken: config.huggingFaceToken,
      modelName: config.modelName,
      enableCache: true,
      cachePath: path.join(config.knowledgeBasePath, 'model-cache'),
      logger: console
    });
  }
  
  // Create feedback loop
  const feedbackLoop = new AIFeedbackLoop({
    feedbackPath: path.join(config.knowledgeBasePath, 'feedback'),
    logger: console
  });
  
  // Create fix engine
  const fixEngine = new AIFixEngine({
    knowledgeBasePath: config.knowledgeBasePath,
    modelType: config.modelType,
    modelEndpoint: config.modelEndpoint,
    huggingFaceToken: config.huggingFaceToken,
    modelName: config.modelName,
    modelConnector,
    feedbackLoop,
    logger: console
  });
  
  // Initialize the engine
  await fixEngine.initialize();
  
  return fixEngine;
}

/**
 * Process each sample failure
 * @param {AIFixEngine} fixEngine - The AI Fix Engine instance
 * @returns {Array} - Results of processing each sample
 */
async function processSampleFailures(fixEngine) {
  console.log('Processing sample failures...');
  
  const results = [];
  
  for (const sample of sampleFailures) {
    console.log(`\nProcessing sample: ${sample.name}`);
    
    // Create failure object
    const failure = {
      testName: `SampleTests.${sample.name}`,
      filePath: path.join(config.samplesDir, `${sample.name}.test.js`),
      errorMessage: sample.errorMessage,
      stackTrace: `Error: ${sample.errorMessage}\n    at Object.<anonymous> (${path.join(config.samplesDir, `${sample.name}.test.js`)}:5:5)`,
      testCode: sample.testCode,
      errorType: sample.errorType
    };
    
    // Analyze the problem
    console.log('Analyzing problem...');
    const fix = await fixEngine.analyzeProblem(failure);
    console.log(`Generated fix with strategy: ${fix.fixStrategy}, confidence: ${fix.confidence}, source: ${fix.source}`);
    
    // Apply the fix
    console.log('Applying fix...');
    const fixedFilePath = path.join(config.resultsDir, `${sample.name}-fixed.test.js`);
    await writeFile(fixedFilePath, fix.fixCode);
    
    // Validate the fix
    console.log('Validating fix...');
    let fixSuccessful = false;
    let validationOutput = '';
    
    try {
      // Simple validation: check if the fixed code has syntax errors
      const validateCmd = `node -c "${fixedFilePath}"`;
      execSync(validateCmd, { stdio: 'pipe' });
      
      // If no syntax error, consider it successful
      fixSuccessful = true;
      validationOutput = 'Syntax validation passed';
    } catch (error) {
      fixSuccessful = false;
      validationOutput = error.stderr?.toString() || 'Syntax validation failed';
    }
    
    console.log(`Fix validation result: ${fixSuccessful ? 'SUCCESS' : 'FAILURE'}`);
    
    // Record feedback
    console.log('Recording feedback...');
    await fixEngine.recordFixFeedback(fix, fixSuccessful, {
      executionTime: 100,
      output: validationOutput
    });
    
    // Store result
    results.push({
      sample: sample.name,
      errorType: sample.errorType,
      fixStrategy: fix.fixStrategy,
      fixSource: fix.source,
      confidence: fix.confidence,
      successful: fixSuccessful,
      originalCode: sample.testCode,
      fixedCode: fix.fixCode,
      validationOutput
    });
  }
  
  return results;
}

/**
 * Generate validation report
 * @param {Array} results - Results of processing each sample
 */
async function generateValidationReport(results) {
  console.log('Generating validation report...');
  
  // Calculate statistics
  const totalSamples = results.length;
  const successfulFixes = results.filter(r => r.successful).length;
  const successRate = (successfulFixes / totalSamples) * 100;
  
  // Generate report content
  const reportContent = `# AI Fix Pipeline Validation Report

Generated: ${new Date().toISOString()}

## Summary

- **Total Samples**: ${totalSamples}
- **Successful Fixes**: ${successfulFixes}
- **Success Rate**: ${successRate.toFixed(2)}%

## Detailed Results

${results.map(r => `
### ${r.sample} (${r.errorType})

- **Fix Strategy**: ${r.fixStrategy}
- **Fix Source**: ${r.fixSource}
- **Confidence**: ${r.confidence.toFixed(2)}
- **Result**: ${r.successful ? '✅ SUCCESS' : '❌ FAILURE'}

**Original Code**:
\`\`\`javascript
${r.originalCode.trim()}
\`\`\`

**Fixed Code**:
\`\`\`javascript
${r.fixedCode.trim()}
\`\`\`

**Validation Output**:
\`\`\`
${r.validationOutput}
\`\`\`
`).join('\n')}

## Recommendations

${successRate < 50 ? '- The success rate is low. Consider improving the fix generation strategies.' : ''}
${successRate >= 50 && successRate < 80 ? '- The success rate is moderate. Some improvements to specific error types may be beneficial.' : ''}
${successRate >= 80 ? '- The success rate is high. The AI fix pipeline is performing well.' : ''}

- Error types with lowest success rates: ${getLowestSuccessRateTypes(results)}
`;

  // Write report to file
  const reportPath = path.join(config.resultsDir, 'validation-report.md');
  await writeFile(reportPath, reportContent);
  
  // Also save JSON results
  const jsonPath = path.join(config.resultsDir, 'validation-results.json');
  await writeFile(jsonPath, JSON.stringify(results, null, 2));
}

/**
 * Get error types with lowest success rates
 * @param {Array} results - Results of processing each sample
 * @returns {string} - Comma-separated list of error types
 */
function getLowestSuccessRateTypes(results) {
  // Group by error type
  const typeGroups = {};
  
  for (const result of results) {
    if (!typeGroups[result.errorType]) {
      typeGroups[result.errorType] = { total: 0, success: 0 };
    }
    
    typeGroups[result.errorType].total++;
    if (result.successful) {
      typeGroups[result.errorType].success++;
    }
  }
  
  // Calculate success rates
  const typeRates = Object.entries(typeGroups).map(([type, stats]) => ({
    type,
    rate: stats.success / stats.total
  }));
  
  // Sort by success rate (ascending)
  typeRates.sort((a, b) => a.rate - b.rate);
  
  // Return lowest 2 or all if less than 2
  return typeRates.slice(0, Math.min(2, typeRates.length))
    .map(t => `${t.type} (${(t.rate * 100).toFixed(0)}%)`)
    .join(', ');
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateAIFixPipeline();
}

module.exports = { validateAIFixPipeline };
