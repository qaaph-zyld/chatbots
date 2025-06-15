# Integration Testing

This document outlines the integration testing approach for the Chatbots project, aligned with the `dev_framework` principles.

## Overview

Integration testing verifies that different modules or services work together correctly. While unit tests focus on isolated components, integration tests ensure that components interact properly when combined.

## Testing Framework

We use **Jest** as our primary testing framework for integration tests, with additional libraries for specific testing needs:

- **Supertest**: For HTTP API testing
- **MongoDB Memory Server**: For database integration tests
- **Redis Mock**: For Redis integration tests

## Directory Structure

Integration tests are organized in a dedicated directory structure:

```
/tests
├── integration/
│   ├── setup/
│   │   └── jest-integration-setup.js  # Integration test configuration
│   ├── api/
│   │   └── [endpoint].test.js         # API endpoint tests
│   ├── services/
│   │   └── [service].integration.test.js # Service integration tests
│   ├── database/
│   │   └── [model].integration.test.js # Database integration tests
│   └── middleware/
│       └── [middleware].integration.test.js # Middleware integration tests
```

## Test File Naming Convention

Integration test files follow the naming convention of `[filename].integration.test.js` to distinguish them from unit tests.

## Integration Testing Strategies

### API Integration Tests

API integration tests verify that API endpoints work correctly end-to-end, including:

- Request validation
- Route handling
- Controller logic
- Service interactions
- Database operations
- Response formatting

Example:

```javascript
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const UserModel = require('../../src/models/user.model');

describe('User API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_MONGODB_URI);
  });

  afterAll(async () => {
    // Disconnect from test database
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear test data
    await UserModel.deleteMany({});
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe(userData.username);
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty('password');

      // Verify user was created in database
      const userInDb = await UserModel.findOne({ email: userData.email });
      expect(userInDb).not.toBeNull();
    });

    it('should return 400 for invalid user data', async () => {
      const invalidUserData = {
        username: 'testuser',
        // Missing email
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUserData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
```

### Service Integration Tests

Service integration tests verify that services work correctly with their dependencies, such as:

- Other services
- Database models
- External APIs
- Caching layers

### Database Integration Tests

Database integration tests verify that models and repositories work correctly with the database, including:

- Schema validation
- CRUD operations
- Indexes
- Transactions
- Migration scripts

### Middleware Integration Tests

Middleware integration tests verify that middleware functions work correctly in the request-response cycle, including:

- Authentication
- Authorization
- Request validation
- Error handling
- Logging

## Test Environment

Integration tests run in a controlled environment that mimics production but is isolated:

- **Test Database**: In-memory MongoDB instance or dedicated test database
- **Test Redis**: In-memory Redis instance or mock
- **Test Configuration**: Environment-specific configuration for testing
- **Mock External Services**: Mock or stub external API calls

## Data Management

- **Test Data Setup**: Create necessary test data before tests
- **Test Data Cleanup**: Clean up test data after tests
- **Test Data Isolation**: Ensure tests don't interfere with each other

## Running Integration Tests

To run integration tests:

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npm run test:integration -- path/to/test-file.integration.test.js

# Run with coverage report
npm run test:coverage:integration
```

## Integration with CI/CD

Integration tests are automatically run as part of our CI/CD pipeline. They run after unit tests and before end-to-end tests.

## Best Practices

1. **Focus on integration points**: Test the interactions between components
2. **Use realistic data**: Test with data that resembles production data
3. **Test error handling**: Verify that errors are handled correctly
4. **Minimize mocking**: Use real dependencies where possible
5. **Control external dependencies**: Use controlled versions of external services
6. **Clean up after tests**: Leave the test environment clean for the next test

## Related Documentation

- [TESTING.md](../TESTING.md) - General testing documentation
- [TESTING_STRATEGY.md](../TESTING_STRATEGY.md) - Overall testing strategy
- [COMPREHENSIVE_TEST_PLAN.md](../COMPREHENSIVE_TEST_PLAN.md) - Comprehensive test plan
