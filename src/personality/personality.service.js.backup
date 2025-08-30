/**
 * Personality Service
 * 
 * Provides capabilities for managing and applying chatbot personalities
 * to customize tone, style, and behavioral characteristics.
 */

const mongoose = require('mongoose');
require('@src/utils');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
require('@src/personality\personality.schema');

/**
 * Personality Service class
 */
class PersonalityService {
  /**
   * Constructor
   */
  constructor() {
    this.proxyConfig = process.env.HTTP_PROXY || 'http://104.129.196.38:10563';
    this.httpClient = axios.create({
      httpAgent: new HttpsProxyAgent(this.proxyConfig),
      httpsAgent: new HttpsProxyAgent(this.proxyConfig)
    });
    
    logger.info('Personality Service initialized');
  }
  
  /**
   * Create a new personality
   * @param {Object} personalityData - Personality data
   * @returns {Promise<Object>} - Created personality
   */
  async createPersonality(personalityData) {
    try {
      const { chatbotId, name } = personalityData;
      
      if (!chatbotId || !name) {
        throw new Error('Chatbot ID and name are required');
      }
      
      // Check if a personality with the same name already exists for this chatbot
      const existingPersonality = await Personality.findOne({
        chatbotId,
        name
      });
      
      if (existingPersonality) {
        throw new Error(`Personality with name "${name}" already exists for this chatbot`);
      }
      
      // Create new personality
      const personality = new Personality(personalityData);
      await personality.save();
      
      logger.info(`Created new personality "${name}" for chatbot ${chatbotId}`);
      
      return personality.toObject();
    } catch (error) {
      logger.error(`Error creating personality:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get personality by ID
   * @param {string} personalityId - Personality ID
   * @returns {Promise<Object>} - Personality
   */
  async getPersonalityById(personalityId) {
    try {
      const personality = await Personality.findById(personalityId);
      
      if (!personality) {
        throw new Error(`Personality not found: ${personalityId}`);
      }
      
      return personality.toObject();
    } catch (error) {
      logger.error(`Error getting personality ${personalityId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get personalities for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array<Object>>} - Personalities
   */
  async getChatbotPersonalities(chatbotId) {
    try {
      const personalities = await Personality.find({ chatbotId });
      
      return personalities.map(personality => personality.toObject());
    } catch (error) {
      logger.error(`Error getting personalities for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get default personality for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Default personality
   */
  async getDefaultPersonality(chatbotId) {
    try {
      let defaultPersonality = await Personality.findOne({
        chatbotId,
        isDefault: true
      });
      
      if (!defaultPersonality) {
        // If no default personality exists, get the first one or create a generic one
        const personalities = await Personality.find({ chatbotId });
        
        if (personalities.length > 0) {
          defaultPersonality = personalities[0];
        } else {
          // Create a generic default personality
          defaultPersonality = new Personality({
            chatbotId,
            name: 'Default Personality',
            description: 'Generic default personality',
            isDefault: true
          });
          
          await defaultPersonality.save();
          logger.info(`Created generic default personality for chatbot ${chatbotId}`);
        }
      }
      
      return defaultPersonality.toObject();
    } catch (error) {
      logger.error(`Error getting default personality for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Update personality
   * @param {string} personalityId - Personality ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated personality
   */
  async updatePersonality(personalityId, updateData) {
    try {
      const personality = await Personality.findById(personalityId);
      
      if (!personality) {
        throw new Error(`Personality not found: ${personalityId}`);
      }
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        if (key !== '_id' && key !== 'chatbotId' && key !== 'createdAt') {
          if (key === 'toneStyle' || key === 'responseStyle' || key === 'behavioralTendencies' || key === 'persona' || key === 'languagePatterns') {
            // For nested objects, merge rather than replace
            personality[key] = { ...personality[key], ...updateData[key] };
          } else {
            personality[key] = updateData[key];
          }
        }
      });
      
      // If setting this personality as default, unset any other default
      if (updateData.isDefault === true) {
        await Personality.updateMany(
          { 
            chatbotId: personality.chatbotId, 
            _id: { $ne: personalityId },
            isDefault: true
          },
          { isDefault: false }
        );
      }
      
      personality.updatedAt = new Date();
      await personality.save();
      
      logger.info(`Updated personality ${personalityId}`);
      
      return personality.toObject();
    } catch (error) {
      logger.error(`Error updating personality ${personalityId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Delete personality
   * @param {string} personalityId - Personality ID
   * @returns {Promise<boolean>} - Success status
   */
  async deletePersonality(personalityId) {
    try {
      const personality = await Personality.findById(personalityId);
      
      if (!personality) {
        throw new Error(`Personality not found: ${personalityId}`);
      }
      
      // Don't allow deleting the default personality
      if (personality.isDefault) {
        throw new Error('Cannot delete the default personality');
      }
      
      await Personality.deleteOne({ _id: personalityId });
      
      logger.info(`Deleted personality ${personalityId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting personality ${personalityId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Apply personality to message
   * @param {string} chatbotId - Chatbot ID
   * @param {string} personalityId - Personality ID (optional, uses default if not provided)
   * @param {string} message - Original message
   * @returns {Promise<string>} - Modified message
   */
  async applyPersonalityToMessage(chatbotId, personalityId, message) {
    try {
      if (!message) {
        return message;
      }
      
      // Get personality
      let personality;
      
      if (personalityId) {
        personality = await this.getPersonalityById(personalityId);
      } else {
        personality = await this.getDefaultPersonality(chatbotId);
      }
      
      // Apply personality modifiers to message
      let modifiedMessage = message;
      
      // Apply formality modifier
      modifiedMessage = this.adjustFormality(modifiedMessage, personality.toneStyle.formality);
      
      // Apply verbosity modifier
      modifiedMessage = this.adjustVerbosity(modifiedMessage, personality.responseStyle.verbosity);
      
      // Apply language patterns
      modifiedMessage = this.applyLanguagePatterns(modifiedMessage, personality.languagePatterns);
      
      return modifiedMessage;
    } catch (error) {
      logger.error(`Error applying personality to message:`, error.message);
      // Return original message if there's an error
      return message;
    }
  }
  
  /**
   * Adjust formality of message
   * @param {string} message - Original message
   * @param {number} formalityLevel - Formality level (0-1)
   * @returns {string} - Modified message
   */
  adjustFormality(message, formalityLevel) {
    // This is a simplified implementation
    // In a real system, this would use more sophisticated NLP techniques
    
    if (!message) return message;
    
    // For demonstration purposes, we'll just modify some common phrases
    if (formalityLevel > 0.7) {
      // More formal
      message = message
        .replace(/hi\b/gi, 'Hello')
        .replace(/hey\b/gi, 'Hello')
        .replace(/thanks/gi, 'Thank you')
        .replace(/sorry/gi, 'I apologize')
        .replace(/ok\b/gi, 'Understood')
        .replace(/okay\b/gi, 'Understood')
        .replace(/yeah\b/gi, 'Yes')
        .replace(/nope\b/gi, 'No')
        .replace(/can't/gi, 'cannot')
        .replace(/won't/gi, 'will not')
        .replace(/don't/gi, 'do not');
    } else if (formalityLevel < 0.3) {
      // More casual
      message = message
        .replace(/Hello/gi, 'Hi')
        .replace(/Thank you/gi, 'Thanks')
        .replace(/I apologize/gi, 'Sorry')
        .replace(/Understood/gi, 'Got it')
        .replace(/cannot/gi, "can't")
        .replace(/will not/gi, "won't")
        .replace(/do not/gi, "don't");
    }
    
    return message;
  }
  
  /**
   * Adjust verbosity of message
   * @param {string} message - Original message
   * @param {number} verbosityLevel - Verbosity level (0-1)
   * @returns {string} - Modified message
   */
  adjustVerbosity(message, verbosityLevel) {
    // This is a simplified implementation
    // In a real system, this would use more sophisticated NLP techniques
    
    if (!message) return message;
    
    const sentences = message.match(/[^.!?]+[.!?]+/g) || [message];
    
    if (verbosityLevel > 0.7 && sentences.length < 3) {
      // More verbose - add a generic elaboration
      return message + ' I hope that helps! Let me know if you need any additional information.';
    } else if (verbosityLevel < 0.3 && sentences.length > 2) {
      // More concise - return just the first 1-2 sentences
      return sentences.slice(0, 2).join(' ');
    }
    
    return message;
  }
  
  /**
   * Apply language patterns to message
   * @param {string} message - Original message
   * @param {Object} languagePatterns - Language patterns
   * @returns {string} - Modified message
   */
  applyLanguagePatterns(message, languagePatterns) {
    if (!message || !languagePatterns) return message;
    
    // Apply greeting pattern if message starts with a greeting
    if (/^(hi|hello|hey|greetings)/i.test(message) && languagePatterns.greetings && languagePatterns.greetings.length > 0) {
      const randomGreeting = languagePatterns.greetings[Math.floor(Math.random() * languagePatterns.greetings.length)];
      message = message.replace(/^(hi|hello|hey|greetings)[,!]?\s/i, randomGreeting + ' ');
    }
    
    // Apply farewell pattern if message ends with a farewell
    if (/(goodbye|bye|farewell|see you|talk to you later)\.?$/i.test(message) && languagePatterns.farewells && languagePatterns.farewells.length > 0) {
      const randomFarewell = languagePatterns.farewells[Math.floor(Math.random() * languagePatterns.farewells.length)];
      message = message.replace(/(goodbye|bye|farewell|see you|talk to you later)\.?$/i, randomFarewell);
    }
    
    return message;
  }
}

// Create singleton instance
const personalityService = new PersonalityService();

module.exports = personalityService;
