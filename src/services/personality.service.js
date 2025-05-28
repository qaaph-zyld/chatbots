/**
 * Personality Service
 * 
 * Handles personality management operations
 */

const mongoose = require('mongoose');
const Personality = require('../database/schemas/personality.schema');
const { logger } = require('../utils');

class PersonalityService {
  /**
   * Create a new personality
   * @param {Object} personalityData - Personality configuration
   * @returns {Promise<Object>} - Created personality
   */
  async createPersonality(personalityData) {
    try {
      logger.debug(`Creating new personality for chatbot ${personalityData.chatbotId}`);
      
      // Check if this is set as default
      if (personalityData.isDefault) {
        // If this is set as default, unset any existing defaults for this chatbot
        await Personality.updateMany(
          { chatbotId: personalityData.chatbotId, isDefault: true },
          { isDefault: false }
        );
      }
      
      const personality = new Personality(personalityData);
      await personality.save();
      
      logger.info(`Created new personality: ${personality._id} (${personality.name})`);
      
      return personality;
    } catch (error) {
      logger.error('Error creating personality:', error.message);
      throw error;
    }
  }
  
  /**
   * Get personality by ID
   * @param {string} personalityId - Personality ID
   * @returns {Promise<Object>} - Personality object
   */
  async getPersonalityById(personalityId) {
    try {
      const personality = await Personality.findById(personalityId);
      
      if (!personality) {
        logger.warn(`Personality not found: ${personalityId}`);
        return null;
      }
      
      return personality;
    } catch (error) {
      logger.error(`Error fetching personality ${personalityId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get personalities for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array>} - Array of personality objects
   */
  async getPersonalitiesByChatbotId(chatbotId) {
    try {
      const personalities = await Personality.find({ chatbotId });
      
      logger.debug(`Retrieved ${personalities.length} personalities for chatbot ${chatbotId}`);
      
      return personalities;
    } catch (error) {
      logger.error(`Error fetching personalities for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get default personality for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Default personality object or null
   */
  async getDefaultPersonality(chatbotId) {
    try {
      const defaultPersonality = await Personality.findOne({ 
        chatbotId, 
        isDefault: true 
      });
      
      if (!defaultPersonality) {
        logger.debug(`No default personality found for chatbot ${chatbotId}`);
        return null;
      }
      
      return defaultPersonality;
    } catch (error) {
      logger.error(`Error fetching default personality for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Update personality
   * @param {string} personalityId - Personality ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated personality
   */
  async updatePersonality(personalityId, updateData) {
    try {
      const personality = await Personality.findById(personalityId);
      
      if (!personality) {
        logger.warn(`Cannot update personality: Personality not found: ${personalityId}`);
        return null;
      }
      
      // Check if this is being set as default
      if (updateData.isDefault && !personality.isDefault) {
        // If this is set as default, unset any existing defaults for this chatbot
        await Personality.updateMany(
          { chatbotId: personality.chatbotId, isDefault: true },
          { isDefault: false }
        );
      }
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        personality[key] = updateData[key];
      });
      
      await personality.save();
      
      logger.info(`Updated personality ${personalityId}`);
      
      return personality;
    } catch (error) {
      logger.error(`Error updating personality ${personalityId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Delete personality
   * @param {string} personalityId - Personality ID
   * @returns {Promise<boolean>} - True if deletion was successful
   */
  async deletePersonality(personalityId) {
    try {
      const personality = await Personality.findById(personalityId);
      
      if (!personality) {
        logger.warn(`Cannot delete personality: Personality not found: ${personalityId}`);
        return false;
      }
      
      // Check if this is the default personality
      if (personality.isDefault) {
        // Find another personality to set as default
        const anotherPersonality = await Personality.findOne({
          chatbotId: personality.chatbotId,
          _id: { $ne: personalityId }
        });
        
        if (anotherPersonality) {
          anotherPersonality.isDefault = true;
          await anotherPersonality.save();
        }
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
   * Set a personality as default for a chatbot
   * @param {string} personalityId - Personality ID
   * @returns {Promise<Object>} - Updated personality
   */
  async setAsDefault(personalityId) {
    try {
      const personality = await Personality.findById(personalityId);
      
      if (!personality) {
        logger.warn(`Cannot set as default: Personality not found: ${personalityId}`);
        return null;
      }
      
      // Unset any existing defaults for this chatbot
      await Personality.updateMany(
        { chatbotId: personality.chatbotId, isDefault: true },
        { isDefault: false }
      );
      
      // Set this personality as default
      personality.isDefault = true;
      await personality.save();
      
      logger.info(`Set personality ${personalityId} as default for chatbot ${personality.chatbotId}`);
      
      return personality;
    } catch (error) {
      logger.error(`Error setting personality ${personalityId} as default:`, error.message);
      throw error;
    }
  }
  
  /**
   * Generate a prompt modifier based on personality settings
   * @param {string} personalityId - Personality ID
   * @returns {Promise<string>} - Prompt modifier text
   */
  async generatePromptModifier(personalityId) {
    try {
      const personality = await Personality.findById(personalityId);
      
      if (!personality) {
        logger.warn(`Cannot generate prompt modifier: Personality not found: ${personalityId}`);
        return '';
      }
      
      return personality.generatePromptModifier();
    } catch (error) {
      logger.error(`Error generating prompt modifier for personality ${personalityId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Create a default personality for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @param {string} name - Personality name
   * @returns {Promise<Object>} - Created personality
   */
  async createDefaultPersonality(chatbotId, name = 'Default') {
    try {
      // Check if a default personality already exists
      const existingDefault = await this.getDefaultPersonality(chatbotId);
      
      if (existingDefault) {
        logger.debug(`Default personality already exists for chatbot ${chatbotId}`);
        return existingDefault;
      }
      
      // Create a balanced default personality
      const defaultPersonality = {
        chatbotId,
        name,
        description: 'Default balanced personality',
        traits: [
          { name: 'friendly', value: 0.5, description: 'Moderately friendly' },
          { name: 'professional', value: 0.5, description: 'Moderately professional' }
        ],
        tones: [
          { name: 'helpful', strength: 0.7, description: 'Strongly helpful' },
          { name: 'respectful', strength: 0.6, description: 'Moderately respectful' }
        ],
        languageStyle: {
          formality: 0,
          complexity: 0,
          verbosity: 0
        },
        responseCharacteristics: {
          humor: 0.2,
          empathy: 0.5,
          creativity: 0.3
        },
        isDefault: true
      };
      
      return this.createPersonality(defaultPersonality);
    } catch (error) {
      logger.error(`Error creating default personality for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
}

// Create singleton instance
const personalityService = new PersonalityService();

module.exports = personalityService;
