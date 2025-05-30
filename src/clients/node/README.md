# Chatbots Platform API Client for Node.js

A simple client library for interacting with the Chatbots Platform External REST API.

## Installation

```bash
npm install @chatbots-platform/api-client
```

## Usage

```javascript
const ChatbotsClient = require('@chatbots-platform/api-client');

// Create a client instance
const client = new ChatbotsClient({
  apiKey: 'YOUR_API_KEY',
  // Optional: override default settings
  baseUrl: 'https://api.chatbots-platform.example.com/api/external',
  version: 'v1',
  proxyUrl: '104.129.196.38:10563', // Default proxy configuration
  useProxy: true // Enable proxy support
});

// Use the client to interact with the API
async function main() {
  try {
    // Get all chatbots
    const chatbots = await client.getChatbots();
    console.log('Available chatbots:', chatbots.data);
    
    // Create a conversation and send a message
    const response = await client.chat(
      chatbots.data[0].id, 
      'Hello, chatbot!',
      { source: 'node-client-example' }
    );
    
    console.log('User message:', response.data.userMessage);
    console.log('Bot response:', response.data.botMessage);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
```

## Proxy Configuration

This client library includes built-in support for proxy servers, which is essential for enterprise environments. By default, it uses the Chatbots Platform's recommended proxy configuration (`104.129.196.38:10563`).

You can customize the proxy configuration when creating the client:

```javascript
const client = new ChatbotsClient({
  apiKey: 'YOUR_API_KEY',
  proxyUrl: 'your-proxy-host:port',
  useProxy: true
});
```

Or disable proxy support entirely:

```javascript
const client = new ChatbotsClient({
  apiKey: 'YOUR_API_KEY',
  useProxy: false
});
```

## API Methods

### Chatbots

```javascript
// Get all accessible chatbots
const chatbots = await client.getChatbots();

// Get a specific chatbot
const chatbot = await client.getChatbot('chatbot-id');
```

### Conversations

```javascript
// Get all conversations
const conversations = await client.getConversations({
  chatbotId: 'optional-chatbot-id',
  limit: 20,
  page: 1
});

// Create a new conversation
const conversation = await client.createConversation(
  'chatbot-id',
  { source: 'node-client' } // Optional metadata
);

// Get a specific conversation
const conversation = await client.getConversation('conversation-id');
```

### Messages

```javascript
// Get messages in a conversation
const messages = await client.getMessages(
  'conversation-id',
  {
    limit: 50,
    before: '2025-05-26T12:00:00Z', // Optional timestamp
    after: '2025-05-25T12:00:00Z'   // Optional timestamp
  }
);

// Send a message in a conversation
const response = await client.sendMessage(
  'conversation-id',
  'Hello, chatbot!',
  'text', // Message type (default: 'text')
  { source: 'node-client' } // Optional metadata
);
```

### Knowledge Base

```javascript
// Search the knowledge base
const results = await client.searchKnowledge(
  'chatbot-id',
  'search query'
);
```

### Convenience Methods

```javascript
// Create a conversation and send a message in one call
const response = await client.chat(
  'chatbot-id',
  'Hello, chatbot!',
  { source: 'node-client' } // Optional metadata
);
```

## Error Handling

The client automatically handles errors and returns them in a consistent format:

```javascript
try {
  const chatbot = await client.getChatbot('non-existent-id');
} catch (error) {
  console.error('Error code:', error.error.code);
  console.error('Error message:', error.error.message);
}
```

## License

MIT
