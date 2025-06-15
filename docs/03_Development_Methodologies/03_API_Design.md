# API Design

This document outlines the API design principles and standards for the Chatbots project, aligned with the `dev_framework` principles.

## Overview

Our API design follows RESTful principles with some GraphQL capabilities for complex data requirements. This document provides guidelines for designing, implementing, and documenting APIs in the Chatbots platform.

## API Design Principles

### 1. Resource-Oriented Design

- APIs are organized around resources (nouns, not verbs)
- Use resource hierarchies for complex relationships
- Use HTTP methods appropriately to operate on resources

### 2. Consistency

- Consistent naming conventions
- Consistent request/response formats
- Consistent error handling
- Consistent versioning

### 3. Simplicity

- Keep APIs simple and intuitive
- Hide implementation details
- Minimize required parameters
- Provide sensible defaults

### 4. Security by Design

- Authentication for all endpoints
- Authorization at resource level
- Input validation and sanitization
- Rate limiting and quota management

### 5. Performance

- Optimize for common use cases
- Support pagination for large collections
- Allow field selection to reduce payload size
- Enable caching where appropriate

## RESTful API Guidelines

### Resource Naming

- Use plural nouns for collections: `/users`, `/messages`
- Use concrete names over abstract concepts: `/tickets` instead of `/issues`
- Use lowercase, kebab-case for multi-word resources: `/chat-sessions`
- Use resource hierarchies for ownership relationships: `/users/{userId}/conversations`

### HTTP Methods

| Method | Description | Idempotent | Safe |
|--------|-------------|------------|------|
| GET | Retrieve a resource or collection | Yes | Yes |
| POST | Create a new resource | No | No |
| PUT | Replace a resource completely | Yes | No |
| PATCH | Update a resource partially | No | No |
| DELETE | Remove a resource | Yes | No |

### Status Codes

| Code | Description | Example Use Case |
|------|-------------|-----------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST that creates a resource |
| 204 | No Content | Successful DELETE or update with no response body |
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authentication succeeded but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Request conflicts with current state |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Request Format

```http
POST /api/v1/conversations HTTP/1.1
Host: api.chatbots.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json

{
  "userId": "user123",
  "botId": "bot456",
  "initialMessage": {
    "text": "Hello, I need help with my account."
  },
  "metadata": {
    "source": "web",
    "locale": "en-US"
  }
}
```

### Response Format

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/v1/conversations/conv789

{
  "id": "conv789",
  "userId": "user123",
  "botId": "bot456",
  "status": "active",
  "createdAt": "2023-06-15T10:30:00Z",
  "messages": [
    {
      "id": "msg001",
      "text": "Hello, I need help with my account.",
      "sender": "user",
      "timestamp": "2023-06-15T10:30:00Z"
    },
    {
      "id": "msg002",
      "text": "Hi there! I'd be happy to help with your account. What specific issue are you experiencing?",
      "sender": "bot",
      "timestamp": "2023-06-15T10:30:01Z"
    }
  ],
  "_links": {
    "self": {
      "href": "/api/v1/conversations/conv789"
    },
    "messages": {
      "href": "/api/v1/conversations/conv789/messages"
    }
  }
}
```

### Error Response Format

```json
{
  "error": {
    "code": "validation_error",
    "message": "The request contains invalid parameters",
    "details": [
      {
        "field": "initialMessage",
        "message": "Initial message is required"
      }
    ]
  },
  "requestId": "req-123456"
}
```

### Pagination

```http
GET /api/v1/conversations?limit=10&cursor=eyJpZCI6ImNvbnY3ODkifQ==
```

```json
{
  "data": [
    {
      "id": "conv790",
      "userId": "user123",
      "botId": "bot456",
      "status": "active",
      "createdAt": "2023-06-15T11:30:00Z"
    },
    // ... more items
  ],
  "pagination": {
    "limit": 10,
    "nextCursor": "eyJpZCI6ImNvbnY4MDAifQ==",
    "hasMore": true
  }
}
```

### Filtering and Sorting

```http
GET /api/v1/conversations?status=active&botId=bot456&sort=-createdAt
```

## GraphQL API Guidelines

For complex data requirements, we provide a GraphQL API that allows clients to request exactly the data they need.

### Schema Design

- Use descriptive names for types, fields, and operations
- Follow naming conventions: PascalCase for types, camelCase for fields
- Design for reusability with interfaces and unions
- Provide meaningful descriptions for all schema elements

### Example Query

```graphql
query GetConversationWithMessages($id: ID!) {
  conversation(id: $id) {
    id
    status
    createdAt
    user {
      id
      name
      avatar
    }
    bot {
      id
      name
      capabilities
    }
    messages(limit: 10) {
      id
      text
      sender
      timestamp
      attachments {
        id
        type
        url
      }
    }
  }
}
```

### Example Mutation

```graphql
mutation CreateMessage($conversationId: ID!, $text: String!) {
  createMessage(input: {
    conversationId: $conversationId,
    text: $text
  }) {
    id
    text
    timestamp
    status
  }
}
```

### Error Handling

```json
{
  "errors": [
    {
      "message": "Conversation not found",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["conversation"],
      "extensions": {
        "code": "NOT_FOUND",
        "requestId": "req-123456"
      }
    }
  ],
  "data": {
    "conversation": null
  }
}
```

## API Versioning

We use a pragmatic approach to API versioning:

- Major version in the URL path: `/api/v1/conversations`
- Minor changes are backward compatible within the same major version
- Breaking changes require a new major version
- Support at least one previous major version during transition periods

## API Documentation

All APIs are documented using OpenAPI (Swagger) for REST APIs and GraphQL Schema for GraphQL APIs:

- Interactive documentation available at `/api/docs`
- Include examples for all operations
- Document all parameters, responses, and error cases
- Provide authentication instructions

## API Security

### Authentication

- JWT-based authentication
- OAuth 2.0 for third-party integrations
- API keys for server-to-server communication

### Authorization

- Role-based access control
- Resource-level permissions
- Scoped tokens

### Rate Limiting

- Per-endpoint rate limits
- User-based quotas
- Graduated rate limits based on user tier

## API Lifecycle Management

### Development Workflow

1. Design API contract (OpenAPI/GraphQL Schema)
2. Review with stakeholders
3. Implement API
4. Test against contract
5. Document and publish

### Deprecation Process

1. Announce deprecation with timeline
2. Add deprecation notices in responses
3. Monitor usage of deprecated endpoints
4. Provide migration guides
5. Remove after deprecation period

## Related Documentation

- [REST_API_REFERENCE.md](../REST_API_REFERENCE.md) - Detailed REST API reference
- [GRAPHQL_SCHEMA.md](../GRAPHQL_SCHEMA.md) - GraphQL schema documentation
- [API_AUTHENTICATION.md](../API_AUTHENTICATION.md) - API authentication details
