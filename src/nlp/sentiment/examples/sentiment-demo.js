/**
 * Sentiment Analysis Demo
 * 
 * This script demonstrates how to use the sentiment analysis service
 * in a chatbot application to create sentiment-aware responses.
 */

const readline = require('readline');
require('@src/nlp\nlp.service');
require('@src/utils');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Sample responses based on sentiment
const responses = {
  'very positive': [
    "I'm thrilled to hear you're so happy!",
    "That's fantastic news!",
    "Wonderful! I'm glad things are going so well for you."
  ],
  'positive': [
    "That sounds good!",
    "I'm glad to hear that.",
    "That's nice to know."
  ],
  'neutral': [
    "I understand.",
    "Thanks for sharing that information.",
    "I see what you mean."
  ],
  'negative': [
    "I'm sorry to hear that.",
    "That sounds challenging.",
    "I understand your frustration."
  ],
  'very negative': [
    "I'm really sorry you're feeling this way.",
    "That sounds really difficult. Is there anything I can do to help?",
    "I'm here to listen if you want to talk more about what's bothering you."
  ]
};

// Emotion-based responses
const emotionResponses = {
  joy: [
    "Your happiness is contagious!",
    "I'm delighted that you're feeling joyful."
  ],
  sadness: [
    "I'm sorry you're feeling down.",
    "It's okay to feel sad sometimes. I'm here for you."
  ],
  anger: [
    "I understand you're frustrated right now.",
    "Let's take a moment to address what's bothering you."
  ],
  fear: [
    "It's natural to feel anxious about that.",
    "Let's work through this concern together."
  ],
  surprise: [
    "That is quite unexpected!",
    "Wow, I can understand why you'd be surprised."
  ]
};

// Get a random response based on sentiment or emotion
function getRandomResponse(category, responseMap) {
  const options = responseMap[category] || responseMap['neutral'];
  return options[Math.floor(Math.random() * options.length)];
}

// Generate a sentiment-aware response
function generateSentimentAwareResponse(sentimentResult) {
  let response = '';
  
  // Base response on sentiment
  response += getRandomResponse(sentimentResult.sentiment.label, responses);
  
  // Add emotion-specific response if a dominant emotion is detected
  const emotions = sentimentResult.emotions;
  const dominantEmotion = Object.keys(emotions).reduce((a, b) => 
    emotions[a] > emotions[b] ? a : b);
  
  if (emotions[dominantEmotion] > 0.3 && dominantEmotion !== 'neutral') {
    response += ' ' + getRandomResponse(dominantEmotion, emotionResponses);
  }
  
  return response;
}

// Main conversation loop
async function startConversation() {
  try {
    logger.info('Sentiment Analysis Demo');
    logger.info('======================');
    logger.info('Type your messages and see how the chatbot responds based on sentiment.');
    logger.info('Type "exit" to quit.\n');
    
    // Create a conversation context
    const userId = 'demo-user-' + Date.now();
    const context = await nlpService.createConversationContext(userId, {
      name: 'Sentiment Demo Conversation'
    });
    
    logger.info(`Created conversation with ID: ${context.id}\n`);
    
    // Start conversation loop
    askQuestion();
    
    function askQuestion() {
      rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'exit') {
          // Show conversation sentiment summary before exiting
          try {
            const sentimentTracking = await nlpService.trackConversationSentiment(context.id);
            
            logger.info('\nConversation Sentiment Summary:');
            logger.info(`Overall Sentiment: ${sentimentTracking.label} (score: ${sentimentTracking.averageScore.toFixed(2)})`);
            logger.info(`Messages: ${sentimentTracking.messageCount}`);
            
            if (sentimentTracking.trend) {
              logger.info(`Trend: ${sentimentTracking.trend}`);
            }
            
            if (sentimentTracking.distribution) {
              logger.info('Sentiment Distribution:');
              for (const [label, count] of Object.entries(sentimentTracking.distribution)) {
                if (count > 0) {
                  logger.info(`  - ${label}: ${count}`);
                }
              }
            }
          } catch (error) {
            logger.error('Error getting conversation summary:', error.message);
          }
          
          logger.info('\nThank you for using the Sentiment Analysis Demo!');
          rl.close();
          return;
        }
        
        try {
          // Process the message with sentiment analysis
          const result = await nlpService.processTextWithContext(
            input,
            context.id,
            ['sentiment', 'entities', 'intent'],
            { userId }
          );
          
          // Generate a sentiment-aware response
          const response = generateSentimentAwareResponse(result.sentiment);
          
          // Display sentiment analysis results
          logger.info(`\nSentiment: ${result.sentiment.sentiment.label} (score: ${result.sentiment.sentiment.score.toFixed(2)})`);
          
          // Display dominant emotion if any
          const emotions = result.sentiment.emotions;
          const dominantEmotion = Object.keys(emotions).reduce((a, b) => 
            emotions[a] > emotions[b] ? a : b);
          
          if (emotions[dominantEmotion] > 0.3) {
            logger.info(`Dominant emotion: ${dominantEmotion} (${emotions[dominantEmotion].toFixed(2)})`);
          }
          
          // Display the chatbot's response
          logger.info(`\nChatbot: ${response}\n`);
          
          // Continue the conversation
          askQuestion();
        } catch (error) {
          logger.error('Error processing message:', error.message);
          logger.info('\nChatbot: I apologize, but I had trouble processing that message.\n');
          askQuestion();
        }
      });
    }
  } catch (error) {
    logger.error('Error in conversation:', error.message);
    rl.close();
  }
}

// Start the demo
startConversation();
