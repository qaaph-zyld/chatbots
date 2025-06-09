/**
 * Test script for Intent Classification Service
 * 
 * This script demonstrates how to use the intent classification service
 * to classify intents from text using local models.
 */

require('@src/nlp\intent\intent.service');
require('@src/utils');

// Sample texts for testing
const sampleTexts = [
  "What's the weather like in New York today?",
  "Book a table for two at Luigi's restaurant for tomorrow at 8pm",
  "How do I reset my password?",
  "Tell me a joke about programming",
  "What time does the store open?"
];

// Sample intents with examples
const intents = {
  'weather': [
    "What's the weather like today?",
    "Will it rain tomorrow?",
    "What's the temperature outside?",
    "Is it going to snow this weekend?",
    "How's the weather in London right now?"
  ],
  'booking': [
    "I want to book a table",
    "Reserve a table for 4 people",
    "Make a restaurant reservation",
    "Book a table at Mario's for Friday night",
    "Can you make a dinner reservation for me?"
  ],
  'account': [
    "I need to reset my password",
    "How do I change my email?",
    "I forgot my login details",
    "Update my account information",
    "How do I delete my account?"
  ],
  'entertainment': [
    "Tell me a joke",
    "I'm bored, entertain me",
    "Do you know any riddles?",
    "Tell me something funny",
    "Can you recommend a movie?"
  ]
};

/**
 * Run intent classification tests
 */
async function runTests() {
  try {
    logger.info('Initializing intent classification service...');
    
    // Initialize the service
    await intentClassificationService.initialize({
      fallbackToRules: true,
      confidenceThreshold: 0.5
    });
    
    logger.info('Adding sample intents...');
    
    // Add sample intents
    for (const [intentName, examples] of Object.entries(intents)) {
      await intentClassificationService.addIntent(intentName, examples);
      logger.info(`Added intent '${intentName}' with ${examples.length} examples`);
    }
    
    logger.info('\nRunning intent classification tests...');
    
    // Process each sample text
    for (const [index, text] of sampleTexts.entries()) {
      logger.info(`\nSample ${index + 1}: "${text}"`);
      
      // Classify intent
      const result = await intentClassificationService.classifyIntent(text, {
        includeScores: true,
        topK: 2
      });
      
      // Display results
      if (result.intent) {
        logger.info(`Detected intent: ${result.intent} (confidence: ${result.confidence.toFixed(2)})`);
        
        if (result.intents && result.intents.length > 1) {
          logger.info('Other possible intents:');
          for (let i = 1; i < result.intents.length; i++) {
            const intent = result.intents[i];
            logger.info(`  - ${intent.intent} (confidence: ${intent.confidence.toFixed(2)})`);
          }
        }
      } else {
        logger.info('No intent detected with sufficient confidence');
      }
    }
    
    logger.info('\nTesting domain-specific intents...');
    
    // Add domain-specific intents
    const healthcareIntents = {
      'symptom_check': [
        "I have a headache",
        "My throat hurts",
        "I'm feeling dizzy",
        "I have a fever",
        "My stomach hurts"
      ],
      'medication': [
        "When should I take my medicine?",
        "What are the side effects of ibuprofen?",
        "Can I take aspirin with my current medication?",
        "I need a prescription refill",
        "How often should I take this medicine?"
      ]
    };
    
    // Add healthcare domain intents
    for (const [intentName, examples] of Object.entries(healthcareIntents)) {
      await intentClassificationService.addIntent(intentName, examples, 'healthcare');
      logger.info(`Added healthcare intent '${intentName}' with ${examples.length} examples`);
    }
    
    // Test healthcare domain intents
    const healthcareTexts = [
      "I've been having a persistent cough",
      "Can I take my medication with food?"
    ];
    
    for (const [index, text] of healthcareTexts.entries()) {
      logger.info(`\nHealthcare Sample ${index + 1}: "${text}"`);
      
      // Classify intent with domain
      const result = await intentClassificationService.classifyIntent(text, {
        domainId: 'healthcare',
        includeScores: true
      });
      
      // Display results
      if (result.intent) {
        logger.info(`Detected healthcare intent: ${result.intent} (confidence: ${result.confidence.toFixed(2)})`);
      } else {
        logger.info('No healthcare intent detected with sufficient confidence');
      }
    }
    
    logger.info('\nIntent classification tests completed.');
  } catch (error) {
    logger.error('Error running intent classification tests:', error.message);
  }
}

// Run the tests
runTests();
