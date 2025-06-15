/**
 * Sentiment Service
 * 
 * Business logic for sentiment analysis operations
 */

// Import dependencies
const logger = require('@core/logger');

/**
 * Sentiment Service class
 * Handles business logic for sentiment analysis
 */
class SentimentService {
  /**
   * Constructor
   * @param {Object} sentimentRepository - Repository for sentiment analysis
   */
  constructor(sentimentRepository) {
    this.sentimentRepository = sentimentRepository;
  }

  /**
   * Analyze sentiment of a single text message
   * @param {string} text - The text to analyze
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(text) {
    try {
      logger.info('Analyzing sentiment for text');
      return await this.sentimentRepository.analyzeSentiment(text);
    } catch (error) {
      logger.error(`Error in sentiment service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze sentiment of multiple text messages
   * @param {Array<string>} texts - Array of texts to analyze
   * @returns {Promise<Array<Object>>} - Array of sentiment analysis results
   */
  async analyzeBatchSentiment(texts) {
    try {
      logger.info(`Analyzing batch sentiment for ${texts.length} texts`);
      return await this.sentimentRepository.analyzeBatchSentiment(texts);
    } catch (error) {
      logger.error(`Error in batch sentiment service: ${error.message}`);
      throw error;
    }
  }
}

module.exports = { SentimentService };
