# Unit Tests

This directory contains unit tests for the chatbot platform.

## Structure

- `bot/`: Tests for bot components (engines, templates, NLP)
- `api/`: Tests for API controllers and routes
- `services/`: Tests for service layer components
- `utils/`: Tests for utility functions

## Running Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- src/tests/unit/bot/engines/base.engine.test.js

# Run with coverage report
npm test -- --coverage
```

## Best Practices

1. Each test file should focus on a single module or component
2. Use descriptive test names that explain the expected behavior
3. Follow the AAA pattern (Arrange, Act, Assert)
4. Mock external dependencies
5. Maintain at least 80% code coverage
