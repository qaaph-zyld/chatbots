/**
 * Test script for User Behavior Insights
 * 
 * This script demonstrates the usage of the User Behavior Insights service
 * for analyzing user behavior patterns and generating actionable insights.
 */

require('@src/analytics\behavior\user-behavior-insights.service');

/**
 * Example data sources for user behavior analysis
 */

// User sessions data source
const userSessionsDataSource = {
  id: 'sessions',
  name: 'User Sessions',
  description: 'Data about user sessions with the chatbot',
  type: 'time-series',
  fetchFunction: async (options = {}) => {
    // Simulate fetching user session data
    console.log(`[DEBUG] Fetching user session data with options:`, options);
    
    const userId = options.userId;
    if (!userId && !options.allUsers) {
      return [];
    }
    
    // Generate sample data
    const data = [];
    const now = new Date();
    const daysToGenerate = 30; // 1 month of data
    
    // Generate data for a specific user or multiple users
    const userIds = userId ? [userId] : Array.from({ length: 50 }, (_, i) => `user-${i + 1}`);
    
    for (const uid of userIds) {
      // Generate 2-5 sessions per week for each user
      const sessionsPerWeek = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < daysToGenerate; i++) {
        // Only create sessions on some days (based on sessionsPerWeek)
        if (Math.random() > (sessionsPerWeek / 7)) continue;
        
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Add some randomness to session time
        date.setHours(Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));
        
        const sessionDuration = Math.floor(Math.random() * 20) + 5; // 5-25 minutes
        const messageCount = Math.floor(Math.random() * 15) + 3; // 3-18 messages
        
        data.push({
          userId: uid,
          sessionId: `session-${uid}-${date.getTime()}`,
          startTime: date.toISOString(),
          endTime: new Date(date.getTime() + sessionDuration * 60 * 1000).toISOString(),
          duration: sessionDuration,
          messageCount,
          completionRate: Math.random() * 0.3 + 0.7, // 0.7-1.0
          device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
          browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)]
        });
      }
    }
    
    // Sort by start time
    data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    // Filter for specific user if requested
    return userId ? data.filter(item => item.userId === userId) : data;
  }
};

// User messages data source
const userMessagesDataSource = {
  id: 'messages',
  name: 'User Messages',
  description: 'Data about user messages sent to the chatbot',
  type: 'event',
  fetchFunction: async (options = {}) => {
    // Simulate fetching user message data
    console.log(`[DEBUG] Fetching user message data with options:`, options);
    
    const userId = options.userId;
    if (!userId && !options.allUsers) {
      return [];
    }
    
    // Generate sample data
    const data = [];
    const now = new Date();
    const daysToGenerate = 30; // 1 month of data
    
    // Generate data for a specific user or multiple users
    const userIds = userId ? [userId] : Array.from({ length: 50 }, (_, i) => `user-${i + 1}`);
    
    const topics = ['product information', 'troubleshooting', 'account help', 'billing', 'feature requests'];
    const intents = ['question', 'command', 'complaint', 'feedback', 'greeting'];
    
    for (const uid of userIds) {
      // Generate 10-30 messages per user
      const messageCount = Math.floor(Math.random() * 21) + 10;
      
      for (let i = 0; i < messageCount; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - Math.floor(Math.random() * daysToGenerate));
        date.setHours(Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));
        
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const intent = intents[Math.floor(Math.random() * intents.length)];
        const messageLength = Math.floor(Math.random() * 100) + 10; // 10-110 characters
        
        data.push({
          userId: uid,
          messageId: `msg-${uid}-${date.getTime()}-${i}`,
          timestamp: date.toISOString(),
          sessionId: `session-${uid}-${Math.floor(date.getTime() / (1000 * 60 * 30))}`, // Group by 30-minute windows
          topic,
          intent,
          messageLength,
          responseTime: Math.floor(Math.random() * 5000) + 500, // 500-5500ms
          sentiment: Math.random() * 2 - 1, // -1 to 1 (negative to positive)
          containsMedia: Math.random() > 0.8 // 20% chance of containing media
        });
      }
    }
    
    // Sort by timestamp
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Filter for specific user if requested
    return userId ? data.filter(item => item.userId === userId) : data;
  }
};

