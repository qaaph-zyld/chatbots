# API Documentation

## Overview
The Chatbot Platform API provides RESTful endpoints for managing chatbots, conversations, and analytics.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Health Check
```http
GET /api/health
```
Returns API status and version information.

### Chatbots

#### Create Chatbot
```http
POST /api/chatbots
Content-Type: application/json

{
  "name": "My Chatbot",
  "description": "A helpful chatbot",
  "engine": "default",
  "settings": {}
}
```

#### Get Chatbot
```http
GET /api/chatbots/{id}
```

#### Update Chatbot
```http
PUT /api/chatbots/{id}
Content-Type: application/json

{
  "name": "Updated Name",
  "isActive": true
}
```

#### Delete Chatbot
```http
DELETE /api/chatbots/{id}
```

#### List Chatbots
```http
GET /api/chatbots?isActive=true&engine=default
```

#### Process Message
```http
POST /api/chatbots/{id}/message
Content-Type: application/json

{
  "message": "Hello, how can you help me?",
  "context": {}
}
```

### Conversations

#### List Conversations
```http
GET /api/conversations
Authorization: Bearer <token>
```

#### Create Conversation
```http
POST /api/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "chatbotId": "chatbot_123",
  "userId": "user_456"
}
```

### Analytics

#### Get Analytics Dashboard
```http
GET /api/analytics/dashboard
Authorization: Bearer <token>
```

#### Get Analytics Reports
```http
GET /api/analytics/reports
Authorization: Bearer <token>
```

## Error Responses

All endpoints return errors in the following format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
