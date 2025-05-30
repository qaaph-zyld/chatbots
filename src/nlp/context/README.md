# Contextual Understanding

This module provides contextual understanding capabilities for the Open-Source Chatbots Platform, enabling chatbots to maintain conversation state and resolve references across multiple messages.

## Features

- **Conversation Context Management**: Maintains state across multiple conversation turns
- **Entity Tracking**: Tracks entities mentioned throughout a conversation
- **Reference Resolution**: Resolves pronouns and references to previously mentioned entities
- **Intent Memory**: Remembers previous intents to understand follow-up questions
- **Conversation History**: Stores and retrieves conversation history

## Core Concepts

### Conversation Context

A conversation context represents a single conversation session and contains:

- **Entities**: Entities mentioned during the conversation
- **Intents**: Intents detected throughout the conversation
- **References**: References to previously mentioned entities
- **Messages**: The history of messages in the conversation
- **Metadata**: Additional information about the conversation

### Reference Resolution

The module can resolve references in messages, such as:

- **Pronouns**: "he", "she", "it", "they", etc.
- **Demonstratives**: "this", "that", "these", "those"
- **Implicit References**: References to previously mentioned entities without explicitly naming them

## Usage

### Basic Usage

```javascript
const { nlpService } = require('./nlp/nlp.service');

// Create a conversation context
const userId = 'user123';
const context = await nlpService.createConversationContext(userId, {
  channel: 'web',
  locale: 'en-US'
});

// Process a message with context
const result = await nlpService.processTextWithContext(
  "What's the weather like in New York?",
  context.id,
  ['entities', 'intent']
);

// Process a follow-up message with reference resolution
const followUpResult = await nlpService.processTextWithContext(
  "What about tomorrow?",
  context.id,
  ['entities', 'intent']
);

// The system will understand that "tomorrow" refers to the weather in New York
console.log(followUpResult.context.resolvedReferences);
```

### Accessing Conversation History

```javascript
// Get conversation history
const history = await nlpService.getConversationHistory(context.id, 10);

// Display conversation
history.forEach(message => {
  console.log(`${message.role}: ${message.text}`);
});
```

### Accessing Active Entities

```javascript
// Get the current context
const context = await nlpService.getConversationContext(contextId);

// Access entities by type
const locations = context.entities.LOC || [];
const people = context.entities.PERSON || [];

// Use entities in response generation
if (locations.length > 0) {
  console.log(`I see you're interested in ${locations[0].value}`);
}
```

## Integration with NLP Service

The contextual understanding module is fully integrated with the NLP service, allowing it to be used seamlessly with other NLP features:

```javascript
// Process text with multiple NLP features and context
const result = await nlpService.processTextWithContext(
  text,
  contextId,
  ['entities', 'intent', 'sentiment'],
  { userId }
);

// Access NLP results
const entities = result.entities;
const intent = result.intent;
const sentiment = result.sentiment;

// Access context information
const resolvedReferences = result.context.resolvedReferences;
const activeEntities = result.context.activeEntities;
const recentIntents = result.context.recentIntents;
```

## Context Lifecycle

1. **Creation**: A context is created at the start of a conversation
2. **Updates**: The context is updated with each message
3. **Expiration**: Contexts expire after a configurable period of inactivity (default: 30 minutes)
4. **Cleanup**: Expired contexts are automatically cleaned up

## Configuration

The context management service can be configured with the following options:

```javascript
// Environment variables
process.env.CONTEXT_TTL_MINUTES = '60'; // Context time-to-live in minutes
process.env.MAX_CONTEXTS_PER_USER = '10'; // Maximum contexts per user

// Or through initialization options
await contextManagementService.initialize({
  contextTTL: 60 * 60 * 1000, // 60 minutes in milliseconds
  maxContextsPerUser: 10
});
```

## Performance Considerations

- Contexts are stored in memory for fast access and periodically persisted to storage
- Expired contexts are automatically cleaned up to prevent memory leaks
- The number of contexts per user is limited to prevent resource exhaustion

## Requirements

- Node.js 14+
- Local storage service (for persistence)

## License

This component is licensed under the MIT License, the same as the main project.
