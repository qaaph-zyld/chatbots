/**
 * Translation Controller
 * 
 * Handles API requests related to translations and language settings
 */

const translationService = require('../../services/translation.service');

/**
 * Get all supported languages
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getSupportedLanguages = async (req, res, next) => {
  try {
    const languages = translationService.getSupportedLanguages();
    res.json({ success: true, data: languages });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available languages (those with translation files)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAvailableLanguages = async (req, res, next) => {
  try {
    const languages = await translationService.getAvailableLanguages();
    res.json({ success: true, data: languages });
  } catch (error) {
    next(error);
  }
};

/**
 * Get translations for a language
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTranslations = async (req, res, next) => {
  try {
    const { langCode, namespace = 'translation' } = req.params;
    const translations = await translationService.getTranslations(langCode, namespace);
    res.json({ success: true, data: translations });
  } catch (error) {
    next(error);
  }
};

/**
 * Update translations for a language
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateTranslations = async (req, res, next) => {
  try {
    const { langCode, namespace = 'translation' } = req.params;
    const translations = req.body;
    
    if (!translations || typeof translations !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid translations data' 
      });
    }
    
    const success = await translationService.updateTranslations(langCode, translations, namespace);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `Translations for ${langCode} updated successfully` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: `Failed to update translations for ${langCode}` 
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new language
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const addLanguage = async (req, res, next) => {
  try {
    const { langCode, langName, flag, isRTL = false, translations = {} } = req.body;
    
    if (!langCode || !langName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Language code and name are required' 
      });
    }
    
    const success = await translationService.addLanguage(
      langCode, 
      langName, 
      flag || '🌐', 
      isRTL, 
      translations
    );
    
    if (success) {
      res.status(201).json({ 
        success: true, 
        message: `Language ${langCode} added successfully` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: `Failed to add language ${langCode}` 
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a language
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const removeLanguage = async (req, res, next) => {
  try {
    const { langCode } = req.params;
    
    if (langCode === 'en') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot remove the default language (English)' 
      });
    }
    
    const success = await translationService.removeLanguage(langCode);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `Language ${langCode} removed successfully` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: `Failed to remove language ${langCode}` 
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSupportedLanguages,
  getAvailableLanguages,
  getTranslations,
  updateTranslations,
  addLanguage,
  removeLanguage
};
