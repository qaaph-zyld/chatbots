/**
 * Preference Learning Service
 * 
 * This service provides functionality for learning and applying user preferences,
 * including explicit preferences, inferred preferences, and preference-based personalization.
 */

const mongoose = require('mongoose');
const Preference = require('../models/preference.model');
const { logger } = require('../utils');
const axios = require('axios');

// Configure axios with proxy
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

class PreferenceLearningService {
  /**
   * Set an explicit user preference
   * @param {Object} preferenceData - Preference data
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Saved preference
   */
  async setPreference(preferenceData, userId, chatbotId) {
    try {
      // Check if preference already exists
      let preference = await Preference.findOne({
        category: preferenceData.category,
        key: preferenceData.key,
        userId,
        chatbotId
      });

      if (preference) {
        // Update existing preference
        preference.value = preferenceData.value;
        preference.source = preferenceData.source || preference.source;
        preference.confidence = preferenceData.confidence || preference.confidence;
        preference.metadata = { ...preference.metadata, ...(preferenceData.metadata || {}) };
        preference.lastUpdated = new Date();
        
        await preference.save();
        logger.info(`Updated existing preference: ${preference._id}`);
      } else {
        // Create new preference
        preference = new Preference({
          category: preferenceData.category,
          key: preferenceData.key,
          value: preferenceData.value,
          source: preferenceData.source || 'explicit',
          confidence: preferenceData.confidence || 1.0,
          metadata: preferenceData.metadata || {},
          userId,
          chatbotId,
          created: new Date(),
          lastUpdated: new Date()
        });
        
        await preference.save();
        logger.info(`Created new preference: ${preference._id}`);
      }
      
      return preference;
    } catch (error) {
      logger.error('Error setting preference:', error);
      throw error;
    }
  }

