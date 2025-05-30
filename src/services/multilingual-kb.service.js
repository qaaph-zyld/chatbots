/**
 * Multilingual Knowledge Base Service
 * 
 * Provides functionality for managing knowledge bases in multiple languages
 */

const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../utils');
const translationService = require('./translation.service');
const knowledgeBaseService = require('./knowledge-base.service');

class MultilingualKnowledgeBaseService {
  constructor() {
    this.kbBasePath = path.join(process.cwd(), 'data', 'knowledge-bases');
  }

  /**
   * Get knowledge base in a specific language
   * 
   * @param {string} kbId - Knowledge base ID
   * @param {string} langCode - Language code
   * @returns {Promise<Object>} Knowledge base data
   */
  async getKnowledgeBase(kbId, langCode) {
    try {
      // Check if language-specific KB exists
      const langKbPath = path.join(this.kbBasePath, kbId, `kb_${langCode}.json`);
      
      try {
        // Try to get language-specific KB
        const data = await fs.readFile(langKbPath, 'utf8');
        return JSON.parse(data);
      } catch (langError) {
        // If language-specific KB doesn't exist, get default KB (English)
        const defaultKbPath = path.join(this.kbBasePath, kbId, 'kb.json');
        const defaultData = await fs.readFile(defaultKbPath, 'utf8');
        return JSON.parse(defaultData);
      }
    } catch (error) {
      logger.error(`Error getting knowledge base ${kbId} in language ${langCode}:`, error);
      throw new Error(`Knowledge base ${kbId} not found`);
    }
  }

  /**
   * Create or update a knowledge base in a specific language
   * 
   * @param {string} kbId - Knowledge base ID
   * @param {string} langCode - Language code
   * @param {Object} data - Knowledge base data
   * @returns {Promise<boolean>} Success status
   */
  async saveKnowledgeBase(kbId, langCode, data) {
    try {
      // Check if language is supported
      if (!translationService.isLanguageSupported(langCode)) {
        throw new Error(`Language ${langCode} is not supported`);
      }

      // Create KB directory if it doesn't exist
      const kbDir = path.join(this.kbBasePath, kbId);
      await fs.mkdir(kbDir, { recursive: true });

      // Save language-specific KB
      const langKbPath = path.join(kbDir, `kb_${langCode}.json`);
      await fs.writeFile(langKbPath, JSON.stringify(data, null, 2), 'utf8');

      // If this is the default language (English), also save as the default KB
      if (langCode === 'en') {
        const defaultKbPath = path.join(kbDir, 'kb.json');
        await fs.writeFile(defaultKbPath, JSON.stringify(data, null, 2), 'utf8');
      }

      return true;
    } catch (error) {
      logger.error(`Error saving knowledge base ${kbId} in language ${langCode}:`, error);
      return false;
    }
  }

  /**
   * Get available languages for a knowledge base
   * 
   * @param {string} kbId - Knowledge base ID
   * @returns {Promise<Array>} List of available language codes
   */
  async getAvailableLanguages(kbId) {
    try {
      const kbDir = path.join(this.kbBasePath, kbId);
      const files = await fs.readdir(kbDir);
      
      // Filter language-specific KB files
      const langFiles = files.filter(file => file.startsWith('kb_') && file.endsWith('.json'));
      
      // Extract language codes
      const langCodes = langFiles.map(file => file.replace('kb_', '').replace('.json', ''));
      
      // Get language information for each code
      const languages = langCodes
        .map(code => translationService.getLanguageInfo(code))
        .filter(lang => lang !== null);
      
      return languages;
    } catch (error) {
      logger.error(`Error getting available languages for knowledge base ${kbId}:`, error);
      return [];
    }
  }

