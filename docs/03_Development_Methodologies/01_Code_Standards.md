# Code Standards

This document outlines the coding standards and style guidelines for the Chatbots project, aligned with the `dev_framework` principles.

## Overview

Consistent coding standards are essential for maintaining a high-quality, maintainable codebase. These standards ensure that all team members write code in a consistent style, making it easier to read, review, and maintain.

## JavaScript/Node.js Standards

### Style Guide

We follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) with some project-specific modifications. Key points include:

- Use ES6+ features where appropriate
- Prefer `const` over `let`, and avoid `var`
- Use arrow functions for anonymous functions
- Use template literals for string interpolation
- Use destructuring assignment where it improves readability

### Naming Conventions

- **Variables and functions**: camelCase (e.g., `getUserData`)
- **Classes**: PascalCase (e.g., `UserService`)
- **Constants**: UPPER_SNAKE_CASE for true constants (e.g., `MAX_RETRY_COUNT`)
- **Private properties/methods**: Prefix with underscore (e.g., `_privateMethod`)
- **File names**: kebab-case for most files (e.g., `user-service.js`)
- **Component files**: PascalCase for React components (e.g., `UserProfile.jsx`)

### Code Structure

- Maximum line length: 100 characters
- Indentation: 2 spaces
- Line endings: LF (Unix-style)
- File encoding: UTF-8
- Always end files with a newline

### Comments and Documentation

- Use JSDoc comments for functions, classes, and modules
- Include parameter types, return types, and descriptions
- Document complex algorithms and business logic
- Keep comments up-to-date with code changes

Example:

```javascript
/**
 * Retrieves user data from the database
 * 
 * @param {string} userId - The unique identifier of the user
 * @param {Object} options - Additional options
 * @param {boolean} options.includeInactive - Whether to include inactive users
 * @returns {Promise<Object>} The user data object
 * @throws {NotFoundError} If the user doesn't exist
 */
async function getUserData(userId, options = {}) {
  // Implementation
}
```

## ESLint Configuration

We use ESLint to enforce our coding standards. The configuration is defined in `.eslintrc.js` and includes:

- Airbnb base configuration
- Additional plugins for specific needs (React, Jest, etc.)
- Project-specific rule overrides

All developers should run ESLint locally before committing code, and our CI pipeline includes ESLint checks.

## Formatting with Prettier

We use Prettier for automatic code formatting. The configuration is defined in `.prettierrc.js` and is designed to work in harmony with our ESLint rules.

Developers should set up their editors to format on save or use the provided npm scripts:

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check
```

## Import Order

Imports should be organized in the following order, with a blank line between each group:

1. Node.js built-in modules
2. External dependencies
3. Internal modules (using absolute paths)
4. Local modules (using relative paths)
5. Type imports (TypeScript)

Example:

```javascript
// Node.js built-in modules
const fs = require('fs');
const path = require('path');

// External dependencies
const express = require('express');
const mongoose = require('mongoose');

// Internal modules (absolute paths)
const { logger } = require('@src/utils/logger');
const config = require('@src/config');

// Local modules (relative paths)
const { validateUser } = require('./validators');
const UserModel = require('./user.model');
```

## Error Handling

- Use custom error classes for different error types
- Always include meaningful error messages
- Log errors appropriately based on severity
- Handle async errors with try/catch or Promise chains

## Testing Standards

- Write tests for all new code
- Follow the Arrange-Act-Assert pattern
- Use descriptive test names
- Isolate tests with proper mocking
- Aim for high test coverage

## Version Control

- Use feature branches for all changes
- Write meaningful commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification
- Keep commits focused on a single change
- Squash commits before merging to maintain a clean history

## Related Documentation

- [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) - Comprehensive developer guide
- [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) - API design and documentation standards
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architectural patterns and decisions
