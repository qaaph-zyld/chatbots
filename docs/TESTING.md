# Comprehensive Testing Guide

This document provides detailed instructions for running tests and achieving our target of 99% test coverage for the Chatbots Platform.

## Test Coverage Goals

| Test Type | Target Coverage |
|-----------|----------------|
| Statements | 99% |
| Branches | 95% |
| Functions | 99% |
| Lines | 99% |

## Setting Up Test Environment

Before running tests, ensure your environment is properly configured:

```bash
# Install all dependencies including dev dependencies
npm install

# If you encounter network issues on corporate networks, use the proxy for installation:
npm config set proxy http://104.129.196.38:10563
npm config set https-proxy http://104.129.196.38:10563
npm install

# After installation, you can reset the proxy settings if needed:
npm config delete proxy
npm config delete https-proxy
```

## Running Tests

### Quick Start

To run all tests and generate a comprehensive coverage report:

```bash
npm run test:all
```

This command will execute all test types and generate a detailed report in the `test-reports` directory.

### Test Types

We have several types of tests to ensure comprehensive coverage:

#### Unit Tests

Test individual components in isolation:

```bash
npm run test:unit
```

#### Integration Tests

Test interactions between components:

```bash
npm run test:integration
```

#### End-to-End Tests

Test complete user flows:

```bash
npm run test:e2e
```

#### UI Tests

Test UI components using Playwright:

```bash
npm run test:ui
```

#### Security Tests

Test for security vulnerabilities:

```bash
npm run test:security
```

#### Performance Tests

Test system performance under load:

```bash
npm run test:performance
```

#### Accessibility Tests

Test compliance with accessibility standards:

```bash
npm run test:accessibility
```

### Coverage Reports

Generate different types of coverage reports:

```bash
# Generate HTML coverage report
npm run test:coverage:html

# Generate JSON summary
npm run test:coverage:json

# Generate LCOV report for CI tools
npm run test:coverage:lcov

# Run tests with strict coverage thresholds
npm run test:coverage:threshold
```

## Analyzing Test Gaps

To identify gaps in test coverage:

```bash
npm run test:gap-analysis
```

This will generate a report in `test-reports/test-gaps.md` highlighting:

1. Files without tests
2. Exported functions without tests
3. Recommendations for improving coverage

## Continuous Integration

Our CI pipeline is configured to run tests and enforce coverage thresholds:

1. Pull requests trigger unit and critical integration tests
2. Merges to main branch run the full test suite
3. Nightly builds run extended tests including performance and security

## Writing Effective Tests

Follow these guidelines to write effective tests:

### Unit Tests

- Test each function for normal operation, edge cases, and error handling
- Mock all dependencies
- Aim for 100% branch coverage

Example:

```javascript
describe('documentationService.getDocumentationItem', () => {
  it('should return item with content and HTML', async () => {
    // Arrange
    const mockItem = { id: 'test-item', category: 'getting-started' };
    dbUtils.getDocumentationItem.mockResolvedValue(mockItem);
    fs.readFile.mockResolvedValue('# Test content');
    
    // Act
    const result = await documentationService.getDocumentationItem('test-item');
    
    // Assert
    expect(result).toEqual({
      ...mockItem,
      content: '# Test content',
      htmlContent: expect.any(String)
    });
  });
  
  it('should throw error if item not found', async () => {
    // Arrange
    dbUtils.getDocumentationItem.mockResolvedValue(null);
    
    // Act & Assert
    await expect(documentationService.getDocumentationItem('missing'))
      .rejects.toThrow('Documentation item missing not found');
  });
});
```

### Integration Tests

- Focus on interactions between components
- Test API endpoints with various inputs
- Verify database operations

### E2E Tests

- Test critical user journeys
- Verify UI interactions
- Test across different browsers and devices

## Troubleshooting

### Common Issues

1. **Dependency installation failing due to network issues**
   - If you're on a corporate network and experiencing installation issues, use the proxy:
   ```bash
   npm config set proxy http://104.129.196.38:10563
   npm config set https-proxy http://104.129.196.38:10563
   npm install
   ```
   - Remember to reset proxy settings after installation if needed:
   ```bash
   npm config delete proxy
   npm config delete https-proxy
   ```

2. **Timeouts in API tests**
   - Increase timeout in Jest configuration
   - Check for network connectivity issues

3. **Browser tests failing**
   - Ensure browsers are installed for Playwright
   - Run `npx playwright install` to install required browsers

## Conclusion

Following this guide will help us achieve and maintain our target of 99% test coverage. Regular testing is essential to ensure the quality and reliability of our Chatbots Platform.

For any questions or issues with testing, please contact the QA team.
