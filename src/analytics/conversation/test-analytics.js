/**
 * Test script for conversation analytics features
 * 
 * This script demonstrates the usage of the conversation analytics services
 * including tracking, dashboard generation, insights, and external integration.
 */

require('@src/analytics\conversation\index');

// Sample conversation data
const sampleConversations = [
  {
    id: '1234-5678-90ab',
    userId: 'user123',
    botId: 'bot456',
    startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    updatedAt: new Date().toISOString(),
    status: 'completed',
    messages: [
      {
        id: 'msg1',
        role: 'user',
        content: 'Hello, I need help with my order',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'msg2',
        role: 'bot',
        content: 'Hi there! I\'d be happy to help with your order. Could you please provide your order number?',
        timestamp: new Date(Date.now() - 3590000).toISOString(),
        nlpData: {
          intent: {
            name: 'greeting',
            confidence: 0.95
          }
        }
      },
      {
        id: 'msg3',
        role: 'user',
        content: 'My order number is ABC12345',
        timestamp: new Date(Date.now() - 3580000).toISOString()
      },
      {
        id: 'msg4',
        role: 'bot',
        content: 'Thank you! I found your order ABC12345. It was shipped yesterday and should arrive by tomorrow.',
        timestamp: new Date(Date.now() - 3570000).toISOString(),
        nlpData: {
          intent: {
            name: 'check_order',
            confidence: 0.88
          },
          entities: [
            {
              name: 'order_number',
              value: 'ABC12345'
            }
          ]
        }
      },
      {
        id: 'msg5',
        role: 'user',
        content: 'Great, thank you!',
        timestamp: new Date(Date.now() - 3560000).toISOString()
      },
      {
        id: 'msg6',
        role: 'bot',
        content: 'You\'re welcome! Is there anything else I can help you with today?',
        timestamp: new Date(Date.now() - 3550000).toISOString(),
        nlpData: {
          intent: {
            name: 'thank_you',
            confidence: 0.92
          }
        }
      },
      {
        id: 'msg7',
        role: 'user',
        content: 'No, that\'s all. Have a nice day!',
        timestamp: new Date(Date.now() - 3540000).toISOString()
      },
      {
        id: 'msg8',
        role: 'bot',
        content: 'Thank you for contacting us. Have a great day!',
        timestamp: new Date(Date.now() - 3530000).toISOString(),
        nlpData: {
          intent: {
            name: 'goodbye',
            confidence: 0.94
          }
        }
      }
    ],
    metrics: {
      userMessageCount: 4,
      botMessageCount: 4,
      totalResponseTime: 40000, // 40 seconds total
      averageResponseTime: 10000, // 10 seconds average
      goalAchieved: true
    }
  },
  {
    id: '2345-6789-01bc',
    userId: 'user456',
    botId: 'bot456',
    startedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 7140000).toISOString(), // 1 minute later
    status: 'abandoned',
    messages: [
      {
        id: 'msg1',
        role: 'user',
        content: 'Hi, do you have the new iPhone in stock?',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'msg2',
        role: 'bot',
        content: 'Hello! I can check that for you. Which model of iPhone are you looking for?',
        timestamp: new Date(Date.now() - 7190000).toISOString(),
        nlpData: {
          intent: {
            name: 'check_inventory',
            confidence: 0.87
          }
        }
      },
      {
        id: 'msg3',
        role: 'user',
        content: 'iPhone 14 Pro',
        timestamp: new Date(Date.now() - 7180000).toISOString()
      },
      {
        id: 'msg4',
        role: 'bot',
        content: 'Let me check our inventory... I\'m sorry, but the iPhone 14 Pro is currently out of stock. Would you like me to notify you when it becomes available?',
        timestamp: new Date(Date.now() - 7170000).toISOString(),
        nlpData: {
          intent: {
            name: 'check_inventory',
            confidence: 0.92
          },
          entities: [
            {
              name: 'product',
              value: 'iPhone 14 Pro'
            }
          ]
        }
      }
    ],
    metrics: {
      userMessageCount: 2,
      botMessageCount: 2,
      totalResponseTime: 20000, // 20 seconds total
      averageResponseTime: 10000, // 10 seconds average
      goalAchieved: false
    }
  }
];

