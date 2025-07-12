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
- `@middleware` - Points to the `src/middleware` directory
- `@config` - Points to the `src/config` directory
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
                
  /sentiment/analyze:
    post:
      summary: Analyze sentiment of a text message
      description: Analyzes the sentiment of a single text message
      operationId: analyzeSentiment
      tags:
        - Sentiment Analysis
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - text
              properties:
                text:
                  type: string
                  description: The text to analyze
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SentimentResult'
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
                
  /sentiment/analyze-batch:
    post:
      summary: Analyze sentiment of multiple text messages
      description: Analyzes the sentiment of multiple text messages in a batch
      operationId: analyzeBatchSentiment
      tags:
        - Sentiment Analysis
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - texts
              properties:
                texts:
                  type: array
                  description: Array of texts to analyze
                  items:
                    type: string
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/SentimentResult'
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
  responses:
    RateLimitExceeded:
      description: Too many requests, please try again later
      content:
        application/json:
          schema:
            type: object
            properties:
              success:
                type: boolean
                example: false
              message:
                type: string
                example: Too many requests, please try again later.
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
          
    SentimentResult:
      type: object
      properties:
        text:
          type: string
          description: The original text that was analyzed
        sentiment:
          type: string
          enum: [positive, neutral, negative]
          description: The sentiment category
        score:
          type: number
          description: Numerical score of the sentiment (positive values for positive sentiment, negative for negative)
        confidence:
          type: number
          format: float
          minimum: 0
          maximum: 1
          description: Confidence level of the sentiment analysis (0-1)
        language:
          type: string
          description: Detected language of the text
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

## Rate Limiting and Caching

The API implements rate limiting to protect against abuse and ensure fair usage of resources. Rate limits are applied to different endpoints based on their sensitivity and resource requirements. Additionally, response caching is implemented for specific endpoints to improve performance.

### Rate Limit Headers

When a request is made, the following headers are included in the response:

- `RateLimit-Limit`: The maximum number of requests allowed in the current time window
- `RateLimit-Remaining`: The number of requests remaining in the current time window
- `RateLimit-Reset`: The time when the current window resets (in seconds since epoch)

### Rate Limit Configuration

The following rate limits are applied by default:

| Endpoint | Time Window | Max Requests | Description |
|----------|-------------|--------------|-------------|
| `/api/*` | 15 minutes | 100 | General API rate limit |
| `/api/auth/*` | 5 minutes | 5 | Authentication endpoints |
| `/api/conversations/*` | 1 minute | 60 | Conversation endpoints |
| `/api/sentiment/*` | 1 minute | 30 | Sentiment analysis endpoints |

### Rate Limit Exceeded Response

When a rate limit is exceeded, the API returns a `429 Too Many Requests` response with the following body:

```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

### Environment-Specific Rate Limits

Rate limits are adjusted based on the environment:

- **Development**: Higher limits for easier development and testing
- **Test**: Rate limiting is disabled for automated tests
- **Production**: Standard limits as described above

### Response Caching

The API implements response caching for specific endpoints to improve performance and reduce server load. Currently, the following endpoints use caching:

| Endpoint | Cache TTL | Cache Key Generation |
|----------|-----------|----------------------|
| `/api/sentiment/analyze` | 1 hour | Based on request body, path, and user ID |
| `/api/sentiment/analyze-batch` | 1 hour | Based on request body, path, and user ID |

#### Cache Headers

Clients can control caching behavior using the following headers:

- `X-Bypass-Cache`: If present, bypasses the cache and forces a fresh response

Alternatively, the `_nocache` query parameter can be added to bypass the cache.

#### Cache Management

Administrators can clear the cache using the following endpoint:

```
DELETE /api/sentiment/cache
```

This endpoint requires admin privileges and will clear all cached sentiment analysis results.

### Cache Monitoring

The API includes a cache monitoring system that tracks cache hit/miss metrics and provides insights into cache performance. The following endpoints are available for monitoring:

```
GET /api/metrics/cache
```

Returns current cache metrics including hit rates, miss rates, and average latency for each resource type.

Example response:

```json
{
  "success": true,
  "metrics": {
    "timestamp": 1623456789000,
    "uptime": 3600000,
    "resources": {
      "sentiment": {
        "hits": 1250,
        "misses": 250,
        "total": 1500,
        "hitRate": 0.83,
        "avgLatency": 12.5,
        "avgSize": 2048
      },
      "conversation": {
        "hits": 850,
        "misses": 150,
        "total": 1000,
        "hitRate": 0.85,
        "avgLatency": 18.2,
        "avgSize": 4096
      }
    },
    "overall": {
      "hits": 2100,
      "misses": 400,
      "total": 2500,
      "hitRate": 0.84
    }
  }
}
```

```
GET /api/metrics/cache/history
```

Returns historical cache metrics for trend analysis. Supports a `limit` query parameter to control the number of records returned.

```
POST /api/metrics/cache/reset
```

Resets cache metrics. Requires admin privileges.

### Cache Warming

The API includes a cache warming system that pre-populates the cache with frequently accessed resources to improve response times. Cache warming runs automatically at configured intervals, but can also be triggered manually:

```
POST /api/metrics/cache/warm
```

Triggers manual cache warming. Requires admin privileges.

Example response:

```json
{
  "success": true,
  "message": "Cache warming completed: 15/20 resources warmed in 350ms",
  "result": {
    "warmed": 15,
    "total": 20,
    "duration": 350
  }
}
```

### Adaptive TTL

The API includes an adaptive Time-To-Live (TTL) system that dynamically adjusts cache expiration times based on resource usage patterns. This improves cache efficiency by keeping frequently accessed resources cached longer while allowing less frequently accessed resources to expire sooner.

#### Configuration

```
GET /api/metrics/cache/adaptive-ttl
```

Returns the current adaptive TTL configuration. Requires admin privileges.

Example response:

```json
{
  "success": true,
  "config": {
    "enabled": true,
    "defaultTTL": 300,
    "minTTL": 60,
    "maxTTL": 3600,
    "decayInterval": 3600,
    "decayFactor": 0.5,
    "weights": {
      "accessFrequency": 0.5,
      "missRate": 0.3,
      "latency": 0.2
    }
  }
}
```

```
PUT /api/metrics/cache/adaptive-ttl
```

Updates the adaptive TTL configuration. Requires admin privileges.

Example request body:

```json
{
  "config": {
    "enabled": true,
    "defaultTTL": 600,
    "minTTL": 120,
    "maxTTL": 7200,
    "decayInterval": 7200,
    "decayFactor": 0.7,
    "weights": {
      "accessFrequency": 0.6,
      "missRate": 0.2,
      "latency": 0.2
    }
  }
}
```

Example response:

```json
{
  "success": true,
  "message": "Adaptive TTL configuration updated successfully"
}
```

#### Resource Access Tracking

```
GET /api/metrics/cache/access-tracking
```

Returns resource access tracking data used by the adaptive TTL system. Requires admin privileges.

Example response:

```json
{
  "success": true,
  "tracking": {
    "api": {
      "users": {
        "count": 120,
        "lastAccessed": 1623456789000
      },
      "products": {
        "count": 85,
        "lastAccessed": 1623456789000
      }
    },
    "db": {
      "users": {
        "count": 95,
        "lastAccessed": 1623456789000
      },
      "orders": {
        "count": 42,
        "lastAccessed": 1623456789000
      }
    }
  }
}
```

```
POST /api/metrics/cache/decay-access
```

Manually triggers decay of resource access counts. Requires admin privileges.

Example response:

```json
{
  "success": true,
  "message": "Resource access counts decayed successfully"
}
```

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
