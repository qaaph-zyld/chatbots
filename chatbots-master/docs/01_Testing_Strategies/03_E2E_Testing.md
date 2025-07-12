# End-to-End Testing

This document outlines the end-to-end (E2E) testing approach for the Chatbots project, aligned with the `dev_framework` principles.

## Overview

End-to-end testing verifies that the entire application works correctly from the user's perspective. These tests simulate real user scenarios across the complete application stack, including frontend, backend, database, and external integrations.

## Testing Framework

We use the following tools for E2E testing:

- **Cypress**: Primary E2E testing framework for web interfaces
- **Playwright**: For cross-browser testing and more complex scenarios
- **Postman/Newman**: For API workflow testing
- **TestCafe**: For specific UI testing scenarios (optional)

## Directory Structure

E2E tests are organized in a dedicated directory structure:

```
/tests
├── e2e/
│   ├── cypress/
│   │   ├── fixtures/        # Test data
│   │   ├── integration/     # Test specs
│   │   │   ├── auth/        # Authentication tests
│   │   │   ├── chatbot/     # Chatbot functionality tests
│   │   │   └── admin/       # Admin panel tests
│   │   ├── plugins/         # Cypress plugins
│   │   └── support/         # Support files and commands
│   ├── playwright/
│   │   ├── tests/           # Playwright test specs
│   │   ├── fixtures/        # Test data
│   │   └── utils/           # Helper utilities
│   └── api/
│       ├── collections/     # Postman collections
│       └── environments/    # Postman environments
```

## Test Scenarios

E2E tests cover key user journeys and critical paths through the application:

### User Authentication Flows

- User registration
- Login/logout
- Password reset
- Account management
- OAuth authentication

### Chatbot Interaction Flows

- Initiating conversations
- Basic Q&A scenarios
- Complex conversation paths
- Handoff to human agents
- File uploads and attachments

### Admin and Management Flows

- Dashboard navigation
- Chatbot configuration
- Analytics reporting
- User management
- System settings

## Example Test

```javascript
// Cypress example for testing user login
describe('User Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should login successfully with valid credentials', () => {
    // Enter valid credentials
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('Password123!');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Verify successful login
    cy.url().should('include', '/dashboard');
    cy.get('.user-welcome').should('contain', 'Welcome, Test User');
    
    // Verify local storage token
    cy.window().then((window) => {
      expect(window.localStorage.getItem('auth_token')).to.exist;
    });
  });

  it('should show error message with invalid credentials', () => {
    // Enter invalid credentials
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('WrongPassword123!');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Verify error message
    cy.get('.error-message').should('be.visible');
    cy.get('.error-message').should('contain', 'Invalid email or password');
    
    // Verify URL remains on login page
    cy.url().should('include', '/login');
  });

  it('should navigate to forgot password page', () => {
    cy.get('a[href*="forgot-password"]').click();
    cy.url().should('include', '/forgot-password');
  });
});
```

## Test Environment

E2E tests run in environments that closely resemble production:

- **Staging Environment**: Dedicated environment for E2E testing
- **Test Data**: Consistent test data across test runs
- **External Dependencies**: Mock or controlled versions of external services
- **Database Seeding**: Automated database seeding before test runs

## Test Execution Strategy

### Local Development

- Developers can run E2E tests locally against development environments
- Visual mode for debugging and test authoring
- Headless mode for faster execution

### CI/CD Pipeline

- E2E tests run automatically in the CI/CD pipeline
- Run after unit and integration tests
- Parallelized execution for faster feedback
- Video recordings and screenshots for failed tests

## Cross-Browser Testing

We test across multiple browsers to ensure compatibility:

- Chrome (primary)
- Firefox
- Safari
- Edge

## Mobile Testing

For mobile web and app interfaces:

- Responsive design testing
- Mobile emulation
- Device-specific testing for critical paths
- Native app testing with Appium (if applicable)

## Performance Considerations

- **Test Timeouts**: Appropriate timeouts for network operations
- **Test Retries**: Automatic retries for flaky tests
- **Resource Monitoring**: Track resource usage during tests
- **Execution Time**: Monitor and optimize test execution time

## Best Practices

1. **Focus on critical paths**: Prioritize testing of key user journeys
2. **Stable selectors**: Use data-testid attributes for stable element selection
3. **Realistic data**: Use realistic test data that mimics production scenarios
4. **Independent tests**: Each test should be independent and not rely on other tests
5. **Clean state**: Start each test with a clean, known state
6. **Appropriate assertions**: Test for the right things at the right level
7. **Visual verification**: Include visual testing for UI components
8. **Accessibility testing**: Incorporate accessibility checks in E2E tests

## Handling Test Flakiness

- **Retry mechanisms**: Automatically retry flaky tests
- **Consistent timing**: Use proper waiting strategies instead of fixed delays
- **Isolation**: Ensure tests don't interfere with each other
- **Logging**: Comprehensive logging for debugging failures
- **Quarantine**: Separate known flaky tests for investigation

## Continuous Improvement

- **Test analytics**: Track test reliability and execution time
- **Coverage analysis**: Identify gaps in E2E test coverage
- **Failure analysis**: Regular review of test failures and patterns
- **Framework updates**: Keep testing frameworks and libraries updated

## Related Documentation

- [TESTING.md](../TESTING.md) - General testing documentation
- [TESTING_STRATEGY.md](../TESTING_STRATEGY.md) - Overall testing strategy
- [COMPREHENSIVE_TEST_PLAN.md](../COMPREHENSIVE_TEST_PLAN.md) - Comprehensive test plan
