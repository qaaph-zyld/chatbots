# MongoDB Data Abstraction Layer Refactoring Guide

This guide outlines the process for refactoring existing services to use the new MongoDB data abstraction layer with the repository pattern.

## Benefits of the Repository Pattern

1. **Separation of Concerns**: Isolates data access logic from business logic
2. **Query Optimization**: Centralizes query optimization in repositories
3. **Caching**: Implements consistent caching strategy across the application
4. **Error Handling**: Provides consistent error handling for database operations
5. **Transaction Support**: Simplifies transaction management
6. **Testing**: Makes services easier to test with mock repositories

## Refactoring Steps

### 1. Identify Direct Model Usage

Look for code that directly uses Mongoose models:

```javascript
// Before: Direct model usage
const Analytics = require('../models/analytics.model');
const results = await Analytics.find({ chatbotId: id }).lean();
```

### 2. Replace with Repository Methods

Replace direct model usage with repository methods:

```javascript
// After: Repository usage
const { repositories } = require('../data');
const results = await repositories.analytics.find({ chatbotId: id });
```

### 3. Use Specialized Repository Methods

Take advantage of specialized repository methods:

```javascript
// Before: Complex query with direct model
const analytics = await Analytics.find({
  chatbotId: id,
  period: 'daily',
  date: { $gte: startDate, $lte: endDate }
}).sort({ date: -1 }).lean();

// After: Specialized repository method
const analytics = await repositories.analytics.getByPeriod(
  id, 'daily', startDate, endDate
);
```

### 4. Implement Transactions

Replace manual transaction management with repository methods:

```javascript
// Before: Manual transaction management
const session = await mongoose.startSession();
session.startTransaction();
try {
  const chatbot = await Chatbot.create([data], { session });
  const analytics = await Analytics.create([{ chatbotId: chatbot[0]._id }], { session });
  await session.commitTransaction();
  return { chatbot: chatbot[0], analytics: analytics[0] };
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}

// After: Repository transaction methods
const session = await repositories.chatbot.startTransaction();
try {
  const chatbot = await repositories.chatbot.model.create([data], { session });
  const analytics = await repositories.analytics.model.create(
    [{ chatbotId: chatbot[0]._id }], 
    { session }
  );
  await repositories.chatbot.commitTransaction(session);
  return { chatbot: chatbot[0], analytics: analytics[0] };
} catch (error) {
  await repositories.chatbot.abortTransaction(session);
  throw error;
}
```

### 5. Implement Caching

Take advantage of repository caching:

```javascript
// Before: No caching
const chatbot = await Chatbot.findById(id).lean();

// After: With caching
const chatbot = await repositories.chatbot.findById(id);
```

### 6. Use Database Service Connection Management

Replace direct Mongoose connection management:

```javascript
// Before: Direct connection management
await mongoose.connect(process.env.MONGODB_URI);

// After: Database service connection management
const { databaseService } = require('../data');
await databaseService.connect();
```

## Example: Refactoring a Service

### Before Refactoring

```javascript
const mongoose = require('mongoose');
const Chatbot = require('../models/chatbot.model');
const Analytics = require('../models/analytics.model');
const logger = require('../utils/logger');

class ChatbotService {
  async getChatbotsByUser(userId) {
    try {
      return await Chatbot.find({ ownerId: userId }).lean();
    } catch (error) {
      logger.error('Error getting chatbots by user', { error: error.message });
      throw error;
    }
  }
  
  async searchChatbots(query) {
    try {
      return await Chatbot.find({ 
        $text: { $search: query } 
      }).lean();
    } catch (error) {
      logger.error('Error searching chatbots', { error: error.message });
      throw error;
    }
  }
  
  async createChatbotWithAnalytics(chatbotData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const chatbot = await Chatbot.create([chatbotData], { session });
      
      const analytics = await Analytics.create([{
        chatbotId: chatbot[0]._id,
        period: 'daily',
        date: new Date(),
        metrics: {
          sessions: { count: 0 },
          messages: { count: 0 },
          users: { unique: 0 }
        }
      }], { session });
      
      await session.commitTransaction();
      return { chatbot: chatbot[0], analytics: analytics[0] };
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error creating chatbot with analytics', { error: error.message });
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new ChatbotService();
```

