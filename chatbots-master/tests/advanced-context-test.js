/**
 * Advanced Context Awareness Test Script
 * 
 * This script tests the functionality of the advanced context awareness features
 * including entity tracking, topic detection, and preference learning.
 */

const axios = require('axios');
require('@src/utils');

// Configure axios with proxy as per user requirements
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
    const entityIds = await testEntityTracking();
    
    // Test topic detection
    const topicIds = await testTopicDetection();
    
    // Test preference learning
    await testPreferenceLearning();
    
    // Test integrated context
    await testIntegratedContext(entityIds, topicIds);
    
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
  
  // Track a person entity
  const personEntity = {
    type: 'person',
    name: 'John Smith',
    aliases: ['John', 'Mr. Smith'],
    confidence: 0.9,
    metadata: {
      occupation: 'Software Engineer',
      location: 'San Francisco'
    }
  };
  
  const personResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/track-entity`,
    personEntity
  );
  
  logger.info(`Tracked person entity: ${personResponse.data.entity._id}`);
  
  // Track an organization entity
  const organizationEntity = {
    type: 'organization',
    name: 'Acme Corporation',
    aliases: ['Acme Corp', 'Acme'],
    confidence: 0.95,
    metadata: {
      industry: 'Technology',
      location: 'San Francisco'
    }
  };
  
  const organizationResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/track-entity`,
    organizationEntity
  );
  
  logger.info(`Tracked organization entity: ${organizationResponse.data.entity._id}`);
  
  // Create a relation between entities
  const relationData = {
    sourceEntityId: personResponse.data.entity._id,
    targetEntityId: organizationResponse.data.entity._id,
    relationType: 'works_at',
    confidence: 0.85,
    metadata: {
      position: 'Senior Developer',
      startDate: '2022-01-15'
    }
  };
  
  const relationResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/cross-conversation-entity-relations`,
    relationData
  );
  
  logger.info(`Created entity relation: ${relationResponse.data.relation._id}`);
  
  // Reference an entity in a second conversation
  const referenceResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.second}/reference-entity`,
    {
      entityId: personResponse.data.entity._id,
      context: 'mentioned in follow-up conversation'
    }
  );
  
  logger.info(`Referenced entity in second conversation: ${referenceResponse.data.success}`);
  
  // Get all entities for the user
  const entitiesResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/cross-conversation-entities`
  );
  
  logger.info(`Retrieved ${entitiesResponse.data.entities.length} entities`);
  
  // Get entities for a specific conversation
  const conversationEntitiesResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/entities`
  );
  
  logger.info(`Retrieved ${conversationEntitiesResponse.data.entities.length} entities for conversation`);
  
  // Get relations for an entity
  const entityRelationsResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/entities/${personResponse.data.entity._id}/relations`
  );
  
  logger.info(`Retrieved entity relations: ${JSON.stringify(entityRelationsResponse.data.relations)}`);
  
  // Return entity IDs for later use
  return {
    personId: personResponse.data.entity._id,
    organizationId: organizationResponse.data.entity._id
  };
}

/**
 * Test topic detection functionality
 */
async function testTopicDetection() {
  logger.info('Testing Topic Detection...');
  
  // Detect topics in a message
  const techMessage = "I'm interested in learning more about artificial intelligence and machine learning technologies.";
  
  const techTopicsResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/detect-topics`,
    { message: techMessage }
  );
  
  logger.info(`Detected ${techTopicsResponse.data.topics.length} topics in tech message`);
  const techTopicId = techTopicsResponse.data.topics[0]._id;
  
  // Detect topics in another message
  const travelMessage = "I'm planning a vacation to Europe next summer. I want to visit France and Italy.";
  
  const travelTopicsResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.second}/detect-topics`,
    { message: travelMessage }
  );
  
  logger.info(`Detected ${travelTopicsResponse.data.topics.length} topics in travel message`);
  const travelTopicId = travelTopicsResponse.data.topics[0]._id;
  
  // Get topics for a conversation
  const conversationTopicsResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/topics`
  );
  
  logger.info(`Retrieved ${conversationTopicsResponse.data.topics.length} topics for conversation`);
  
  // Get topic history for a user
  const topicHistoryResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/topic-history`
  );
  
  logger.info(`Retrieved ${topicHistoryResponse.data.topicHistory.length} topics in user history`);
  
  // Get topics in a time period
  const now = new Date();
  const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  
  const topicsInPeriodResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/topics-in-time-period?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`
  );
  
  logger.info(`Retrieved ${topicsInPeriodResponse.data.topics.length} topics in time period`);
  
  // Return topic IDs for later use
  return {
    techTopicId,
    travelTopicId
  };
}

