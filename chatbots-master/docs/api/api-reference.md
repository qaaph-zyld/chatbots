# API Reference

This document provides a comprehensive reference for the Chatbot Platform API.

## Authentication

All API requests require authentication using JWT (JSON Web Token).

### Obtaining a Token

```
POST /api/v1/auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "5f8d0c1b2e3a4b5c6d7e8f9g",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

### Using the Token

Include the token in the Authorization header for all API requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Chatbots

### List Chatbots

```
GET /api/v1/chatbots
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20) |
| status | string | Filter by status (active, inactive, all) |

**Response:**

```json
{
  "chatbots": [
    {
      "id": "5f8d0c1b2e3a4b5c6d7e8f9g",
      "name": "Customer Support Bot",
      "description": "Handles customer inquiries",
      "status": "active",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-06-20T14:25:00Z"
    },
    {
      "id": "6a7b8c9d0e1f2g3h4i5j6k7l",
      "name": "Sales Assistant",
      "description": "Helps with product inquiries",
      "status": "active",
      "createdAt": "2025-02-10T08:15:00Z",
      "updatedAt": "2025-06-18T11:45:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### Get Chatbot

```
GET /api/v1/chatbots/:id
```

**Response:**

```json
{
  "id": "5f8d0c1b2e3a4b5c6d7e8f9g",
  "name": "Customer Support Bot",
  "description": "Handles customer inquiries",
  "status": "active",
  "personality": {
    "formality": 0.7,
    "friendliness": 0.8,
    "conciseness": 0.5
  },
  "templates": {
    "greeting": "Hello! How can I help you today?",
    "fallback": "I'm sorry, I don't understand. Could you rephrase that?"
  },
  "integrations": ["website", "slack"],
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-06-20T14:25:00Z"
}
```

### Create Chatbot

```
POST /api/v1/chatbots
```

**Request Body:**

```json
{
  "name": "New Bot",
  "description": "Description of the bot",
  "personality": {
    "formality": 0.5,
    "friendliness": 0.8,
    "conciseness": 0.3
  },
  "templates": {
    "greeting": "Hello! How can I help you today?",
    "fallback": "I'm sorry, I don't understand. Could you rephrase that?"
  }
}
```

**Response:**

```json
{
  "id": "7g8h9i0j1k2l3m4n5o6p7q8r",
  "name": "New Bot",
  "description": "Description of the bot",
  "status": "inactive",
  "personality": {
    "formality": 0.5,
    "friendliness": 0.8,
    "conciseness": 0.3
  },
  "templates": {
    "greeting": "Hello! How can I help you today?",
    "fallback": "I'm sorry, I don't understand. Could you rephrase that?"
  },
  "integrations": [],
  "createdAt": "2025-07-05T14:30:00Z",
  "updatedAt": "2025-07-05T14:30:00Z"
}
```

### Update Chatbot

```
PUT /api/v1/chatbots/:id
```

**Request Body:**

```json
{
  "name": "Updated Bot Name",
  "description": "Updated description",
  "personality": {
    "formality": 0.6,
    "friendliness": 0.9,
    "conciseness": 0.4
  }
}
```

**Response:**

```json
{
  "id": "5f8d0c1b2e3a4b5c6d7e8f9g",
  "name": "Updated Bot Name",
  "description": "Updated description",
  "status": "active",
  "personality": {
    "formality": 0.6,
    "friendliness": 0.9,
    "conciseness": 0.4
  },
  "templates": {
    "greeting": "Hello! How can I help you today?",
    "fallback": "I'm sorry, I don't understand. Could you rephrase that?"
  },
  "integrations": ["website", "slack"],
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-07-05T14:35:00Z"
}
```

### Delete Chatbot

```
DELETE /api/v1/chatbots/:id
```

**Response:**

```json
{
  "message": "Chatbot deleted successfully"
}
```

## Knowledge Base

### List Knowledge Items

```
GET /api/v1/chatbots/:chatbotId/knowledge
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20) |
| query | string | Search query |

**Response:**

```json
{
  "items": [
    {
      "id": "5f8d0c1b2e3a4b5c6d7e8f9g",
      "question": "What are your business hours?",
      "answer": "We are open Monday to Friday, 9 AM to 5 PM.",
      "tags": ["hours", "business"],
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-06-20T14:25:00Z"
    },
    {
      "id": "6a7b8c9d0e1f2g3h4i5j6k7l",
      "question": "Do you offer refunds?",
      "answer": "Yes, we offer refunds within 30 days of purchase.",
      "tags": ["refunds", "policy"],
      "createdAt": "2025-02-10T08:15:00Z",
      "updatedAt": "2025-06-18T11:45:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### Add Knowledge Item

```
POST /api/v1/chatbots/:chatbotId/knowledge
```

**Request Body:**

```json
{
  "question": "What payment methods do you accept?",
  "answer": "We accept credit cards, PayPal, and bank transfers.",
  "tags": ["payment", "billing"]
}
```

**Response:**

```json
{
  "id": "7g8h9i0j1k2l3m4n5o6p7q8r",
  "question": "What payment methods do you accept?",
  "answer": "We accept credit cards, PayPal, and bank transfers.",
  "tags": ["payment", "billing"],
  "createdAt": "2025-07-05T14:40:00Z",
  "updatedAt": "2025-07-05T14:40:00Z"
}
```

## Conversations

### List Conversations

```
GET /api/v1/chatbots/:chatbotId/conversations
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20) |
| startDate | string | Filter by start date (ISO format) |
| endDate | string | Filter by end date (ISO format) |