/**
 * Mock storage for testing
 */
class MockStorage {
  constructor() {
    this.conversations = [...sampleConversations];
  }

  async find(filter) {
    // Simple filter implementation for testing
    return this.conversations.filter(conversation => {
      let match = true;
      
      if (filter.botId && conversation.botId !== filter.botId) {
        match = false;
      }
      
      if (filter.userId && conversation.userId !== filter.userId) {
        match = false;
      }
      
      if (filter.startedAt && filter.startedAt.$gte) {
        const filterDate = new Date(filter.startedAt.$gte);
        const conversationDate = new Date(conversation.startedAt);
        if (conversationDate < filterDate) {
          match = false;
        }
      }
      
      if (filter.updatedAt && filter.updatedAt.$lte) {
        const filterDate = new Date(filter.updatedAt.$lte);
        const conversationDate = new Date(conversation.updatedAt);
        if (conversationDate > filterDate) {
          match = false;
        }
      }
      
      return match;
    });
  }

  async findOne(id) {
    return this.conversations.find(conversation => conversation.id === id);
  }

  async save(conversation) {
    const index = this.conversations.findIndex(c => c.id === conversation.id);
    if (index >= 0) {
      this.conversations[index] = conversation;
    } else {
      this.conversations.push(conversation);
    }
    return conversation;
  }

  async count(filter) {
    const results = await this.find(filter);
    return results.length;
  }
}

// Set up mock storage for testing
conversationTrackingService.storage = new MockStorage();

/**
 * Run the test
 */
async function runTest() {
  console.log('=== Conversation Analytics Test ===\n');

  // Test tracking service
  console.log('--- Testing Conversation Tracking Service ---');
  const stats = await conversationTrackingService.getConversationStatistics();
  console.log('Conversation Statistics:');
  console.log(JSON.stringify(stats, null, 2));
  console.log();

  // Test dashboard service
  console.log('--- Testing Conversation Dashboard Service ---');
  const dashboard = await conversationDashboardService.generateDashboard({
    timeRange: 1, // 1 day
    botId: 'bot456'
  });
  console.log('Dashboard Overview:');
  console.log(JSON.stringify(dashboard.overview, null, 2));
  console.log('Available Charts:');
  console.log(Object.keys(dashboard.charts).join(', '));
  console.log();

  // Test insights service
  console.log('--- Testing Conversation Insights Service ---');
  const insights = await conversationInsightsService.generateInsights({
    timeRange: 1, // 1 day
    botId: 'bot456'
  });
  console.log('Insights:');
  if (insights.hasEnoughData === false) {
    console.log(insights.message);
  } else {
    console.log(`Generated ${insights.insights.length} insights`);
    if (insights.insights.length > 0) {
      console.log('Top insight:');
      console.log(JSON.stringify(insights.insights[0], null, 2));
    }
  }
  console.log();

  // Test integration service
  console.log('--- Testing Analytics Integration Service ---');
  if (analyticsIntegrationService.options.enabled) {
    console.log(`Integration enabled with provider: ${analyticsIntegrationService.options.provider}`);
    const trackResult = await analyticsIntegrationService.trackConversationStart(sampleConversations[0]);
    console.log(`Tracked conversation start: ${trackResult}`);
  } else {
    console.log('Integration is disabled. Set ENABLE_EXTERNAL_ANALYTICS=true to enable.');
    console.log('Available providers: matomo, plausible, custom');
  }
  
  const dashboardUrl = analyticsIntegrationService.getDashboardUrl();
  if (dashboardUrl) {
    console.log(`External analytics dashboard URL: ${dashboardUrl}`);
  }
  console.log();

  console.log('=== Test Completed ===');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
