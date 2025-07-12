# Integration Tests

This directory contains integration tests for the chatbot platform.

## Structure

- `api/`: Tests for API endpoints
- `database/`: Tests for database operations
- `bot/`: Tests for bot components working together
- `e2e/`: End-to-end tests for complete user flows

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- src/tests/integration/api/chatbot.test.js

# Run with coverage report
npm run test:integration -- --coverage
```

## Best Practices

1. Use a test database for integration tests
2. Clean up test data after each test
3. Test complete workflows rather than individual functions
4. Focus on component interactions
5. Use realistic test data that mimics production scenarios
6. Test error conditions and edge cases
