# Unit Testing Approach

This document outlines the unit testing approach for the Chatbots project, aligned with the `dev_framework` principles.

## Overview

Unit testing is a critical component of our development process, ensuring that individual components function correctly in isolation. Our approach focuses on comprehensive coverage, meaningful assertions, and maintainable test code.

## Testing Framework

We use **Jest** as our primary testing framework for unit tests. Jest provides a robust set of features including:

- Fast parallel test execution
- Built-in assertion library
- Mocking capabilities
- Code coverage reporting

## Directory Structure

Unit tests are organized to mirror the source code structure:

```
/tests
├── unit/
│   ├── setup/
│   │   └── jest-setup.js     # Jest configuration and global setup
│   ├── services/
│   │   └── [service].test.js # Tests for service modules
│   ├── models/
│   │   └── [model].test.js   # Tests for data models
│   ├── controllers/
│   │   └── [controller].test.js # Tests for controllers
│   └── utils/
│       └── [util].test.js    # Tests for utility functions
```

## Test File Naming Convention

Test files should follow the naming convention of `[filename].test.js` to ensure they are automatically discovered by Jest.

## Writing Effective Unit Tests

### Best Practices

1. **Test in isolation**: Mock dependencies to ensure true unit testing
2. **Single responsibility**: Each test should verify one specific behavior
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
4. **Descriptive test names**: Use clear, descriptive names that explain the expected behavior
5. **Avoid test interdependence**: Tests should not depend on the state from other tests

### Example Test

```javascript
// Example unit test for a service
const { safeCompileModel } = require('@src/utils/mongoose-model-helper');
const UserService = require('@src/services/user.service');
const UserModel = require('@src/models/user.model');

// Mock dependencies
jest.mock('@src/models/user.model');
jest.mock('@src/utils/logger');

describe('UserService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const userData = { username: 'testuser', email: 'test@example.com' };
      const savedUser = { ...userData, _id: 'user123' };
      
      UserModel.create.mockResolvedValue(savedUser);

      // Act
      const result = await UserService.createUser(userData);

      // Assert
      expect(UserModel.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual(savedUser);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const userData = { username: 'testuser' }; // Missing required email
      const validationError = new Error('Validation error');
      validationError.name = 'ValidationError';
      
      UserModel.create.mockRejectedValue(validationError);

      // Act & Assert
      await expect(UserService.createUser(userData)).rejects.toThrow('Invalid user data');
    });
  });
});
```

## Test Coverage

We aim for high test coverage, with a minimum threshold of:

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

Coverage reports are generated automatically during test runs and can be viewed in the `/coverage` directory.

## Running Tests

To run unit tests:

```bash
# Run all unit tests
npm run test:unit

# Run specific test file
npm run test:unit -- path/to/test-file.test.js

# Run with coverage report
npm run test:coverage
```

## Integration with CI/CD

Unit tests are automatically run as part of our CI/CD pipeline. Pull requests cannot be merged if unit tests are failing or if coverage drops below the defined thresholds.

## Related Documentation

- [TESTING.md](../TESTING.md) - General testing documentation
- [TESTING_STRATEGY.md](../TESTING_STRATEGY.md) - Overall testing strategy
- [COMPREHENSIVE_TEST_PLAN.md](../COMPREHENSIVE_TEST_PLAN.md) - Comprehensive test plan
