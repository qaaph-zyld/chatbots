/**
 * Test script for Sentiment Analysis
 * 
 * This script demonstrates how to use the sentiment analysis service
 * to analyze sentiment in text using open-source libraries.
 */

const { nlpService } = require('../nlp.service');
const { logger } = require('../../utils');

// Sample texts for testing
const sampleTexts = [
  "I absolutely love this product! It's amazing and works perfectly.",
  "This is the worst experience I've ever had. I'm extremely disappointed.",
  "The package arrived on time and contained all the items I ordered.",
  "I'm a bit frustrated with the slow response time, but the staff was helpful.",
  "I'm not sure if I like this new feature. It seems complicated."
];

// Sample conversation for testing sentiment tracking
const conversation = [
  "Hi there! I'm excited to try your new chatbot platform.",
  "I've been looking for something like this for a while.",
  "The setup process was a bit confusing though.",
  "I couldn't figure out how to connect to my database at first.",
  "But after reading the documentation, I got it working!",
  "Now everything is running smoothly and I'm very happy with the results."
];

/**
 * Run sentiment analysis tests
 */
async function runTests() {
  try {
    logger.info('Testing sentiment analysis capabilities...\n');
    
    // Analyze individual texts
    logger.info('Individual Sentiment Analysis:');
    for (const [index, text] of sampleTexts.entries()) {
      logger.info(`\nSample ${index + 1}: "${text}"`);
      
      // Analyze sentiment
      const result = await nlpService.analyzeSentiment(text);
      
      // Display results
      logger.info(`Sentiment: ${result.sentiment.label} (score: ${result.sentiment.score.toFixed(2)})`);
      
      // Display emotions if available
      if (result.emotions) {
        logger.info('Emotions:');
        for (const [emotion, score] of Object.entries(result.emotions)) {
          if (score > 0.1) {
            logger.info(`  - ${emotion}: ${score.toFixed(2)}`);
          }
        }
      }
      
      // Display detailed scores if available
      if (result.sentiment.vader) {
        logger.info('VADER Scores:');
        logger.info(`  - Positive: ${result.sentiment.vader.positive.toFixed(2)}`);
        logger.info(`  - Negative: ${result.sentiment.vader.negative.toFixed(2)}`);
        logger.info(`  - Neutral: ${result.sentiment.vader.neutral.toFixed(2)}`);
      }
      
      logger.info('---');
    }
    
    // Test conversation sentiment tracking
    logger.info('\nConversation Sentiment Tracking:');
    
    // Create a context for the conversation
    const userId = 'test-user-' + Date.now();
    const context = await nlpService.createConversationContext(userId, {
      name: 'Sentiment Test Conversation',
      testRun: true
    });
    
    logger.info(`Created conversation context with ID: ${context.id}\n`);
    
    // Process each message in the conversation
    for (const [index, message] of conversation.entries()) {
      logger.info(`Turn ${index + 1}: "${message}"`);
      
      // Process the message with context and sentiment analysis
      await nlpService.processTextWithContext(
        message,
        context.id,
        ['sentiment', 'entities', 'intent'],
        { userId }
      );
    }
    
    // Track sentiment over the conversation
    const sentimentTracking = await nlpService.trackConversationSentiment(context.id);
    
    logger.info('\nConversation Sentiment Summary:');
    logger.info(`Overall Sentiment: ${sentimentTracking.label} (score: ${sentimentTracking.averageScore.toFixed(2)})`);
    logger.info(`Trend: ${sentimentTracking.trend}`);
    logger.info('Sentiment Distribution:');
    logger.info(`  - Positive: ${sentimentTracking.distribution.positive}`);
    logger.info(`  - Neutral: ${sentimentTracking.distribution.neutral}`);
    logger.info(`  - Negative: ${sentimentTracking.distribution.negative}`);
    
    if (sentimentTracking.dominantEmotion !== 'neutral') {
      logger.info(`Dominant Emotion: ${sentimentTracking.dominantEmotion}`);
    }
    
    logger.info('\nSentiment analysis tests completed.');
  } catch (error) {
    logger.error('Error running sentiment analysis tests:', error.message);
  }
}

// Run the tests
runTests();