**Response:**

```json
{
  "conversations": [
    {
      "id": "5f8d0c1b2e3a4b5c6d7e8f9g",
      "userId": "user-123",
      "channel": "website",
      "messageCount": 8,
      "startedAt": "2025-07-04T10:30:00Z",
      "endedAt": "2025-07-04T10:45:00Z"
    },
    {
      "id": "6a7b8c9d0e1f2g3h4i5j6k7l",
      "userId": "user-456",
      "channel": "slack",
      "messageCount": 12,
      "startedAt": "2025-07-04T11:15:00Z",
      "endedAt": "2025-07-04T11:30:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

### Get Conversation Messages

```
GET /api/v1/chatbots/:chatbotId/conversations/:conversationId/messages
```

**Response:**

```json
{
  "conversation": {
    "id": "5f8d0c1b2e3a4b5c6d7e8f9g",
    "userId": "user-123",
    "channel": "website",
    "startedAt": "2025-07-04T10:30:00Z",
    "endedAt": "2025-07-04T10:45:00Z"
  },
  "messages": [
    {
      "id": "msg-001",
      "sender": "user",
      "content": "Hello, I need help with my order",
      "timestamp": "2025-07-04T10:30:00Z"
    },
    {
      "id": "msg-002",
      "sender": "bot",
      "content": "Hello! I'd be happy to help with your order. Could you please provide your order number?",
      "timestamp": "2025-07-04T10:30:05Z"
    },
    {
      "id": "msg-003",
      "sender": "user",
      "content": "My order number is ABC123",
      "timestamp": "2025-07-04T10:30:15Z"
    }
  ]
}
```

## Analytics

### Get Chatbot Analytics

```
GET /api/v1/chatbots/:chatbotId/analytics
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | Start date (ISO format) |
| endDate | string | End date (ISO format) |
| metrics | string | Comma-separated list of metrics |

**Response:**

```json
{
  "timeframe": {
    "start": "2025-06-01T00:00:00Z",
    "end": "2025-07-01T00:00:00Z"
  },
  "metrics": {
    "totalConversations": 1245,
    "averageConversationLength": 6.8,
    "averageResponseTime": 1.2,
    "userSatisfactionScore": 4.2,
    "topIntents": [
      {"intent": "order_status", "count": 325},
      {"intent": "refund_request", "count": 187},
      {"intent": "product_info", "count": 156}
    ],
    "hourlyDistribution": [
      {"hour": 0, "count": 12},
      {"hour": 1, "count": 8},
      // ... more hours
      {"hour": 23, "count": 15}
    ]
  }
}
```

## Monitoring

### Get System Health

```
GET /api/v1/monitoring/health
```

**Response:**

```json
{
  "status": "healthy",
  "components": {
    "api": {
      "status": "healthy",
      "responseTime": 45
    },
    "database": {
      "status": "healthy",
      "connectionPool": {
        "used": 5,
        "available": 15
      }
    },
    "cache": {
      "status": "healthy",
      "hitRate": 0.87
    }
  },
  "timestamp": "2025-07-05T14:45:00Z"
}
```

### Get System Metrics

```
GET /api/v1/monitoring/metrics
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| startTime | string | Start time (ISO format) |
| endTime | string | End time (ISO format) |
| metrics | string | Comma-separated list of metrics |
| interval | string | Time interval (1m, 5m, 1h, 1d) |

**Response:**

```json
{
  "timeframe": {
    "start": "2025-07-04T14:45:00Z",
    "end": "2025-07-05T14:45:00Z",
    "interval": "1h"
  },
  "metrics": {
    "cpu": [
      {"timestamp": "2025-07-04T15:00:00Z", "value": 32.5},
      {"timestamp": "2025-07-04T16:00:00Z", "value": 28.7},
      // ... more data points
    ],
    "memory": [
      {"timestamp": "2025-07-04T15:00:00Z", "value": 1256.8},
      {"timestamp": "2025-07-04T16:00:00Z", "value": 1245.2},
      // ... more data points
    ],
    "requestRate": [
      {"timestamp": "2025-07-04T15:00:00Z", "value": 125.3},
      {"timestamp": "2025-07-04T16:00:00Z", "value": 118.7},
      // ... more data points
    ]
  }
}
```

## Alerts

### List Alerts

```
GET /api/v1/monitoring/alerts
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status (active, resolved, all) |
| severity | string | Filter by severity (critical, warning, info) |
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20) |

