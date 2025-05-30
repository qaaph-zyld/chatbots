/**
 * Language Detector
 * 
 * Detects the language of text or audio input using open-source
 * language detection libraries.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const logger = require('./logger');
const config = require('../config/open-voice.config');

// Language detection libraries
let franc;
let langdetect;

class LanguageDetector {
  constructor() {
    this.config = config.language || {};
    this.initialized = false;
    this.supportedLanguages = {
      'en': ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en-NZ', 'en-IN'],
      'fr': ['fr-FR', 'fr-CA', 'fr-BE', 'fr-CH'],
      'es': ['es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-US'],
      'de': ['de-DE', 'de-AT', 'de-CH'],
      'it': ['it-IT', 'it-CH'],
      'pt': ['pt-BR', 'pt-PT'],
      'nl': ['nl-NL', 'nl-BE'],
      'ru': ['ru-RU'],
      'ja': ['ja-JP'],
      'zh': ['zh-CN', 'zh-TW', 'zh-HK'],
      'ko': ['ko-KR'],
      'ar': ['ar-SA', 'ar-EG', 'ar-DZ', 'ar-MA'],
      'hi': ['hi-IN'],
      'pl': ['pl-PL'],
      'tr': ['tr-TR'],
      'cs': ['cs-CZ'],
      'sv': ['sv-SE'],
      'da': ['da-DK'],
      'fi': ['fi-FI'],
      'no': ['no-NO'],
      'hu': ['hu-HU'],
      'el': ['el-GR'],
      'he': ['he-IL'],
      'th': ['th-TH'],
      'vi': ['vi-VN'],
      'id': ['id-ID'],
      'ms': ['ms-MY'],
      'ro': ['ro-RO'],
      'uk': ['uk-UA'],
      'bg': ['bg-BG'],
      'hr': ['hr-HR'],
      'lt': ['lt-LT'],
      'lv': ['lv-LV'],
      'et': ['et-EE'],
      'sk': ['sk-SK'],
      'sl': ['sl-SI']
    };
    
    // Language name mapping
    this.languageNames = {
      'en': 'English',
      'fr': 'French',
      'es': 'Spanish',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'nl': 'Dutch',
      'ru': 'Russian',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'pl': 'Polish',
      'tr': 'Turkish',
      'cs': 'Czech',
      'sv': 'Swedish',
      'da': 'Danish',
      'fi': 'Finnish',
      'no': 'Norwegian',
      'hu': 'Hungarian',
      'el': 'Greek',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'ro': 'Romanian',
      'uk': 'Ukrainian',
      'bg': 'Bulgarian',
      'hr': 'Croatian',
      'lt': 'Lithuanian',
      'lv': 'Latvian',
      'et': 'Estonian',
      'sk': 'Slovak',
      'sl': 'Slovenian'
    };
  }
  
  /**
   * Initialize language detector
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }
      
      logger.info('Initializing language detector');
      
      // Load franc for language detection
      try {
        franc = require('franc');
        logger.info('Franc loaded successfully');
      } catch (error) {
        logger.warn('Franc not installed, attempting to install...');
        await this.installDependency('franc');
        franc = require('franc');
      }
      
      // Load langdetect as a backup
      try {
        langdetect = require('langdetect');
        logger.info('Langdetect loaded successfully');
      } catch (error) {
        logger.warn('Langdetect not installed, attempting to install...');
        await this.installDependency('langdetect');
        langdetect = require('langdetect');
      }
      
      this.initialized = true;
      logger.info('Language detector initialized successfully');
      
      return true;
    } catch (error) {
      logger.error('Error initializing language detector', error);
      return false;
    }
  }
  
  /**
   * Install dependency
   * @param {String} packageName - Package name
   * @returns {Promise<boolean>} Whether installation was successful
   */
  async installDependency(packageName) {
    return new Promise((resolve, reject) => {
      logger.info(`Installing ${packageName}...`);
      
      const npm = spawn('npm', ['install', packageName, '--save']);
      
      npm.stdout.on('data', data => {
        logger.debug(`npm stdout: ${data}`);
      });
      
      npm.stderr.on('data', data => {
        logger.debug(`npm stderr: ${data}`);
      });
      
      npm.on('close', code => {
        if (code === 0) {
          logger.info(`Successfully installed ${packageName}`);
          resolve(true);
        } else {
          logger.error(`Failed to install ${packageName}, exit code: ${code}`);
          reject(new Error(`Failed to install ${packageName}`));
        }
      });
    });
  }
  
  /**
   * Detect language from text
   * @param {String} text - Text to detect language from
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Detection result
   */
  async detectLanguage(text, options = {}) {
    try {
      // Initialize if not already initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Default options
      const opts = {
        minLength: options.minLength || 10,
        minConfidence: options.minConfidence || 0.5,
        defaultLanguage: options.defaultLanguage || 'en-US'
      };
      
      // Check if text is long enough
      if (!text || text.length < opts.minLength) {
        return {
          detected: false,
          language: opts.defaultLanguage,
          confidence: 0,
          message: 'Text too short for reliable detection'
        };
      }
      
      // Detect language using franc
      const francResult = franc(text, { minLength: opts.minLength });
      
      // Detect language using langdetect as backup
      let langdetectResult = [];
      try {
        langdetectResult = langdetect.detect(text);
      } catch (error) {
        logger.debug('Langdetect failed, using only franc result');
      }
      
      // Combine results
      let detectedLanguage = francResult;
      let confidence = 0.7; // Default confidence for franc
      
      // If langdetect returned results, use the one with highest confidence
      if (langdetectResult && langdetectResult.length > 0) {
        const topLangdetect = langdetectResult[0];
        
        // If franc and langdetect agree, increase confidence
        if (topLangdetect.lang === francResult) {
          detectedLanguage = francResult;
          confidence = Math.min(0.9, topLangdetect.prob + 0.2); // Boost confidence but cap at 0.9
        } else if (topLangdetect.prob > 0.8) {
          // If langdetect is very confident, use its result
          detectedLanguage = topLangdetect.lang;
          confidence = topLangdetect.prob;
        }
      }
      
      // Check if detected language is supported
      if (detectedLanguage === 'und' || !this.supportedLanguages[detectedLanguage]) {
        // Language not detected or not supported
        return {
          detected: false,
          language: opts.defaultLanguage,
          confidence: 0,
          message: 'Language not detected or not supported'
        };
      }
      
      // Check confidence threshold
      if (confidence < opts.minConfidence) {
        return {
          detected: false,
          language: opts.defaultLanguage,
          confidence,
          message: 'Confidence below threshold'
        };
      }
      
      // Get the best locale for the detected language
      const locales = this.supportedLanguages[detectedLanguage];
      const locale = locales[0]; // Use the first (primary) locale
      
      return {
        detected: true,
        language: locale,
        baseLanguage: detectedLanguage,
        confidence,
        name: this.languageNames[detectedLanguage] || detectedLanguage,
        message: 'Language detected successfully'
      };
    } catch (error) {
      logger.error('Error detecting language', error);
      
      return {
        detected: false,
        language: options.defaultLanguage || 'en-US',
        confidence: 0,
        message: `Error detecting language: ${error.message}`
      };
    }
  }
  
  /**
   * Get supported languages
   * @returns {Object} Supported languages
   */
  getSupportedLanguages() {
    const result = {};
    
    for (const [baseLanguage, locales] of Object.entries(this.supportedLanguages)) {
      const name = this.languageNames[baseLanguage] || baseLanguage;
      
      result[baseLanguage] = {
        name,
        locales: locales.map(locale => ({
          code: locale,
          name: `${name} (${locale.split('-')[1]})`
        }))
      };
    }
    
    return result;
  }
  
  /**
   * Get best locale for language
   * @param {String} language - Language code (e.g., 'en', 'en-US')
   * @returns {String} Best locale
   */
  getBestLocale(language) {
    // If it's already a locale, check if it's supported
    if (language.includes('-')) {
      const baseLanguage = language.split('-')[0];
      
      if (this.supportedLanguages[baseLanguage] && this.supportedLanguages[baseLanguage].includes(language)) {
        return language;
      }
      
      // If not supported, fall back to the first locale for the base language
      if (this.supportedLanguages[baseLanguage]) {
        return this.supportedLanguages[baseLanguage][0];
      }
    } else {
      // If it's a base language, return the first locale
      if (this.supportedLanguages[language]) {
        return this.supportedLanguages[language][0];
      }
    }
    
    // Default to English if language not supported
    return 'en-US';
  }
  
  /**
   * Check if language is supported
   * @param {String} language - Language code
   * @returns {Boolean} Whether language is supported
   */
  isLanguageSupported(language) {
    if (language.includes('-')) {
      const baseLanguage = language.split('-')[0];
      return this.supportedLanguages[baseLanguage] && this.supportedLanguages[baseLanguage].includes(language);
    } else {
      return !!this.supportedLanguages[language];
    }
  }
}

module.exports = new LanguageDetector();
