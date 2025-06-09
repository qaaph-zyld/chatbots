# API Documentation

## Project Structure Overview

The chatbot platform has been reorganized to follow the dev_framework standards, with a modular architecture that separates concerns and improves maintainability.

### Directory Structure

```
chatbots/
├── configs/               # Configuration files
│   ├── eslint/            # ESLint configurations
│   ├── jest/              # Jest test configurations
│   └── webpack/           # Webpack configurations
├── src/                   # Source code
│   ├── api/               # API endpoints and controllers
│   │   ├── external/      # External API endpoints
│   │   └── internal/      # Internal API endpoints
│   ├── core/              # Core functionality
│   │   ├── module-alias.js # Module alias registration
│   │   └── server.js      # Server setup
│   ├── data/              # Data access layer
│   │   ├── repositories/  # Data repositories
│   │   └── models/        # Database models
│   ├── domain/            # Domain models and business logic
│   ├── modules/           # Feature modules
│   │   ├── analytics/     # Analytics module
│   │   ├── chatbot/       # Chatbot module
│   │   ├── conversation/  # Conversation module
│   │   ├── entity/        # Entity module
│   │   ├── preference/    # Preference module
│   │   └── topic/         # Topic module
│   └── utils/             # Utility functions
├── tests/                 # Test files
│   ├── e2e/               # End-to-end tests
│   ├── integration/       # Integration tests
│   └── unit/              # Unit tests
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

## Module Aliases

To simplify imports and improve code readability, the project uses module aliases. These are defined in `package.json` and registered at runtime in `src/core/module-alias.js`.

Available aliases:

- `@src` - Points to the `src` directory
- `@core` - Points to the `src/core` directory
- `@modules` - Points to the `src/modules` directory
- `@api` - Points to the `src/api` directory
- `@data` - Points to the `src/data` directory
- `@domain` - Points to the `src/domain` directory
- `@utils` - Points to the `src/utils` directory
- `@tests` - Points to the `tests` directory

Example usage:

```javascript
// Instead of relative imports like:
const server = require('../../../core/server');

// Use module aliases:
const server = require('@core/server');
```

## API Endpoints

### External API

The external API endpoints are located in `src/api/external` and are organized by version:

- `v1` - Version 1 of the API
- `v2` - Version 2 of the API (if applicable)

Each version contains:

- `controllers/` - Controller functions for handling requests
- `routes/` - Route definitions
- `middleware/` - Version-specific middleware
- `validators/` - Request validation

### Internal API

The internal API endpoints are located in `src/api/internal` and follow a similar structure to the external API.

## OpenAPI 3.0 Documentation

```yaml
openapi: 3.0.0
info:
  title: Chatbot Platform API
  description: API for the Chatbot Platform
  version: 1.0.0
servers:
  - url: http://localhost:3000/api
    description: Local development server
paths:
  /conversations:
    get:
      summary: Get paginated conversation history
      description: Retrieves paginated conversation history between a user and a chatbot
      operationId: getConversationHistory
      tags:
        - Conversations
      parameters:
        - name: chatbotId
          in: query
          description: ID of the chatbot
          required: true
          schema:
            type: string
        - name: page
          in: query
          description: Page number (1-based)
          required: false
          schema:
            type: integer
            default: 1
            minimum: 1
        - name: limit
          in: query
          description: Number of items per page
          required: false
          schema:
            type: integer
            default: 20
            minimum: 1
            maximum: 100
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                type: object
                properties:
                  conversations:
                    type: array
                    items:
                      $ref: '#/components/schemas/Conversation'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
        '400':
          description: Bad request - Missing required parameters
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '401':
          description: Unauthorized - Invalid or missing authentication token
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Conversation:
      type: object
      properties:
        _id:
          type: string
          description: Unique identifier for the conversation
        userId:
          type: string
          description: ID of the user
        chatbotId:
          type: string
          description: ID of the chatbot
        messages:
          type: array
          items:
            $ref: '#/components/schemas/Message'
        createdAt:
          type: string
          format: date-time
          description: Creation timestamp
        updatedAt:
          type: string
          format: date-time
          description: Last update timestamp
    Message:
      type: object
      properties:
        content:
          type: string
          description: Message content
        sender:
          type: string
          enum: [user, bot, system]
          description: Sender of the message
        contentType:
          type: string
          enum: [text, image, audio, video, file, rich]
          default: text
          description: Type of content
        metadata:
          type: object
          description: Additional metadata for the message
        timestamp:
          type: string
          format: date-time
          description: Message timestamp
    Pagination:
      type: object
      properties:
        total:
          type: integer
          description: Total number of items
        page:
          type: integer
          description: Current page number
        limit:
          type: integer
          description: Number of items per page
        pages:
          type: integer
          description: Total number of pages
    Error:
      type: object
      properties:
        success:
          type: boolean
          default: false
          description: Indicates if the operation was successful
        message:
          type: string
          description: Error message
        error:
          type: string
          description: Detailed error information (only in development mode)
```

## Modules

Each feature module in `src/modules/` follows a consistent structure:

- `controllers/` - Module-specific controllers
- `services/` - Business logic services
- `repositories/` - Data access repositories
- `models/` - Domain models
- `utils/` - Module-specific utilities
- `index.js` - Module entry point

## Testing

The project uses Jest for testing, with different configurations for different types of tests:

- `jest.config.js` - Base configuration
- `configs/jest/jest.memory.config.js` - Configuration for tests using MongoDB Memory Server
- `configs/jest/jest.integration.config.js` - Configuration for integration tests
- `configs/jest/jest.e2e.config.js` - Configuration for end-to-end tests

### MongoDB Memory Server

For tests that require a MongoDB database, the project uses MongoDB Memory Server to create an in-memory MongoDB instance. This allows tests to run without requiring an external MongoDB instance.

To use MongoDB Memory Server in tests:

1. Import the memory server setup:

```javascript
require('@src/core/module-alias');
const { connectTestDB, disconnectTestDB, clearDatabase } = require('@tests/unit/setup/mongoose-test-setup');
```

2. Use the provided utilities in your test lifecycle hooks:

```javascript
beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearDatabase();
});
```

## Environment Variables

The project uses environment variables for configuration. These can be set in a `.env` file or via the command line.

Common environment variables:

- `NODE_ENV` - Environment (development, test, production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection URI
- `USE_MEMORY_SERVER` - Whether to use MongoDB Memory Server for tests

For cross-platform compatibility, the project uses `cross-env` to set environment variables in npm scripts.

## Scripts

The project includes several utility scripts in the `scripts/` directory:

- `migrate-files.js` - Moves files to their new locations
- `update-imports.js` - Updates import paths to use module aliases
- `verify-structure.js` - Validates the project structure
- `install-dependencies.js` - Installs required dependencies

## Running the Application

To run the application:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Running Tests

To run tests:

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
```
