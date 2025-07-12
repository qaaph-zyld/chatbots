# Plugin Architecture

## Overview

The chatbot platform supports a robust plugin architecture that allows developers to extend the platform's functionality without modifying the core codebase. Plugins can hook into various stages of the message processing pipeline, add new capabilities, integrate with external services, and customize the behavior of chatbots.

## Plugin Structure

Each plugin consists of:

1. **Metadata**: Information about the plugin, including name, version, description, and author
2. **Configuration Options**: Customizable settings that control the plugin's behavior
3. **Hooks**: Functions that are executed at specific points in the message processing pipeline
4. **Implementation**: The actual code that implements the plugin's functionality

### Plugin Directory Structure

```
src/plugins/
├── plugin-name/
│   ├── index.js       # Main plugin entry point
│   ├── README.md      # Plugin documentation
│   └── [other files]  # Additional plugin files
```

### Plugin Entry Point (index.js)

Each plugin must have an `index.js` file that exports the plugin metadata and hooks:

```javascript
module.exports = {
  name: 'plugin-name',
  version: '1.0.0',
  description: 'Plugin description',
  author: 'Plugin author',
  configOptions: [...],
  hooks: {
    'hookName': async (data, config) => {
      // Hook implementation
      return data;
    }
  }
};
```

## Plugin Hooks

Plugins can implement the following hooks:

| Hook Name | Description | Data Passed | Expected Return |
|-----------|-------------|-------------|----------------|
| `preProcessMessage` | Executed before processing a user message | `{ message, user, chatbot }` | Modified data object |
| `postProcessMessage` | Executed after processing a user message | `{ message, user, chatbot }` | Modified data object |
| `preProcessResponse` | Executed before generating a response | `{ message, user, chatbot, context }` | Modified data object |
| `postProcessResponse` | Executed after generating a response | `{ message, response, user, chatbot }` | Modified data object |
| `onMessage` | Executed when a message is received | `{ message, user, chatbot }` | Modified data object |
| `onResponse` | Executed when a response is sent | `{ message, response, user, chatbot }` | Modified data object |

## Configuration Options

Plugins can define configuration options that can be customized by chatbot administrators:

```javascript
configOptions: [
  {
    name: 'optionName',
    type: 'string', // string, number, boolean, array, object
    description: 'Option description',
    required: false,
    defaultValue: 'default'
  }
]
```

## Available Plugins

The platform includes the following plugins:

### 1. Sentiment Analyzer

Analyzes the sentiment of user messages and adds sentiment data to the message context. This allows the chatbot to respond appropriately based on the detected sentiment.

[Learn more about the Sentiment Analyzer plugin](../src/plugins/sentiment-analyzer/README.md)

### 2. Weather Integration

Adds weather information to chatbot responses when weather-related queries are detected. It uses an external weather API to fetch current weather data for specified locations.

[Learn more about the Weather Integration plugin](../src/plugins/weather-integration/README.md)

### 3. Translator

Enables multilingual capabilities for chatbots by translating messages between languages using open-source translation libraries. It supports both explicit translation requests and automatic translation of messages.

[Learn more about the Translator plugin](../src/plugins/translator/README.md)

## Developing Custom Plugins

To develop a custom plugin:

1. Create a new directory in `src/plugins/` with your plugin name
2. Create an `index.js` file with your plugin metadata and hooks
3. Implement the hooks to provide your plugin's functionality
4. Create a `README.md` file to document your plugin
5. Register your plugin using the Plugin Management interface

### Example Plugin Template

```javascript
/**
 * Example Plugin
 */

const { logger } = require('../../utils');

// Plugin metadata
const pluginInfo = {
  name: 'example-plugin',
  version: '1.0.0',
  description: 'An example plugin',
  author: 'Your Name',
  
  // Configuration options
  configOptions: [
    {
      name: 'exampleOption',
      type: 'string',
      description: 'An example option',
      required: false,
      defaultValue: 'default'
    }
  ]
};

// Plugin hooks
const hooks = {
  'preProcessMessage': async (data, config) => {
    // Modify the message before processing
    return data;
  },
  
  'postProcessResponse': async (data, config) => {
    // Modify the response after processing
    return data;
  }
};

// Export plugin
module.exports = {
  ...pluginInfo,
  hooks
};
```

## Plugin Management

Plugins can be managed through the Plugin Management interface or programmatically using the Plugin Service API:

```javascript
const pluginService = require('./services/plugin.service');

// Register a plugin
await pluginService.registerPlugin({
  name: 'plugin-name',
  version: '1.0.0',
  entryPoint: 'index.js',
  installPath: '/path/to/plugin'
});

// Install a plugin on a chatbot
await pluginService.installPlugin(chatbotId, pluginId, config);

// Enable/disable a plugin
await pluginService.setPluginEnabled(instanceId, isEnabled);
```

## Best Practices

1. **Error Handling**: Always handle errors gracefully and return the original data if an error occurs
2. **Performance**: Keep plugin operations lightweight and asynchronous
3. **Documentation**: Provide clear documentation for your plugin
4. **Configuration**: Make your plugin configurable to support different use cases
5. **Isolation**: Ensure your plugin doesn't interfere with other plugins
6. **Proxy Configuration**: Use the configured proxy for all external API calls (104.129.196.38:10563)
