/**
 * User Preference Learning Service
 * 
 * Provides capabilities for learning and applying user preferences
 * across conversations to enhance personalization.
 */

const mongoose = require('mongoose');
require('@src/utils');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
require('@src/context\advanced-context.service');

// Define user preference schema if not already defined in advanced-context.service.js
let UserPreference;
try {
  UserPreference = mongoose.model('UserPreference');
} catch (error) {
  const UserPreferenceSchema = new mongoose.Schema({
    chatbotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chatbot',
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    key: {
      type: String,
      required: true
    },
    value: mongoose.Schema.Types.Mixed,
    confidence: {
      type: Number,
      default: 0.5
    },
    source: {
      type: String,
      enum: ['explicit', 'implicit', 'inferred'],
      default: 'inferred'
    },
    firstSeenAt: {
      type: Date,
      default: Date.now
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    },
    occurrenceCount: {
      type: Number,
      default: 1
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Create compound index for efficient lookups
  UserPreferenceSchema.index({ chatbotId: 1, userId: 1, category: 1, key: 1 }, { unique: true });
  
  UserPreference = mongoose.model('UserPreference', UserPreferenceSchema);
}

/**
 * User Preference Learning Service class
 */
class PreferenceLearningService {
  /**
   * Constructor
   */
  constructor() {
    this.proxyConfig = null;
    this.httpClient = axios.create({
      httpAgent: new HttpsProxyAgent(this.proxyConfig),
      httpsAgent: new HttpsProxyAgent(this.proxyConfig)
    });
    
    this.confidenceThreshold = 0.7; // Minimum confidence to store preferences
    this.confidenceIncrement = 0.1; // Increment for repeated preferences
    this.maxConfidence = 0.95; // Maximum confidence level
    
    // Define preference categories
    this.preferenceCategories = [
      'communication', // Communication style preferences
      'content',       // Content preferences
      'interface',     // Interface preferences
      'notifications', // Notification preferences
      'privacy',       // Privacy preferences
      'topic',         // Topic preferences
      'scheduling',    // Scheduling preferences
      'format',        // Format preferences
      'language',      // Language preferences
      'custom'         // Custom preferences
    ];
    
    logger.info('User Preference Learning Service initialized');
  }
  
  /**
   * Add or update user preference
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} category - Preference category
   * @param {string} key - Preference key
   * @param {*} value - Preference value
   * @param {string} source - Source of preference (explicit, implicit, inferred)
   * @param {number} confidence - Confidence level
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - Updated preference
   */
  async setPreference(chatbotId, userId, category, key, value, source = 'explicit', confidence = 0.8, metadata = {}) {
    try {
      if (!this.preferenceCategories.includes(category)) {
        throw new Error(`Invalid preference category: ${category}`);
      }
      
      // Find existing preference
      let preference = await UserPreference.findOne({
        chatbotId,
        userId,
        category,
        key
      });
      
      if (preference) {
        // Update existing preference
        preference.value = value;
        preference.lastSeenAt = new Date();
        preference.occurrenceCount += 1;
        
        // Update confidence based on source
        if (source === 'explicit') {
          // Explicit preferences have high confidence
          preference.confidence = Math.min(this.maxConfidence, 0.9);
        } else if (source === preference.source) {
          // Same source, increment confidence slightly
          preference.confidence = Math.min(
            this.maxConfidence,
            preference.confidence + this.confidenceIncrement
          );
        } else if (source === 'implicit' && preference.source === 'inferred') {
          // Implicit is stronger than inferred
          preference.confidence = Math.max(preference.confidence, confidence);
        }
        
        preference.source = source === 'explicit' ? 'explicit' : preference.source;
        
        // Update metadata
        for (const [key, value] of Object.entries(metadata)) {
          preference.metadata.set(key, value);
        }
        
        preference.updatedAt = new Date();
        await preference.save();
        
        logger.info(`Updated preference ${category}.${key} for user ${userId}`);
      } else {
        // Create new preference
        preference = new UserPreference({
          chatbotId,
          userId,
          category,
          key,
          value,
          confidence,
          source,
          metadata: new Map(Object.entries(metadata))
        });
        
        await preference.save();
        logger.info(`Created new preference ${category}.${key} for user ${userId}`);
      }
      
      return preference.toObject();
    } catch (error) {
      logger.error(`Error setting preference for user ${userId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get user preferences
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - User preferences grouped by category
   */
  async getPreferences(chatbotId, userId, filters = {}) {
    try {
      const { category, minConfidence = 0 } = filters;
      
      const query = {
        chatbotId,
        userId,
        confidence: { $gte: minConfidence }
      };
      
      if (category) {
        query.category = category;
      }
      
      const preferences = await UserPreference.find(query)
        .sort({ category: 1, key: 1 });
      
      // Group by category
      const groupedPreferences = {};
      
      for (const pref of preferences) {
        if (!groupedPreferences[pref.category]) {
          groupedPreferences[pref.category] = {};
        }
        
        groupedPreferences[pref.category][pref.key] = {
          value: pref.value,
          confidence: pref.confidence,
          source: pref.source,
          occurrenceCount: pref.occurrenceCount,
          lastSeenAt: pref.lastSeenAt
        };
      }
      
      return groupedPreferences;
    } catch (error) {
      logger.error(`Error getting preferences for user ${userId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Delete user preference
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} category - Preference category
   * @param {string} key - Preference key
   * @returns {Promise<boolean>} - Success status
   */
  async deletePreference(chatbotId, userId, category, key) {
    try {
      const result = await UserPreference.deleteOne({
        chatbotId,
        userId,
        category,
        key
      });
      
      if (result.deletedCount === 0) {
        throw new Error(`Preference ${category}.${key} not found for user ${userId}`);
      }
      
      logger.info(`Deleted preference ${category}.${key} for user ${userId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting preference for user ${userId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Infer preferences from conversation
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - Message data
   * @param {Object} nlpAnalysis - NLP analysis results
   * @returns {Promise<Array<Object>>} - Inferred preferences
   */
  async inferPreferencesFromMessage(chatbotId, userId, conversationId, message, nlpAnalysis) {
    try {
      const inferredPreferences = [];
      
      // Extract preferences from message content
      if (message.content && typeof message.content === 'string') {
        // Check for explicit preference statements
        const explicitPreferences = this._extractExplicitPreferences(message.content);
        
        for (const { category, key, value, confidence } of explicitPreferences) {
          const preference = await this.setPreference(
            chatbotId,
            userId,
            category,
            key,
            value,
            'implicit',
            confidence
          );
          
          inferredPreferences.push(preference);
        }
      }
      
      // Extract preferences from NLP analysis
      if (nlpAnalysis) {
        // Check for topic preferences
        if (nlpAnalysis.topics && nlpAnalysis.topics.length > 0) {
          for (const topic of nlpAnalysis.topics) {
            if (topic.confidence >= this.confidenceThreshold) {
              const preference = await this.setPreference(
                chatbotId,
                userId,
                'topic',
                topic.name,
                true,
                'inferred',
                topic.confidence
              );
              
              inferredPreferences.push(preference);
            }
          }
        }
        
        // Check for sentiment-based preferences
        if (nlpAnalysis.sentiment) {
          const { sentiment } = nlpAnalysis;
          
          if (sentiment.score > 0.7) {
            // Positive sentiment - user likes something
            if (nlpAnalysis.entities && nlpAnalysis.entities.length > 0) {
              for (const entity of nlpAnalysis.entities) {
                if (entity.type === 'PRODUCT' || entity.type === 'SERVICE' || entity.type === 'TOPIC') {
                  const preference = await this.setPreference(
                    chatbotId,
                    userId,
                    'content',
                    `likes_${entity.type.toLowerCase()}`,
                    entity.text,
                    'inferred',
                    0.6
                  );
                  
                  inferredPreferences.push(preference);
                }
              }
            }
          } else if (sentiment.score < -0.7) {
            // Negative sentiment - user dislikes something
            if (nlpAnalysis.entities && nlpAnalysis.entities.length > 0) {
              for (const entity of nlpAnalysis.entities) {
                if (entity.type === 'PRODUCT' || entity.type === 'SERVICE' || entity.type === 'TOPIC') {
                  const preference = await this.setPreference(
                    chatbotId,
                    userId,
                    'content',
                    `dislikes_${entity.type.toLowerCase()}`,
                    entity.text,
                    'inferred',
                    0.6
                  );
                  
                  inferredPreferences.push(preference);
                }
              }
            }
          }
        }
      }
      
      return inferredPreferences;
    } catch (error) {
      logger.error(`Error inferring preferences from message:`, error.message);
      throw error;
    }
  }
  
  /**
   * Extract explicit preferences from text
   * @param {string} text - Text to analyze
   * @returns {Array<Object>} - Extracted preferences
   * @private
   */
  _extractExplicitPreferences(text) {
    const preferences = [];
    
    // Define preference patterns
    const patterns = [
      // Communication style preferences
      {
        regex: /I (prefer|like|want) (formal|informal|casual|professional|detailed|concise|brief) (communication|responses|messages)/i,
        category: 'communication',
        key: 'style',
        confidence: 0.8
      },
      // Language preferences
      {
        regex: /I (prefer|like|want) (English|Spanish|French|German|Italian|Portuguese|Russian|Chinese|Japanese|Korean)/i,
        category: 'language',
        key: 'preferred_language',
        confidence: 0.85
      },
      // Format preferences
      {
        regex: /I (prefer|like|want) (text|images|audio|video|bullet points|numbered lists)/i,
        category: 'format',
        key: 'preferred_format',
        confidence: 0.75
      },
      // Notification preferences
      {
        regex: /(don't|do not) (send|notify|alert) me/i,
        category: 'notifications',
        key: 'enabled',
        value: false,
        confidence: 0.8
      },
      // Privacy preferences
      {
        regex: /(don't|do not) (store|save|remember|track) my (data|information|history|conversations)/i,
        category: 'privacy',
        key: 'data_retention',
        value: false,
        confidence: 0.85
      }
    ];
    
    // Check each pattern
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      
      if (match) {
        const preference = {
          category: pattern.category,
          key: pattern.key,
          confidence: pattern.confidence
        };
        
        // Set value based on pattern or match
        if ('value' in pattern) {
          preference.value = pattern.value;
        } else {
          // Extract value from match
          const value = match[2].toLowerCase();
          preference.value = value;
        }
        
        preferences.push(preference);
      }
    }
    
    return preferences;
  }
  
  /**
   * Apply user preferences to response generation
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {Object} responseOptions - Response generation options
   * @returns {Promise<Object>} - Updated response options
   */
  async applyPreferencesToResponse(chatbotId, userId, responseOptions = {}) {
    try {
      // Get user preferences with minimum confidence
      const preferences = await this.getPreferences(chatbotId, userId, {
        minConfidence: 0.6
      });
      
      const updatedOptions = { ...responseOptions };
      
      // Apply communication style preferences
      if (preferences.communication && preferences.communication.style) {
        const style = preferences.communication.style.value;
        
        if (style === 'formal' || style === 'professional') {
          updatedOptions.formality = 'high';
          updatedOptions.tone = 'professional';
        } else if (style === 'informal' || style === 'casual') {
          updatedOptions.formality = 'low';
          updatedOptions.tone = 'friendly';
        }
        
        if (style === 'detailed') {
          updatedOptions.verbosity = 'high';
        } else if (style === 'concise' || style === 'brief') {
          updatedOptions.verbosity = 'low';
        }
      }
      
      // Apply format preferences
      if (preferences.format && preferences.format.preferred_format) {
        const format = preferences.format.preferred_format.value;
        
        if (format === 'bullet points') {
          updatedOptions.format = 'bullet_points';
        } else if (format === 'numbered lists') {
          updatedOptions.format = 'numbered_list';
        } else {
          updatedOptions.format = format;
        }
      }
      
      // Apply language preferences
      if (preferences.language && preferences.language.preferred_language) {
        updatedOptions.language = preferences.language.preferred_language.value;
      }
      
      return updatedOptions;
    } catch (error) {
      logger.error(`Error applying preferences to response:`, error.message);
      // Return original options if error occurs
      return responseOptions;
    }
  }
}

// Create singleton instance
const preferenceLearningService = new PreferenceLearningService();

module.exports = preferenceLearningService;
