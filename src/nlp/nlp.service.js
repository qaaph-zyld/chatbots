/**
 * Advanced NLP Service
 * 
 * Provides advanced natural language processing capabilities for chatbots
 */

const axios = require('axios');
const { logger } = require('../utils');

/**
 * NLP Service class
 */
class NLPService {
  /**
   * Constructor
   * @param {Object} options - NLP service options
   */
  constructor(options = {}) {
    this.options = {
      apiKey: process.env.NLP_API_KEY,
      apiUrl: process.env.NLP_API_URL || 'https://api.nlp-service.com',
      ...options
    };
    
    this.axios = axios.create({
      baseURL: this.options.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    logger.info('NLP Service initialized');
  }
  
  /**
   * Extract entities from text
   * @param {string} text - Text to extract entities from
   * @returns {Promise<Array>} - Array of extracted entities
   */
  async extractEntities(text) {
    try {
      const response = await this.axios.post('/entities', { text });
      return response.data.entities;
    } catch (error) {
      logger.error('Error extracting entities:', error.message);
      return [];
    }
  }
  
  /**
   * Extract keywords from text
   * @param {string} text - Text to extract keywords from
   * @returns {Promise<Array>} - Array of extracted keywords
   */
  async extractKeywords(text) {
    try {
      const response = await this.axios.post('/keywords', { text });
      return response.data.keywords;
    } catch (error) {
      logger.error('Error extracting keywords:', error.message);
      return [];
    }
  }
  
  /**
   * Analyze sentiment of text
   * @param {string} text - Text to analyze sentiment of
   * @returns {Promise<Object>} - Sentiment analysis result
   */
  async analyzeSentiment(text) {
    try {
      const response = await this.axios.post('/sentiment', { text });
      return response.data;
    } catch (error) {
      logger.error('Error analyzing sentiment:', error.message);
      return { score: 0, magnitude: 0, label: 'neutral' };
    }
  }
  
  /**
   * Detect language of text
   * @param {string} text - Text to detect language of
   * @returns {Promise<Object>} - Language detection result
   */
  async detectLanguage(text) {
    try {
      const response = await this.axios.post('/language', { text });
      return response.data;
    } catch (error) {
      logger.error('Error detecting language:', error.message);
      return { language: 'en', confidence: 0 };
    }
  }
  
  /**
   * Classify text into categories
   * @param {string} text - Text to classify
   * @param {Array} categories - Categories to classify into
   * @returns {Promise<Object>} - Classification result
   */
  async classifyText(text, categories = []) {
    try {
      const response = await this.axios.post('/classify', { text, categories });
      return response.data;
    } catch (error) {
      logger.error('Error classifying text:', error.message);
      return { category: null, confidence: 0 };
    }
  }
  
  /**
   * Generate embeddings for text
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<Object>} - Embeddings result
   */
  async generateEmbeddings(text) {
    try {
      const response = await this.axios.post('/embeddings', { text });
      return response.data;
    } catch (error) {
      logger.error('Error generating embeddings:', error.message);
      return { embeddings: [] };
    }
  }
  
  /**
   * Summarize text
   * @param {string} text - Text to summarize
   * @param {Object} options - Summarization options
   * @returns {Promise<Object>} - Summarization result
   */
  async summarizeText(text, options = { maxLength: 100 }) {
    try {
      const response = await this.axios.post('/summarize', { text, ...options });
      return response.data;
    } catch (error) {
      logger.error('Error summarizing text:', error.message);
      return { summary: '' };
    }
  }
  
  /**
   * Parse intent from text
   * @param {string} text - Text to parse intent from
   * @returns {Promise<Object>} - Intent parsing result
   */
  async parseIntent(text) {
    try {
      const response = await this.axios.post('/intent', { text });
      return response.data;
    } catch (error) {
      logger.error('Error parsing intent:', error.message);
      return { intent: null, confidence: 0, entities: [] };
    }
  }
  
  /**
   * Process text with multiple NLP features
   * @param {string} text - Text to process
   * @param {Array} features - Features to process
   * @returns {Promise<Object>} - Processing result
   */
  async processText(text, features = ['entities', 'keywords', 'sentiment']) {
    try {
      const response = await this.axios.post('/process', { text, features });
      return response.data;
    } catch (error) {
      logger.error('Error processing text:', error.message);
      return {};
    }
  }
}

// Create singleton instance
const nlpService = new NLPService();

module.exports = nlpService;