// User feedback data source
const userFeedbackDataSource = {
  id: 'feedback',
  name: 'User Feedback',
  description: 'Data about user feedback and ratings',
  type: 'event',
  fetchFunction: async (options = {}) => {
    // Simulate fetching user feedback data
    console.log(`[DEBUG] Fetching user feedback data with options:`, options);
    
    const userId = options.userId;
    if (!userId && !options.allUsers) {
      return [];
    }
    
    // Generate sample data
    const data = [];
    const now = new Date();
    const daysToGenerate = 90; // 3 months of data
    
    // Generate data for a specific user or multiple users
    const userIds = userId ? [userId] : Array.from({ length: 50 }, (_, i) => `user-${i + 1}`);
    
    const feedbackTypes = ['conversation', 'feature', 'general'];
    
    for (const uid of userIds) {
      // Generate 1-5 feedback items per user
      const feedbackCount = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < feedbackCount; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - Math.floor(Math.random() * daysToGenerate));
        
        const feedbackType = feedbackTypes[Math.floor(Math.random() * feedbackTypes.length)];
        const rating = Math.floor(Math.random() * 5) + 1; // 1-5 stars
        
        data.push({
          userId: uid,
          feedbackId: `feedback-${uid}-${date.getTime()}`,
          timestamp: date.toISOString(),
          type: feedbackType,
          rating,
          comment: rating > 3 ? 'Great experience!' : 'Could be improved.',
          sentiment: rating > 3 ? 'positive' : (rating > 1 ? 'neutral' : 'negative')
        });
      }
    }
    
    // Sort by timestamp
    data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Filter for specific user if requested
    return userId ? data.filter(item => item.userId === userId) : data;
  }
};

/**
 * Run the test
 */
