# Chatbots Platform API Documentation

This document provides comprehensive information about the Chatbots Platform API, including authentication, endpoints, request/response formats, and best practices.

## Table of Contents

- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Versioning](#api-versioning)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Chatbots](#chatbot-endpoints)
  - [Conversations](#conversation-endpoints)
  - [Personalities](#personality-endpoints)
  - [Knowledge Bases](#knowledge-base-endpoints)
  - [Plugins](#plugin-endpoints)
  - [Training](#training-endpoints)
  - [Analytics](#analytics-endpoints)
  - [Context](#context-endpoints)
  - [Health](#health-endpoints)
- [Webhooks](#webhooks)
- [SDKs and Client Libraries](#sdks-and-client-libraries)
- [Best Practices](#best-practices)

## API Overview

The Chatbots Platform API allows developers to create, manage, and integrate customizable chatbots into their applications. The API follows REST principles and uses JSON for request and response bodies.

## Authentication

The API supports two authentication methods:

### JWT Authentication

For user authentication and accessing user-specific resources, use JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

To obtain a JWT token, use the `/api/v1/auth/login` endpoint with your username and password.

### API Key Authentication

For application authentication and accessing chatbot resources, use API keys. Include the API key in the X-API-Key header:

```
X-API-Key: <api_key>
```

To generate an API key, use the `/api/v1/auth/api-key` endpoint with a valid JWT token.

## Base URL

The base URL for all API endpoints is:

```
https://api.chatbots-platform.com/api/v1
```

For development and testing, you can use:

```
http://localhost:3000/api/v1
```

## Response Format

All API responses are in JSON format and follow this structure:

```json
{
  "status": "success",
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

For paginated responses, the structure includes pagination information:

```json
{
  "status": "success",
  "data": [
    // Array of items
  ],
  "pagination": {
    "total": 100,
    "pages": 10,
    "page": 1,
    "limit": 10
  }
}
```

## Error Handling

When an error occurs, the API returns an appropriate HTTP status code and a JSON response with error details:

```json
{
  "status": "error",
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:

- `VALIDATION_ERROR`: Invalid request parameters
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SERVER_ERROR`: Internal server error

## Rate Limiting

To ensure fair usage, the API has rate limits for different endpoints:

- Authentication endpoints: 10-20 requests per minute
- Chatbot conversation endpoints: 60 requests per minute
- Management endpoints: 30 requests per minute

If you exceed the rate limit, you'll receive a 429 Too Many Requests response with headers indicating the limit and when it resets:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1621234567
```

## API Versioning

The API uses versioning to ensure backward compatibility. The current version is v1, which is included in the URL path.

## Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login to the system |
| POST | `/auth/refresh-token` | Refresh access token |
| POST | `/auth/logout` | Logout from the system |
| POST | `/auth/password-reset-request` | Request password reset |
| POST | `/auth/password-reset` | Reset password |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/me` | Update current user |
| POST | `/auth/api-key` | Generate API key |
| GET | `/admin/users` | Get all users (admin only) |
| GET | `/admin/users/:id` | Get user by ID (admin only) |
| PUT | `/admin/users/:id` | Update user (admin only) |
| DELETE | `/admin/users/:id` | Delete user (admin only) |

### Chatbot Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chatbots` | Get all chatbots |
| POST | `/chatbots` | Create a chatbot |
| GET | `/chatbots/:id` | Get chatbot by ID |
| PUT | `/chatbots/:id` | Update chatbot |
| DELETE | `/chatbots/:id` | Delete chatbot |

### Conversation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chatbots/:id/conversation` | Send a message to the chatbot |
| GET | `/chatbots/:id/conversation/history` | Get conversation history |
| POST | `/chatbots/:id/response-rating` | Rate a chatbot response |

### Personality Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chatbots/:chatbotId/personalities` | Get all personalities for a chatbot |
| POST | `/chatbots/:chatbotId/personalities` | Create a personality for a chatbot |
| POST | `/chatbots/:chatbotId/personalities/default` | Create default personality for a chatbot |
| GET | `/personalities/:id` | Get personality by ID |
| PUT | `/personalities/:id` | Update personality |
| DELETE | `/personalities/:id` | Delete personality |
| POST | `/personalities/:id/default` | Set personality as default |
| GET | `/personalities/:id/prompt-modifier` | Generate prompt modifier for personality |

### Knowledge Base Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chatbots/:chatbotId/knowledge-bases` | Get all knowledge bases for a chatbot |
| POST | `/chatbots/:chatbotId/knowledge-bases` | Create a knowledge base for a chatbot |
| GET | `/knowledge-bases/:id` | Get knowledge base by ID |
| PUT | `/knowledge-bases/:id` | Update knowledge base |
| DELETE | `/knowledge-bases/:id` | Delete knowledge base |
| POST | `/knowledge-bases/:id/items` | Add knowledge item |
| PUT | `/knowledge-bases/:id/items/:itemId` | Update knowledge item |
| DELETE | `/knowledge-bases/:id/items/:itemId` | Delete knowledge item |
| GET | `/knowledge-bases/:id/search` | Search knowledge items |

### Plugin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plugins` | Get all plugins |
| POST | `/plugins` | Register a plugin |
| GET | `/plugins/:id` | Get plugin by ID |
| PUT | `/plugins/:id` | Update plugin |
| DELETE | `/plugins/:id` | Unregister plugin |
| GET | `/chatbots/:chatbotId/plugins` | Get all plugins for a chatbot |
| POST | `/chatbots/:chatbotId/plugins` | Install plugin for a chatbot |
| DELETE | `/chatbots/:chatbotId/plugins/:pluginId` | Uninstall plugin from a chatbot |
| PUT | `/chatbots/:chatbotId/plugins/:pluginId/config` | Update plugin configuration |
| GET | `/chatbots/:chatbotId/plugins/:pluginId/status` | Get plugin status |

### Training Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chatbots/:chatbotId/training/datasets` | Get all training datasets for a chatbot |
| POST | `/chatbots/:chatbotId/training/datasets` | Create a training dataset for a chatbot |
| GET | `/training/datasets/:id` | Get training dataset by ID |
| PUT | `/training/datasets/:id` | Update training dataset |
| DELETE | `/training/datasets/:id` | Delete training dataset |
| POST | `/training/datasets/:id/examples` | Add training examples |
| DELETE | `/training/datasets/:id/examples/:exampleId` | Delete training example |
| POST | `/chatbots/:chatbotId/training/sessions` | Start a training session |
| GET | `/chatbots/:chatbotId/training/sessions` | Get all training sessions for a chatbot |
| GET | `/training/sessions/:id` | Get training session by ID |
| DELETE | `/training/sessions/:id` | Cancel training session |

### Analytics Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chatbots/:chatbotId/analytics/messages` | Get message analytics |
| GET | `/chatbots/:chatbotId/analytics/users` | Get user analytics |
| GET | `/chatbots/:chatbotId/analytics/sessions` | Get session analytics |
| GET | `/chatbots/:chatbotId/analytics/intents` | Get intent analytics |
| GET | `/chatbots/:chatbotId/insights` | Get insights for a chatbot |
| GET | `/chatbots/:chatbotId/learning` | Get learning items for a chatbot |
| POST | `/chatbots/:chatbotId/learning` | Add manual learning item |
| PUT | `/learning/:learningId/status` | Update learning item status |
| POST | `/chatbots/:chatbotId/learning/generate` | Generate learning items |
| POST | `/chatbots/:chatbotId/learning/apply` | Apply learning to a chatbot |

### Context Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chatbots/:chatbotId/context/:userId` | Get context for a user |
| POST | `/chatbots/:chatbotId/context/:userId` | Create or update context |
| DELETE | `/chatbots/:chatbotId/context/:userId` | Delete context |
| GET | `/chatbots/:chatbotId/topics/:userId` | Get topics for a user |
| POST | `/chatbots/:chatbotId/topics/:userId` | Add or update topic |
| DELETE | `/chatbots/:chatbotId/topics/:userId/:topicId` | Delete topic |
| GET | `/chatbots/:chatbotId/entities/:userId` | Get entities for a user |
| POST | `/chatbots/:chatbotId/entities/:userId` | Add entity |
| DELETE | `/chatbots/:chatbotId/entities/:userId/:entityId` | Delete entity |
| POST | `/chatbots/:chatbotId/references/resolve` | Resolve references in text |

### Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/status` | Detailed system status (admin only) |
| GET | `/metrics` | Prometheus metrics (admin only) |

## Webhooks

The API supports webhooks for real-time notifications about events. To use webhooks:

1. Register a webhook URL using the `/api/v1/webhooks` endpoint
2. Specify the events you want to receive notifications for
3. Implement a webhook handler at your URL to process the notifications

Available webhook events:

- `message.received`: Triggered when a message is received from a user
- `message.sent`: Triggered when a message is sent by the chatbot
- `conversation.started`: Triggered when a new conversation is started
- `conversation.ended`: Triggered when a conversation ends
- `user.registered`: Triggered when a new user registers
- `chatbot.created`: Triggered when a new chatbot is created
- `training.completed`: Triggered when a training session completes

## SDKs and Client Libraries

Official client libraries are available for:

- JavaScript/Node.js: `chatbots-platform-js`
- Python: `chatbots-platform-python`
- Java: `chatbots-platform-java`
- Ruby: `chatbots-platform-ruby`

## Best Practices

1. **Use HTTPS**: Always use HTTPS to ensure secure communication with the API.
2. **Handle Rate Limits**: Implement exponential backoff when rate limits are reached.
3. **Cache Responses**: Cache responses that don't change frequently to reduce API calls.
4. **Validate Input**: Validate user input before sending it to the API.
5. **Handle Errors**: Implement proper error handling for all API calls.
6. **Use Pagination**: When retrieving large datasets, use pagination parameters.
7. **Secure API Keys**: Store API keys securely and never expose them in client-side code.
8. **Monitor Usage**: Monitor your API usage to detect unusual patterns.
9. **Use Webhooks**: Use webhooks for real-time updates instead of polling.
10. **Keep SDKs Updated**: Always use the latest version of the client libraries.
