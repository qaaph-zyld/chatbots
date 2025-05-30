/**
 * Advanced Context Awareness Test Script
 * 
 * This script tests the advanced context awareness features:
 * - Entity tracking across conversations
 * - User preference learning
 * - Topic detection and management
 */

const axios = require('axios');
const { logger } = require('../src/utils');

// Configure axios with proxy
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

// Test configuration
const config = {
  baseUrl: 'http://localhost:3000/api',
  chatbotId: '60d21b4667d0d8992e610c85', // Example chatbot ID
  userId: 'user123',
  conversationIds: {
    first: 'conv456',
    second: 'conv789'
  }
};

/**
 * Run all tests
 */
async function runTests() {
  try {
    logger.info('Starting Advanced Context Awareness Tests');
    
    // Test entity tracking
    await testEntityTracking();
    
    // Test user preference learning
    await testPreferenceLearning();
    
    // Test topic detection
    await testTopicDetection();
    
    // Test cross-conversation context
    await testCrossConversationContext();
    
    logger.info('All tests completed successfully');
  } catch (error) {
    logger.error('Test failed:', error.message);
    logger.error(error.stack);
  }
}

/**
 * Test entity tracking functionality
 */
async function testEntityTracking() {
  logger.info('Testing Entity Tracking...');
  
  // Track a person entity in the first conversation
  const personEntity = {
    type: 'person',
    name: 'John Smith',
    aliases: ['John', 'Mr. Smith'],
    confidence: 0.85,
    metadata: {
      occupation: 'Software Engineer',
      location: 'San Francisco'
    }
  };
  
  const trackPersonResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/track-entity`,
    personEntity
  );
  
  logger.info(`Tracked person entity: ${trackPersonResponse.data.entity._id}`);
  
  // Track a location entity in the first conversation
  const locationEntity = {
    type: 'location',
    name: 'Golden Gate Park',
    aliases: ['the park'],
    confidence: 0.9,
    metadata: {
      city: 'San Francisco',
      type: 'park'
    }
  };
  
  const trackLocationResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/track-entity`,
    locationEntity
  );
  
  logger.info(`Tracked location entity: ${trackLocationResponse.data.entity._id}`);
  
  // Create a relation between entities
  const relationData = {
    sourceEntityId: trackPersonResponse.data.entity._id,
    targetEntityId: trackLocationResponse.data.entity._id,
    relationType: 'visited',
    confidence: 0.8,
    metadata: {
      frequency: 'weekly',
      lastVisit: '2023-05-15'
    }
  };
  
  const relationResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/cross-conversation-entity-relations`,
    relationData
  );
  
  logger.info(`Created entity relation: ${relationResponse.data.relation._id}`);
  
  // Reference the same entities in a second conversation
  const referenceResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.second}/reference-entity`,
    {
      entityId: trackPersonResponse.data.entity._id,
      context: 'mentioned in conversation'
    }
  );
  
  logger.info(`Referenced entity in second conversation: ${referenceResponse.data.success}`);
  
  // Get all tracked entities for the user
  const entitiesResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/cross-conversation-entities`
  );
  
  logger.info(`Retrieved ${entitiesResponse.data.entities.length} entities`);
  
  // Verify entity tracking is working correctly
  if (entitiesResponse.data.entities.length < 2) {
    throw new Error('Entity tracking test failed: Not all entities were tracked');
  }
  
  logger.info('Entity Tracking test passed');
}

/**
 * Test user preference learning functionality
 */
async function testPreferenceLearning() {
  logger.info('Testing User Preference Learning...');
  
  // Set explicit preferences
  const explicitPreferences = [
    {
      category: 'communication',
      key: 'responseStyle',
      value: 'concise',
      source: 'explicit',
      confidence: 1.0
    },
    {
      category: 'topics',
      key: 'interests',
      value: ['technology', 'travel'],
      source: 'explicit',
      confidence: 1.0
    }
  ];
  
  for (const pref of explicitPreferences) {
    const prefResponse = await axios.post(
      `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/preferences`,
      pref
    );
    
    logger.info(`Set explicit preference: ${pref.category}.${pref.key}`);
  }
  
  // Infer preferences from a message
  const inferResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/infer-preferences`,
    {
      message: "I really enjoy hiking in the mountains and reading science fiction books. I prefer detailed explanations rather than short answers."
    }
  );
  
  logger.info(`Inferred ${inferResponse.data.preferences.length} preferences from message`);
  
  // Get all user preferences
  const preferencesResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/preferences`
  );
  
  logger.info(`Retrieved ${preferencesResponse.data.preferences.length} preferences`);
  
  // Apply preferences to response options
  const applyResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/apply-preferences`,
    {
      responseOptions: [
        { text: "Here's a brief answer to your question.", metadata: { style: 'concise' } },
        { text: "Let me provide you with a detailed explanation of this topic...", metadata: { style: 'detailed' } }
      ]
    }
  );
  
  logger.info(`Applied preferences to responses, selected: ${applyResponse.data.selectedResponse.metadata.style}`);
  
  // Verify preference learning is working correctly
  if (preferencesResponse.data.preferences.length < 3) {
    throw new Error('Preference learning test failed: Not enough preferences were learned');
  }
  
  logger.info('User Preference Learning test passed');
}

