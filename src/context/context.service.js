/**
 * Context Service
 * 
 * Provides advanced context awareness capabilities for chatbots
 */

const mongoose = require('mongoose');
require('@src/utils');

// Define context schema
const ContextSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  conversationId: {
    type: String,
    required: true
  },
  activeContext: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  entities: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  topics: [
    {
      name: String,
      confidence: Number,
      firstMentionedAt: Date,
      lastMentionedAt: Date,
      mentionCount: Number
    }
  ],
  references: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  shortTermMemory: [
    {
      type: {
        type: String,
        enum: ['message', 'event', 'entity', 'topic', 'reference']
      },
      data: mongoose.Schema.Types.Mixed,
      timestamp: Date
    }
  ],
  longTermMemory: [
    {
      type: {
        type: String,
        enum: ['preference', 'fact', 'entity', 'topic', 'pattern']
      },
      data: mongoose.Schema.Types.Mixed,
      confidence: Number,
      firstSeenAt: Date,
      lastSeenAt: Date,
      occurrenceCount: Number
    }
  ],
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

// Create model
const Context = mongoose.model('Context', ContextSchema);

/**
 * Context Service class
 */
class ContextService {
  /**
   * Constructor
   */
  constructor() {
    this.shortTermMemoryLimit = 20; // Number of items to keep in short-term memory
    this.shortTermMemoryTTL = 30 * 60 * 1000; // 30 minutes in milliseconds
    this.confidenceThreshold = 0.6; // Minimum confidence to store in long-term memory
    
    logger.info('Context Service initialized');
  }
  