/**
 * Test preference learning functionality
 */
async function testPreferenceLearning() {
  logger.info('Testing Preference Learning...');
  
  // Set explicit preferences
  const communicationPref = {
    category: 'communication',
    key: 'responseStyle',
    value: 'detailed',
    source: 'explicit',
    confidence: 1.0
  };
  
  const communicationPrefResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/preferences`,
    communicationPref
  );
  
  logger.info(`Set communication preference: ${communicationPrefResponse.data.preference._id}`);
  
  const topicsPref = {
    category: 'topics',
    key: 'interests',
    value: ['technology', 'travel', 'food'],
    source: 'explicit',
    confidence: 1.0
  };
  
  const topicsPrefResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/preferences`,
    topicsPref
  );
  
  logger.info(`Set topics preference: ${topicsPrefResponse.data.preference._id}`);
  
  // Infer preferences from a message
  const message = "I prefer detailed explanations rather than short answers. I also enjoy reading about history and science.";
  
  const inferredPrefsResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.first}/infer-preferences`,
    { message }
  );
  
  logger.info(`Inferred ${inferredPrefsResponse.data.preferences.length} preferences from message`);
  
  // Get all preferences for a user
  const preferencesResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/preferences`
  );
  
  logger.info(`Retrieved ${preferencesResponse.data.preferences.length} preferences for user`);
  
  // Apply preferences to response options
  const responseOptions = [
    {
      text: "Here's a brief answer to your question about technology.",
      metadata: { 
        style: 'concise',
        topics: ['technology']
      }
    },
    {
      text: "Let me provide you with a detailed explanation of this technology topic...",
      metadata: { 
        style: 'detailed',
        topics: ['technology']
      }
    },
    {
      text: "Here's some information about travel destinations.",
      metadata: { 
        style: 'concise',
        topics: ['travel']
      }
    }
  ];
  
  const appliedPrefsResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/apply-preferences`,
    { responseOptions }
  );
  
  logger.info(`Applied preferences to responses, selected: "${appliedPrefsResponse.data.selectedResponse.text.substring(0, 30)}..."`);
  
  // Return the selected response for later use
  return appliedPrefsResponse.data.selectedResponse;
}

/**
 * Test integrated context functionality
 */
async function testIntegratedContext(entityIds, topicIds) {
  logger.info('Testing Integrated Context...');
  
  // Process a message for context
  const message = "I'd like to know more about AI technologies that Acme Corp is developing.";
  
  const processedContextResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.second}/process-message`,
    { message }
  );
  
  logger.info(`Processed message for context: ${JSON.stringify(processedContextResponse.data.context)}`);
  
  // Get conversation context
  const conversationContextResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.second}/context`
  );
  
  logger.info(`Retrieved conversation context with ${conversationContextResponse.data.context.entities.length} entities and ${conversationContextResponse.data.context.topics.length} topics`);
  
  // Get cross-conversation context
  const crossContextResponse = await axios.get(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/cross-conversation-context`
  );
  
  logger.info(`Retrieved cross-conversation context with ${crossContextResponse.data.context.entities.length} entities and ${crossContextResponse.data.context.topicHistory.length} topics`);
  
  // Apply context to responses
  const responseOptions = [
    {
      text: "Here's information about Acme Corp's AI technologies.",
      metadata: { 
        style: 'concise',
        topics: ['technology', 'ai'],
        entities: [entityIds.organizationId]
      }
    },
    {
      text: "Let me provide detailed information about the latest AI advancements.",
      metadata: { 
        style: 'detailed',
        topics: ['technology', 'ai'],
        entities: []
      }
    },
    {
      text: "John Smith from Acme Corp recently discussed their AI initiatives.",
      metadata: { 
        style: 'detailed',
        topics: ['technology', 'ai'],
        entities: [entityIds.personId, entityIds.organizationId]
      }
    }
  ];
  
  const appliedContextResponse = await axios.post(
    `${config.baseUrl}/chatbots/${config.chatbotId}/users/${config.userId}/conversations/${config.conversationIds.second}/apply-context`,
    { responseOptions }
  );
  
  logger.info(`Applied context to responses, selected: "${appliedContextResponse.data.selectedResponse.text}"`);
  
  // Test complete
  logger.info('Integrated context test completed successfully');
}

// Run the tests
runTests().catch(error => {
  logger.error('Test execution failed:', error);
  process.exit(1);
});
