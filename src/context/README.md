# Context Persistence Module

This module provides workspace context awareness for the AI coder, enabling it to understand and reference the codebase effectively.

## Components

### 1. ContextManager

Manages the workspace context, including:
- Scanning the workspace for files
- Caching context for performance
- Tracking file changes
- Providing relevant context for queries

### 2. WorkspaceWatcher

Monitors the workspace for file changes and updates the context automatically.

### 3. PromptUtils

Utilities for creating well-formatted prompts with context injection.

## Getting Started

1. Install dependencies:
```bash
npm install chokidar
```

2. Basic usage:
```javascript
const ContextManager = require('./context/ContextManager');
const WorkspaceWatcher = require('./context/WorkspaceWatcher');

async function setupContext(workspaceRoot) {
  const contextManager = new ContextManager(workspaceRoot);
  const watcher = new WorkspaceWatcher(workspaceRoot, contextManager);
  
  await watcher.start();
  await contextManager.initialize();
  
  // Get relevant context for a query
  const relevantContext = contextManager.getRelevantContext("Show me authentication code");
  
  // Inject context into a prompt
  const prompt = contextManager.injectContextIntoPrompt("How does authentication work?");
  
  return { contextManager, watcher };
}
```

## Integration with Chatbot

To integrate with your chatbot:

1. Initialize the context manager when your bot starts
2. Use the context manager to enhance user prompts
3. Handle file change events to keep context up-to-date

Example integration:

```javascript
// In your message handler
async function handleUserMessage(message) {
  // Get relevant context for the message
  const context = contextManager.getRelevantContext(message);
  
  // Create a prompt with context
  const prompt = PromptUtils.createUserPrompt(message, context);
  
  // Send to AI and get response
  const response = await aiService.sendRequest([
    PromptUtils.createSystemPrompt({
      workspaceRoot: contextManager.workspaceRoot
    }),
    prompt
  ]);
  
  return response;
}
```

## Configuration

The context manager can be configured with these environment variables:

- `CONTEXT_CACHE_PATH`: Where to store the context cache (default: `.context-cache.json`)
- `MAX_CONTEXT_TOKENS`: Maximum tokens to include in context (default: 10000)
- `SCAN_INTERVAL_MS`: How often to check for changes (default: 5000ms)

## Best Practices

1. **Incremental Updates**: The context manager only rescans changed files for performance.
2. **Token Management**: Be mindful of token limits when including context.
3. **Error Handling**: Implement proper error handling for file operations.
4. **Cache Validation**: The cache is automatically invalidated when files change.

## Example

See `example.js` for a complete usage example.
