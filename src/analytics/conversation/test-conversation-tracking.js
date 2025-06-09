/**
 * Test script for Conversation Tracking
 * 
 * This script demonstrates the conversation tracking capabilities
 * of the analytics system.
 */

require('@src/analytics\conversation\tracking.service');
require('@src/analytics\conversation\dashboard.service');
require('@src/analytics\conversation\insights.service');

/**
 * Test conversation tracking
 */
async function testConversationTracking() {
  console.log('=== Testing Conversation Tracking ===');
  
  // Sample conversation data
  const conversation = {
    conversationId: 'test-conversation-' + Date.now(),
    botId: 'test-bot-1',
    userId: 'test-user-1',
    messages: [
      {
        role: 'user',
        content: 'Hello, I need help with my order',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        type: 'text',
        metadata: {
          source: 'web',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      },
      {
        role: 'bot',
        content: 'Hi there! I\'d be happy to help with your order. Could you please provide your order number?',
        timestamp: new Date(Date.now() - 1000 * 60 * 4.8).toISOString(), // 4.8 minutes ago
        type: 'text'
      },
      {
        role: 'user',
        content: 'My order number is ABC123',
        timestamp: new Date(Date.now() - 1000 * 60 * 4.5).toISOString(), // 4.5 minutes ago
        type: 'text',
        nlpAnalysis: {
          intent: 'provide_order_number',
          entities: [
            { type: 'order_number', value: 'ABC123' }
          ],
          sentiment: 'neutral'
        }
      },
      {
        role: 'bot',
        content: 'Thank you. I found your order ABC123. It was shipped yesterday and should arrive by tomorrow. Is there anything specific about the order you\'d like to know?',
        timestamp: new Date(Date.now() - 1000 * 60 * 4.3).toISOString(), // 4.3 minutes ago
        type: 'text'
      },
      {
        role: 'user',
        content: 'Can I change the delivery address?',
        timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(), // 4 minutes ago
        type: 'text',
        nlpAnalysis: {
          intent: 'change_delivery_address',
          sentiment: 'neutral'
        }
      },
      {
        role: 'bot',
        content: 'I\'m sorry, but once an order has been shipped, we cannot change the delivery address. However, you can refuse the delivery when it arrives, and then place a new order with the correct address.',
        timestamp: new Date(Date.now() - 1000 * 60 * 3.8).toISOString(), // 3.8 minutes ago
        type: 'text'
      },
      {
        role: 'user',
        content: 'That\'s disappointing. I really needed it at my new address.',
        timestamp: new Date(Date.now() - 1000 * 60 * 3.5).toISOString(), // 3.5 minutes ago
        type: 'text',
        nlpAnalysis: {
          intent: 'express_disappointment',
          sentiment: 'negative'
        }
      },
      {
        role: 'bot',
        content: 'I understand your frustration and I apologize for the inconvenience. As an alternative, you could contact the shipping carrier directly with your tracking number to see if they can redirect the package. Would you like me to provide their contact information?',
        timestamp: new Date(Date.now() - 1000 * 60 * 3.3).toISOString(), // 3.3 minutes ago
        type: 'text'
      },
      {
        role: 'user',
        content: 'Yes, please provide their contact information.',
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
        type: 'text',
        nlpAnalysis: {
          intent: 'request_information',
          sentiment: 'neutral'
        }
      },
      {
        role: 'bot',
        content: 'Here\'s the contact information for the shipping carrier: Phone: 1-800-123-4567, Website: www.shippingcarrier.com. You\'ll need your tracking number: XYZ789. Is there anything else I can help you with?',
        timestamp: new Date(Date.now() - 1000 * 60 * 2.8).toISOString(), // 2.8 minutes ago
        type: 'text'
      },
      {
        role: 'user',
        content: 'No, that\'s all. Thank you for your help.',
        timestamp: new Date(Date.now() - 1000 * 60 * 2.5).toISOString(), // 2.5 minutes ago
        type: 'text',
        nlpAnalysis: {
          intent: 'thank_you',
          sentiment: 'positive'
        }
      },
      {
        role: 'bot',
        content: 'You\'re welcome! I\'m glad I could assist you. If you have any other questions in the future, don\'t hesitate to reach out. Have a great day!',
        timestamp: new Date(Date.now() - 1000 * 60 * 2.3).toISOString(), // 2.3 minutes ago
        type: 'text'
      }
    ]
  };
  
  // Track each message
  console.log('Tracking conversation messages...');
  for (const message of conversation.messages) {
    const trackingData = {
      conversationId: conversation.conversationId,
      botId: conversation.botId,
      userId: conversation.userId,
      ...message
    };
    
    const result = await conversationTrackingService.trackMessage(trackingData);
    console.log(`Tracked message: ${message.role} - ${result.tracked ? 'Success' : 'Failed'}`);
  }
  
  // Get conversation data
  console.log('\nRetrieving conversation data...');
  const retrievedConversation = await conversationTrackingService.getConversation(conversation.conversationId);
  console.log(`Retrieved conversation: ${retrievedConversation.conversationId}`);
  console.log(`Message count: ${retrievedConversation.messageCount}`);
  console.log(`User messages: ${retrievedConversation.metrics.userMessageCount}`);
  console.log(`Bot messages: ${retrievedConversation.metrics.botMessageCount}`);
  console.log(`Average response time: ${retrievedConversation.metrics.averageResponseTime}ms`);
  
  // Generate dashboard
  console.log('\nGenerating conversation dashboard...');
  const dashboardOptions = {
    timeRange: 30, // days
    botId: conversation.botId,
    metrics: ['messageCount', 'responseTime', 'userSatisfaction', 'topIntents', 'conversationLength']
  };
  
  const dashboard = await conversationDashboardService.generateDashboard(dashboardOptions);
  console.log('Dashboard metrics:');
  console.log(dashboard.metrics);
  console.log('Available charts:');
  console.log(Object.keys(dashboard.charts));
  
  // Generate insights
  console.log('\nGenerating conversation insights...');
  const insightOptions = {
    timeRange: 30, // days
    botId: conversation.botId,
    insightTypes: ['userBehavior', 'conversationPatterns', 'issueDetection', 'performanceMetrics']
  };
  
  const insights = await conversationInsightsService.generateInsights(insightOptions);
  console.log(`Generated ${insights.insights.length} insights`);
  if (insights.insights.length > 0) {
    console.log('Sample insights:');
    insights.insights.slice(0, 3).forEach((insight, index) => {
      console.log(`${index + 1}. ${insight.title}: ${insight.description}`);
    });
  }
  
  console.log('\nConversation tracking test completed successfully!');
}

// Run the test
testConversationTracking()
  .then(() => {
    console.log('Test completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
