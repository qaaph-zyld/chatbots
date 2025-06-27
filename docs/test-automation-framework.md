# AI-Enhanced Test Automation Framework

## Overview

This framework provides a robust solution for automated test execution with intelligent failure recovery. It combines traditional test automation with AI-driven analysis and fix generation to streamline the testing process.

## Key Features

- **Robust Test Execution**: Configurable test runner with support for Jest and Mocha
- **Intelligent Error Analysis**: AI-powered test failure analysis
- **Automatic Fix Generation**: Suggests and applies fixes for common test failures
- **Comprehensive Logging**: Structured logging with different log levels
- **Network Error Handling**: Detection and recovery from network-related issues
- **Test Categorization**: Organize and prioritize tests by category
- **Analytics**: Track test execution history and generate reports

## Architecture

The framework consists of several core components:

1. **TestAutomationRunner**: Main orchestrator for the test execution workflow
2. **TestExecutor**: Handles test execution and result collection
3. **ResultAnalyzer**: Parses and analyzes test results
4. **FixApplier**: Applies AI-generated fixes to failing tests
5. **CommandExecutor**: Robust command execution with error handling and progress monitoring
6. **TestLogger**: Structured logging with different log levels
7. **NetworkErrorDetector**: Detection and handling of network-related issues
8. **AIFixEngine**: AI-powered analysis and fix generation
9. **Test Parsers**: Framework-specific result parsers (Jest, Mocha)

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher
- Jest or Mocha test framework

### Installation

```bash
npm install --save-dev test-automation-framework
```

### Basic Usage

```javascript
const { TestAutomationRunner } = require('./auto-test-runner');

// Create a runner instance with default options
const runner = new TestAutomationRunner({
  testCommand: 'npx jest',
  outputDir: './test-results',
  maxRetries: 3
});

// Run tests with automatic fix generation
runner.runTestsWithAutoFix()
  .then(result => {
    console.log('Test execution completed:', result.success ? 'SUCCESS' : 'FAILURE');
  })
  .catch(error => {
    console.error('Error during test execution:', error);
  });
```

## Configuration Options

The `TestAutomationRunner` accepts the following configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `testCommand` | string | 'npm test' | Command to execute tests |
| `outputDir` | string | './test-results' | Directory for output files |
| `maxRetries` | number | 3 | Maximum number of retry attempts |
| `networkTimeoutMs` | number | 120000 | Network timeout in milliseconds |
| `aiFixEnabled` | boolean | true | Enable AI-driven fix generation |
| `testFramework` | string | 'jest' | Test framework ('jest' or 'mocha') |
| `categorizationEnabled` | boolean | true | Enable test categorization |
| `analyticsEnabled` | boolean | true | Enable test analytics |
| `fixManagementEnabled` | boolean | true | Enable fix management |
| `autoRevertFailedFixes` | boolean | true | Automatically revert failed fixes |
| `useFeedbackLoop` | boolean | true | Use feedback loop for fix improvement |
| `generateReportAfterRun` | boolean | false | Generate report after test run |
| `codebasePath` | string | process.cwd() | Path to codebase root |

### Advanced Configuration

#### AI Service Configuration

```javascript
const runner = new TestAutomationRunner({
  // ... basic options
  aiOptions: {
    model: 'codellama:7b-instruct',  // Default AI model
    provider: 'ollama',               // AI provider (ollama, huggingface)
    apiKey: process.env.AI_API_KEY,   // API key if needed
    temperature: 0.7,                 // Model temperature
    maxTokens: 2048,                  // Maximum tokens for response
    timeout: 30000                    // Request timeout in milliseconds
  }
});
```

#### Test Categorization Configuration

```javascript
const runner = new TestAutomationRunner({
  // ... basic options
  categorizationEnabled: true,
  categories: ['unit', 'integration'],  // Only run tests in these categories
  priorities: ['high', 'medium'],       // Only run tests with these priorities
  categorizationOptions: {
    tagPattern: /@(\w+)/,               // Pattern to extract tags from test names
    priorityPattern: /@priority:(\w+)/  // Pattern to extract priority from test names
  }
});
```

## Command Line Interface

The framework can be used from the command line:

```bash
node auto-test-runner.js --command="npx jest" --output="./test-results" --retries=3 --ai=true
```

### CLI Arguments

| Argument | Description |
|----------|-------------|
| `--command`, `-c` | Test command to execute |
| `--output`, `-o` | Output directory for logs and results |
| `--retries`, `-r` | Maximum number of retry attempts |
| `--timeout`, `-t` | Network timeout in milliseconds |
| `--ai`, `-a` | Enable/disable AI fix generation (true/false) |
| `--framework`, `-f` | Test framework (jest/mocha) |
| `--categories` | Comma-separated list of test categories to run |
| `--priorities` | Comma-separated list of test priorities to run |
| `--help`, `-h` | Show help information |

## AI Integration

The framework supports integration with various AI models for test failure analysis and fix generation:

### Local Models (Ollama)

```javascript
const runner = new TestAutomationRunner({
  // ... other options
  aiOptions: {
    provider: 'ollama',
    model: 'codellama:7b-instruct',
    endpoint: 'http://localhost:11434/api/generate'
  }
});
```

