/**
 * Sentiment Repository
 * 
 * Handles sentiment analysis operations using a third-party sentiment analysis service
 */

// Import dependencies
const Sentiment = require('sentiment');
const logger = require('@core/logger');

/**
 * Sentiment Repository class
 * Responsible for analyzing sentiment of text using sentiment analysis library
 */
class SentimentRepository {
  constructor() {
    // Initialize the sentiment analyzer
    this.sentimentAnalyzer = new Sentiment();
    
    // Language detection options
    this.languageDetector = {
      detect: (text) => {
        // Simple language detection based on character set
        // In a production environment, use a proper language detection library
        if (!text || text.trim() === '') return 'unknown';
        
        // Check for common non-Latin characters
        if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text)) {
          return 'ja'; // Japanese
        } else if (/[\u0400-\u04FF]/.test(text)) {
          return 'ru'; // Russian
        } else if (/[\u0600-\u06FF]/.test(text)) {
          return 'ar'; // Arabic
        } else {
          return 'en'; // Default to English
        }
      }
    };
  }

  /**
   * Analyze sentiment of a single text message
   * @param {string} text - The text to analyze
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(text) {
    try {
      logger.debug(`Analyzing sentiment for text: ${text.substring(0, 50)}...`);
      
      if (!text || text.trim() === '') {
        return {
          text,
          sentiment: 'neutral',
          score: 0,
          confidence: 0,
          language: 'unknown'
        };
      }
      
      // Detect language
      const language = this.languageDetector.detect(text);
      
      // Analyze sentiment
      const result = this.sentimentAnalyzer.analyze(text);
      
      // Map the sentiment score to a category
      let sentiment = 'neutral';
      if (result.score > 2) {
        sentiment = 'positive';
      } else if (result.score < -2) {
        sentiment = 'negative';
      }
      
      // Calculate confidence based on comparative score
      const confidence = Math.min(Math.abs(result.comparative) * 5, 1);
      
      return {
        text,
        sentiment,
        score: result.score,
        confidence,
        language
      };
    } catch (error) {
      logger.error(`Error analyzing sentiment: ${error.message}`);
      throw new Error(`Sentiment analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze sentiment of multiple text messages
   * @param {Array<string>} texts - Array of texts to analyze
   * @returns {Promise<Array<Object>>} - Array of sentiment analysis results
   */
  async analyzeBatchSentiment(texts) {
    try {
      logger.debug(`Analyzing batch sentiment for ${texts.length} texts`);
      
      if (!texts || !Array.isArray(texts) || texts.length === 0) {
        return [];
      }
      
      // Process each text in the batch
      const results = await Promise.all(
        texts.map(text => this.analyzeSentiment(text))
      );
      
      return results;
    } catch (error) {
      logger.error(`Error analyzing batch sentiment: ${error.message}`);
      throw new Error(`Batch sentiment analysis failed: ${error.message}`);
    }
  }
}

module.exports = { SentimentRepository };
