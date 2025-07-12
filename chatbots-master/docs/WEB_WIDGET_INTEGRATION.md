# Web Widget Integration Guide

This guide explains how to integrate the Chatbots Platform Web Widget into your website or web application.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [JavaScript API](#javascript-api)
- [Events](#events)
- [Styling](#styling)
- [Localization](#localization)
- [Security Considerations](#security-considerations)
- [Proxy Configuration](#proxy-configuration)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Overview

The Chatbots Platform Web Widget is a lightweight, customizable chat interface that can be embedded into any website or web application. It provides a seamless way for your users to interact with your chatbots directly on your website.

Key features:
- Real-time chat interface
- Customizable themes and appearance
- Responsive design for all devices
- Secure communication with the Chatbots Platform API
- Support for attachments, voice input, and more
- Comprehensive JavaScript API

## Installation

### Via CDN (Recommended)

Add the following script to your website's HTML, preferably just before the closing `</body>` tag:

```html
<script src="https://cdn.chatbots-platform.example.com/widget.js" 
  data-chatbot-widget="true"
  data-auto-init="true"
  data-api-key="YOUR_API_KEY"
  data-chatbot-id="YOUR_CHATBOT_ID">
</script>
```

Replace `YOUR_API_KEY` and `YOUR_CHATBOT_ID` with your actual API key and chatbot ID from the Chatbots Platform dashboard.

### Via npm

If you're using a module bundler like webpack, you can install the widget via npm:

```bash
npm install @chatbots-platform/web-widget
```

Then import and initialize the widget in your JavaScript code:

```javascript
import ChatbotWidget from '@chatbots-platform/web-widget';

const widget = new ChatbotWidget({
  apiKey: 'YOUR_API_KEY',
  chatbotId: 'YOUR_CHATBOT_ID'
});

widget.init();
```

## Configuration

The widget can be configured using data attributes (when using the script tag) or JavaScript options (when using npm).

### Script Tag Configuration

```html
<script src="https://cdn.chatbots-platform.example.com/widget.js" 
  data-chatbot-widget="true"
  data-auto-init="true"
  data-api-key="YOUR_API_KEY"
  data-chatbot-id="YOUR_CHATBOT_ID"
  data-position="right"
  data-theme="light"
  data-welcome-message="Hello! How can I help you today?"
  data-title="Chatbot Assistant"
  data-subtitle="How can I help you today?"
  data-primary-color="#2563eb"
  data-secondary-color="#f3f4f6"
  data-text-color="#111827"
  data-api-url="https://api.chatbots-platform.example.com"
  data-proxy-url="104.129.196.38:10563">
</script>
```

### JavaScript Configuration

```javascript
const widget = new ChatbotWidget({
  apiKey: 'YOUR_API_KEY',
  chatbotId: 'YOUR_CHATBOT_ID',
  position: 'right', // 'right' or 'left'
  theme: 'light', // 'light', 'dark', or 'auto'
  welcomeMessage: 'Hello! How can I help you today?',
  title: 'Chatbot Assistant',
  subtitle: 'How can I help you today?',
  primaryColor: '#2563eb',
  secondaryColor: '#f3f4f6',
  textColor: '#111827',
  apiUrl: 'https://api.chatbots-platform.example.com',
  proxyUrl: '104.129.196.38:10563', // Optional proxy URL
  userId: 'user123', // Optional user ID for tracking
  userEmail: 'user@example.com', // Optional user email
  userName: 'John Doe', // Optional user name
  enableAttachments: true, // Enable file attachments
  enableVoice: false, // Enable voice input/output
  enableHistory: true, // Enable conversation history
  enableTypingIndicator: true, // Enable typing indicator
  enableReadReceipts: true, // Enable read receipts
  enableUserFeedback: true, // Enable user feedback
  messageDelay: 500, // Delay between messages in ms
  autoOpen: false, // Auto open the widget on load
  persistSession: true, // Persist session across page reloads
  debug: false // Enable debug logging
});

widget.init();
```

## JavaScript API

The widget exposes the following methods:

### Initialization

```javascript
// Initialize the widget
widget.init();
```

### Widget Controls

```javascript
// Open the widget
widget.open();

// Close the widget
widget.close();

// Toggle the widget (open if closed, close if open)
widget.toggle();
```

### Messaging

```javascript
// Send a message programmatically
widget.sendMessage('Hello, chatbot!');

// Clear the conversation
widget.clearConversation();
```

### Customization

```javascript
// Update the widget title
widget.updateTitle('New Title');

// Update the widget subtitle
widget.updateSubtitle('New Subtitle');

// Update the widget theme
widget.updateTheme('dark'); // 'light', 'dark', or 'auto'
```

### Cleanup

```javascript
// Destroy the widget and remove it from the DOM
widget.destroy();
```

## Events

The widget emits various events that you can listen to:

```javascript
// Listen for events
widget.on('initialized', () => {
  console.log('Widget initialized');
});

widget.on('connected', () => {
  console.log('Connected to API');
});

widget.on('open', () => {
  console.log('Widget opened');
});

widget.on('close', () => {
  console.log('Widget closed');
});

widget.on('messageSent', (message) => {
  console.log('Message sent:', message);
});

widget.on('messageReceived', (message) => {
  console.log('Message received:', message);
});

widget.on('conversationCleared', () => {
  console.log('Conversation cleared');
});

widget.on('error', (error) => {
  console.error('Widget error:', error);
});

widget.on('destroyed', () => {
  console.log('Widget destroyed');
});
```

## Styling

The widget can be styled using CSS variables. You can override these variables in your own CSS:

```css
:root {
  --chatbot-primary-color: #2563eb;
  --chatbot-secondary-color: #f3f4f6;
  --chatbot-text-color: #111827;
  --chatbot-background-color: #ffffff;
  --chatbot-border-color: #e5e7eb;
  --chatbot-user-message-bg: #e9f2ff;
  --chatbot-bot-message-bg: #f3f4f6;
}
```

Alternatively, you can use the configuration options to set the primary, secondary, and text colors:

```javascript
const widget = new ChatbotWidget({
  // ...
  primaryColor: '#2563eb',
  secondaryColor: '#f3f4f6',
  textColor: '#111827'
});
```

## Localization

The widget supports localization through the configuration options:

```javascript
const widget = new ChatbotWidget({
  // ...
  locale: 'fr', // Set the locale to French
  translations: {
    title: 'Assistant Chatbot',
    subtitle: 'Comment puis-je vous aider aujourd\'hui?',
    welcomeMessage: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
    inputPlaceholder: 'Tapez un message...',
    sendButtonLabel: 'Envoyer',
    clearButtonLabel: 'Effacer la conversation',
    closeButtonLabel: 'Fermer',
    typingIndicator: 'en train d\'écrire...',
    errorMessage: 'Désolé, une erreur s\'est produite. Veuillez réessayer.'
  }
});
```

## Security Considerations

### API Key Security

Your API key should be kept secure. If possible, proxy API requests through your own server to avoid exposing your API key in client-side code.

### CORS

The Chatbots Platform API supports CORS (Cross-Origin Resource Sharing) for secure cross-origin requests.

### Data Privacy

Be mindful of the data you collect through the chatbot widget. Ensure you comply with relevant data protection regulations (e.g., GDPR, CCPA) and include appropriate disclosures in your privacy policy.

## Proxy Configuration

If your environment requires a proxy for external connections, you can configure the widget to use a proxy server:

```javascript
const widget = new ChatbotWidget({
  // ... other options
  proxyUrl: '104.129.196.38:10563'
});
```

This will route all API requests through the specified proxy.

For script tag configuration:

```html
<script src="https://cdn.chatbots-platform.example.com/widget.js" 
  data-chatbot-widget="true"
  data-auto-init="true"
  data-api-key="YOUR_API_KEY"
  data-chatbot-id="YOUR_CHATBOT_ID"
  data-proxy-url="104.129.196.38:10563">
</script>
```

## Troubleshooting

### Widget Not Appearing

- Ensure you've included the script correctly
- Check browser console for errors
- Verify your API key and chatbot ID are correct

### Connection Issues

- Check your network connection
- Verify API URL is correct
- Ensure your API key has the correct permissions
- Check if a proxy is needed in your environment

### Styling Issues

- Inspect the widget elements using browser developer tools
- Ensure your CSS selectors have sufficient specificity to override default styles
- Check for CSS conflicts with your website's existing styles

## Examples

### Basic Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>Chatbot Example</title>
</head>
<body>
  <h1>Welcome to our website</h1>
  <p>This is a simple example of integrating the Chatbots Platform Web Widget.</p>
  
  <script src="https://cdn.chatbots-platform.example.com/widget.js" 
    data-chatbot-widget="true"
    data-auto-init="true"
    data-api-key="YOUR_API_KEY"
    data-chatbot-id="YOUR_CHATBOT_ID">
  </script>
</body>
</html>
```

### Advanced Integration with Custom Styling and Events

```html
<!DOCTYPE html>
<html>
<head>
  <title>Advanced Chatbot Example</title>
  <style>
    :root {
      --chatbot-primary-color: #4f46e5;
      --chatbot-secondary-color: #eff6ff;
      --chatbot-text-color: #1f2937;
    }
  </style>
</head>
<body>
  <h1>Welcome to our website</h1>
  <p>This is an advanced example of integrating the Chatbots Platform Web Widget.</p>
  
  <button id="openChatbot">Open Chatbot</button>
  
  <script src="https://cdn.chatbots-platform.example.com/widget.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Initialize widget
      const widget = new ChatbotWidget({
        apiKey: 'YOUR_API_KEY',
        chatbotId: 'YOUR_CHATBOT_ID',
        theme: 'light',
        position: 'right',
        welcomeMessage: 'Hello! How can I assist you today?',
        proxyUrl: '104.129.196.38:10563'
      });
      
      widget.init();
      
      // Listen for events
      widget.on('initialized', () => {
        console.log('Widget initialized');
      });
      
      widget.on('messageReceived', (message) => {
        console.log('New message from chatbot:', message);
        
        // Example: Track chatbot interactions with analytics
        if (window.analytics) {
          window.analytics.track('Chatbot Message Received', {
            messageId: message.id,
            content: message.content
          });
        }
      });
      
      // Open chatbot when button is clicked
      document.getElementById('openChatbot').addEventListener('click', () => {
        widget.open();
      });
    });
  </script>
</body>
</html>
```

### React Integration

```jsx
import React, { useEffect, useRef } from 'react';
import ChatbotWidget from '@chatbots-platform/web-widget';

function ChatbotComponent() {
  const widgetRef = useRef(null);
  
  useEffect(() => {
    // Initialize widget
    const widget = new ChatbotWidget({
      apiKey: 'YOUR_API_KEY',
      chatbotId: 'YOUR_CHATBOT_ID',
      proxyUrl: '104.129.196.38:10563'
    });
    
    widget.init();
    
    // Store reference to widget
    widgetRef.current = widget;
    
    // Cleanup on unmount
    return () => {
      if (widgetRef.current) {
        widgetRef.current.destroy();
      }
    };
  }, []);
  
  const handleOpenChatbot = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    }
  };
  
  return (
    <div>
      <h2>Chatbot Integration</h2>
      <button onClick={handleOpenChatbot}>Open Chatbot</button>
    </div>
  );
}

export default ChatbotComponent;
```