### After Refactoring

```javascript
const { databaseService, repositories } = require('../data');
const { logger } = require('../utils');

class ChatbotService {
  constructor() {
    this.chatbotRepo = repositories.chatbot;
    this.analyticsRepo = repositories.analytics;
  }
  
  async getChatbotsByUser(userId) {
    try {
      await databaseService.connect();
      return await this.chatbotRepo.findByUser(userId);
    } catch (error) {
      logger.error('Error getting chatbots by user', { error: error.message });
      throw error;
    }
  }
  
  async searchChatbots(query) {
    try {
      await databaseService.connect();
      return await this.chatbotRepo.search(query);
    } catch (error) {
      logger.error('Error searching chatbots', { error: error.message });
      throw error;
    }
  }
  
  async createChatbotWithAnalytics(chatbotData) {
    try {
      await databaseService.connect();
      
      // Start transaction
      const session = await this.chatbotRepo.startTransaction();
      
      try {
        // Create chatbot with session
        const chatbot = await this.chatbotRepo.model.create([chatbotData], { session });
        
        // Create analytics record with session
        const analytics = await this.analyticsRepo.model.create([{
          chatbotId: chatbot[0]._id,
          period: 'daily',
          date: new Date(),
          metrics: {
            sessions: { count: 0 },
            messages: { count: 0 },
            users: { unique: 0 }
          }
        }], { session });
        
        // Commit transaction
        await this.chatbotRepo.commitTransaction(session);
        
        return { chatbot: chatbot[0], analytics: analytics[0] };
      } catch (error) {
        // Abort transaction on error
        await this.chatbotRepo.abortTransaction(session);
        logger.error('Transaction aborted', { error: error.message });
        throw error;
      }
    } catch (error) {
      logger.error('Error creating chatbot with analytics', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ChatbotService();
```

## Testing the Refactored Service

1. Run the test script to verify the data abstraction layer is working correctly:

```bash
node src/tests/scripts/data-layer-test.js
```

2. Run the chatbot repository demo to see the repository pattern in action:

```bash
node src/tests/scripts/chatbot-repository-demo.js
```

## Next Steps

1. Refactor all services to use the new data abstraction layer
2. Add more specialized repository methods as needed
3. Implement caching for frequently accessed data
4. Add performance monitoring for database operations
5. Update tests to use the new data abstraction layer

## Additional Resources

1. **Data Layer README**: See `src/data/README.md` for detailed documentation on the data abstraction layer
2. **Repository Implementations**: Review existing repositories in `src/data` for implementation examples
3. **Test Scripts**: See `src/tests/scripts` for examples of using repositories in tests
4. **Preference Service Refactoring Example**: See `docs/preference-service-refactoring-example.md` for a detailed example of refactoring a service to use the repository pattern
5. **Conversation Service Refactoring Example**: See `docs/conversation-service-refactoring.md` for a comprehensive example of refactoring a service with transaction support
6. **Entity Service Refactoring Example**: See `docs/entity-service-refactoring.md` for an example of refactoring entity management with caching and specialized query methods
7. **Topic Service Refactoring Example**: See `docs/topic-service-refactoring.md` for an example of refactoring topic management with pattern and response handling

## Best Practices

1. Always use repository methods instead of direct model access
2. Use specialized repository methods for complex queries
3. Use the database service for connection management
4. Use transactions for operations that modify multiple collections
5. Invalidate caches when data is modified
6. Use lean queries for read-only operations
7. Use projection to limit the fields returned by queries
