/**
 * Sentiment Analysis Service
 * 
 * Provides advanced sentiment analysis capabilities for chatbots
 */

const nlpService = require('./nlp.service');
const { logger } = require('../utils');

/**
 * Sentiment categories
 * @enum {string}
 */
const SentimentCategory = {
  VERY_NEGATIVE: 'VERY_NEGATIVE',
  NEGATIVE: 'NEGATIVE',
  NEUTRAL: 'NEUTRAL',
  POSITIVE: 'POSITIVE',
  VERY_POSITIVE: 'VERY_POSITIVE'
};

/**
 * Sentiment Analysis Service class
 */
class SentimentService {
  /**
   * Constructor
   * @param {Object} options - Sentiment service options
   */
  constructor(options = {}) {
    this.options = {
      useLocalAnalysis: true,
      ...options
    };
    
    // Sentiment lexicon for local analysis
    this.sentimentLexicon = {
      positive: new Set([
        'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic',
        'terrific', 'outstanding', 'superb', 'brilliant', 'awesome',
        'happy', 'glad', 'pleased', 'delighted', 'satisfied', 'content',
        'love', 'like', 'enjoy', 'appreciate', 'thankful', 'grateful',
        'perfect', 'best', 'better', 'impressive', 'exceptional'
      ]),
      negative: new Set([
        'bad', 'terrible', 'horrible', 'awful', 'poor', 'disappointing',
        'frustrating', 'annoying', 'irritating', 'unpleasant', 'dreadful',
        'sad', 'unhappy', 'upset', 'angry', 'furious', 'mad', 'displeased',
        'hate', 'dislike', 'loathe', 'despise', 'detest', 'resent',
        'worst', 'worse', 'inferior', 'mediocre', 'subpar'
      ]),
      intensifiers: new Set([
        'very', 'extremely', 'incredibly', 'really', 'absolutely', 'completely',
        'totally', 'utterly', 'highly', 'especially', 'particularly',
        'exceedingly', 'immensely', 'enormously', 'tremendously'
      ]),
      negators: new Set([
        'not', 'no', 'never', 'none', 'nobody', 'nothing', 'nowhere',
        'neither', 'nor', 'barely', 'hardly', 'scarcely', 'rarely'
      ])
    };
    
    logger.info('Sentiment Analysis Service initialized');
  }
  
  /**
   * Add words to the sentiment lexicon
   * @param {string} category - Category to add words to ('positive', 'negative', 'intensifiers', 'negators')
   * @param {Array<string>} words - Words to add
   * @returns {SentimentService} - This instance for chaining
   */
  addToLexicon(category, words) {
    if (this.sentimentLexicon[category]) {
      words.forEach(word => this.sentimentLexicon[category].add(word.toLowerCase()));
    }
    return this;
  }
  
  /**
   * Remove words from the sentiment lexicon
   * @param {string} category - Category to remove words from
   * @param {Array<string>} words - Words to remove
   * @returns {SentimentService} - This instance for chaining
   */
  removeFromLexicon(category, words) {
    if (this.sentimentLexicon[category]) {
      words.forEach(word => this.sentimentLexicon[category].delete(word.toLowerCase()));
    }
    return this;
  }
  
