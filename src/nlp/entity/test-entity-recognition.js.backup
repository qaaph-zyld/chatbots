/**
 * Test script for Entity Recognition Service
 * 
 * This script demonstrates how to use the entity recognition service
 * to extract entities from text using open-source models.
 */

require('@src/nlp\entity\entity.service');
require('@src/utils');

// Sample texts for testing
const sampleTexts = [
  "Apple Inc. is planning to open a new store in New York City next month.",
  "The patient was prescribed 500mg of ibuprofen to be taken twice daily for pain management.",
  "Please transfer $5000 to my account at Chase Bank by Friday, January 15th, 2023.",
  "The conference will be held at the Hilton Hotel in London from March 10-12, 2021.",
  "Tesla's new Model Y electric vehicle can travel up to 330 miles on a single charge."
];

// Custom entity patterns
const customEntityPatterns = {
  'MEDICATION': [
    'ibuprofen',
    'aspirin',
    'acetaminophen',
    /\d+mg/i
  ],
  'PRODUCT': [
    'Model Y',
    'iPhone',
    /Tesla \w+/
  ]
};

/**
 * Run entity recognition tests
 */
async function runTests() {
  try {
    logger.info('Initializing entity recognition service...');
    
    // Initialize the service
    await entityRecognitionService.initialize({
      defaultModel: 'spacy', // Use spaCy for faster testing
      fallbackToSpacy: true,
      confidenceThreshold: 0.5
    });
    
    logger.info('Adding custom entity patterns...');
    
    // Add custom entity patterns
    for (const [entityType, patterns] of Object.entries(customEntityPatterns)) {
      await entityRecognitionService.addCustomEntityPatterns(entityType, patterns);
    }
    
    logger.info('Running entity recognition tests...');
    
    // Process each sample text
    for (const [index, text] of sampleTexts.entries()) {
      logger.info(`\nSample ${index + 1}: "${text}"`);
      
      // Extract entities
      const entities = await entityRecognitionService.extractEntities(text);
      
      // Display results
      if (entities.length > 0) {
        logger.info('Extracted entities:');
        entities.forEach(entity => {
          logger.info(`  - ${entity.text} (${entity.type}) [${entity.source}] ${entity.confidence ? `Confidence: ${entity.confidence.toFixed(2)}` : ''}`);
        });
      } else {
        logger.info('No entities found.');
      }
    }
    
    logger.info('\nEntity recognition tests completed.');
  } catch (error) {
    logger.error('Error running entity recognition tests:', error.message);
  }
}

// Run the tests
runTests();
