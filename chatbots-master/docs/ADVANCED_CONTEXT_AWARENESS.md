# Advanced Context Awareness

This document provides an overview of the advanced context awareness features in the chatbot platform, including entity tracking, topic detection, and user preference learning.

## Overview

The advanced context awareness system enables chatbots to maintain context across conversations, track important entities, detect topics, and learn user preferences. This creates more natural and personalized interactions by allowing the chatbot to remember information over time.

## Features

### Entity Tracking

Entity tracking allows chatbots to identify, store, and reference entities (people, places, organizations, etc.) across multiple conversations.

**Key capabilities:**
- Track entities with metadata and confidence scores
- Create relationships between entities (e.g., "John works at Acme Corp")
- Reference entities across different conversations
- Query entities by type, name, or other attributes

**Example use cases:**
- Remember people mentioned in previous conversations
- Track locations a user has discussed
- Maintain knowledge of organizations relevant to the user

### Topic Detection

Topic detection identifies and tracks conversation topics over time, allowing the chatbot to understand what subjects are being discussed.

**Key capabilities:**
- Detect topics in user messages
- Track topic relevance and frequency
- Maintain topic history across conversations
- Calculate topic relevance scores based on recency and frequency

**Example use cases:**
- Identify user interests based on frequently discussed topics
- Provide relevant responses based on the current conversation topic
- Suggest related topics based on conversation history

### User Preference Learning

Preference learning enables chatbots to learn and apply user preferences to personalize responses.

**Key capabilities:**
- Store explicit user preferences
- Infer preferences from conversation content
- Apply preferences to select the most appropriate responses
- Manage preference confidence scores

**Example use cases:**
- Personalize response style (concise vs. detailed)
- Remember topic interests and tailor content accordingly
- Customize interaction patterns based on user behavior

## API Endpoints

### Entity Tracking Endpoints

```
POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/track-entity
POST /api/chatbots/:chatbotId/users/:userId/cross-conversation-entity-relations
POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/reference-entity
GET /api/chatbots/:chatbotId/users/:userId/cross-conversation-entities
GET /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/entities
GET /api/chatbots/:chatbotId/users/:userId/entities/:entityId/relations
DELETE /api/chatbots/:chatbotId/users/:userId/entities/:entityId
```

### Topic Detection Endpoints

```
POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/detect-topics
GET /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/topics
GET /api/chatbots/:chatbotId/users/:userId/topic-history
GET /api/chatbots/:chatbotId/users/:userId/topics-in-time-period
DELETE /api/chatbots/:chatbotId/users/:userId/topics/:topicId
```

### Preference Learning Endpoints

```
POST /api/chatbots/:chatbotId/users/:userId/preferences
POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/infer-preferences
GET /api/chatbots/:chatbotId/users/:userId/preferences
POST /api/chatbots/:chatbotId/users/:userId/apply-preferences
DELETE /api/chatbots/:chatbotId/users/:userId/preferences/:preferenceId
DELETE /api/chatbots/:chatbotId/users/:userId/preferences
```

### Combined Context Endpoints

```
POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/process-message
GET /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/context
GET /api/chatbots/:chatbotId/users/:userId/cross-conversation-context
POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/apply-context
DELETE /api/chatbots/:chatbotId/users/:userId/context
```

## Usage Examples

### Track an Entity

```javascript
// Track a person entity
const response = await axios.post(
  `/api/chatbots/${chatbotId}/users/${userId}/conversations/${conversationId}/track-entity`,
  {
    type: 'person',
    name: 'John Smith',
    aliases: ['John', 'Mr. Smith'],
    confidence: 0.9,
    metadata: {
      occupation: 'Software Engineer',
      location: 'San Francisco'
    }
  }
);
```

### Create an Entity Relation

```javascript
// Create a relation between two entities
const response = await axios.post(
  `/api/chatbots/${chatbotId}/users/${userId}/cross-conversation-entity-relations`,
  {
    sourceEntityId: personEntityId,
    targetEntityId: organizationEntityId,
    relationType: 'works_at',
    confidence: 0.8,
    metadata: {
      position: 'Senior Developer',
      startDate: '2022-01-15'
    }
  }
);
```

### Detect Topics in a Message

```javascript
// Detect topics in a user message
const response = await axios.post(
  `/api/chatbots/${chatbotId}/users/${userId}/conversations/${conversationId}/detect-topics`,
  {
    message: "I'm interested in learning more about artificial intelligence and machine learning technologies."
  }
);
```

### Set a User Preference

```javascript
// Set an explicit user preference
const response = await axios.post(
  `/api/chatbots/${chatbotId}/users/${userId}/preferences`,
  {
    category: 'communication',
    key: 'responseStyle',
    value: 'detailed',
    source: 'explicit',
    confidence: 1.0
  }
);
```

### Apply Context to Responses

```javascript
// Apply context to select the best response
const response = await axios.post(
  `/api/chatbots/${chatbotId}/users/${userId}/conversations/${conversationId}/apply-context`,
  {
    responseOptions: [
      {
        text: "Here's a brief answer to your question.",
        metadata: { style: 'concise' }
      },
      {
        text: "Let me provide you with a detailed explanation of this topic...",
        metadata: { style: 'detailed' }
      }
    ]
  }
);
```

## Best Practices

1. **Privacy and Data Retention**
   - Only store entities and preferences that are relevant to the chatbot's purpose
   - Implement appropriate data retention policies
   - Allow users to view and delete their stored context data

2. **Confidence Scores**
   - Use confidence scores to determine how much to trust inferred information
   - Prioritize explicit preferences over inferred ones
   - Increase confidence with repeated observations

3. **Performance Considerations**
   - Use indexes for efficient querying
   - Implement caching for frequently accessed context data
   - Consider pruning old or low-confidence context data

4. **Integration with Other Features**
   - Combine with analytics to identify patterns in user preferences
   - Use with learning systems to improve context awareness over time
   - Integrate with NLP capabilities for better entity and topic detection

## Implementation Details

The advanced context awareness system consists of several components:

1. **MongoDB Models**
   - `Entity`: Stores entity information
   - `EntityRelation`: Tracks relationships between entities
   - `EntityReference`: Records entity mentions in conversations
   - `Topic`: Stores topic information
   - `TopicReference`: Tracks topic occurrences in conversations
   - `Preference`: Stores user preferences

2. **Services**
   - `entity-tracking.service.js`: Handles entity operations
   - `topic-detection.service.js`: Manages topic detection and tracking
   - `preference-learning.service.js`: Handles preference operations
   - `advanced-context.service.js`: Integrates all context awareness features

3. **API Layer**
   - `advanced-context.controller.js`: Processes API requests
   - `advanced-context.routes.js`: Defines API endpoints

## Security Considerations

- All endpoints require authentication and appropriate permissions
- Input validation is performed on all requests
- Rate limiting is applied to prevent abuse
- Proxy settings are configured for external API calls (104.129.196.38:10563)

## Future Enhancements

- Integration with more sophisticated NLP models for better entity and topic detection
- Hierarchical topic modeling for more nuanced topic tracking
- Collaborative filtering for preference recommendations
- Context-aware response generation using the tracked context
