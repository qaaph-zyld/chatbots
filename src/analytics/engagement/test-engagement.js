/**
 * Test script for user engagement metrics
 * 
 * This script demonstrates the usage of the user engagement service
 * for tracking sessions, calculating engagement metrics, and generating
 * user profiles.
 */

const { userEngagementService } = require('./index');
const { v4: uuidv4 } = require('uuid');

// Mock conversation tracking service storage
userEngagementService.conversationTrackingService = {
  storage: {
    find: async (filter) => {
      return sampleConversations.filter(conversation => {
        let match = true;
        
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
        
        if (filter.userId && conversation.userId !== filter.userId) {
          match = false;
        }
        
        if (filter.botId && conversation.botId !== filter.botId) {
          match = false;
        }
        
        return match;
      });
    }
  }
};

// Sample conversations for testing
const sampleConversations = [
  {
    id: uuidv4(),
    userId: 'user123',
    botId: 'bot456',
    startedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86340000).toISOString(), // 1 day ago + 1 minute
    messages: [
      {
        role: 'user',
        content: 'Hello',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      },
      {
        role: 'bot',
        content: 'Hi there! How can I help you today?',
        timestamp: new Date(Date.now() - 86395000).toISOString()
      },
      {
        role: 'user',
        content: 'I have a question about my order',
        timestamp: new Date(Date.now() - 86380000).toISOString()
      },
      {
        role: 'bot',
        content: 'I\'d be happy to help with your order. Could you please provide your order number?',
        timestamp: new Date(Date.now() - 86375000).toISOString()
      },
      {
        role: 'user',
        content: 'It\'s ABC123',
        timestamp: new Date(Date.now() - 86360000).toISOString()
      },
      {
        role: 'bot',
        content: 'Thank you. I can see your order ABC123 was shipped yesterday and should arrive tomorrow.',
        timestamp: new Date(Date.now() - 86350000).toISOString()
      },
      {
        role: 'user',
        content: 'Great, thanks!',
        timestamp: new Date(Date.now() - 86345000).toISOString()
      },
      {
        role: 'bot',
        content: 'You\'re welcome! Is there anything else I can help you with today?',
        timestamp: new Date(Date.now() - 86340000).toISOString()
      }
    ]
  },
  {
    id: uuidv4(),
    userId: 'user123',
    botId: 'bot456',
    startedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 43140000).toISOString(), // 12 hours ago + 1 minute
    messages: [
      {
        role: 'user',
        content: 'Hi again',
        timestamp: new Date(Date.now() - 43200000).toISOString()
      },
      {
        role: 'bot',
        content: 'Hello! Welcome back. How can I assist you today?',
        timestamp: new Date(Date.now() - 43195000).toISOString()
      },
      {
        role: 'user',
        content: 'I just wanted to check if there are any updates on my order',
        timestamp: new Date(Date.now() - 43180000).toISOString()
      },
      {
        role: 'bot',
        content: 'Let me check that for you. Your order ABC123 is out for delivery today.',
        timestamp: new Date(Date.now() - 43170000).toISOString()
      },
      {
        role: 'user',
        content: 'Perfect, thank you!',
        timestamp: new Date(Date.now() - 43160000).toISOString()
      },
      {
        role: 'bot',
        content: 'You\'re welcome! Have a great day!',
        timestamp: new Date(Date.now() - 43140000).toISOString()
      }
    ]
  },
  {
    id: uuidv4(),
    userId: 'user456',
    botId: 'bot456',
    startedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172740000).toISOString(), // 2 days ago + 1 minute
    messages: [
      {
        role: 'user',
        content: 'Hello, I need help with your product',
        timestamp: new Date(Date.now() - 172800000).toISOString()
      },
      {
        role: 'bot',
        content: 'Hi there! I\'d be happy to help with our product. What specific question do you have?',
        timestamp: new Date(Date.now() - 172795000).toISOString()
      },
      {
        role: 'user',
        content: 'How do I reset my password?',
        timestamp: new Date(Date.now() - 172780000).toISOString()
      },
      {
        role: 'bot',
        content: 'To reset your password, please go to the login page and click on "Forgot Password". You\'ll receive an email with instructions.',
        timestamp: new Date(Date.now() - 172770000).toISOString()
      },
      {
        role: 'user',
        content: 'Thanks!',
        timestamp: new Date(Date.now() - 172750000).toISOString()
      },
      {
        role: 'bot',
        content: 'You\'re welcome! Let me know if you need anything else.',
        timestamp: new Date(Date.now() - 172740000).toISOString()
      }
    ]
  }
];

/**
 * Run the test
 */
async function runTest() {
  console.log('=== User Engagement Metrics Test ===\n');

  // Test session tracking
  console.log('--- Testing Session Tracking ---');
  const sessionId = uuidv4();
  
  // Start session
  const session1 = await userEngagementService.trackSession({
    userId: 'test-user',
    sessionId,
    action: 'start'
  });
  console.log('Session started:', session1.id);
  
  // Track messages
  await userEngagementService.trackSession({
    userId: 'test-user',
    sessionId,
    action: 'message'
  });
  
  await userEngagementService.trackSession({
    userId: 'test-user',
    sessionId,
    action: 'message'
  });
  
  // End session
  const session2 = await userEngagementService.trackSession({
    userId: 'test-user',
    sessionId,
    action: 'end'
  });
  console.log('Session ended with', session2.messageCount, 'messages\n');

  // Test satisfaction tracking
  console.log('--- Testing Satisfaction Tracking ---');
  try {
    const feedback = await userEngagementService.trackSatisfaction({
      userId: 'test-user',
      sessionId,
      rating: 5,
      comment: 'Great experience!'
    });
    
    if (feedback) {
      console.log('Feedback recorded:', feedback);
    } else {
      console.log('Satisfaction tracking is disabled');
    }
  } catch (error) {
    console.log('Error tracking satisfaction:', error.message);
  }
  console.log();

  // Test engagement metrics
  console.log('--- Testing Engagement Metrics ---');
  const metrics = await userEngagementService.getEngagementMetrics({
    timeRange: 7 // 7 days
  });
  
  console.log('Engagement Overview:');
  console.log(JSON.stringify(metrics.overview, null, 2));
  
  console.log('\nRetention Rates:');
  console.log(JSON.stringify(metrics.retention, null, 2));
  
  console.log('\nDaily Engagement (First 3 days):');
  console.log(JSON.stringify(metrics.engagement.daily.slice(0, 3), null, 2));
  console.log();

  // Test user profile
  console.log('--- Testing User Profile ---');
  const userProfile = await userEngagementService.getUserProfile('test-user');
  
  if (userProfile) {
    console.log('User Profile:');
    console.log(JSON.stringify(userProfile, null, 2));
  } else {
    console.log('User profile not found');
  }
  console.log();

  console.log('=== Test Completed ===');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
