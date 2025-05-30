/**
 * Translation Service
 * 
 * Provides functionality for managing translations and language settings
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils');

class TranslationService {
  constructor() {
    this.localesPath = path.join(process.cwd(), 'public', 'locales');
    this.supportedLanguages = [
      { code: 'en', name: 'English', flag: '🇬🇧', isRTL: false },
      { code: 'es', name: 'Español', flag: '🇪🇸', isRTL: false },
      { code: 'fr', name: 'Français', flag: '🇫🇷', isRTL: false },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪', isRTL: false },
      { code: 'it', name: 'Italiano', flag: '🇮🇹', isRTL: false },
      { code: 'pt', name: 'Português', flag: '🇵🇹', isRTL: false },
      { code: 'ru', name: 'Русский', flag: '🇷🇺', isRTL: false },
      { code: 'zh', name: '中文', flag: '🇨🇳', isRTL: false },
      { code: 'ja', name: '日本語', flag: '🇯🇵', isRTL: false },
      { code: 'ko', name: '한국어', flag: '🇰🇷', isRTL: false },
      { code: 'ar', name: 'العربية', flag: '🇸🇦', isRTL: true },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', isRTL: false },
      { code: 'he', name: 'עברית', flag: '🇮🇱', isRTL: true },
      { code: 'fa', name: 'فارسی', flag: '🇮🇷', isRTL: true },
      { code: 'ur', name: 'اردو', flag: '🇵🇰', isRTL: true }
    ];
  }

  /**
   * Get all supported languages
   * 
   * @returns {Array} List of supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Get available languages (those with translation files)
   * 
   * @returns {Promise<Array>} List of available languages
   */
  async getAvailableLanguages() {
    try {
      const directories = await fs.readdir(this.localesPath);
      
      const availableLanguages = directories
        .filter(dir => {
          const langInfo = this.supportedLanguages.find(lang => lang.code === dir);
          return langInfo !== undefined;
        })
        .map(dir => {
          const langInfo = this.supportedLanguages.find(lang => lang.code === dir);
          return langInfo;
        });
      
      return availableLanguages;
    } catch (error) {
      logger.error('Error getting available languages:', error);
      return [];
    }
  }

  /**
   * Check if a language is supported
   * 
   * @param {string} langCode - Language code
   * @returns {boolean} Whether the language is supported
   */
  isLanguageSupported(langCode) {
    return this.supportedLanguages.some(lang => lang.code === langCode);
  }

  /**
   * Get language information
   * 
   * @param {string} langCode - Language code
   * @returns {Object|null} Language information or null if not supported
   */
  getLanguageInfo(langCode) {
    return this.supportedLanguages.find(lang => lang.code === langCode) || null;
  }

  /**
   * Get translations for a language
   * 
   * @param {string} langCode - Language code
   * @param {string} namespace - Namespace (default: 'translation')
   * @returns {Promise<Object>} Translations object
   */
  async getTranslations(langCode, namespace = 'translation') {
    try {
      if (!this.isLanguageSupported(langCode)) {
        throw new Error(`Language ${langCode} is not supported`);
      }

      const filePath = path.join(this.localesPath, langCode, `${namespace}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Error getting translations for ${langCode}:`, error);
      
      // If the requested language fails, try to return English as fallback
      if (langCode !== 'en') {
        try {
          const fallbackPath = path.join(this.localesPath, 'en', `${namespace}.json`);
          const fallbackData = await fs.readFile(fallbackPath, 'utf8');
          return JSON.parse(fallbackData);
        } catch (fallbackError) {
          logger.error('Error getting fallback translations:', fallbackError);
          return {};
        }
      }
      
      return {};
    }
  }

  /**
   * Update translations for a language
   * 
   * @param {string} langCode - Language code
   * @param {Object} translations - Translations object
   * @param {string} namespace - Namespace (default: 'translation')
   * @returns {Promise<boolean>} Success status
   */
  async updateTranslations(langCode, translations, namespace = 'translation') {
    try {
      if (!this.isLanguageSupported(langCode)) {
        throw new Error(`Language ${langCode} is not supported`);
      }

      const langDir = path.join(this.localesPath, langCode);
      
      // Create language directory if it doesn't exist
      try {
        await fs.mkdir(langDir, { recursive: true });
      } catch (mkdirError) {
        // Ignore if directory already exists
        if (mkdirError.code !== 'EEXIST') {
          throw mkdirError;
        }
      }

      const filePath = path.join(langDir, `${namespace}.json`);
      await fs.writeFile(filePath, JSON.stringify(translations, null, 2), 'utf8');
      
      return true;
    } catch (error) {
      logger.error(`Error updating translations for ${langCode}:`, error);
      return false;
    }
  }

  /**
   * Add a new language
   * 
   * @param {string} langCode - Language code
   * @param {string} langName - Language name
   * @param {string} flag - Flag emoji
   * @param {boolean} isRTL - Whether the language is right-to-left
   * @param {Object} translations - Initial translations
   * @returns {Promise<boolean>} Success status
   */
  async addLanguage(langCode, langName, flag, isRTL = false, translations = {}) {
    try {
      // Check if language already exists
      if (this.isLanguageSupported(langCode)) {
        throw new Error(`Language ${langCode} already exists`);
      }

      // Add language to supported languages
      this.supportedLanguages.push({
        code: langCode,
        name: langName,
        flag,
        isRTL
      });

      // Create language directory and translation file
      const langDir = path.join(this.localesPath, langCode);
      
      await fs.mkdir(langDir, { recursive: true });
      
      const filePath = path.join(langDir, 'translation.json');
      await fs.writeFile(filePath, JSON.stringify(translations, null, 2), 'utf8');
      
      return true;
    } catch (error) {
      logger.error(`Error adding language ${langCode}:`, error);
      return false;
    }
  }

  /**
   * Remove a language
   * 
   * @param {string} langCode - Language code
   * @returns {Promise<boolean>} Success status
   */
  async removeLanguage(langCode) {
    try {
      // Check if language exists
      if (!this.isLanguageSupported(langCode)) {
        throw new Error(`Language ${langCode} does not exist`);
      }

      // Don't allow removing English (default language)
      if (langCode === 'en') {
        throw new Error('Cannot remove the default language (English)');
      }

      // Remove language from supported languages
      this.supportedLanguages = this.supportedLanguages.filter(
        lang => lang.code !== langCode
      );

      // Remove language directory
      const langDir = path.join(this.localesPath, langCode);
      await fs.rmdir(langDir, { recursive: true });
      
      return true;
    } catch (error) {
      logger.error(`Error removing language ${langCode}:`, error);
      return false;
    }
  }
}

module.exports = new TranslationService();