  /**
   * Analyze sentiment using local lexicon
   * @param {string} text - Text to analyze
   * @returns {Object} - Sentiment analysis result
   */
  analyzeLocalSentiment(text) {
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let negationActive = false;
    let intensifierActive = false;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^\w]/g, ''); // Remove punctuation
      
      // Check for negators
      if (this.sentimentLexicon.negators.has(word)) {
        negationActive = true;
        continue;
      }
      
      // Check for intensifiers
      if (this.sentimentLexicon.intensifiers.has(word)) {
        intensifierActive = true;
        continue;
      }
      
      // Check for positive words
      if (this.sentimentLexicon.positive.has(word)) {
        const wordScore = negationActive ? -1 : 1;
        const multiplier = intensifierActive ? 2 : 1;
        score += wordScore * multiplier;
        
        if (negationActive) {
          negativeCount++;
        } else {
          positiveCount++;
        }
        
        negationActive = false;
        intensifierActive = false;
        continue;
      }
      
      // Check for negative words
      if (this.sentimentLexicon.negative.has(word)) {
        const wordScore = negationActive ? 1 : -1;
        const multiplier = intensifierActive ? 2 : 1;
        score += wordScore * multiplier;
        
        if (negationActive) {
          positiveCount++;
        } else {
          negativeCount++;
        }
        
        negationActive = false;
        intensifierActive = false;
        continue;
      }
      
      // Reset negation after 3 words if not used
      if (negationActive && i > 0 && i % 3 === 0) {
        negationActive = false;
      }
      
      // Reset intensifier after 2 words if not used
      if (intensifierActive && i > 0 && i % 2 === 0) {
        intensifierActive = false;
      }
    }
    
    // Normalize score between -1 and 1
    const totalSentimentWords = positiveCount + negativeCount;
    const normalizedScore = totalSentimentWords > 0
      ? score / totalSentimentWords
      : 0;
    
    // Calculate magnitude (strength of sentiment)
    const magnitude = Math.abs(normalizedScore);
    
    // Determine sentiment category
    let category;
    if (normalizedScore < -0.6) {
      category = SentimentCategory.VERY_NEGATIVE;
    } else if (normalizedScore < -0.2) {
      category = SentimentCategory.NEGATIVE;
    } else if (normalizedScore <= 0.2) {
      category = SentimentCategory.NEUTRAL;
    } else if (normalizedScore <= 0.6) {
      category = SentimentCategory.POSITIVE;
    } else {
      category = SentimentCategory.VERY_POSITIVE;
    }
    
    return {
      score: normalizedScore,
      magnitude,
      category,
      positiveCount,
      negativeCount
    };
  }
  
  /**
   * Analyze sentiment using NLP service
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeRemoteSentiment(text) {
    try {
      const result = await nlpService.analyzeSentiment(text);
      
      // Map NLP service result to our format
      let category;
      if (result.score < -0.6) {
        category = SentimentCategory.VERY_NEGATIVE;
      } else if (result.score < -0.2) {
        category = SentimentCategory.NEGATIVE;
      } else if (result.score <= 0.2) {
        category = SentimentCategory.NEUTRAL;
      } else if (result.score <= 0.6) {
        category = SentimentCategory.POSITIVE;
      } else {
        category = SentimentCategory.VERY_POSITIVE;
      }
      
      return {
        score: result.score,
        magnitude: result.magnitude,
        category,
        remoteLabel: result.label
      };
    } catch (error) {
      logger.error('Error analyzing sentiment with NLP service:', error.message);
      return this.analyzeLocalSentiment(text); // Fallback to local analysis
    }
  }
  
  /**
   * Analyze sentiment using both local and remote methods
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(text) {
    try {
      // Get local sentiment
      const localResult = this.analyzeLocalSentiment(text);
      
      // If local analysis is sufficient or remote is disabled, return local result
      if (this.options.useLocalAnalysis || Math.abs(localResult.score) > 0.7) {
        return {
          ...localResult,
          source: 'local'
        };
      }
      
      // Get remote sentiment
      const remoteResult = await this.analyzeRemoteSentiment(text);
      
      // Combine results, favoring remote if available
      return {
        ...remoteResult,
        source: 'remote'
      };
    } catch (error) {
      logger.error('Error analyzing sentiment:', error.message);
      return {
        score: 0,
        magnitude: 0,
        category: SentimentCategory.NEUTRAL,
        source: 'fallback'
      };
    }
  }
  
  /**
   * Get suggested responses based on sentiment
   * @param {string} category - Sentiment category
   * @returns {Array<string>} - Array of suggested responses
   */
  getSuggestedResponses(category) {
    const responses = {
      [SentimentCategory.VERY_NEGATIVE]: [
        "I'm really sorry to hear that. How can I help improve the situation?",
        "I understand you're upset. Let's work together to resolve this issue.",
        "I apologize for the frustration. Let me try to help make things right."
      ],
      [SentimentCategory.NEGATIVE]: [
        "I see you're not happy with this. How can I help?",
        "I'm sorry to hear that. Let me see what I can do to help.",
        "I understand your concern. Let's look into this together."
      ],
      [SentimentCategory.NEUTRAL]: [
        "How can I assist you further?",
        "Is there anything specific you'd like to know?",
        "I'm here to help. What would you like to do next?"
      ],
      [SentimentCategory.POSITIVE]: [
        "I'm glad to hear that! Is there anything else I can help with?",
        "That's great! What else would you like to know?",
        "Wonderful! How else can I assist you today?"
      ],
      [SentimentCategory.VERY_POSITIVE]: [
        "That's fantastic! I'm really happy I could help.",
        "Excellent! It's great to hear you're so pleased.",
        "Amazing! I'm delighted that you're having such a positive experience."
      ]
    };
    
    return responses[category] || responses[SentimentCategory.NEUTRAL];
  }
  
  /**
   * Process message to analyze sentiment
   * @param {string} text - Text to process
   * @returns {Promise<Object>} - Processed message with sentiment analysis
   */
  async processMessage(text) {
    try {
      // Analyze sentiment
      const sentimentResult = await this.analyzeSentiment(text);
      
      return {
        text,
        sentiment: sentimentResult.category,
        score: sentimentResult.score,
        magnitude: sentimentResult.magnitude,
        suggestedResponses: this.getSuggestedResponses(sentimentResult.category)
      };
    } catch (error) {
      logger.error('Error processing message for sentiment:', error.message);
      return {
        text,
        sentiment: SentimentCategory.NEUTRAL,
        score: 0,
        magnitude: 0,
        suggestedResponses: this.getSuggestedResponses(SentimentCategory.NEUTRAL)
      };
    }
  }
}

// Create singleton instance
const sentimentService = new SentimentService();

module.exports = {
  sentimentService,
  SentimentCategory
};
