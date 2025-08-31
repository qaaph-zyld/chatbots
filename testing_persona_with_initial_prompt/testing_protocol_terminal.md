# Testing Protocol: Terminal Operations and Test Verification

## Strict Protocol for All Test Runs

1. Run the command with proper output redirection
2. Save output to a specific file in test-results directory
3. Wait for 60 seconds to ensure test completion
4. Check the output file after 60 seconds
5. Analyze the output and proceed accordingly
6. If the file is missing, try other ways to get the output
7. Do not claim tests are passing until you paste the exact summary lines from the output (e.g. 'Test Suites: 2 failed, 2 total')
8. Update comprehensive_testing_results.md after each test run

## Error Handling in Tests

1. Always use try/catch blocks around async operations in tests
2. Ensure all Promise-returning functions are properly awaited
3. Use .mockResolvedValue() instead of .mockImplementation() for cleaner Promise mocks
4. Add explicit error assertions for expected failure cases

## Mock Implementation Standards

1. Use jest.doMock() for more reliable mocking of modules
2. Place all mocks before any imports in test files
3. Reset all mocks in beforeEach() to prevent test interference
4. Use consistent mock patterns across all test files
5. Ensure mock paths are correct and consistent (e.g., '../../../src/utils/logger')

## Test Isolation Guidelines

1. Reset all mocks between tests using jest.clearAllMocks()
2. Save and restore environment variables that tests may modify
3. Use unique identifiers for test data to prevent collisions
4. Clean up any resources created during tests in afterEach() or afterAll()
Note: Latest test output for auth.middleware.test.js:
Test Suites: 2 failed, 2 total
Tests: 2 failed, 8 passed, 10 total
Snapshots: 0 total
Time: 62.888 s
Ran all test suites matching /src\tests\unit\auth\auth.middleware.test.js/i.
Note: Actual test output shows failures; do not proceed until all failures are fixed and output is verified.

Working Test Command
For future test runs, we should use the following command pattern to ensure proper output capture:

powershell
powershell -Command "npm test -- [test-file-path] --verbose *> test-results/[test-name]-output.txt"

## Critical Rules

1. **NEVER assume tests pass without explicit verification**
   - Always verify test completion by checking for Jest summary statistics (e.g., "Test Suites: X passed, X total")
   - Never declare tests as passing without this explicit confirmation
   - If test output is incomplete, treat test status as INDETERMINATE

2. **Properly handle async operations**
   - Return Promises from test functions for proper async handling
   - Use explicit timeouts for long-running operations
   - Implement proper cleanup in afterEach/afterAll hooks

3. **Supertest best practices**
   - Always use .end() with callback for proper connection closure
   - Move assertions inside the callback to ensure execution
   - Return Promise from test function for proper async handling
   - Clean up Express app instances after each test

1. **No Proceeding Without Complete Output**: We cannot move forward without seeing the exact Jest summary
2. **60-Second Wait Mandatory**: Always wait the full 60 seconds before checking files
3. **Exact Text Required**: Must paste the exact summary lines from the output
4. **Multiple Verification Methods**: Use at least 2 different capture methods
5. **File Size Verification**: Ensure output files are not empty or truncated
6. **MANDATORY WORKFLOW RULE**: Always wait for test completion and check test-results/manual-test-results.txt before proceeding. This is now a non-negotiable part of the workflow.

## Expected Success Output Format

We need to see exactly this format in the output:
```
Test Suites: 1 passed, 1 total
Tests: 3 passed, 3 total
Snapshots: 0 total
Time: 15.03 s
Ran all test suites matching /src\\tests\\unit\\auth\\auth.middleware.test.js/i.
```

Only when we have this exact format can we proceed with confidence about the test status.

**Key aspects of this plan:**

1. **Multiple Capture Methods**: Uses `tee`, redirection, and JSON output to ensure we get complete results
2. **60-Second Wait**: Mandatory waiting period before checking output files
3. **Verification Requirements**: Must see exact Jest summary lines before proceeding
4. **Fallback Methods**: Multiple alternatives if primary methods fail
5. **No Assumptions Rule**: Cannot proceed without seeing the exact test summary

The plan specifically addresses the issue in your screenshot where the output file only contains database connection logs but is missing the crucial Jest summary with test counts.
