/**
 * Test script for Contextual Understanding
 * 
 * This script demonstrates how to use the context management service
 * to maintain conversation state and resolve references across messages.
 */

require('@src/nlp\nlp.service');
require('@src/utils');

// Sample conversation
const conversation = [
  "What's the weather like in New York today?",
  "I'm planning to visit there next week",
  "What are some good restaurants in the area?",
  "Are there any Italian places?",
  "What about museums near Central Park?"
];

/**
 * Run contextual understanding tests
 */
async function runTests() {
  try {
    logger.info('Testing contextual understanding capabilities...\n');
    
    // Create a conversation context
    const userId = 'test-user-' + Date.now();
    const context = await nlpService.createConversationContext(userId, {
      name: 'Test Conversation',
      testRun: true
    });
    
    logger.info(`Created conversation context with ID: ${context.id}\n`);
    
    // Process each message in the conversation
    for (const [index, message] of conversation.entries()) {
      logger.info(`Turn ${index + 1}: "${message}"`);
      
      // Process the message with context
      const result = await nlpService.processTextWithContext(
        message,
        context.id,
        ['entities', 'intent'],
        { userId }
      );
      
      // Display entities
      if (result.entities && result.entities.length > 0) {
        logger.info('Entities:');
        result.entities.forEach(entity => {
          logger.info(`  - ${entity.text} (${entity.type})`);
        });
      } else {
        logger.info('No entities found');
      }
      
      // Display intent
      if (result.intent && result.intent.intent) {
        logger.info(`Intent: ${result.intent.intent} (confidence: ${result.intent.confidence.toFixed(2)})`);
      } else {
        logger.info('No intent detected');
      }
      
      // Display resolved references
      if (result.context && result.context.resolvedReferences) {
        const refs = result.context.resolvedReferences;
        
        if (Object.keys(refs.pronouns).length > 0) {
          logger.info('Resolved References:');
          for (const [pronoun, entity] of Object.entries(refs.pronouns)) {
            logger.info(`  - "${pronoun}" refers to "${entity.entity}" (${entity.entityType})`);
          }
        }
      }
      
      // Display active entities in context
      if (result.context && result.context.activeEntities) {
        const entities = result.context.activeEntities;
        const entityTypes = Object.keys(entities);
        
        if (entityTypes.length > 0) {
          logger.info('Active Entities in Context:');
          for (const type of entityTypes) {
            const typeEntities = entities[type];
            for (const [id, data] of Object.entries(typeEntities)) {
              logger.info(`  - ${data.value} (${type})`);
            }
          }
        }
      }
      
      // Display recent intents
      if (result.context && result.context.recentIntents && result.context.recentIntents.length > 0) {
        logger.info('Recent Intents:');
        result.context.recentIntents.forEach(intent => {
          logger.info(`  - ${intent.intent}`);
        });
      }
      
      logger.info('\n---\n');
    }
    
    // Get conversation history
    const history = await nlpService.getConversationHistory(context.id);
    
    logger.info('Conversation History:');
    history.forEach((message, index) => {
      logger.info(`${index + 1}. ${message.role}: "${message.text}"`);
    });
    
    logger.info('\nContextual understanding tests completed.');
  } catch (error) {
    logger.error('Error running contextual understanding tests:', error.message);
  }
}

// Run the tests
runTests();
