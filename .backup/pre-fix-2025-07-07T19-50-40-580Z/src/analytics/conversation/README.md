# Conversation Analytics Module

This module provides comprehensive conversation analytics capabilities for the chatbot platform, including:

- **Conversation Tracking**: Track and store conversation history and metrics
- **Analytics Dashboard**: Generate visualizations and reports from conversation data
- **Insights Generation**: Automatically identify patterns and generate actionable insights
- **External Analytics Integration**: Connect with tools like Matomo and Plausible

## Services

### Conversation Tracking Service

The tracking service records all conversation interactions and calculates key metrics:

```javascript
const { conversationTrackingService } = require('./analytics/conversation');

// Track a new message
await conversationTrackingService.trackMessage({
  conversationId: 'conv123',
  role: 'user',
  content: 'Hello bot!'
});

// Get conversation statistics
const stats = await conversationTrackingService.getConversationStatistics();
```

### Dashboard Service

The dashboard service generates visualizations and reports from conversation data:

```javascript
const { conversationDashboardService } = require('./analytics/conversation');

// Generate a dashboard
const dashboard = await conversationDashboardService.generateDashboard({
  timeRange: 30, // days
  botId: 'bot123',
  metrics: ['messageCount', 'responseTime', 'userSatisfaction']
});

// Export dashboard data to CSV
const csvData = conversationDashboardService.exportToCsv(dashboard);
```

### Insights Service

The insights service analyzes conversation data to generate actionable insights:

```javascript
const { conversationInsightsService } = require('./analytics/conversation');

// Generate insights
const insights = await conversationInsightsService.generateInsights({
  timeRange: 30, // days
  botId: 'bot123'
});

// Get recommendations based on insights
const recommendations = conversationInsightsService.getRecommendations(insights.insights);
```

### Analytics Integration Service

The integration service connects with external analytics tools:

```javascript
const { analyticsIntegrationService } = require('./analytics/conversation');

// Track an event in external analytics
await analyticsIntegrationService.trackEvent({
  type: 'conversation_start',
  userId: 'user123',
  sessionId: 'conv456'
});

// Get external analytics dashboard URL
const dashboardUrl = analyticsIntegrationService.getDashboardUrl();
```

## Configuration

The conversation analytics module can be configured using environment variables:

```
# Tracking Service
CONVERSATION_STORAGE_TYPE=memory  # or mongodb, redis, etc.
ANONYMIZE_USER_DATA=true          # anonymize sensitive user data

# Dashboard Service
DEFAULT_ANALYTICS_TIME_RANGE=30   # default time range in days
ANALYTICS_REFRESH_INTERVAL=3600   # cache refresh interval in seconds

# Insights Service
INSIGHT_GENERATION_INTERVAL=86400 # insights generation interval in seconds
MIN_CONVERSATIONS_FOR_INSIGHTS=10 # minimum conversations needed for insights

# Integration Service
ENABLE_EXTERNAL_ANALYTICS=false   # enable external analytics integration
EXTERNAL_ANALYTICS_PROVIDER=matomo # matomo, plausible, or custom
EXTERNAL_ANALYTICS_ENDPOINT=      # analytics endpoint URL
EXTERNAL_ANALYTICS_SITE_ID=1      # site ID for analytics
EXTERNAL_ANALYTICS_API_KEY=       # API key for analytics
```

## Testing

Run the test script to see the conversation analytics in action:

```
node src/analytics/conversation/test-analytics.js
```
