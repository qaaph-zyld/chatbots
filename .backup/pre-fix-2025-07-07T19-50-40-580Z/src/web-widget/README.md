# Chatbots Platform Web Widget

A lightweight, customizable web widget for embedding chatbots from the Chatbots Platform into any website.

## Features

- 💬 Real-time chat interface
- 🎨 Customizable themes and colors
- 📱 Responsive design for all devices
- 🔒 Secure communication with the Chatbots Platform API
- 🌐 Cross-browser compatibility
- 🔌 Easy integration via script tag or npm package
- 🛠️ Comprehensive JavaScript API
- 🔄 Persistent conversations (optional)
- 📎 File attachment support
- 🎤 Voice input/output support (optional)

## Installation

### Via CDN (Recommended)

Add the following script to your website:

```html
<script src="https://cdn.chatbots-platform.example.com/widget.js" 
  data-chatbot-widget="true"
  data-auto-init="true"
  data-api-key="YOUR_API_KEY"
  data-chatbot-id="YOUR_CHATBOT_ID">
</script>
```

### Via npm

```bash
npm install @chatbots-platform/web-widget
```

Then import and initialize the widget:

```javascript
import ChatbotWidget from '@chatbots-platform/web-widget';

const widget = new ChatbotWidget({
  apiKey: 'YOUR_API_KEY',
  chatbotId: 'YOUR_CHATBOT_ID'
});

widget.init();
```

## Configuration

The widget can be configured using data attributes or JavaScript options:

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

## API Methods

The widget exposes the following methods:

```javascript
// Initialize the widget
widget.init();

// Open the widget
widget.open();

// Close the widget
widget.close();

// Toggle the widget
widget.toggle();

// Send a message
widget.sendMessage('Hello, chatbot!');

// Clear the conversation
widget.clearConversation();

// Destroy the widget
widget.destroy();
```

## Events

The widget emits the following events:

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

## Proxy Configuration

If your environment requires a proxy for external connections, you can configure the widget to use a proxy server:

```javascript
const widget = new ChatbotWidget({
  // ... other options
  proxyUrl: '104.129.196.38:10563'
});
```

This will route all API requests through the specified proxy.

## Browser Support

The widget supports all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Opera (latest)

## Development

### Prerequisites

- Node.js 14+
- npm 6+

### Setup

```bash
# Clone the repository
git clone https://github.com/example/chatbots-platform-web-widget.git

# Install dependencies
cd chatbots-platform-web-widget
npm install

# Start development server
npm run dev
```

### Building

```bash
# Build for production
npm run build
```

### Testing

```bash
# Run tests
npm test
```

## License

MIT