/**
 * Test topic detection functionality
 */
async function testTopicDetection() {
  logger.info('Testing Topic Detection...');
  
  // Create topics
  const topics = [
    {
      name: 'artificial_intelligence',
      description: 'Artificial Intelligence and Machine Learning',
      keywords: ['AI', 'machine learning', 'neural networks', 'deep learning']
    },
    {
      name: 'travel',
      description: 'Travel and tourism',
      keywords: ['vacation', 'trip', 'tourism', 'destination', 'hotel']
    },
    {
      name: 'technology',
      description: 'Technology and gadgets',
      keywords: ['computer', 'smartphone', 'device', 'software', 'hardware']
    }
  ];
  
  for (const topic of topics) {
    const topicResponse = await axios.post(
      `${config.baseUrl}/chatbots/${config.chatbotId}/topics`,
      topic
    );
    
    logger.info(`Created topic: ${topic.name}`);
  }
  
  // Add related topics
  const relatedTopicResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/topics/related`,
    {
      sourceName: 'artificial_intelligence',
      targetName: 'technology',
      relationStrength: 0.8
    }
  );
  
  logger.info(`Added related topic: ${relatedTopicResponse.data.success}`);
  
  // Detect topics in text
  const detectResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/detect-topics`,
    {
      text: "I'm interested in learning more about artificial intelligence and how it's being used in modern technology. I recently read an article about neural networks."
    }
  );
  
  logger.info(`Detected ${detectResponse.data.topics.length} topics in text`);
  
  // Track topics in conversation
  const trackResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/track-topics`,
    {
      detectedTopics: detectResponse.data.topics
    }
  );
  
  logger.info(`Tracked ${trackResponse.data.activeTopics.length} topics in conversation`);
  
  // Get active topics for conversation
  const activeTopicsResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/active-topics`
  );
  
  logger.info(`Retrieved ${activeTopicsResponse.data.topics.length} active topics`);
  
  // Verify topic detection is working correctly
  if (activeTopicsResponse.data.topics.length < 1) {
    throw new Error('Topic detection test failed: No active topics were found');
  }
  
  logger.info('Topic Detection test passed');
}

/**
 * Test cross-conversation context functionality
 */
async function testCrossConversationContext() {
  logger.info('Testing Cross-Conversation Context...');
  
  // Set context in first conversation
  const setContextResponse = await axios.put(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/context`,
    {
      activeContext: {
        topic: 'artificial_intelligence',
        entities: ['neural networks', 'machine learning'],
        userIntent: 'learn_about_ai'
      }
    }
  );
  
  logger.info(`Set context in first conversation: ${setContextResponse.data.success}`);
  
  // Get context from first conversation
  const getFirstContextResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/context`
  );
  
  logger.info(`Retrieved context from first conversation`);
  
  // Get cross-conversation context for second conversation
  const getCrossContextResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/cross-conversation-context`,
    {
      params: {
        currentConversationId: config.conversationIds.second
      }
    }
  );
  
  logger.info(`Retrieved cross-conversation context with ${getCrossContextResponse.data.context.relevantContexts.length} relevant contexts`);
  
  // Verify cross-conversation context is working correctly
  if (!getCrossContextResponse.data.context.relevantContexts.some(ctx => ctx.conversationId === config.conversationIds.first)) {
    throw new Error('Cross-conversation context test failed: First conversation context not found');
  }
  
  logger.info('Cross-Conversation Context test passed');
}

// Run the tests
runTests().catch(error => {
  logger.error('Test execution failed:', error.message);
  process.exit(1);
});
