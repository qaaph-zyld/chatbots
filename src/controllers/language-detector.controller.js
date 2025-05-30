/**
 * Language Detector Controller
 * 
 * Handles API requests for language detection.
 */

const languageDetector = require('../utils/language-detector');
const logger = require('../utils/logger');

/**
 * Detect language from text
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.detectLanguage = async (req, res) => {
  try {
    const { text } = req.body;
    const options = req.body.options || {};
    
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }
    
    // Initialize language detector if not already initialized
    if (!languageDetector.initialized) {
      await languageDetector.initialize();
    }
    
    // Detect language
    const result = await languageDetector.detectLanguage(text, options);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Error detecting language', error);
    
    res.status(500).json({
      success: false,
      message: 'Error detecting language',
      error: error.message
    });
  }
};

/**
 * Get supported languages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getSupportedLanguages = async (req, res) => {
  try {
    // Initialize language detector if not already initialized
    if (!languageDetector.initialized) {
      await languageDetector.initialize();
    }
    
    // Get supported languages
    const languages = languageDetector.getSupportedLanguages();
    
    res.json({
      success: true,
      languages
    });
  } catch (error) {
    logger.error('Error getting supported languages', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting supported languages',
      error: error.message
    });
  }
};

/**
 * Check if language is supported
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.isLanguageSupported = (req, res) => {
  try {
    const { language } = req.params;
    
    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Language is required'
      });
    }
    
    // Check if language is supported
    const isSupported = languageDetector.isLanguageSupported(language);
    
    res.json({
      success: true,
      language,
      isSupported
    });
  } catch (error) {
    logger.error('Error checking if language is supported', error);
    
    res.status(500).json({
      success: false,
      message: 'Error checking if language is supported',
      error: error.message
    });
  }
};

/**
 * Get best locale for language
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getBestLocale = (req, res) => {
  try {
    const { language } = req.params;
    
    if (!language) {
      return res.status(400).json({
        success: false,
        message: 'Language is required'
      });
    }
    
    // Get best locale
    const locale = languageDetector.getBestLocale(language);
    
    res.json({
      success: true,
      language,
      locale
    });
  } catch (error) {
    logger.error('Error getting best locale', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting best locale',
      error: error.message
    });
  }
};
