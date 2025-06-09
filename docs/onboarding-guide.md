# Developer Onboarding Guide

Welcome to the Chatbot Platform project! This guide will help you get started with the codebase and development workflow.

## Project Overview

The Chatbot Platform is a modern, flexible system for creating and deploying customizable chatbots with advanced AI capabilities. The project follows a modular architecture that separates concerns and improves maintainability.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB (v4.4 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/chatbots.git
   cd chatbots
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/chatbots
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

The project follows the dev_framework standards with a modular architecture:

```
chatbots/
├── configs/               # Configuration files
├── src/                   # Source code
│   ├── api/               # API endpoints and controllers
│   ├── core/              # Core functionality
│   ├── data/              # Data access layer
│   ├── domain/            # Domain models
│   ├── modules/           # Feature modules
│   └── utils/             # Utility functions
├── tests/                 # Test files
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

For a more detailed overview of the project structure, see [API Documentation](./api-documentation.md).

## Module Aliases

The project uses module aliases to simplify imports. Instead of using relative paths, you can use aliases like `@core`, `@modules`, etc.

Example:
```javascript
// Instead of:
const server = require('../../../core/server');

// Use:
const server = require('@core/server');
```

Available aliases are defined in `package.json` under `_moduleAliases`.

## Development Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `release/*` - Release preparation branches

### Creating a New Feature

1. Create a new branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Implement your feature, following the project's architecture and coding standards.

3. Write tests for your feature:
   ```bash
   npm run test:unit
   npm run test:memory
   npm run test:integration
   ```

4. Create a pull request to merge your feature into `develop`.

### Code Style and Linting

The project uses ESLint and Prettier for code style and linting:

```bash
# Run linting
npm run lint

# Format code
npm run format
```

## Testing

The project uses Jest for testing, with different configurations for different types of tests:

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run tests with MongoDB Memory Server
npm run test:memory

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Tests are organized by type:

- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/e2e/` - End-to-end tests

#### Unit Tests

Unit tests should test individual functions or classes in isolation. Use mocks for dependencies.

Example:
```javascript
// Import module alias registration
require('@src/core/module-alias');

const { TopicService } = require('@modules/topic/services/topic.service');
const { TopicRepository } = require('@modules/topic/repositories/topic.repository');

// Mock the repository
jest.mock('@modules/topic/repositories/topic.repository');

describe('TopicService', () => {
  let topicService;
  let mockTopicRepository;

  beforeEach(() => {
    mockTopicRepository = new TopicRepository();
    topicService = new TopicService(mockTopicRepository);
  });

  test('should get topics', async () => {
    // Arrange
    const mockTopics = [{ id: '1', name: 'Test Topic' }];
    mockTopicRepository.getTopics.mockResolvedValue(mockTopics);

    // Act
    const result = await topicService.getTopics();

    // Assert
    expect(result).toEqual(mockTopics);
    expect(mockTopicRepository.getTopics).toHaveBeenCalled();
  });
});
```

#### Integration Tests with MongoDB Memory Server

For tests that require a MongoDB database, use the MongoDB Memory Server setup:

```javascript
// Import module alias registration
require('@src/core/module-alias');

const { connectTestDB, disconnectTestDB, clearDatabase } = require('@tests/unit/setup/mongoose-test-setup');
const { TopicModel } = require('@domain/topic.model');

describe('Topic Integration Tests', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  test('should create a topic', async () => {
    // Arrange
    const topicData = { name: 'Test Topic', description: 'Test Description' };

    // Act
    const topic = new TopicModel(topicData);
    await topic.save();

    // Assert
    const savedTopic = await TopicModel.findOne({ name: 'Test Topic' });
    expect(savedTopic).toBeTruthy();
    expect(savedTopic.description).toBe('Test Description');
  });
});
```

## Troubleshooting

### Common Issues

1. **Module not found errors**:
   - Make sure you've imported the module alias registration at the top of your file:
     ```javascript
     require('@src/core/module-alias');
     ```
   - Check that the module path is correct.

2. **MongoDB connection issues**:
   - Verify that MongoDB is running.
   - Check your `.env` file for the correct MongoDB URI.

3. **Test failures with MongoDB Memory Server**:
   - Make sure you're using the correct setup and teardown functions.
   - Check that you're clearing the database between tests.

### Getting Help

If you encounter issues not covered in this guide:

1. Check the project documentation in the `docs/` directory.
2. Review the codebase and tests for similar functionality.
3. Ask for help from the team on the project's communication channels.

## Additional Resources

- [API Documentation](./api-documentation.md)
- [Changelog](../changelog.md)
- [Reorganization Progress](./reorganization-progress.md)
- [Open Source Dependencies](./OPEN_SOURCE_DEPENDENCIES.md)

## Contributing

1. Follow the branching strategy and development workflow.
2. Write tests for your code.
3. Update documentation as needed.
4. Create a pull request with a clear description of your changes.

Welcome to the team, and happy coding!
