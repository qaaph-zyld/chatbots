# Chatbots Platform API Documentation

This document provides comprehensive documentation for the Chatbots Platform API, including authentication, endpoints, request/response formats, and usage examples.

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [API Versioning](#api-versioning)
4. [Common Response Formats](#common-response-formats)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [API Endpoints](#api-endpoints)
8. [Webhooks](#webhooks)
9. [SDKs and Client Libraries](#sdks-and-client-libraries)
10. [Best Practices](#best-practices)

## Introduction

The Chatbots Platform API allows developers to programmatically interact with the platform, enabling the creation, management, and integration of chatbots into various applications and services.

**Base URL:**
- Development: `http://localhost:3000/api`
- Production: `https://api.chatbots-platform.example.com/api`

**Interactive Documentation:**
- Swagger UI: `/api/docs`
- OpenAPI Specification: `/api/docs.json`

## Authentication

The API supports multiple authentication methods to accommodate different use cases:

### JWT Authentication

For user-based authentication, the API uses JSON Web Tokens (JWT).

1. **Obtain a token:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

2. **Use the token in requests:**

```http
GET /api/chatbots
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Refresh a token:**

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### API Key Authentication

For service-to-service communication, the API supports API key authentication.

```http
GET /api/chatbots
X-API-KEY: your_api_key
```

## API Versioning

The API uses URL versioning to ensure backward compatibility as the API evolves.

- Current version: `/api/v1`
- Legacy version: `/api/v0` (deprecated)

When a new version is released, the previous version will be maintained for a minimum of 6 months to allow for migration.

## Common Response Formats

All API responses follow a consistent format:

### Success Response

```json
{
  "status": "success",
  "data": {
    // Response data
  }
}
```

### Paginated Response

```json
{
  "status": "success",
  "data": {
    "items": [
      // Array of items
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 10,
      "pages": 10,
      "next": "/api/chatbots?page=2&pageSize=10",
      "prev": null
    }
  }
}
```

### Error Response

```json
{
  "status": "error",
  "error": {
    "code": 400,
    "message": "Invalid request parameters",
    "details": [
      // Optional detailed error information
    ]
  }
}
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

- **2xx**: Success
  - 200: OK
  - 201: Created
  - 204: No Content

- **4xx**: Client Errors
  - 400: Bad Request
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found
  - 422: Unprocessable Entity
  - 429: Too Many Requests

- **5xx**: Server Errors
  - 500: Internal Server Error
  - 503: Service Unavailable

## Rate Limiting

To ensure fair usage and system stability, the API implements rate limiting:

- Standard tier: 100 requests per minute
- Enterprise tier: 1000 requests per minute

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

When a rate limit is exceeded, the API returns a 429 Too Many Requests response.

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/login` | POST | Authenticate a user |
| `/api/auth/refresh` | POST | Refresh an access token |
| `/api/auth/logout` | POST | Invalidate a token |
| `/api/auth/mfa/setup` | POST | Set up multi-factor authentication |
| `/api/auth/mfa/verify` | POST | Verify MFA code |

### Chatbots

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chatbots` | GET | List all chatbots |
| `/api/chatbots` | POST | Create a new chatbot |
| `/api/chatbots/{id}` | GET | Get a specific chatbot |
| `/api/chatbots/{id}` | PUT | Update a chatbot |
| `/api/chatbots/{id}` | DELETE | Delete a chatbot |
| `/api/chatbots/{id}/train` | POST | Train a chatbot |
| `/api/chatbots/{id}/deploy` | POST | Deploy a chatbot |
| `/api/chatbots/{id}/analytics` | GET | Get chatbot analytics |

### Conversations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversations` | GET | List all conversations |
| `/api/conversations/{id}` | GET | Get a specific conversation |
| `/api/conversations/{id}/messages` | GET | Get messages in a conversation |
| `/api/conversations/{id}/messages` | POST | Send a message in a conversation |

### Templates

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/templates` | GET | List all templates |
| `/api/templates` | POST | Create a new template |
| `/api/templates/{id}` | GET | Get a specific template |
| `/api/templates/{id}` | PUT | Update a template |
| `/api/templates/{id}` | DELETE | Delete a template |

### Training

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/training/datasets` | GET | List all training datasets |
| `/api/training/datasets` | POST | Create a new dataset |
| `/api/training/datasets/{id}` | GET | Get a specific dataset |
| `/api/training/datasets/{id}` | PUT | Update a dataset |
| `/api/training/datasets/{id}` | DELETE | Delete a dataset |
| `/api/training/jobs` | GET | List all training jobs |
| `/api/training/jobs` | POST | Create a new training job |
| `/api/training/jobs/{id}` | GET | Get a specific training job |

### Voice

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/voice/tts` | POST | Convert text to speech |
| `/api/voice/stt` | POST | Convert speech to text |
| `/api/voice/voices` | GET | List available voices |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health/liveness` | GET | Check if the service is running |
| `/api/health/readiness` | GET | Check if the service is ready to accept traffic |
| `/api/health/metrics` | GET | Get service metrics |

## Webhooks

The Chatbots Platform supports webhooks for event-driven integrations. You can register webhook URLs to receive notifications when specific events occur.

### Registering a Webhook

```http
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "url": "https://your-service.example.com/webhook",
  "events": ["conversation.created", "message.received"],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload

When an event occurs, the platform will send a POST request to your webhook URL with the following payload:

```json
{
  "event": "message.received",
  "timestamp": "2023-05-01T12:00:00Z",
  "data": {
    // Event-specific data
  },
  "signature": "sha256=..."
}
```

### Verifying Webhook Signatures

To verify that a webhook request came from the Chatbots Platform, you should validate the signature:

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  );
}
```

## SDKs and Client Libraries

To simplify integration, the Chatbots Platform provides official SDKs for popular programming languages:

- [JavaScript/Node.js](https://github.com/example/chatbots-platform-js)
- [Python](https://github.com/example/chatbots-platform-python)
- [Java](https://github.com/example/chatbots-platform-java)
- [Go](https://github.com/example/chatbots-platform-go)

### JavaScript Example

```javascript
const ChatbotsSDK = require('chatbots-platform-sdk');

const client = new ChatbotsSDK({
  apiKey: 'your_api_key',
  // or
  accessToken: 'your_access_token'
});

// Create a chatbot
const chatbot = await client.chatbots.create({
  name: 'Customer Support Bot',
  description: 'A chatbot for handling customer support inquiries',
  type: 'hybrid'
});

// Send a message
const response = await client.conversations.sendMessage(
  conversationId,
  { text: 'Hello, how can I help you?' }
);
```

## Best Practices

### Performance Optimization

1. **Use pagination** for endpoints that return collections of resources.
2. **Request only the data you need** using field selection parameters where supported.
3. **Cache responses** when appropriate to reduce API calls.

### Security

1. **Store API keys and tokens securely** and never expose them in client-side code.
2. **Implement proper token rotation** for long-lived applications.
3. **Use HTTPS** for all API requests to ensure data is encrypted in transit.
4. **Validate webhook signatures** to ensure requests are legitimate.

### Error Handling

1. **Implement proper error handling** in your client code.
2. **Use exponential backoff** when retrying failed requests.
3. **Monitor API response times and error rates** to detect issues early.

## Support and Feedback

If you encounter any issues or have questions about the API, please:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Visit our [Community Forum](https://community.chatbots-platform.example.com)
3. Open an issue on [GitHub](https://github.com/example/chatbots-platform)
4. Contact support at api-support@chatbots-platform.example.com

We welcome feedback and suggestions for improving the API. Please submit feature requests through our [Feedback Portal](https://feedback.chatbots-platform.example.com).