async function runTest() {
  console.log('=== User Behavior Insights Test ===\n');

  // Register data sources
  console.log('--- Registering Data Sources ---');
  
  const sessionsSource = userBehaviorInsightsService.registerDataSource(userSessionsDataSource);
  const messagesSource = userBehaviorInsightsService.registerDataSource(userMessagesDataSource);
  const feedbackSource = userBehaviorInsightsService.registerDataSource(userFeedbackDataSource);
  
  console.log(`Registered ${[
    sessionsSource, 
    messagesSource, 
    feedbackSource
  ].filter(s => s.success).length} data sources`);
  console.log();

  // Generate insights for a specific user
  console.log('--- Generating User Insights ---');
  
  const userId = 'user-42';
  console.log(`Generating insights for user: ${userId}`);
  
  const userInsights = await userBehaviorInsightsService.generateUserInsights(userId);
  if (userInsights.success) {
    console.log('User behavior insights:');
    console.log(`- Generated at: ${userInsights.insights.generatedAt}`);
    console.log(`- Engagement score: ${userInsights.insights.engagementScore}/100`);
    
    console.log('\nSession patterns:');
    console.log(`- Frequency: ${userInsights.insights.sessionPatterns.frequency} sessions per week`);
    console.log(`- Average duration: ${userInsights.insights.sessionPatterns.averageDuration} minutes`);
    console.log(`- Preferred days: ${userInsights.insights.sessionPatterns.preferredDays.join(', ')}`);
    console.log(`- Preferred times: ${userInsights.insights.sessionPatterns.preferredTimes.join(', ')}`);
    console.log(`- Consistency: ${(userInsights.insights.sessionPatterns.consistency * 100).toFixed(1)}%`);
    console.log(`- Trend: ${userInsights.insights.sessionPatterns.trend}`);
    
    console.log('\nMessaging behavior:');
    console.log(`- Messages per session: ${userInsights.insights.messagingBehavior.messagesPerSession}`);
    console.log(`- Average response time: ${userInsights.insights.messagingBehavior.averageResponseTime} seconds`);
    console.log(`- Message length: ${userInsights.insights.messagingBehavior.messageLength}`);
    console.log(`- Interaction style: ${userInsights.insights.messagingBehavior.interactionStyle}`);
    console.log(`- Initiates conversation: ${userInsights.insights.messagingBehavior.initiatesConversation}`);
    console.log(`- Completion rate: ${(userInsights.insights.messagingBehavior.completionRate * 100).toFixed(1)}%`);
    
    console.log('\nContent preferences:');
    console.log(`- Preferred topics: ${userInsights.insights.contentPreferences.preferredTopics.join(', ')}`);
    console.log(`- Preferred response length: ${userInsights.insights.contentPreferences.preferredResponseLength}`);
    console.log(`- Preferred media: ${userInsights.insights.contentPreferences.preferredMedia.join(', ')}`);
    
    console.log('\nSatisfaction metrics:');
    console.log(`- Average rating: ${userInsights.insights.satisfactionMetrics.averageRating.toFixed(1)} stars`);
    console.log(`- Sentiment trend: ${userInsights.insights.satisfactionMetrics.sentimentTrend}`);
    console.log(`- Pain points: ${userInsights.insights.satisfactionMetrics.painPoints.length > 0 ? userInsights.insights.satisfactionMetrics.painPoints.join(', ') : 'None identified'}`);
    console.log(`- NPS score: ${userInsights.insights.satisfactionMetrics.npsScore}`);
    
    console.log('\nPredicted behavior:');
    console.log(`- Churn risk: ${userInsights.insights.predictedBehavior.churnRisk}`);
    console.log(`- Next session: ${new Date(userInsights.insights.predictedBehavior.nextSessionPrediction).toLocaleString()}`);
    console.log(`- Expected engagement trend: ${userInsights.insights.predictedBehavior.expectedEngagementTrend}`);
    console.log(`- Retention probability: ${(userInsights.insights.predictedBehavior.retentionProbability * 100).toFixed(1)}%`);
  }
  console.log();

  // Generate user segments
  console.log('--- Generating User Segments ---');
  
  const segmentationResult = await userBehaviorInsightsService.generateUserSegments();
  if (segmentationResult.success) {
    console.log(`Generated ${segmentationResult.segments.length} user segments:`);
    
    for (const segment of segmentationResult.segments) {
      console.log(`\n${segment.name} (${segment.id}):`);
      console.log(`- Description: ${segment.description}`);
      console.log(`- User count: ${segment.userCount}`);
      console.log(`- Characteristics:`);
      
      for (const [key, value] of Object.entries(segment.characteristics)) {
        console.log(`  * ${key}: ${value}`);
      }
    }
  }
  console.log();

  // Get recommended actions for a user
  console.log('--- Getting Recommended Actions ---');
  
  console.log(`Getting recommended actions for user: ${userId}`);
  
  const recommendationsResult = await userBehaviorInsightsService.getRecommendedActions(userId);
  if (recommendationsResult.success) {
    console.log(`Generated ${recommendationsResult.recommendations.length} recommendations:`);
    
    for (const recommendation of recommendationsResult.recommendations) {
      console.log(`\n${recommendation.type.toUpperCase()} - ${recommendation.action}:`);
      console.log(`- Priority: ${recommendation.priority}`);
      
      if (recommendation.timing) {
        console.log(`- Timing: ${recommendation.timing}`);
      }
      
      if (recommendation.message) {
        console.log(`- Message: "${recommendation.message}"`);
      }
      
      if (recommendation.parameters) {
        console.log(`- Parameters: ${JSON.stringify(recommendation.parameters)}`);
      }
      
      console.log(`- Expected impact: ${recommendation.expectedImpact}`);
    }
  }
  console.log();

  // Get all segments
  console.log('--- Listing All Segments ---');
  
  const allSegments = userBehaviorInsightsService.getAllSegments();
  if (allSegments.success) {
    console.log(`Available segments: ${allSegments.segments.length}`);
    
    for (const segment of allSegments.segments) {
      console.log(`- ${segment.name}: ${segment.userCount} users`);
    }
  }
  console.log();
  
  console.log('=== Test Complete ===');
  console.log('The User Behavior Insights service is ready for use in the chatbot platform.');
  console.log();
  console.log('Key features demonstrated:');
  console.log('1. Analyzing user session patterns and preferences');
  console.log('2. Identifying messaging behavior and content preferences');
  console.log('3. Measuring user satisfaction and sentiment');
  console.log('4. Predicting future behavior and churn risk');
  console.log('5. Segmenting users based on behavior patterns');
  console.log('6. Generating personalized action recommendations');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
