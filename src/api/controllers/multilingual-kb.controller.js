/**
 * Multilingual Knowledge Base Controller
 * 
 * Handles API requests related to multilingual knowledge bases
 */

const multilingualKbService = require('../../services/multilingual-kb.service');
const { logger } = require('../../utils');

/**
 * Get knowledge base in a specific language
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getKnowledgeBase = async (req, res, next) => {
  try {
    const { kbId } = req.params;
    const langCode = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    
    const knowledgeBase = await multilingualKbService.getKnowledgeBase(kbId, langCode);
    
    res.json({
      success: true,
      data: knowledgeBase
    });
  } catch (error) {
    logger.error('Error in getKnowledgeBase controller:', error);
    next(error);
  }
};

/**
 * Save knowledge base in a specific language
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const saveKnowledgeBase = async (req, res, next) => {
  try {
    const { kbId } = req.params;
    const { langCode } = req.params;
    const kbData = req.body;
    
    if (!kbData) {
      return res.status(400).json({
        success: false,
        error: 'Knowledge base data is required'
      });
    }
    
    const success = await multilingualKbService.saveKnowledgeBase(kbId, langCode, kbData);
    
    if (success) {
      res.json({
        success: true,
        message: `Knowledge base ${kbId} saved successfully in language ${langCode}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Failed to save knowledge base ${kbId} in language ${langCode}`
      });
    }
  } catch (error) {
    logger.error('Error in saveKnowledgeBase controller:', error);
    next(error);
  }
};

/**
 * Get available languages for a knowledge base
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAvailableLanguages = async (req, res, next) => {
  try {
    const { kbId } = req.params;
    
    const languages = await multilingualKbService.getAvailableLanguages(kbId);
    
    res.json({
      success: true,
      data: languages
    });
  } catch (error) {
    logger.error('Error in getAvailableLanguages controller:', error);
    next(error);
  }
};

/**
 * Delete a language-specific knowledge base
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteLanguageKnowledgeBase = async (req, res, next) => {
  try {
    const { kbId, langCode } = req.params;
    
    if (langCode === 'en') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete the default language (English) knowledge base'
      });
    }
    
    const success = await multilingualKbService.deleteLanguageKnowledgeBase(kbId, langCode);
    
    if (success) {
      res.json({
        success: true,
        message: `Knowledge base ${kbId} in language ${langCode} deleted successfully`
      });
    } else {
      res.status(500).json({
        success: false,
        error: `Failed to delete knowledge base ${kbId} in language ${langCode}`
      });
    }
  } catch (error) {
    logger.error('Error in deleteLanguageKnowledgeBase controller:', error);
    next(error);
  }
};

/**
 * Translate a knowledge base to multiple languages
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const translateKnowledgeBase = async (req, res, next) => {
  try {
    const { kbId } = req.params;
    const { targetLangs, sourceLang = 'en' } = req.body;
    
    if (!targetLangs || !Array.isArray(targetLangs) || targetLangs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Target languages are required'
      });
    }
    
    const results = await multilingualKbService.translateKnowledgeBase(kbId, targetLangs, sourceLang);
    
    res.json({
      success: true,
      data: results,
      message: `Knowledge base ${kbId} translation completed`
    });
  } catch (error) {
    logger.error('Error in translateKnowledgeBase controller:', error);
    next(error);
  }
};

/**
 * Search across multilingual knowledge bases
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const searchMultilingualKnowledgeBases = async (req, res, next) => {
  try {
    const { query } = req.query;
    const langCode = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
    const kbIds = req.body.kbIds; // Optional
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }
    
    const results = await multilingualKbService.searchMultilingualKnowledgeBases(query, langCode, kbIds);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Error in searchMultilingualKnowledgeBases controller:', error);
    next(error);
  }
};

module.exports = {
  getKnowledgeBase,
  saveKnowledgeBase,
  getAvailableLanguages,
  deleteLanguageKnowledgeBase,
  translateKnowledgeBase,
  searchMultilingualKnowledgeBases
};
