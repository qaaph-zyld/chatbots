# ShopBot API Documentation

## Overview

The ShopBot API provides endpoints for managing e-commerce customer support automation. This API enables integration with Shopify and WooCommerce stores to handle customer inquiries, order tracking, and support automation.

## Base URL

```
https://api.shopbot.com/v1
```

## Authentication

All API requests require authentication using JWT tokens or API keys.

### Headers
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

## Core Endpoints

### Store Management

#### Register Store
```http
POST /api/stores
```

**Request Body:**
```json
{
  "name": "My Store",
  "platform": "shopify",
  "api_credentials": {
    "shop_domain": "mystore.myshopify.com",
    "access_token": "your_access_token"
  },
  "settings": {
    "business_hours": {
      "start": "09:00",
      "end": "17:00"
    },
    "auto_responses": true,
    "escalation_rules": {
      "max_wait_time": 300,
      "keywords": ["urgent", "complaint"]
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "store_id_123",
    "name": "My Store",
    "platform": "shopify",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Store Configuration
```http
GET /api/stores/:id
```

#### Update Store Settings
```http
PUT /api/stores/:id
```

### Chat Interface

#### Process Message
```http
POST /api/chat/:store_id
```

**Request Body:**
```json
{
  "message": "What's the status of my order #1001?",
  "customer_id": "customer_123",
  "session_id": "session_456",
  "context": {
    "email": "customer@example.com",
    "previous_orders": ["#1001", "#1002"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Your order #1001 is currently being processed and will ship within 2 business days.",
    "intent": "order_status",
    "confidence": 0.95,
    "actions": [
      {
        "type": "order_lookup",
        "data": {
          "order_id": "1001",
          "status": "processing"
        }
      }
    ],
    "escalate": false
  }
}
```

#### Get Conversation History
```http
GET /api/conversations/:id
```

#### Escalate to Human Agent
```http
PUT /api/conversations/:id/escalate
```

### Order Management

#### Get Order Status
```http
GET /api/orders/:store_id/:order_number
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_number": "#1001",
    "status": "shipped",
    "fulfillment_status": "fulfilled",
    "tracking_numbers": ["1Z999AA1234567890"],
    "estimated_delivery": "2024-01-05",
    "items": [
      {
        "title": "Product Name",
        "quantity": 1,
        "price": "99.99"
      }
    ]
  }
}
```

#### Process Refund
```http
POST /api/orders/:store_id/:order_id/refund
```

### Analytics

#### Get Performance Metrics
```http
GET /api/analytics/:store_id
```

**Query Parameters:**
- `start_date`: Start date (ISO 8601)
- `end_date`: End date (ISO 8601)
- `metric_type`: Type of metric (conversations, resolution_rate, response_time)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_conversations": 150,
    "resolution_rate": 0.85,
    "avg_response_time": 2.3,
    "customer_satisfaction": 4.2,
    "top_intents": [
      {"intent": "order_status", "count": 45},
      {"intent": "return_request", "count": 23}
    ]
  }
}
```

#### Export Analytics Data
```http
GET /api/analytics/:store_id/export
```

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTEGRATION_ERROR`: External platform API error
- `INTERNAL_ERROR`: Server error

## Rate Limiting

API requests are limited to:
- 1000 requests per hour for authenticated users
- 100 requests per hour for unauthenticated requests

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## Webhooks

ShopBot can send webhooks for important events:

### Webhook Events

- `conversation.started`: New conversation initiated
- `conversation.escalated`: Conversation escalated to human
- `conversation.completed`: Conversation resolved
- `order.status_updated`: Order status changed
- `analytics.daily_report`: Daily analytics summary

### Webhook Payload Example

```json
{
  "event": "conversation.escalated",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "conversation_id": "conv_123",
    "store_id": "store_456",
    "customer_email": "customer@example.com",
    "reason": "complex_issue",
    "context": {
      "last_message": "I need help with a custom order",
      "conversation_length": 5
    }
  }
}
```

## SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @shopbot/sdk
```

```javascript
const ShopBot = require('@shopbot/sdk');

const client = new ShopBot({
  apiKey: 'your_api_key',
  baseUrl: 'https://api.shopbot.com/v1'
});

// Process a message
const response = await client.chat.process('store_id', {
  message: 'Track my order #1001',
  customer_id: 'customer_123'
});
```

### Python
```bash
pip install shopbot-sdk
```

```python
from shopbot import ShopBotClient

client = ShopBotClient(api_key='your_api_key')

# Get order status
order = client.orders.get('store_id', '#1001')
```

## Testing

### Test Environment
```
Base URL: https://api-test.shopbot.com/v1
```

### Test Credentials
Contact support for test store credentials and API keys.

## Support

- Documentation: https://docs.shopbot.com
- Support Email: support@shopbot.com
- Status Page: https://status.shopbot.com
- GitHub: https://github.com/shopbot/api