**Response:**

```json
{
  "alerts": [
    {
      "id": "alert-001",
      "name": "High CPU Usage",
      "description": "CPU usage exceeded 80% threshold",
      "severity": "warning",
      "status": "active",
      "metric": "cpu",
      "threshold": 80,
      "value": 85.2,
      "triggeredAt": "2025-07-05T13:45:00Z"
    },
    {
      "id": "alert-002",
      "name": "Database Connection Issues",
      "description": "Database connection pool nearly exhausted",
      "severity": "critical",
      "status": "resolved",
      "metric": "db_connections",
      "threshold": 90,
      "value": 95,
      "triggeredAt": "2025-07-05T12:30:00Z",
      "resolvedAt": "2025-07-05T12:45:00Z"
    }
  ],
  "pagination": {
    "total": 8,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

### Create Alert Configuration

```
POST /api/v1/monitoring/alert-configs
```

**Request Body:**

```json
{
  "name": "High Error Rate",
  "description": "Alert when error rate exceeds threshold",
  "metric": "error_rate",
  "threshold": 5,
  "operator": ">",
  "duration": 300,
  "severity": "critical",
  "notifications": [
    {
      "type": "email",
      "target": "alerts@example.com"
    },
    {
      "type": "slack",
      "target": "#alerts-channel"
    }
  ]
}
```

**Response:**

```json
{
  "id": "config-001",
  "name": "High Error Rate",
  "description": "Alert when error rate exceeds threshold",
  "metric": "error_rate",
  "threshold": 5,
  "operator": ">",
  "duration": 300,
  "severity": "critical",
  "notifications": [
    {
      "type": "email",
      "target": "alerts@example.com"
    },
    {
      "type": "slack",
      "target": "#alerts-channel"
    }
  ],
  "createdAt": "2025-07-05T14:50:00Z",
  "updatedAt": "2025-07-05T14:50:00Z"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - The request was invalid |
| 401 | Unauthorized - Authentication failed |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Server temporarily unavailable |

## Rate Limiting

API requests are rate-limited to prevent abuse. The current limits are:

- 100 requests per minute per API key
- 1000 requests per hour per API key

Rate limit information is included in the response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1625490000
```

## Webhooks

### Register Webhook

```
POST /api/v1/webhooks
```

**Request Body:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["conversation.started", "conversation.ended", "message.received"],
  "secret": "your-webhook-secret"
}
```

**Response:**

```json
{
  "id": "webhook-001",
  "url": "https://example.com/webhook",
  "events": ["conversation.started", "conversation.ended", "message.received"],
  "createdAt": "2025-07-05T14:55:00Z",
  "updatedAt": "2025-07-05T14:55:00Z"
}
```

### Webhook Payload Example

```json
{
  "event": "conversation.ended",
  "timestamp": "2025-07-05T14:30:00Z",
  "data": {
    "conversationId": "5f8d0c1b2e3a4b5c6d7e8f9g",
    "chatbotId": "6a7b8c9d0e1f2g3h4i5j6k7l",
    "userId": "user-123",
    "channel": "website",
    "messageCount": 8,
    "duration": 900,
    "startedAt": "2025-07-05T14:15:00Z",
    "endedAt": "2025-07-05T14:30:00Z"
  }
}
```

## SDK Examples

### JavaScript

```javascript
const ChatbotSDK = require('chatbot-platform-sdk');

const client = new ChatbotSDK({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.chatbotplatform.com/v1'
});

// List chatbots
client.chatbots.list()
  .then(response => {
    console.log(response.chatbots);
  })
  .catch(error => {
    console.error('Error:', error);
  });

// Send a message
client.conversations.sendMessage({
  chatbotId: '5f8d0c1b2e3a4b5c6d7e8f9g',
  conversationId: '6a7b8c9d0e1f2g3h4i5j6k7l',
  message: 'Hello, how can I help you?'
})
  .then(response => {
    console.log('Message sent:', response);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Python

```python
from chatbot_platform_sdk import ChatbotClient

client = ChatbotClient(
    api_key='your-api-key',
    base_url='https://api.chatbotplatform.com/v1'
)

# List chatbots
try:
    response = client.chatbots.list()
    print(response['chatbots'])
except Exception as e:
    print(f"Error: {e}")

# Send a message
try:
    response = client.conversations.send_message(
        chatbot_id='5f8d0c1b2e3a4b5c6d7e8f9g',
        conversation_id='6a7b8c9d0e1f2g3h4i5j6k7l',
        message='Hello, how can I help you?'
    )
    print(f"Message sent: {response}")
except Exception as e:
    print(f"Error: {e}")
```
