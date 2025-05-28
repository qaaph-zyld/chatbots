/**
 * Sentiment Analysis Plugin
 * 
 * A plugin that analyzes message sentiment and adds sentiment data to the response
 */

// Simulated sentiment analysis function
function analyzeSentiment(text) {
  // In a real implementation, this would use a proper sentiment analysis library
  // For now, we'll use a simple keyword-based approach
  
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'like', 'thanks', 'thank', 'awesome', 'wonderful'];
  const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'hate', 'dislike', 'sorry', 'problem', 'issue', 'wrong'];
  
  const words = text.toLowerCase().split(/\s+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) {
      positiveScore++;
    }
    if (negativeWords.includes(word)) {
      negativeScore++;
    }
  });
  
  const totalScore = positiveScore - negativeScore;
  let sentiment = 'neutral';
  
  if (totalScore > 1) {
    sentiment = 'positive';
  } else if (totalScore < -1) {
    sentiment = 'negative';
  }
  
  return {
    sentiment,
    score: totalScore,
    positive: positiveScore,
    negative: negativeScore
  };
}

/**
 * Plugin initialization
 */
async function initialize() {
  console.log('Initializing Sentiment Analysis Plugin');
  return true;
}

/**
 * Plugin shutdown
 */
async function shutdown() {
  console.log('Shutting down Sentiment Analysis Plugin');
  return true;
}

/**
 * Pre-process message hook
 * @param {Object} data - Message data
 * @param {Object} config - Plugin configuration
 * @returns {Object} - Modified message data
 */
async function preProcessMessage(data, config) {
  console.log('Pre-processing message with Sentiment Analysis Plugin');
  
  // Analyze message sentiment
  const sentimentData = analyzeSentiment(data.message);
  
  // Add sentiment data to context
  data.context = {
    ...data.context,
    sentiment: sentimentData
  };
  
  return data;
}

/**
 * Post-process message hook
 * @param {Object} response - Response data
 * @param {Object} config - Plugin configuration
 * @returns {Object} - Modified response data
 */
async function postProcessMessage(response, config) {
  console.log('Post-processing response with Sentiment Analysis Plugin');
  
  // Add sentiment data to response metadata
  const responseSentiment = analyzeSentiment(response.text);
  
  response.metadata = {
    ...response.metadata,
    sentiment: responseSentiment
  };
  
  return response;
}

// Export plugin hooks
module.exports = {
  name: 'sentiment-analysis',
  version: '1.0.0',
  initialize,
  shutdown,
  hooks: {
    'pre-process-message': preProcessMessage,
    'post-process-message': postProcessMessage
  }
};
