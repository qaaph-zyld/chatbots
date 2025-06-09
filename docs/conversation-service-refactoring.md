# Conversation Service Refactoring Documentation

## Overview

This document details the refactoring of the `conversation.service.js` to use the MongoDB abstraction layer with the repository pattern. The refactoring follows the architecture optimization plan and aligns with the MongoDB abstraction refactoring guide.

## Changes Made

### 1. Dependency Updates

**Before:**
```javascript
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Conversation = require('../database/schemas/conversation.schema');
const { logger } = require('../utils');
```

**After:**
```javascript
const { v4: uuidv4 } = require('uuid');
const { databaseService, repositories } = require('../data');
const { logger } = require('../utils');
```

### 2. Database Connection Management

All methods now ensure database connection before performing operations:

```javascript
// Ensure database connection
await databaseService.connect();
```

### 3. Repository Pattern Implementation

All direct Mongoose model calls have been replaced with repository methods:

**Before:**
```javascript
const conversation = await Conversation.findById(conversationId);
await conversation.save();
```

**After:**
```javascript
const conversation = await repositories.conversation.findById(conversationId);
const updatedConversation = await repositories.conversation.findByIdAndUpdate(
  conversationId,
  { $set: { isActive: false } },
  { new: true }
);
```

### 4. Transaction Support

Added transaction support for operations that require atomic updates:

```javascript
// Start a transaction for adding the message
const session = await repositories.conversation.startTransaction();

try {
  // Operations within transaction
  // ...
  
  // Commit transaction
  await repositories.conversation.commitTransaction(session);
} catch (error) {
  // Abort transaction on error
  await repositories.conversation.abortTransaction(session);
  throw error;
}
```

### 5. Optimized Queries

Leveraged specialized repository methods for common query patterns:

**Before:**
```javascript
const conversations = await Conversation.find({ 
  chatbotId, 
  isActive: true 
})
.sort({ lastMessageAt: -1 })
.limit(limit);
```

**After:**
```javascript
const options = {
  sort: { lastMessageAt: -1 },
  limit
};

const conversations = await repositories.conversation.findActive(chatbotId, options);
```

## Key Benefits

1. **Separation of Concerns**: Business logic in the service layer is now cleanly separated from data access logic in the repository layer.

2. **Improved Testability**: The service can be tested with mocked repositories, allowing for more focused unit tests.

3. **Centralized Data Access**: All database operations are now handled through the repository, providing a consistent interface.

4. **Transaction Support**: Critical operations now use transactions for data integrity.

5. **Caching Integration**: The repository pattern enables transparent caching of frequently accessed data.

6. **Consistent Error Handling**: Error handling is standardized across all database operations.

## Testing

A comprehensive test script has been created at `src/tests/scripts/conversation-service-test.js` to validate the refactored service. The tests cover:

- Creating conversations
- Retrieving conversations by ID and session ID
- Adding messages to conversations
- Updating conversation context
- Getting active conversations
- Ending conversations

## Implementation Details

### Method: createConversation

**Before:**
```javascript
const conversation = new Conversation({
  chatbotId,
  sessionId,
  userId,
  context: initialContext,
  messages: [],
  startedAt: new Date(),
  lastMessageAt: new Date(),
  isActive: true,
  metadata: {}
});

await conversation.save();
```

**After:**
```javascript
const conversationData = {
  chatbotId,
  sessionId,
  userId,
  context: initialContext,
  messages: [],
  startedAt: new Date(),
  lastMessageAt: new Date(),
  isActive: true,
  metadata: {}
};

const conversation = await repositories.conversation.create(conversationData);
```

### Method: addMessage

**Before:**
```javascript
const conversation = await Conversation.findById(conversationId);
await conversation.addMessage(text, sender, metadata);
```

**After:**
```javascript
// Start a transaction
const session = await repositories.conversation.startTransaction();

try {
  // Create message object
  const message = {
    text,
    sender,
    timestamp: new Date(),
    metadata
  };
  
  // Update conversation with new message
  const update = {
    $push: { messages: message },
    $set: { lastMessageAt: new Date() }
  };
  
  // Update conversation in database
  const updatedConversation = await repositories.conversation.findByIdAndUpdate(
    conversationId,
    update,
    { session, new: true }
  );
  
  // Commit transaction
  await repositories.conversation.commitTransaction(session);
  
  return updatedConversation;
} catch (error) {
  // Abort transaction on error
  await repositories.conversation.abortTransaction(session);
  throw error;
}
```

## Future Improvements

1. **Enhanced Caching**: Implement more sophisticated caching strategies for frequently accessed conversations.

2. **Batch Operations**: Add support for batch operations to improve performance when processing multiple conversations.

3. **Query Optimization**: Further optimize queries with proper indexing and projection.

4. **Metrics Collection**: Add instrumentation to track repository performance metrics.

5. **Pagination Support**: Enhance the repository to support cursor-based pagination for large result sets.

## Migration Guide for Other Services

When refactoring other services to use the repository pattern, follow these steps:

1. **Update Dependencies**:
   - Remove direct Mongoose model imports
   - Import `databaseService` and `repositories` from the data layer

2. **Ensure Database Connection**:
   - Add `await databaseService.connect()` at the beginning of each method that accesses the database

3. **Replace Direct Model Access**:
   - Replace `Model.find()` with `repositories.modelName.find()`
   - Replace `Model.findById()` with `repositories.modelName.findById()`
   - Replace `new Model()` and `save()` with `repositories.modelName.create()`

4. **Add Transaction Support**:
   - For operations that modify multiple documents or require atomicity
   - Use `startTransaction()`, `commitTransaction()`, and `abortTransaction()`

5. **Leverage Specialized Repository Methods**:
   - Use custom repository methods for common query patterns
   - Consider adding new repository methods for service-specific queries

6. **Update Error Handling**:
   - Ensure consistent error logging and propagation
   - Add specific error handling for repository-specific errors

7. **Create Tests**:
   - Create comprehensive tests for the refactored service
   - Validate all functionality works as expected with the repository pattern

## Conclusion

The refactoring of the conversation service to use the MongoDB abstraction layer with the repository pattern has improved the code quality, maintainability, and performance. This refactoring serves as a template for other services that still use direct Mongoose model access.

By following the architecture optimization plan and the MongoDB abstraction refactoring guide, we are moving towards a more modular, maintainable, and performant codebase.
