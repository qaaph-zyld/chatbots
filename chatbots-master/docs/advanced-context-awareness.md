# Advanced Context Awareness

This document provides an overview of the Advanced Context Awareness features implemented in the chatbot platform.

## Overview

Advanced Context Awareness enhances the chatbot's ability to maintain context across conversations, track entities, learn user preferences, and detect topics. These capabilities enable more personalized and contextually relevant interactions with users.

## Key Components

### 1. Advanced Context Management

The Advanced Context Management service extends the basic context management capabilities by providing:

- Cross-conversation context tracking
- Long-term memory for chatbots
- Context prioritization and relevance scoring
- Context persistence across sessions

**API Endpoints:**
- `GET /chatbots/:chatbotId/users/:userId/conversations/:conversationId/context` - Get context for a conversation
- `PUT /chatbots/:chatbotId/users/:userId/conversations/:conversationId/context` - Update context for a conversation

### 2. Entity Tracking Across Conversations

The Entity Tracking service allows chatbots to track entities (people, places, things, concepts) across multiple conversations with a user, enabling:

- Recognition of previously mentioned entities
- Maintenance of entity properties and relationships
- Cross-referencing entities between conversations
- Entity disambiguation and merging

**API Endpoints:**
- `POST /chatbots/:chatbotId/users/:userId/conversations/:conversationId/track-entity` - Track an entity in a conversation
- `GET /chatbots/:chatbotId/users/:userId/cross-conversation-entities` - Get all tracked entities for a user
- `GET /chatbots/:chatbotId/users/:userId/cross-conversation-entities/:entityId` - Get a specific entity by ID
- `POST /chatbots/:chatbotId/users/:userId/cross-conversation-entity-relations` - Add a relation between entities
- `POST /chatbots/:chatbotId/users/:userId/merge-cross-conversation-entities` - Merge duplicate entities
- `GET /chatbots/:chatbotId/users/:userId/potential-duplicate-entities` - Find potential duplicate entities

### 3. User Preference Learning

The User Preference Learning service enables chatbots to learn and apply user preferences across conversations, including:

- Explicit preference capture from user statements
- Implicit preference inference from behavior
- Preference confidence scoring and validation
- Application of preferences to response generation

**API Endpoints:**
- `POST /chatbots/:chatbotId/users/:userId/preferences` - Set a user preference
- `GET /chatbots/:chatbotId/users/:userId/preferences` - Get user preferences
- `DELETE /chatbots/:chatbotId/users/:userId/preferences` - Delete a user preference
- `POST /chatbots/:chatbotId/users/:userId/conversations/:conversationId/infer-preferences` - Infer preferences from a message
- `POST /chatbots/:chatbotId/users/:userId/apply-preferences` - Apply preferences to response options

### 4. Topic Detection and Management

The Topic Detection service allows chatbots to identify, track, and manage conversation topics, enabling:

- Automatic topic detection in messages
- Topic tracking across conversations
- Topic relationship mapping
- Topic-based context switching

**API Endpoints:**
- `POST /chatbots/:chatbotId/topics` - Create or update a topic
- `POST /chatbots/:chatbotId/detect-topics` - Detect topics in text
- `POST /chatbots/:chatbotId/users/:userId/conversations/:conversationId/track-topics` - Track topics in a conversation
- `POST /chatbots/:chatbotId/topics/related` - Add related topics

## Usage Examples

### Tracking an Entity

```javascript
// Track a person entity
const response = await axios.post(
  '/chatbots/123/users/user456/conversations/conv789/track-entity',
  {
    type: 'person',
    name: 'John Smith',
    aliases: ['John', 'Mr. Smith'],
    confidence: 0.85,
    metadata: {
      occupation: 'Software Engineer',
      location: 'San Francisco'
    }
  }
);
```

### Setting a User Preference

```javascript
// Set a user preference for response style
const response = await axios.post(
  '/chatbots/123/users/user456/preferences',
  {
    category: 'communication',
    key: 'responseStyle',
    value: 'concise',
    source: 'explicit',
    confidence: 0.9
  }
);
```

### Detecting Topics in Text

```javascript
// Detect topics in a message
const response = await axios.post(
  '/chatbots/123/detect-topics',
  {
    text: "I'd like to discuss the latest developments in renewable energy, particularly solar power."
  }
);
```

## Integration with Other Services

The Advanced Context Awareness features integrate with:

1. **NLP Processing** - For entity extraction and topic detection
2. **Learning from Conversations** - To improve context understanding over time
3. **Conversation Analytics** - To track context usage and effectiveness
4. **Response Generation** - To create more contextually relevant responses

## Configuration

Advanced Context Awareness features can be configured in the chatbot settings:

- Context retention period (how long to maintain context)
- Entity tracking confidence threshold
- Topic detection sensitivity
- Preference learning aggressiveness

## Proxy Support

All HTTP requests made by the Advanced Context Awareness services use the configured proxy (104.129.196.38:10563) for external API calls.

## Best Practices

1. **Context Prioritization**: Focus on the most relevant context for the current conversation
2. **Entity Confidence**: Use confidence scores to handle ambiguous entity references
3. **Preference Validation**: Verify inferred preferences with users before applying them extensively
4. **Topic Transitions**: Manage smooth transitions between topics using the topic relationship graph

## Future Enhancements

1. Enhanced entity relationship mapping
2. Improved topic detection using deep learning models
3. Multi-modal context awareness (incorporating image and voice context)
4. Context-aware proactive suggestions
