/**
 * Sentiment Controller
 * 
 * Handles HTTP requests for sentiment analysis operations
 */

// Import dependencies
const { SentimentService } = require('@modules/sentiment/services/sentiment.service');
const { SentimentRepository } = require('@modules/sentiment/repositories/sentiment.repository');
const logger = require('@core/logger');

// Create instances
const sentimentRepository = new SentimentRepository();
const sentimentService = new SentimentService(sentimentRepository);

/**
 * Sentiment Controller class
 * Handles API endpoints for sentiment analysis
 */
class SentimentController {
  /**
   * Analyze sentiment of a single text message
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with sentiment analysis result
   */
  static async analyzeSentiment(req, res) {
    try {
      const { text } = req.body;
      
      // Validate input
      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'text is required'
        });
      }
      
      logger.info('Received request to analyze sentiment');
      
      // Call service to analyze sentiment
      const result = await sentimentService.analyzeSentiment(text);
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error(`Error in sentiment controller: ${error.message}`);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze sentiment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Analyze sentiment of multiple text messages
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JSON response with array of sentiment analysis results
   */
  static async analyzeBatchSentiment(req, res) {
    try {
      const { texts } = req.body;
      
      // Validate input
      if (!texts) {
        return res.status(400).json({
          success: false,
          message: 'texts array is required'
        });
      }
      
      if (!Array.isArray(texts)) {
        return res.status(400).json({
          success: false,
          message: 'texts must be an array'
        });
      }
      
      logger.info(`Received request to analyze batch sentiment for ${texts.length} texts`);
      
      // Call service to analyze batch sentiment
      const results = await sentimentService.analyzeBatchSentiment(texts);
      
      return res.status(200).json(results);
    } catch (error) {
      logger.error(`Error in batch sentiment controller: ${error.message}`);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze batch sentiment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = { SentimentController };
