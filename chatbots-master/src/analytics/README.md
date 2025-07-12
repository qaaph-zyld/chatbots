# Analytics Service

## Overview

The Analytics Service is a core component of the chatbot platform that tracks, processes, and analyzes conversation data to provide insights and metrics about chatbot performance and user interactions.

## Features

- **Message Tracking**: Tracks user and bot messages with detailed metrics
- **Analytics Aggregation**: Aggregates metrics by period (daily, weekly, monthly, all-time)
- **Report Generation**: Generates comprehensive reports with metrics, trends, and insights
- **Performance Monitoring**: Tracks response times and other performance metrics
- **Sentiment Analysis**: Analyzes sentiment in user messages
- **Top Entities/Intents/Queries**: Identifies most common entities, intents, and user queries

## Installation

The Analytics Service is part of the chatbot platform and does not require separate installation. Simply ensure that the MongoDB connection is properly configured in your environment.

## Usage

### Basic Usage

```javascript
const AnalyticsService = require('./analytics.service');

// Initialize the service
const analyticsService = new AnalyticsService();

// Track a user message
await analyticsService.trackMessage({
  chatbotId: 'chatbot123',
  type: 'user',
  text: 'Hello, how can you help me today?',
  userId: 'user123',
  timestamp: new Date(),
  intent: 'greeting',
  entities: [{ type: 'greeting', value: 'hello' }],
  sentiment: 'positive'
});

// Get analytics for a specific period and date
const dailyAnalytics = await analyticsService.getAnalytics('chatbot123', 'daily', new Date());

// Get all-time analytics
const allTimeAnalytics = await analyticsService.getAllTimeAnalytics('chatbot123');

// Generate a report for a specific period and date range
const report = await analyticsService.generateReport(
  'chatbot123',
  'weekly',
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  new Date() // today
);
```

### Advanced Usage

For more advanced usage, see the [Analytics Service Documentation](../../docs/analytics-service.md).

## API Reference

### `trackMessage(message)`

Tracks a message (user or bot) and updates analytics in the database.

**Parameters:**

- `message` (Object): The message to track
  - `chatbotId` (String): ID of the chatbot
  - `type` (String): Type of message ('user' or 'bot')
  - `text` (String): Message text
  - `userId` (String): ID of the user
  - `timestamp` (Date): Message timestamp
  - `intent` (String, optional): Intent of the message
  - `entities` (Array, optional): Entities in the message
  - `sentiment` (String, optional): Sentiment of the message

**Returns:**

- Promise that resolves when the message is tracked

### `getAnalytics(chatbotId, period, date)`

Retrieves analytics for a specific period and date.

**Parameters:**

- `chatbotId` (String): ID of the chatbot
- `period` (String): Period to retrieve ('daily', 'weekly', 'monthly')
- `date` (Date): Date to retrieve analytics for

**Returns:**

- Promise that resolves to the analytics document or null if not found

### `getAllTimeAnalytics(chatbotId)`

Retrieves all-time analytics for a chatbot.

**Parameters:**

- `chatbotId` (String): ID of the chatbot

**Returns:**

- Promise that resolves to the all-time analytics document or null if not found

### `generateReport(chatbotId, period, startDate, endDate)`

Generates a comprehensive report with metrics, trends, and insights.

**Parameters:**

- `chatbotId` (String): ID of the chatbot
- `period` (String): Period to generate report for ('daily', 'weekly', 'monthly')
- `startDate` (Date): Start date of the report
- `endDate` (Date): End date of the report

**Returns:**

- Promise that resolves to a report object with metrics, trends, and insights

## Testing

The Analytics Service is tested using Jest. To run the tests:

```bash
npx jest src/tests/unit/services/analytics.service.test.js
```

## Demo

A demo script is available to showcase the Analytics Service capabilities:

```bash
node src/tests/scripts/analytics-demo.js
```

## Contributing

To contribute to the Analytics Service:

1. Ensure all tests pass before submitting a pull request
2. Add tests for any new functionality
3. Update documentation as needed
4. Follow the coding style of the project

## License

This project is licensed under the MIT License - see the LICENSE file for details.
