# External REST API Guide

This document provides comprehensive documentation for the Chatbots Platform External REST API, which allows third-party applications to integrate with the platform.

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [API Versioning](#api-versioning)
4. [Proxy Configuration](#proxy-configuration)
5. [Endpoints](#endpoints)
6. [Response Format](#response-format)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Examples](#examples)
10. [Best Practices](#best-practices)

## Introduction

The External REST API provides a streamlined interface for third-party applications to interact with the Chatbots Platform. This API is specifically designed for external integrations and provides a subset of the functionality available in the full API.

**Base URL:**
- Development: `http://localhost:3000/api/external`
- Production: `https://api.chatbots-platform.example.com/api/external`

## Authentication

The External REST API uses API key authentication. You can generate an API key from the Chatbots Platform dashboard.

Include the API key in the `Authorization` header of your requests:

```http
GET /api/external/v1/chatbots
Authorization: Bearer YOUR_API_KEY
```

## API Versioning

The External REST API follows the versioning strategy outlined in the [API Versioning Guide](./API_VERSIONING.md). The current version is `v1`.

You can access the API using either of these formats:
- `/api/external/v1/resource` (explicit version)
- `/api/external/resource` (latest version)

To discover available versions, you can make a GET request to the base URL:

```http
GET /api/external
```

Response:
```json
{
  "versions": [
    {
      "version": "v1",
      "status": "stable",
      "url": "https://api.chatbots-platform.example.com/api/external/v1"
    }
  ],
  "latest": "v1",
  "current": "v1"
}
```

## Proxy Configuration

If your environment requires a proxy for external connections, you can configure the API client to use a proxy. The Chatbots Platform API supports proxy configuration through the HTTP_PROXY environment variable.

For detailed instructions on configuring proxies, see the [Proxy Configuration Guide](./PROXY_CONFIGURATION.md).

The default proxy configuration for the Chatbots Platform is:

```
104.129.196.38:10563
```

## Endpoints

### Chatbots

#### Get all accessible chatbots

```http
GET /api/external/v1/chatbots
```

Returns a list of all chatbots that are accessible with your API key.

#### Get a specific chatbot

```http
GET /api/external/v1/chatbots/{id}
```

Returns details of a specific chatbot.

### Conversations

#### Get all conversations

```http
GET /api/external/v1/conversations
```

Query parameters:
- `chatbotId`: Filter by chatbot ID
- `limit`: Maximum number of conversations to return (default: 20)
- `page`: Page number for pagination (default: 1)

Returns a list of conversations associated with your API key.

#### Create a new conversation

```http
POST /api/external/v1/conversations
```

Request body:
```json
{
  "chatbotId": "required-chatbot-id",
  "metadata": {
    "optional": "metadata",
    "source": "external-app"
  }
}
```

Creates a new conversation with the specified chatbot.

#### Get a specific conversation

```http
GET /api/external/v1/conversations/{id}
```

Returns details of a specific conversation.

### Messages

#### Get messages in a conversation

```http
GET /api/external/v1/conversations/{conversationId}/messages
```

Query parameters:
- `limit`: Maximum number of messages to return (default: 50)
- `before`: Get messages before this timestamp
- `after`: Get messages after this timestamp

Returns a list of messages in the specified conversation.

#### Send a message in a conversation

```http
POST /api/external/v1/conversations/{conversationId}/messages
```

Request body:
```json
{
  "content": "Hello, chatbot!",
  "type": "text",
  "metadata": {
    "optional": "metadata",
    "source": "external-app"
  }
}
```

Sends a message in the specified conversation and returns both the user message and the chatbot's response.

### Knowledge Base

#### Search the knowledge base

```http
GET /api/external/v1/chatbots/{chatbotId}/knowledge?query=search+term
```

Query parameters:
- `query`: Search term (required)

Searches the knowledge base of the specified chatbot and returns relevant results.

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "item-id",
      "property1": "value1",
      "property2": "value2"
    }
  ]
}
```

For paginated responses, additional fields are included:

```json
{
  "success": true,
  "count": 10,
  "total": 100,
  "page": 1,
  "pages": 10,
  "data": [
    {
      "id": "item-id",
      "property1": "value1",
      "property2": "value2"
    }
  ]
}
```

## Error Handling

When an error occurs, the API returns an appropriate HTTP status code and a JSON response with error details:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  }
}
```

Common error codes:
- `400`: Bad Request - The request was malformed or missing required parameters
- `401`: Unauthorized - API key is missing or invalid
- `403`: Forbidden - API key doesn't have permission to access the resource
- `404`: Not Found - The requested resource doesn't exist
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Something went wrong on the server

## Rate Limiting

The External REST API implements rate limiting to prevent abuse. The default rate limit is 100 requests per minute per API key.

When a rate limit is exceeded, the API returns a `429 Too Many Requests` response with a `Retry-After` header indicating when you can make requests again.

## Examples

### Creating a conversation and sending a message

```javascript
// Using fetch API
async function chatWithBot() {
  // Create a conversation
  const conversationResponse = await fetch('https://api.chatbots-platform.example.com/api/external/v1/conversations', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chatbotId: 'your-chatbot-id'
    })
  });
  
  const conversationData = await conversationResponse.json();
  const conversationId = conversationData.data.id;
  
  // Send a message
  const messageResponse = await fetch(`https://api.chatbots-platform.example.com/api/external/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: 'Hello, chatbot!'
    })
  });
  
  const messageData = await messageResponse.json();
  console.log('User message:', messageData.data.userMessage);
  console.log('Bot response:', messageData.data.botMessage);
}
```

### Searching the knowledge base

```javascript
// Using axios with proxy configuration
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

const api = axios.create({
  baseURL: 'https://api.chatbots-platform.example.com/api/external/v1',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  // Configure proxy if needed
  httpsAgent: new HttpsProxyAgent('http://104.129.196.38:10563')
});

async function searchKnowledge(chatbotId, query) {
  try {
    const response = await api.get(`/chatbots/${chatbotId}/knowledge`, {
      params: { query }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error searching knowledge base:', error.response?.data || error.message);
    throw error;
  }
}
```

## Best Practices

1. **Use API Keys Securely**
   - Never expose your API key in client-side code
   - Rotate API keys periodically
   - Use different API keys for different environments (development, staging, production)

2. **Handle Rate Limits**
   - Implement exponential backoff when rate limits are hit
   - Cache responses when appropriate to reduce API calls

3. **Implement Error Handling**
   - Always check for and handle error responses
   - Provide meaningful error messages to your users

4. **Use Pagination**
   - Always use pagination when retrieving lists of resources
   - Don't request more items than you need

5. **Proxy Configuration**
   - If your environment requires a proxy, configure it properly
   - Use the default proxy configuration (104.129.196.38:10563) if needed

6. **Versioning**
   - Specify the API version explicitly in production code
   - Subscribe to the API changelog to stay informed about updates

7. **Metadata**
   - Use the metadata field to store application-specific data
   - Include a `source` property to identify your application

8. **Conversation Management**
   - Clean up old conversations to avoid clutter
   - Use meaningful titles for conversations

For additional support, please contact api-support@chatbots-platform.example.com or visit our [developer community forum](https://community.chatbots-platform.example.com).
