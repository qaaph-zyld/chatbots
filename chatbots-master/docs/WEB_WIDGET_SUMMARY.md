# Web Widget Implementation Summary

This document provides an overview of the web widget implementation for the Chatbots Platform, including its features, architecture, and usage instructions.

## Overview

The Chatbots Platform Web Widget is a lightweight, customizable chat interface that can be embedded into any website or web application. It provides a seamless way for users to interact with chatbots directly on a website.

## Features

- **Real-time Chat Interface**: Smooth, responsive chat experience
- **Customizable Appearance**: Themes, colors, and positioning options
- **Responsive Design**: Works on all devices and screen sizes
- **Proxy Support**: Built-in support for corporate proxies
- **API Integration**: Secure communication with the Chatbots Platform API
- **Event System**: Comprehensive event handling for integration with other systems
- **Accessibility**: WCAG 2.1 AA compliant
- **Internationalization**: Support for multiple languages
- **File Attachments**: Upload and download file capabilities
- **Voice Input/Output**: Optional speech recognition and synthesis

## Architecture

The web widget follows a modular architecture with the following components:

1. **ChatbotWidget**: Core class that manages the widget state and coordinates other components
2. **WidgetUI**: Handles the user interface rendering and interactions
3. **ApiClient**: Manages communication with the Chatbots Platform API
4. **Helpers**: Utility functions for common tasks

### Directory Structure

```
src/web-widget/
├── build.js                # Build script
├── package.json            # Package configuration
├── README.md               # Documentation
├── webpack.config.js       # Webpack configuration
├── src/
│   ├── index.js            # Main entry point
│   ├── ChatbotWidget.js    # Core widget class
│   ├── demo.html           # Demo page
│   ├── styles/             # Stylesheets
│   │   └── main.scss       # Main stylesheet
│   ├── ui/                 # UI components
│   │   └── WidgetUI.js     # UI manager
│   └── utils/              # Utilities
│       ├── ApiClient.js    # API client
│       └── helpers.js      # Helper functions
└── test/                   # Tests
    ├── widget.test.js      # Unit tests
    └── integration.test.js # Integration tests
```

## Integration Methods

### Script Tag Integration

The simplest way to integrate the widget is using a script tag:

```html
<script src="https://cdn.chatbots-platform.example.com/widget.js" 
  data-chatbot-widget="true"
  data-auto-init="true"
  data-api-key="YOUR_API_KEY"
  data-chatbot-id="YOUR_CHATBOT_ID"
  data-proxy-url="104.129.196.38:10563">
</script>
```

### JavaScript Integration

For more control, you can integrate the widget programmatically:

```javascript
import ChatbotWidget from '@chatbots-platform/web-widget';

const widget = new ChatbotWidget({
  apiKey: 'YOUR_API_KEY',
  chatbotId: 'YOUR_CHATBOT_ID',
  position: 'right',
  theme: 'light',
  proxyUrl: '104.129.196.38:10563'
});

widget.init();
```

## Proxy Configuration

The web widget includes built-in support for corporate proxies, which is essential for enterprise environments. The proxy can be configured in several ways:

1. **Script Tag**: Using the `data-proxy-url` attribute
2. **JavaScript**: Using the `proxyUrl` configuration option
3. **Build Process**: Using the `HTTP_PROXY` environment variable

For detailed instructions, see the [Proxy Configuration Guide](./PROXY_CONFIGURATION.md).

## Building and Testing

### Prerequisites

- Node.js 14+
- npm 6+

### Installation

```bash
cd src/web-widget
npm install
```

### Building

```bash
# Development build
npm run build:dev

# Production build
npm run build:prod

# Complete build with demo
npm run build
```

### Running the Demo

```bash
npm run demo
```

### Testing

```bash
npm test
```

## Deployment

The widget can be deployed in several ways:

1. **CDN**: Host the built files on a CDN for easy integration
2. **npm Package**: Publish as an npm package for use in JavaScript projects
3. **Self-hosted**: Host the files on your own server

## Security Considerations

- **API Key Security**: The API key should be kept secure
- **CORS**: The Chatbots Platform API supports CORS for secure cross-origin requests
- **Data Privacy**: Be mindful of data collected through the widget

## Future Enhancements

- **Analytics Integration**: Built-in support for tracking user interactions
- **Chatbot Handover**: Support for transferring conversations to human agents
- **Rich Message Types**: Support for cards, carousels, and other rich message types
- **Offline Support**: Ability to function when offline and sync when back online
- **Mobile SDK**: Native mobile SDK versions for iOS and Android

## Documentation

For more detailed information, refer to the following documentation:

- [Web Widget Integration Guide](./WEB_WIDGET_INTEGRATION.md)
- [Proxy Configuration Guide](./PROXY_CONFIGURATION.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Webhook Integration Guide](./WEBHOOK_INTEGRATION.md)
