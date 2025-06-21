/**
 * Script to run validation tests for the TestAutomationRunner
 */
const path = require('path');
const { TestAutomationRunner } = require('../auto-test-runner');
const { OllamaServiceConnector } = require('../ai-integration/OllamaServiceConnector');
const { APIKeyManager } = require('../ai-integration/APIKeyManager');

// Create API key manager
const apiKeyManager = new APIKeyManager({
  configPath: path.join(__dirname, '../config/api-keys.json'),
  encryptionKey: 'test-automation-validation-key',
  createIfNotExists: true
});

async function runValidationTests() {
  console.log('Starting TestAutomationRunner validation tests...');
  
  // Create TestAutomationRunner instance
  const runner = new TestAutomationRunner({
    testCommand: 'npx jest --json --outputFile=test-results/jest-results.json test-results/sample-tests/calculator.test.js',
    outputDir: path.join(__dirname, 'output'),
    maxRetries: 2,
    networkTimeoutMs: 30000, // Increased from 10000ms to 30000ms to prevent timeout issues
    aiFixEnabled: true,
    fixManagementEnabled: true,
    aiServiceConnector: new OllamaServiceConnector({
      apiKeyManager,
      modelName: 'codellama', // Adjust based on available models
      baseUrl: 'http://localhost:11434', // Default Ollama URL
      apiOptions: {
        temperature: 0.2,
        max_tokens: 2048
      }
    }),
    codebasePath: path.join(__dirname, '..'),
    aiOptions: {
      dryRun: false // Set to true to prevent actual code changes
    },
    fixManagementOptions: {
      backupDir: path.join(__dirname, 'backups'),
      feedbackFile: path.join(__dirname, 'fix-feedback.json'),
      autoRevertFailedFixes: true
    }
  });

  try {
    // Run tests with auto fix
    console.log('Running tests with auto fix...');
    const result = await runner.runTestsWithAutoFix();
    
    console.log('\n--- Test Run Summary ---');
    console.log(`Run ID: ${result.runId}`);
    console.log(`Success: ${result.success}`);
    console.log(`Retry Count: ${result.retryCount}`);
    console.log(`Fix Attempts: ${result.fixAttempts}`);
    console.log(`Log File: ${result.logSummary?.logFile}`);
    console.log(`JSON Results: ${result.logSummary?.jsonResultFile}`);
    
    // Return results for further analysis
    return result;
  } catch (error) {
    console.error('Error running validation tests:', error);
    throw error;
  }
}

// Run the validation tests
runValidationTests()
  .then(result => {
    console.log('Validation tests completed successfully');
  })
  .catch(error => {
    console.error('Validation tests failed:', error);
    process.exit(1);
  });