### Open Source Models (Hugging Face)

```javascript
const runner = new TestAutomationRunner({
  // ... other options
  aiOptions: {
    provider: 'huggingface',
    model: 'bigcode/starcoder',
    apiKey: process.env.HUGGINGFACE_API_KEY
  }
});
```

## Validation Suite

The framework includes a comprehensive validation suite to ensure proper functionality:

```bash
node test-results/validation/comprehensive-suite.js
```

This will run a series of tests to validate:
- Baseline test execution (should pass)
- Failing test handling (should fail)
- AI fix generation (should attempt fix)

## Extending the Framework

### Creating Custom Test Parsers

```javascript
class CustomTestParser {
  constructor(options = {}) {
    this.options = options;
  }

  parse(testOutput) {
    // Parse test output and return structured results
    return {
      success: true,
      tests: [],
      // ... other result properties
    };
  }
}

// Use the custom parser
const runner = new TestAutomationRunner({
  // ... other options
  parser: new CustomTestParser()
});
```

### Creating Custom AI Fix Engines

```javascript
class CustomAIFixEngine {
  constructor(options = {}) {
    this.options = options;
  }

  async analyzeProblem(testOutput, failedTests = [], parsedResults = null) {
    // Analyze test failures and generate recommendations
    return {
      recommendations: []
    };
  }

  async applyFixes(recommendations, parsedResults = null) {
    // Apply fixes to the codebase
    return {
      success: true,
      appliedFixes: []
    };
  }
}

// Use the custom AI fix engine
const runner = new TestAutomationRunner({
  // ... other options
  aiFixEngine: new CustomAIFixEngine()
});
```

## Robust Command Execution

The framework includes a robust command execution module that ensures reliable command execution across different platforms.

### CommandExecutor

The `CommandExecutor` class provides a high-level interface for executing commands with advanced features:

```javascript
const { CommandExecutor } = require('../test-utils/command-executor');

const executor = new CommandExecutor({
  outputDir: './test-results',
  defaultTimeout: 60000,  // 60 seconds
  progressTimeout: 5000,   // 5 seconds for progress checks
  verbose: true            // Enable verbose logging
});

// Execute a command
async function runTest() {
  try {
    const result = await executor.runCommand('npm', ['test']);
    console.log(`Command exited with code ${result.code}`);
    console.log(`Output: ${result.stdout}`);
    
    // Access output files
    console.log(`Stdout file: ${result.stdoutFile}`);
    console.log(`Stderr file: ${result.stderrFile}`);
    console.log(`Status file: ${result.statusFile}`);
  } catch (error) {
    console.error('Command execution failed:', error);
  }
}
```

### Features

- **Cross-Platform Compatibility**: Works reliably on Windows, macOS, and Linux
- **Real-Time Output Streaming**: Captures stdout and stderr in real-time
- **Automatic Timeout Handling**: Configurable timeouts with automatic process termination
- **Progress Monitoring**: Detects and handles command hangs
- **Detailed Status Tracking**: Generates status files with execution details
- **Command History**: Maintains a history of executed commands
- **Error Handling**: Robust error handling with detailed error information
- **File Output**: Automatically saves command output to files

### Low-Level API

For more control, you can use the low-level `runCommand` function directly:

```javascript
const { runCommand } = require('../scripts/robust-command-runner');

async function executeCommand() {
  try {
    const result = await runCommand('node', ['-e', 'console.log("Hello World")'], {
      cwd: process.cwd(),
      timeout: 30000,
      outputDir: './test-results',
      statusFilename: 'custom-status.json',
      stdoutFilename: 'custom-stdout.txt',
      stderrFilename: 'custom-stderr.txt'
    });
    
    console.log('Command result:', result);
  } catch (error) {
    console.error('Command failed:', error);
  }
}
```

## CI/CD Integration

The test automation framework is designed to integrate seamlessly with CI/CD pipelines.

### GitHub Actions Integration

Create a GitHub Actions workflow file (`.github/workflows/test.yml`):

```yaml
name: Test Automation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run automated tests
      run: node auto-test-runner.js --command="npx jest" --output="./test-results" --retries=3
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      with:
        name: test-results
        path: ./test-results
        if-no-files-found: warn
```

### Jenkins Integration

Create a `Jenkinsfile` in your project root:

```groovy
pipeline {
    agent {
        docker {
            image 'node:16'
        }
    }
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Test') {
            steps {
                sh 'node auto-test-runner.js --command="npx jest" --output="./test-results" --retries=3'
            }
        }
        
        stage('Report') {
            steps {
                archiveArtifacts artifacts: 'test-results/**', fingerprint: true
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}
```

### Azure DevOps Integration

Create an `azure-pipelines.yml` file:

```yaml
trigger:
  - main
  - develop

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '16.x'
  displayName: 'Install Node.js'

- script: npm ci
  displayName: 'Install dependencies'

- script: node auto-test-runner.js --command="npx jest" --output="./test-results" --retries=3
  displayName: 'Run automated tests'

- task: PublishBuildArtifacts@1
  inputs:
    pathtoPublish: './test-results'
    artifactName: 'test-results'
  displayName: 'Publish test results'
```

## License

MIT