  /**
   * Get or create context for a conversation
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Context object
   */
  async getContext(chatbotId, userId, conversationId) {
    try {
      // Find existing context
      let context = await Context.findOne({
        chatbotId,
        userId,
        conversationId
      });
      
      // Create new context if not found
      if (!context) {
        context = new Context({
          chatbotId,
          userId,
          conversationId
        });
        
        await context.save();
        logger.info(`Created new context for chatbot ${chatbotId}, user ${userId}, conversation ${conversationId}`);
      }
      
      return context;
    } catch (error) {
      logger.error(`Error getting context for chatbot ${chatbotId}, user ${userId}, conversation ${conversationId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Update context with new information
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} contextData - Context data to update
   * @returns {Promise<Object>} - Updated context object
   */
  async updateContext(chatbotId, userId, conversationId, contextData) {
    try {
      // Get context
      const context = await this.getContext(chatbotId, userId, conversationId);
      
      // Update active context
      if (contextData.activeContext) {
        for (const [key, value] of Object.entries(contextData.activeContext)) {
          context.activeContext.set(key, value);
        }
      }
      
      // Update entities
      if (contextData.entities) {
        for (const [entityId, entityData] of Object.entries(contextData.entities)) {
          context.entities.set(entityId, entityData);
        }
      }
      
      // Update topics
      if (contextData.topics && Array.isArray(contextData.topics)) {
        for (const topic of contextData.topics) {
          const existingTopic = context.topics.find(t => t.name === topic.name);
          
          if (existingTopic) {
            // Update existing topic
            existingTopic.confidence = topic.confidence || existingTopic.confidence;
            existingTopic.lastMentionedAt = new Date();
            existingTopic.mentionCount += 1;
          } else {
            // Add new topic
            context.topics.push({
              name: topic.name,
              confidence: topic.confidence || 0.5,
              firstMentionedAt: new Date(),
              lastMentionedAt: new Date(),
              mentionCount: 1
            });
          }
        }
        
        // Sort topics by mention count and recency
        context.topics.sort((a, b) => {
          // First sort by mention count
          const countDiff = b.mentionCount - a.mentionCount;
          if (countDiff !== 0) return countDiff;
          
          // Then by recency
          return b.lastMentionedAt - a.lastMentionedAt;
        });
      }
      
      // Update references
      if (contextData.references) {
        for (const [referenceId, referenceData] of Object.entries(contextData.references)) {
          context.references.set(referenceId, referenceData);
        }
      }
      
      // Add to short-term memory
      if (contextData.shortTermMemory) {
        for (const memoryItem of contextData.shortTermMemory) {
          context.shortTermMemory.push({
            type: memoryItem.type,
            data: memoryItem.data,
            timestamp: new Date()
          });
        }
        
        // Trim short-term memory to limit
        if (context.shortTermMemory.length > this.shortTermMemoryLimit) {
          context.shortTermMemory = context.shortTermMemory.slice(-this.shortTermMemoryLimit);
        }
      }
      
      // Add to long-term memory
      if (contextData.longTermMemory) {
        for (const memoryItem of contextData.longTermMemory) {
          // Only add items with sufficient confidence
          if (memoryItem.confidence >= this.confidenceThreshold) {
            const existingItem = context.longTermMemory.find(item => 
              item.type === memoryItem.type && 
              JSON.stringify(item.data) === JSON.stringify(memoryItem.data)
            );
            
            if (existingItem) {
              // Update existing item
              existingItem.confidence = Math.max(existingItem.confidence, memoryItem.confidence);
              existingItem.lastSeenAt = new Date();
              existingItem.occurrenceCount += 1;
            } else {
              // Add new item
              context.longTermMemory.push({
                type: memoryItem.type,
                data: memoryItem.data,
                confidence: memoryItem.confidence,
                firstSeenAt: new Date(),
                lastSeenAt: new Date(),
                occurrenceCount: 1
              });
            }
          }
        }
      }
      
      // Update metadata
      if (contextData.metadata) {
        for (const [key, value] of Object.entries(contextData.metadata)) {
          context.metadata.set(key, value);
        }
      }
      
      // Update timestamp
      context.updatedAt = new Date();
      
      // Save context
      await context.save();
      
      return context;
    } catch (error) {
      logger.error(`Error updating context for chatbot ${chatbotId}, user ${userId}, conversation ${conversationId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Process message for context extraction
   * @param {Object} message - Message data
   * @param {Object} nlpAnalysis - NLP analysis results
   * @returns {Promise<Object>} - Extracted context data
   */
  async processMessageForContext(message, nlpAnalysis) {
    try {
      const contextData = {
        activeContext: {},
        entities: {},
        topics: [],
        references: {},
        shortTermMemory: [],
        longTermMemory: []
      };
      
      // Add message to short-term memory
      contextData.shortTermMemory.push({
        type: 'message',
        data: {
          role: message.role,
          content: message.content,
          timestamp: message.timestamp || new Date()
        }
      });
      
      // Process entities
      if (nlpAnalysis && nlpAnalysis.entities && nlpAnalysis.entities.length > 0) {
        for (const entity of nlpAnalysis.entities) {
          const entityId = `${entity.type}:${entity.value}`;
          
          // Add to entities
          contextData.entities[entityId] = {
            type: entity.type,
            value: entity.value,
            metadata: entity.metadata || {},
            lastMentioned: new Date()
          };
          
          // Add to short-term memory
          contextData.shortTermMemory.push({
            type: 'entity',
            data: entity
          });
          
          // Add to long-term memory if confidence is high enough
          if (entity.confidence >= this.confidenceThreshold) {
            contextData.longTermMemory.push({
              type: 'entity',
              data: entity,
              confidence: entity.confidence
            });
          }
        }
      }
      
      // Process intent for topic
      if (nlpAnalysis && nlpAnalysis.intent) {
        const topic = {
          name: nlpAnalysis.intent,
          confidence: nlpAnalysis.intentConfidence || 0.5
        };
        
        contextData.topics.push(topic);
        
        // Add to short-term memory
        contextData.shortTermMemory.push({
          type: 'topic',
          data: topic
        });
        
        // Add to long-term memory if confidence is high enough
        if (topic.confidence >= this.confidenceThreshold) {
          contextData.longTermMemory.push({
            type: 'topic',
            data: topic,
            confidence: topic.confidence
          });
        }
      }
      
      // Extract references (pronouns, etc.)
      if (message.content) {
        const references = this.extractReferences(message.content);
        
        for (const [referenceId, referenceData] of Object.entries(references)) {
          contextData.references[referenceId] = referenceData;
          
          // Add to short-term memory
          contextData.shortTermMemory.push({
            type: 'reference',
            data: referenceData
          });
        }
      }
      
      return contextData;
    } catch (error) {
      logger.error('Error processing message for context:', error.message);
      return {};
    }
  }
  
  /**
   * Extract references from text (pronouns, etc.)
   * @param {string} text - Text to extract references from
   * @returns {Object} - Extracted references
   * @private
   */
  extractReferences(text) {
    const references = {};
    
    // Simple pronoun detection
    const pronounRegex = /\b(he|she|it|they|this|that|these|those|him|her|them)\b/gi;
    const pronounMatches = text.match(pronounRegex) || [];
    
    for (const pronoun of pronounMatches) {
      const lowerPronoun = pronoun.toLowerCase();
      
      references[`pronoun:${lowerPronoun}`] = {
        type: 'pronoun',
        value: lowerPronoun,
        position: text.toLowerCase().indexOf(lowerPronoun)
      };
    }
    
    return references;
  }
  
  /**
   * Resolve references in text using context
   * @param {string} text - Text with references to resolve
   * @param {Object} context - Context object
   * @returns {Promise<Object>} - Resolved references and updated text
   */
  async resolveReferences(text, context) {
    try {
      let resolvedText = text;
      const resolvedReferences = {};
      
      // Get pronouns from text
      const pronounRegex = /\b(he|she|it|they|this|that|these|those|him|her|them)\b/gi;
      const pronounMatches = [...text.matchAll(pronounRegex)];
      
      for (const match of pronounMatches) {
        const pronoun = match[0].toLowerCase();
        const position = match.index;
        
        // Find most recent entity that could match this pronoun
        const entity = this.findEntityForPronoun(pronoun, context);
        
        if (entity) {
          // Store resolved reference
          resolvedReferences[`${pronoun}@${position}`] = {
            original: pronoun,
            resolved: entity.value,
            entityType: entity.type,
            confidence: 0.8 // Arbitrary confidence for now
          };
        }
      }
      
      return {
        originalText: text,
        resolvedText,
        references: resolvedReferences
      };
    } catch (error) {
      logger.error('Error resolving references:', error.message);
      return {
        originalText: text,
        resolvedText: text,
        references: {}
      };
    }
  }
  
  /**
   * Find entity that could match a pronoun
   * @param {string} pronoun - Pronoun to match
   * @param {Object} context - Context object
   * @returns {Object|null} - Matching entity or null
   * @private
   */
  findEntityForPronoun(pronoun, context) {
    // Get recent entities from short-term memory
    const recentEntities = context.shortTermMemory
      .filter(item => item.type === 'entity')
      .map(item => item.data)
      .reverse(); // Most recent first
    
    // Match pronoun to entity type
    const personPronouns = ['he', 'she', 'him', 'her'];
    const thingPronouns = ['it', 'this', 'that'];
    const pluralPronouns = ['they', 'them', 'these', 'those'];
    
    let matchingEntityTypes = [];
    
    if (personPronouns.includes(pronoun)) {
      matchingEntityTypes = ['person', 'contact', 'user'];
    } else if (thingPronouns.includes(pronoun)) {
      matchingEntityTypes = ['product', 'item', 'location', 'organization', 'event'];
    } else if (pluralPronouns.includes(pronoun)) {
      // Any entity type could match plural pronouns
      return null;
    }
    
    // Find first matching entity
    for (const entity of recentEntities) {
      if (matchingEntityTypes.includes(entity.type)) {
        return entity;
      }
    }
    
    return null;
  }
  
  /**
   * Get active topics for a conversation
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Array>} - Active topics
   */
  async getActiveTopics(chatbotId, userId, conversationId) {
    try {
      const context = await this.getContext(chatbotId, userId, conversationId);
      
      // Return topics sorted by relevance (mention count and recency)
      return context.topics.sort((a, b) => {
        // First sort by mention count
        const countDiff = b.mentionCount - a.mentionCount;
        if (countDiff !== 0) return countDiff;
        
        // Then by recency
        return b.lastMentionedAt - a.lastMentionedAt;
      });
    } catch (error) {
      logger.error(`Error getting active topics for chatbot ${chatbotId}, user ${userId}, conversation ${conversationId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Get entities from context
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} options - Options for filtering entities
   * @returns {Promise<Array>} - Entities
   */
  async getEntities(chatbotId, userId, conversationId, options = {}) {
    try {
      const context = await this.getContext(chatbotId, userId, conversationId);
      
      // Convert entities map to array
      let entities = Array.from(context.entities.entries()).map(([id, data]) => ({
        id,
        ...data
      }));
      
      // Apply filters
      if (options.types && Array.isArray(options.types)) {
        entities = entities.filter(entity => options.types.includes(entity.type));
      }
      
      // Sort by recency
      entities.sort((a, b) => new Date(b.lastMentioned) - new Date(a.lastMentioned));
      
      return entities;
    } catch (error) {
      logger.error(`Error getting entities for chatbot ${chatbotId}, user ${userId}, conversation ${conversationId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Get user preferences from long-term memory
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User preferences
   */
  async getUserPreferences(chatbotId, userId) {
    try {
      // Find all contexts for this user
      const contexts = await Context.find({
        chatbotId,
        userId
      });
      
      const preferences = {};
      
      // Extract preferences from long-term memory
      for (const context of contexts) {
        const preferenceItems = context.longTermMemory.filter(item => item.type === 'preference');
        
        for (const item of preferenceItems) {
          const { key, value } = item.data;
          
          // Only keep preferences with high confidence or multiple occurrences
          if (item.confidence >= 0.8 || item.occurrenceCount >= 3) {
            preferences[key] = {
              value,
              confidence: item.confidence,
              occurrenceCount: item.occurrenceCount,
              lastSeenAt: item.lastSeenAt
            };
          }
        }
      }
      
      return preferences;
    } catch (error) {
      logger.error(`Error getting user preferences for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return {};
    }
  }
  
  /**
   * Add user preference to long-term memory
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {string} key - Preference key
   * @param {*} value - Preference value
   * @param {number} confidence - Confidence level (0-1)
   * @returns {Promise<Object>} - Updated context
   */
  async addUserPreference(chatbotId, userId, conversationId, key, value, confidence = 0.7) {
    try {
      // Update context with preference
      return await this.updateContext(chatbotId, userId, conversationId, {
        longTermMemory: [
          {
            type: 'preference',
            data: { key, value },
            confidence
          }
        ]
      });
    } catch (error) {
      logger.error(`Error adding user preference for chatbot ${chatbotId}, user ${userId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get conversation summary
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} - Conversation summary
   */
  async getConversationSummary(chatbotId, userId, conversationId) {
    try {
      const context = await this.getContext(chatbotId, userId, conversationId);
      
      // Get messages from short-term memory
      const messages = context.shortTermMemory
        .filter(item => item.type === 'message')
        .map(item => item.data)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      // Get active topics
      const topics = context.topics.slice(0, 3).map(topic => topic.name);
      
      // Get key entities
      const entities = Array.from(context.entities.values())
        .sort((a, b) => new Date(b.lastMentioned) - new Date(a.lastMentioned))
        .slice(0, 5);
      
      return {
        conversationId,
        messageCount: messages.length,
        topics,
        entities,
        startedAt: context.createdAt,
        lastUpdatedAt: context.updatedAt
      };
    } catch (error) {
      logger.error(`Error getting conversation summary for chatbot ${chatbotId}, user ${userId}, conversation ${conversationId}:`, error.message);
      return {
        conversationId,
        messageCount: 0,
        topics: [],
        entities: [],
        startedAt: null,
        lastUpdatedAt: null
      };
    }
  }
  
  /**
   * Clean up old contexts
   * @param {number} maxAgeDays - Maximum age in days
   * @returns {Promise<number>} - Number of contexts removed
   */
  async cleanupOldContexts(maxAgeDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
      
      const result = await Context.deleteMany({
        updatedAt: { $lt: cutoffDate }
      });
      
      logger.info(`Cleaned up ${result.deletedCount} old contexts`);
      
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old contexts:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const contextService = new ContextService();

module.exports = contextService;
