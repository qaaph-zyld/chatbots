# API Versioning Guide

This document outlines the API versioning strategy for the Chatbots Platform, ensuring backward compatibility and smooth transitions for API consumers as the platform evolves.

## Versioning Strategy

The Chatbots Platform uses **URL path versioning** as the primary versioning strategy. This approach is chosen for its simplicity, visibility, and compatibility with various client implementations.

### URL Path Format

```
https://api.chatbots-platform.example.com/api/v{version_number}/{resource}
```

Example:
```
https://api.chatbots-platform.example.com/api/v1/chatbots
```

### Version Numbers

- Versions are represented as whole numbers (v1, v2, v3)
- We do not use minor versions in the URL (no v1.1, v1.2, etc.)
- The latest version is always available without a version number at `/api/{resource}`

## When to Create a New Version

A new API version is created when making breaking changes that would disrupt existing clients. Examples include:

1. Removing or renaming endpoints
2. Changing the structure of request or response payloads
3. Changing the meaning of HTTP status codes
4. Removing or renaming request parameters
5. Changing authentication mechanisms

Non-breaking changes do not require a new version:

1. Adding new endpoints
2. Adding optional request parameters
3. Adding new fields to response payloads
4. Bug fixes that maintain the same behavior

## Version Lifecycle

Each API version follows a defined lifecycle:

1. **Development**: Internal development and testing
2. **Preview**: Available to selected partners for early testing
3. **General Availability (GA)**: Publicly available and fully supported
4. **Deprecated**: Still available but scheduled for retirement
5. **Retired**: No longer available

### Deprecation Policy

- API versions are supported for a minimum of 12 months after a new version is released
- Deprecation notices are provided at least 6 months before retirement
- Deprecation is communicated through:
  - API response headers (`X-API-Deprecated: true`)
  - Documentation updates
  - Email notifications to registered API users
  - Deprecation notices in the developer portal

## Implementation Guidelines

### Directory Structure

API versions are organized in the codebase as follows:

```
src/
  api/
    v1/
      routes/
      controllers/
      models/
      middleware/
    v2/
      routes/
      controllers/
      models/
      middleware/
    current/ (symlink to latest version)
```

### Code Reuse

To minimize duplication, common functionality should be extracted into shared modules:

```
src/
  api/
    common/
      utils/
      validators/
      helpers/
    v1/
    v2/
```

### Version-Specific Documentation

Each API version has its own documentation:

```
docs/
  api/
    v1/
    v2/
```

## Client Implementation Best Practices

### Version Selection

Clients should:

1. Specify the exact API version they depend on
2. Be prepared to migrate to newer versions according to the deprecation timeline
3. Test their integration against new versions before migrating

### Version Header

In addition to URL versioning, clients can specify the desired version using the `Accept` header:

```
Accept: application/json; version=1
```

This is supported as an alternative to URL versioning for clients that prefer header-based versioning.

## Example: Migrating from v1 to v2

### V1 Endpoint (Original)

```
GET /api/v1/chatbots/{id}
```

Response:
```json
{
  "id": "60d21b4667d0d8992e610c85",
  "name": "Customer Support Bot",
  "type": "rule-based",
  "created": "2023-01-01T00:00:00Z"
}
```

### V2 Endpoint (Breaking Changes)

```
GET /api/v2/chatbots/{id}
```

Response:
```json
{
  "id": "60d21b4667d0d8992e610c85",
  "name": "Customer Support Bot",
  "botType": "rule-based",
  "metadata": {
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-15T00:00:00Z",
    "createdBy": "user123"
  }
}
```

Key changes:
1. Renamed `type` to `botType`
2. Moved `created` into a `metadata` object and renamed to `createdAt`
3. Added new fields: `updatedAt` and `createdBy`

### Migration Guide

A migration guide would be published explaining:
1. The changes between versions
2. How to adapt client code
3. Timeline for deprecation of v1
4. Testing procedures for v2

## Version Compatibility Matrix

| Feature | v1 | v2 | Notes |
|---------|----|----|-------|
| Authentication | JWT, API Key | JWT, API Key, OAuth2 | OAuth2 added in v2 |
| Chatbot Management | Basic CRUD | Extended CRUD + Templates | Templates only in v2 |
| Conversation API | Simple messages | Rich messages + Attachments | Rich messages only in v2 |
| Webhooks | Basic events | Advanced events + Filtering | Advanced filtering in v2 |

## Monitoring and Analytics

To inform versioning decisions, we track:

1. Usage metrics by version
2. Error rates by version
3. Client migration patterns
4. Deprecated endpoint usage

This data helps determine when versions can be safely retired and which features need to be maintained for backward compatibility.

## Communicating Changes

All API changes are communicated through multiple channels:

1. **Changelog**: Detailed technical changes for each version
2. **Release Notes**: User-friendly summaries of new features and changes
3. **Developer Blog**: Articles explaining major changes and migration strategies
4. **Email Notifications**: Direct communication to API users about important changes
5. **Status Page**: Real-time updates about API availability and issues

## Conclusion

This versioning strategy ensures that the Chatbots Platform API can evolve while maintaining compatibility with existing clients. By following these guidelines, we provide a predictable and reliable API for our developer community.