  /**
   * Delete a language-specific knowledge base
   * 
   * @param {string} kbId - Knowledge base ID
   * @param {string} langCode - Language code
   * @returns {Promise<boolean>} Success status
   */
  async deleteLanguageKnowledgeBase(kbId, langCode) {
    try {
      // Don't allow deleting the default language (English)
      if (langCode === 'en') {
        throw new Error('Cannot delete the default language (English) knowledge base');
      }

      const langKbPath = path.join(this.kbBasePath, kbId, `kb_${langCode}.json`);
      await fs.unlink(langKbPath);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting knowledge base ${kbId} in language ${langCode}:`, error);
      return false;
    }
  }

  /**
   * Auto-translate a knowledge base to multiple languages
   * 
   * @param {string} kbId - Knowledge base ID
   * @param {Array} targetLangs - List of target language codes
   * @param {string} sourceLang - Source language code (default: 'en')
   * @returns {Promise<Object>} Results of translation attempts
   */
  async translateKnowledgeBase(kbId, targetLangs, sourceLang = 'en') {
    try {
      // Get source knowledge base
      const sourceKb = await this.getKnowledgeBase(kbId, sourceLang);
      
      // Track results
      const results = {
        success: [],
        failed: []
      };
      
      // Process each target language
      for (const langCode of targetLangs) {
        // Skip source language
        if (langCode === sourceLang) continue;
        
        try {
          // Check if language is supported
          if (!translationService.isLanguageSupported(langCode)) {
            throw new Error(`Language ${langCode} is not supported`);
          }
          
          // Create a deep copy of the source KB for translation
          const translatedKb = JSON.parse(JSON.stringify(sourceKb));
          
          // Translate KB title and description
          if (translatedKb.title) {
            translatedKb.title = await this.translateText(translatedKb.title, sourceLang, langCode);
          }
          
          if (translatedKb.description) {
            translatedKb.description = await this.translateText(translatedKb.description, sourceLang, langCode);
          }
          
          // Translate KB entries
          if (translatedKb.entries && Array.isArray(translatedKb.entries)) {
            for (let i = 0; i < translatedKb.entries.length; i++) {
              const entry = translatedKb.entries[i];
              
              if (entry.question) {
                entry.question = await this.translateText(entry.question, sourceLang, langCode);
              }
              
              if (entry.answer) {
                entry.answer = await this.translateText(entry.answer, sourceLang, langCode);
              }
              
              // Translate tags if present
              if (entry.tags && Array.isArray(entry.tags)) {
                entry.tags = await Promise.all(
                  entry.tags.map(tag => this.translateText(tag, sourceLang, langCode))
                );
              }
            }
          }
          
          // Save translated KB
          const saved = await this.saveKnowledgeBase(kbId, langCode, translatedKb);
          
          if (saved) {
            results.success.push(langCode);
          } else {
            results.failed.push(langCode);
          }
        } catch (langError) {
          logger.error(`Error translating KB ${kbId} to ${langCode}:`, langError);
          results.failed.push(langCode);
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error in translateKnowledgeBase for ${kbId}:`, error);
      throw error;
    }
  }

  /**
   * Translate text from one language to another
   * This is a placeholder method that should be replaced with an actual translation service
   * 
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, sourceLang, targetLang) {
    // This is a placeholder. In a real implementation, you would:
    // 1. Use a translation API like Google Translate, Microsoft Translator, or DeepL
    // 2. Or use a local translation model like LibreTranslate or Argos Translate
    
    // For now, we'll just return the original text with a note
    // In a real implementation, remove this and use actual translation
    return `[${targetLang}] ${text}`;
  }

  /**
   * Search across multilingual knowledge bases
   * 
   * @param {string} query - Search query
   * @param {string} langCode - Language code
   * @param {Array} kbIds - List of knowledge base IDs to search (optional)
   * @returns {Promise<Array>} Search results
   */
  async searchMultilingualKnowledgeBases(query, langCode, kbIds = null) {
    try {
      // If no specific KBs provided, get all KBs
      if (!kbIds) {
        kbIds = await knowledgeBaseService.getAllKnowledgeBaseIds();
      }
      
      const results = [];
      
      // Search each KB
      for (const kbId of kbIds) {
        try {
          // Get KB in requested language
          const kb = await this.getKnowledgeBase(kbId, langCode);
          
          // Search entries
          if (kb.entries && Array.isArray(kb.entries)) {
            const matchingEntries = kb.entries.filter(entry => {
              // Search in question and answer
              const questionMatch = entry.question && 
                entry.question.toLowerCase().includes(query.toLowerCase());
              
              const answerMatch = entry.answer && 
                entry.answer.toLowerCase().includes(query.toLowerCase());
              
              // Search in tags if present
              const tagMatch = entry.tags && Array.isArray(entry.tags) && 
                entry.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
              
              return questionMatch || answerMatch || tagMatch;
            });
            
            // Add matching entries to results
            if (matchingEntries.length > 0) {
              results.push({
                kbId,
                kbTitle: kb.title || kbId,
                entries: matchingEntries
              });
            }
          }
        } catch (kbError) {
          // Skip KBs that can't be accessed
          logger.error(`Error searching KB ${kbId} in language ${langCode}:`, kbError);
        }
      }
      
      return results;
    } catch (error) {
      logger.error(`Error searching multilingual knowledge bases:`, error);
      return [];
    }
  }
}

module.exports = new MultilingualKnowledgeBaseService();