  /**
   * Infer preferences from user message
   * @param {String} message - User message
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {String} conversationId - Conversation ID
   * @returns {Promise<Array>} - Inferred preferences
   */
  async inferPreferencesFromMessage(message, userId, chatbotId, conversationId) {
    try {
      // In a real implementation, this would use NLP models to infer preferences
      // For this example, we'll use a simplified rule-based approach
      
      const inferredPreferences = [];
      const lowerMessage = message.toLowerCase();
      
      // Infer communication style preferences
      if (lowerMessage.includes('detailed') || lowerMessage.includes('thorough') || 
          lowerMessage.includes('comprehensive') || lowerMessage.includes('in-depth')) {
        inferredPreferences.push({
          category: 'communication',
          key: 'responseStyle',
          value: 'detailed',
          source: 'inferred',
          confidence: 0.8,
          metadata: {
            inferredFrom: 'message content',
            conversationId
          }
        });
      } else if (lowerMessage.includes('brief') || lowerMessage.includes('concise') || 
                lowerMessage.includes('short') || lowerMessage.includes('quick')) {
        inferredPreferences.push({
          category: 'communication',
          key: 'responseStyle',
          value: 'concise',
          source: 'inferred',
          confidence: 0.8,
          metadata: {
            inferredFrom: 'message content',
            conversationId
          }
        });
      }
      
      // Infer topic interests
      const topicKeywords = {
        'technology': ['tech', 'computer', 'software', 'hardware', 'digital', 'ai', 'code', 'programming'],
        'travel': ['travel', 'vacation', 'trip', 'destination', 'tourism', 'hotel', 'flight'],
        'food': ['food', 'cooking', 'recipe', 'restaurant', 'cuisine', 'meal', 'dish'],
        'sports': ['sports', 'game', 'team', 'player', 'match', 'competition', 'workout'],
        'music': ['music', 'song', 'artist', 'band', 'concert', 'album', 'playlist'],
        'movies': ['movie', 'film', 'cinema', 'actor', 'director', 'watch', 'series']
      };
      
      const detectedTopics = [];
      
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        for (const keyword of keywords) {
          if (lowerMessage.includes(keyword)) {
            detectedTopics.push(topic);
            break;
          }
        }
      }
      
      if (detectedTopics.length > 0) {
        inferredPreferences.push({
          category: 'topics',
          key: 'interests',
          value: detectedTopics,
          source: 'inferred',
          confidence: 0.7,
          metadata: {
            inferredFrom: 'message content',
            conversationId
          }
        });
      }
      
      // Save inferred preferences
      const savedPreferences = [];
      for (const prefData of inferredPreferences) {
        const savedPref = await this._saveInferredPreference(prefData, userId, chatbotId);
        savedPreferences.push(savedPref);
      }
      
      return savedPreferences;
    } catch (error) {
      logger.error('Error inferring preferences:', error);
      throw error;
    }
  }

  /**
   * Save an inferred preference, updating if it already exists
   * @param {Object} preferenceData - Preference data
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Saved preference
   * @private
   */
  async _saveInferredPreference(preferenceData, userId, chatbotId) {
    try {
      // Check if preference already exists
      let preference = await Preference.findOne({
        category: preferenceData.category,
        key: preferenceData.key,
        userId,
        chatbotId
      });

      if (preference) {
        // Only update if the existing preference is also inferred
        // Don't override explicit preferences with inferred ones
        if (preference.source === 'inferred') {
          // For array values like interests, merge them
          if (Array.isArray(preference.value) && Array.isArray(preferenceData.value)) {
            preference.value = [...new Set([...preference.value, ...preferenceData.value])];
          } else {
            // For scalar values, update if confidence is higher
            if (preferenceData.confidence > preference.confidence) {
              preference.value = preferenceData.value;
              preference.confidence = preferenceData.confidence;
            }
          }
          
          preference.metadata = { ...preference.metadata, ...(preferenceData.metadata || {}) };
          preference.lastUpdated = new Date();
          
          await preference.save();
          logger.info(`Updated existing inferred preference: ${preference._id}`);
        } else {
          logger.info(`Skipped updating explicit preference with inferred data: ${preference._id}`);
        }
      } else {
        // Create new preference
        preference = new Preference({
          category: preferenceData.category,
          key: preferenceData.key,
          value: preferenceData.value,
          source: 'inferred',
          confidence: preferenceData.confidence || 0.5,
          metadata: preferenceData.metadata || {},
          userId,
          chatbotId,
          created: new Date(),
          lastUpdated: new Date()
        });
        
        await preference.save();
        logger.info(`Created new inferred preference: ${preference._id}`);
      }
      
      return preference;
    } catch (error) {
      logger.error('Error saving inferred preference:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - User preferences
   */
  async getUserPreferences(userId, chatbotId, filters = {}) {
    try {
      const query = {
        userId,
        chatbotId,
        ...filters
      };
      
      const preferences = await Preference.find(query).sort({ category: 1, key: 1 });
      return preferences;
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      throw error;
    }
  }

  /**
   * Apply user preferences to response options
   * @param {Array} responseOptions - Response options
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Selected response and all options
   */
  async applyPreferencesToResponses(responseOptions, userId, chatbotId) {
    try {
      if (!responseOptions || responseOptions.length === 0) {
        throw new Error('No response options provided');
      }
      
      // Get user preferences
      const preferences = await this.getUserPreferences(userId, chatbotId);
      
      // Score each response option based on preferences
      const scoredOptions = responseOptions.map(option => {
        let score = 0;
        const matchedPreferences = [];
        
        // Check each preference against the response option
        for (const pref of preferences) {
          // For communication style preference
          if (pref.category === 'communication' && pref.key === 'responseStyle') {
            if (option.metadata && option.metadata.style === pref.value) {
              score += 1 * pref.confidence;
              matchedPreferences.push(`${pref.category}.${pref.key}`);
            }
          }
          
          // For topic interests
          if (pref.category === 'topics' && pref.key === 'interests' && Array.isArray(pref.value)) {
            if (option.metadata && option.metadata.topics) {
              const matchedTopics = option.metadata.topics.filter(topic => 
                pref.value.includes(topic)
              );
              
              if (matchedTopics.length > 0) {
                score += (matchedTopics.length / option.metadata.topics.length) * pref.confidence;
                matchedPreferences.push(`${pref.category}.${pref.key}`);
              }
            }
          }
          
          // Add more preference matching logic as needed
        }
        
        return {
          ...option,
          preferenceScore: score,
          matchedPreferences
        };
      });
      
      // Sort by preference score
      scoredOptions.sort((a, b) => b.preferenceScore - a.preferenceScore);
      
      // Return the best option and all scored options
      return {
        selectedResponse: scoredOptions[0],
        allResponses: scoredOptions
      };
    } catch (error) {
      logger.error('Error applying preferences to responses:', error);
      throw error;
    }
  }

  /**
   * Delete a user preference
   * @param {String} preferenceId - Preference ID
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Boolean>} - Success status
   */
  async deletePreference(preferenceId, userId, chatbotId) {
    try {
      const result = await Preference.deleteOne({
        _id: preferenceId,
        userId,
        chatbotId
      });
      
      if (result.deletedCount === 0) {
        throw new Error('Preference not found or not authorized to delete');
      }
      
      logger.info(`Deleted preference: ${preferenceId}`);
      return true;
    } catch (error) {
      logger.error('Error deleting preference:', error);
      throw error;
    }
  }

  /**
   * Reset all preferences for a user
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {String} source - Optional source filter (e.g., 'inferred')
   * @returns {Promise<Number>} - Number of preferences deleted
   */
  async resetUserPreferences(userId, chatbotId, source = null) {
    try {
      const query = {
        userId,
        chatbotId
      };
      
      if (source) {
        query.source = source;
      }
      
      const result = await Preference.deleteMany(query);
      logger.info(`Reset ${result.deletedCount} preferences for user ${userId}`);
      
      return result.deletedCount;
    } catch (error) {
      logger.error('Error resetting user preferences:', error);
      throw error;
    }
  }
}

module.exports = new PreferenceLearningService();
