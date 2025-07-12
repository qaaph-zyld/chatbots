# Standardized Test Result Format

This document defines the standardized format that all test result parsers must produce. This ensures consistency across different test frameworks and allows the test automation system to work with any supported test framework.

## Top-Level Structure

```javascript
{
  "summary": {
    "success": boolean,         // Overall success status
    "totalTests": number,       // Total number of tests
    "passedTests": number,      // Number of passed tests
    "failedTests": number,      // Number of failed tests
    "skippedTests": number,     // Number of skipped tests
    "duration": number,         // Total duration in milliseconds
    "startTime": string,        // ISO timestamp of test start
    "endTime": string          // ISO timestamp of test end
  },
  "testSuites": [              // Array of test suites
    {
      "name": string,          // Suite name
      "filePath": string,      // Path to test file
      "duration": number,      // Duration in milliseconds
      "status": string,        // "passed", "failed", or "skipped"
      "tests": [               // Array of tests in this suite
        {
          "id": string,        // Unique test identifier
          "name": string,      // Test name/description
          "fullName": string,  // Full test path (suite + test name)
          "status": string,    // "passed", "failed", or "skipped"
          "duration": number,  // Duration in milliseconds
          "lineNumber": number, // Line number in file (if available)
          "error": {           // Present only for failed tests
            "message": string, // Error message
            "stack": string,   // Stack trace
            "diff": string,    // Diff output (if available)
            "type": string     // Error type (e.g., "AssertionError")
          }
        }
        // ... more tests
      ]
    }
    // ... more test suites
  ],
  "coverage": {                // Optional coverage information
    "statements": {
      "total": number,
      "covered": number,
      "percentage": number
    },
    "branches": {
      "total": number,
      "covered": number,
      "percentage": number
    },
    "functions": {
      "total": number,
      "covered": number,
      "percentage": number
    },
    "lines": {
      "total": number,
      "covered": number,
      "percentage": number
    },
    "files": [                 // Per-file coverage details
      {
        "path": string,
        "statements": number,  // Percentage
        "branches": number,    // Percentage
        "functions": number,   // Percentage
        "lines": number        // Percentage
      }
      // ... more files
    ]
  },
  "metadata": {                // Additional metadata
    "framework": string,       // Test framework name (e.g., "jest", "mocha")
    "version": string,         // Framework version
    "config": object,          // Framework-specific configuration
    "environment": {           // Test environment information
      "node": string,          // Node.js version
      "os": string            // Operating system
    }
  }
}
```

## Test Status Values

- `"passed"`: Test completed successfully
- `"failed"`: Test failed
- `"skipped"`: Test was skipped (e.g., marked with `.skip()` or `xit()`)
- `"todo"`: Test is marked as todo/pending (framework-specific)
- `"timedOut"`: Test timed out

## Error Object Structure

The error object for failed tests should contain:

- `message`: The main error message
- `stack`: Full stack trace if available
- `diff`: Visual diff for assertion failures if available
- `type`: Error type (e.g., "AssertionError", "TypeError")
- `actual`: Actual value in assertion (if applicable)
- `expected`: Expected value in assertion (if applicable)

## Framework-Specific Extensions

Test frameworks may include additional data beyond this standardized format. These should be placed in a framework-specific namespace within the metadata section:

```javascript
"metadata": {
  "framework": "jest",
  "jest": {
    // Jest-specific data
  }
}
```

## Usage Notes

- All parsers must implement the `ITestResultParser` interface
- Duration values are always in milliseconds
- File paths should be normalized to use forward slashes
- Test IDs should be unique across the entire test run
- The `fullName` should provide the complete path to identify a test (e.g., "Suite > Nested Suite > Test Name")
