# MongoDB Data Abstraction Layer

This module provides an optimized data access layer for MongoDB models using the repository pattern. It centralizes database operations, implements query optimization, adds caching capabilities, provides consistent error handling, and supports transaction management.

## Architecture

The data layer consists of the following components:

- **BaseRepository**: Abstract base class providing common CRUD operations and query optimization capabilities
- **Model-specific Repositories**: Extend BaseRepository to provide model-specific optimized queries and caching
- **DatabaseService**: Manages MongoDB connection and provides access to repositories

## Features

- **Centralized Data Access**: All database operations are performed through repositories
- **Query Optimization**: Optimized queries with proper indexing and projection
- **Caching**: In-memory caching with TTL for frequently accessed data
- **Error Handling**: Consistent error handling and logging
- **Transaction Support**: Methods for transaction management
- **Connection Management**: Centralized connection handling with event listeners

## Usage

### Connecting to the Database

```javascript
const { databaseService } = require('../data');

// Connect to the database
await databaseService.connect();

// Disconnect when done
await databaseService.disconnect();
```

### Using Repositories

```javascript
const { repositories } = require('../data');

// Get a repository
const chatbotRepo = repositories.chatbot;
const analyticsRepo = repositories.analytics;
const conversationRepo = repositories.conversation;
const preferenceRepo = repositories.preference;

// Use repository methods
const userChatbots = await chatbotRepo.findByUser(userId);
const publicChatbots = await chatbotRepo.findPublic();
const chatbotsByType = await chatbotRepo.findByType('customer-support');
```

### Example: Finding and Updating a Document

```javascript
const { repositories, databaseService } = require('../data');

async function updateChatbotName(chatbotId, newName) {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Get repository
    const chatbotRepo = repositories.chatbot;
    
    // Find chatbot
    const chatbot = await chatbotRepo.findById(chatbotId);
    
    if (!chatbot) {
      throw new Error(`Chatbot not found: ${chatbotId}`);
    }
    
    // Update chatbot
    chatbot.name = newName;
    await chatbot.save();
    
    // Invalidate cache
    chatbotRepo.invalidateChatbotCache(chatbotId);
    
    return chatbot;
  } catch (error) {
    console.error('Error updating chatbot name', error);
    throw error;
  }
}
```

### Example: Using Transactions

```javascript
const { repositories, databaseService } = require('../data');

async function createChatbotWithConversation(chatbotData, conversationData) {
  // Get repositories
  const chatbotRepo = repositories.chatbot;
  const conversationRepo = repositories.conversation;
  
  // Start transaction session
  const session = await chatbotRepo.startTransaction();
  
  try {
    // Create chatbot with session
    const chatbot = await chatbotRepo.model.create([chatbotData], { session });
    
    // Add chatbot ID to conversation data
    conversationData.chatbotId = chatbot[0]._id;
    
    // Create conversation with session
    const conversation = await conversationRepo.model.create([conversationData], { session });
    
    // Commit transaction
    await chatbotRepo.commitTransaction(session);
    
    return { chatbot: chatbot[0], conversation: conversation[0] };
  } catch (error) {
    // Abort transaction on error
    await chatbotRepo.abortTransaction(session);
    console.error('Error creating chatbot with conversation', error);
    throw error;
  }
}
```

## Available Repositories

### ChatbotRepository

Repository for the Chatbot model with methods for finding chatbots by user, type, engine, and more.

```javascript
const chatbotRepo = repositories.chatbot;

// Find chatbots by user
const userChatbots = await chatbotRepo.findByUser(userId);

// Find public chatbots
const publicChatbots = await chatbotRepo.findPublic();

// Find chatbots by type
const supportChatbots = await chatbotRepo.findByType('customer-support');

// Find chatbots by engine
const openaiChatbots = await chatbotRepo.findByEngine('openai');

// Search chatbots
const searchResults = await chatbotRepo.search('support');

// Check access
const hasAccess = await chatbotRepo.hasAccess(chatbotId, userId);
```

### PreferenceRepository

Repository for the Preference model with methods for managing user preferences with caching and optimized queries.

```javascript
const preferenceRepo = repositories.preference;

// Get all preferences for a user
const userPreferences = await preferenceRepo.getByUserId(userId);

// Get preferences by category
const notificationPrefs = await preferenceRepo.getByCategory(userId, 'notifications');

// Get a specific preference
const emailPref = await preferenceRepo.getPreference(userId, 'notifications', 'email');

// Set a preference
const updatedPref = await preferenceRepo.setPreference(
  userId, 'notifications', 'email', false, 
  { source: 'explicit', confidence: 1.0 }
);

// Delete a preference
const deleted = await preferenceRepo.deletePreference(userId, 'notifications', 'email');

// Delete all user preferences
const result = await preferenceRepo.deleteAllUserPreferences(userId);

// Get high confidence preferences
const confidentPrefs = await preferenceRepo.getHighConfidencePreferences(userId, 0.8);

// Batch update preferences
const batchResult = await preferenceRepo.batchUpdatePreferences(userId, [
  { category: 'theme', key: 'mode', value: 'dark' },
  { category: 'notifications', key: 'email', value: false }
]);
```

### AnalyticsRepository

Repository for the Analytics model with methods for finding and aggregating analytics data.

```javascript
const analyticsRepo = repositories.analytics;

// Get analytics by period
const analytics = await analyticsRepo.getByPeriod(chatbotId, 'daily', startDate, endDate);

// Get latest analytics
const latestAnalytics = await analyticsRepo.getLatest(chatbotId, 'daily', 10);

// Generate summary
const summary = await analyticsRepo.generateSummary(chatbotId);

// Find or create analytics record
const record = await analyticsRepo.findOrCreate(chatbotId, 'daily', new Date());

// Update metrics
await analyticsRepo.updateMetrics(recordId, metrics);
```

### ConversationRepository

Repository for the Conversation model with methods for finding and analyzing conversations.

```javascript
const conversationRepo = repositories.conversation;

// Find active conversations
const activeConversations = await conversationRepo.findActive(chatbotId);

// Find conversations by user
const userConversations = await conversationRepo.findByUser(userId);

// Add message to conversation
await conversationRepo.addMessage(conversationId, message);

// Get conversation statistics
const statistics = await conversationRepo.getStatistics(chatbotId, startDate, endDate);

// Get conversation insights
const insights = await conversationRepo.getInsights(chatbotId, startDate, endDate);
```

## Testing

Run the data layer test script to verify the repositories are working correctly:

```bash
node src/tests/scripts/data-layer-test.js
```

## Future Improvements

- Add more repositories for other models
- Implement distributed caching with Redis
- Add query performance monitoring
- Implement automatic index optimization
- Add support for read replicas and sharding
