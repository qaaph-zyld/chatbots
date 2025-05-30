/**
 * Context Management Service
 * 
 * Provides contextual understanding capabilities for chatbots
 * Maintains conversation state and resolves references across messages
 */

const { v4: uuidv4 } = require('uuid');
const { logger } = require('../../utils');
const { localStorageService } = require('../../storage');

class ContextManagementService {
  constructor() {
    this.activeContexts = new Map();
    this.contextTTL = process.env.CONTEXT_TTL_MINUTES 
      ? parseInt(process.env.CONTEXT_TTL_MINUTES) * 60 * 1000 
      : 30 * 60 * 1000; // Default 30 minutes
    this.maxContextsPerUser = process.env.MAX_CONTEXTS_PER_USER 
      ? parseInt(process.env.MAX_CONTEXTS_PER_USER) 
      : 5;
    this.initialized = false;
  }
  
  /**
   * Initialize the context management service
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize(options = {}) {
    try {
      // Apply configuration options
      if (options.contextTTL) {
        this.contextTTL = options.contextTTL;
      }
      
      if (options.maxContextsPerUser) {
        this.maxContextsPerUser = options.maxContextsPerUser;
      }
      
      // Initialize storage
      this.storage = localStorageService.getCollection('conversation_contexts');
      
      // Start cleanup interval for expired contexts
      this._startCleanupInterval();
      
      this.initialized = true;
      logger.info('Context Management Service initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Context Management Service:', error.message);
      return false;
    }
  }
  
  /**
   * Create a new conversation context
   * @param {string} userId - User ID
   * @param {Object} metadata - Additional metadata for the context
   * @returns {Promise<Object>} - Created context
   */
  async createContext(userId, metadata = {}) {
    if (!this.initialized) {
      throw new Error('Context Management Service not initialized');
    }
    
    try {
      // Generate a unique context ID
      const contextId = uuidv4();
      
      // Create new context
      const context = {
        id: contextId,
        userId,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString()
        },
        entities: {},
        intents: [],
        references: {},
        lastActivity: Date.now(),
        messages: []
      };
      
      // Store in memory
      this.activeContexts.set(contextId, context);
      
      // Store in persistent storage
      await this.storage.insertOne({
        _id: contextId,
        userId,
        metadata: context.metadata,
        entities: context.entities,
        intents: context.intents,
        references: context.references,
        lastActivity: context.lastActivity,
        messages: context.messages
      });
      
      // Clean up old contexts if needed
      await this._cleanupUserContexts(userId);
      
      logger.info(`Created new context ${contextId} for user ${userId}`);
      return context;
    } catch (error) {
      logger.error('Failed to create context:', error.message);
      throw error;
    }
  }
  
  /**
   * Get an existing context
   * @param {string} contextId - Context ID
   * @returns {Promise<Object>} - Context object or null if not found
   */
  async getContext(contextId) {
    if (!this.initialized) {
      throw new Error('Context Management Service not initialized');
    }
    
    try {
      // Check memory cache first
      if (this.activeContexts.has(contextId)) {
        const context = this.activeContexts.get(contextId);
        
        // Update last activity
        context.lastActivity = Date.now();
        this.activeContexts.set(contextId, context);
        
        // Update in storage
        await this.storage.updateOne(
          { _id: contextId },
          { $set: { lastActivity: context.lastActivity } }
        );
        
        return context;
      }
      
      // Not in memory, try to load from storage
      const storedContext = await this.storage.findOne({ _id: contextId });
      
      if (storedContext) {
        // Convert to internal format
        const context = {
          id: storedContext._id,
          userId: storedContext.userId,
          metadata: storedContext.metadata || {},
          entities: storedContext.entities || {},
          intents: storedContext.intents || [],
          references: storedContext.references || {},
          lastActivity: Date.now(),
          messages: storedContext.messages || []
        };
        
        // Update last activity
        await this.storage.updateOne(
          { _id: contextId },
          { $set: { lastActivity: context.lastActivity } }
        );
        
        // Add to memory cache
        this.activeContexts.set(contextId, context);
        
        return context;
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to get context ${contextId}:`, error.message);
      return null;
    }
  }
  
  /**
   * Add a message to the context
   * @param {string} contextId - Context ID
   * @param {string} message - Message text
   * @param {string} role - Message role (user, bot)
   * @param {Object} nlpData - NLP data for the message
   * @returns {Promise<Object>} - Updated context
   */
  async addMessage(contextId, message, role, nlpData = {}) {
    if (!this.initialized) {
      throw new Error('Context Management Service not initialized');
    }
    
    try {
      // Get context
      const context = await this.getContext(contextId);
      
      if (!context) {
        throw new Error(`Context ${contextId} not found`);
      }
      
      // Create message object
      const messageObj = {
        id: uuidv4(),
        text: message,
        role,
        timestamp: Date.now(),
        nlpData
      };
      
      // Add message to context
      context.messages.push(messageObj);
      
      // Update entities and intents if NLP data is provided
      if (nlpData) {
        this._updateContextWithNLPData(context, nlpData);
      }
      
      // Update last activity
      context.lastActivity = Date.now();
      
      // Update in memory
      this.activeContexts.set(contextId, context);
      
      // Update in storage
      await this.storage.updateOne(
        { _id: contextId },
        { 
          $set: { 
            lastActivity: context.lastActivity,
            entities: context.entities,
            intents: context.intents,
            references: context.references
          },
          $push: { messages: messageObj }
        }
      );
      
      return context;
    } catch (error) {
      logger.error(`Failed to add message to context ${contextId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Update context with NLP data
   * @param {Object} context - Context object
   * @param {Object} nlpData - NLP data
   * @private
   */
  _updateContextWithNLPData(context, nlpData) {
    // Update entities
    if (nlpData.entities && Array.isArray(nlpData.entities)) {
      for (const entity of nlpData.entities) {
        const entityType = entity.type;
        const entityValue = entity.text;
        const entityId = entity.id || entityValue.toLowerCase().replace(/\s+/g, '_');
        
        if (!context.entities[entityType]) {
          context.entities[entityType] = {};
        }
        
        // Store or update entity
        context.entities[entityType][entityId] = {
          value: entityValue,
          mentions: (context.entities[entityType][entityId]?.mentions || 0) + 1,
          lastMentioned: Date.now(),
          metadata: entity.metadata || {}
        };
        
        // Add to references for pronoun resolution
        if (['PERSON', 'ORG', 'GPE', 'LOC', 'PRODUCT'].includes(entityType)) {
          context.references.lastMentioned = context.references.lastMentioned || {};
          context.references.lastMentioned[entityType] = {
            id: entityId,
            type: entityType,
            value: entityValue
          };
        }
      }
    }
    
    // Update intents
    if (nlpData.intent && nlpData.intent.intent) {
      context.intents.push({
        intent: nlpData.intent.intent,
        confidence: nlpData.intent.confidence,
        timestamp: Date.now()
      });
      
      // Keep only the last 10 intents
      if (context.intents.length > 10) {
        context.intents = context.intents.slice(-10);
      }
    }
  }
  
  /**
   * Resolve references in a message
   * @param {string} contextId - Context ID
   * @param {string} message - Message text
   * @returns {Promise<Object>} - Resolved references
   */
  async resolveReferences(contextId, message) {
    if (!this.initialized) {
      throw new Error('Context Management Service not initialized');
    }
    
    try {
      // Get context
      const context = await this.getContext(contextId);
      
      if (!context) {
        throw new Error(`Context ${contextId} not found`);
      }
      
      // Simple pronoun resolution
      const pronouns = {
        // Personal pronouns
        'he': { gender: 'male', type: 'PERSON' },
        'him': { gender: 'male', type: 'PERSON' },
        'his': { gender: 'male', type: 'PERSON' },
        'she': { gender: 'female', type: 'PERSON' },
        'her': { gender: 'female', type: 'PERSON' },
        'hers': { gender: 'female', type: 'PERSON' },
        'they': { number: 'plural', type: 'PERSON' },
        'them': { number: 'plural', type: 'PERSON' },
        'their': { number: 'plural', type: 'PERSON' },
        'theirs': { number: 'plural', type: 'PERSON' },
        
        // Demonstrative pronouns
        'this': { distance: 'near' },
        'that': { distance: 'far' },
        'these': { distance: 'near', number: 'plural' },
        'those': { distance: 'far', number: 'plural' },
        
        // Object pronouns
        'it': { type: ['PRODUCT', 'ORG', 'LOC', 'GPE'] }
      };
      
      const resolvedReferences = {
        pronouns: {},
        entities: {}
      };
      
      // Check for pronouns
      const words = message.toLowerCase().split(/\s+/);
      
      for (const word of words) {
        const cleanWord = word.replace(/[^\w]/g, '');
        
        if (pronouns[cleanWord]) {
          const pronoun = pronouns[cleanWord];
          
          // Try to resolve the pronoun
          if (pronoun.type) {
            const types = Array.isArray(pronoun.type) ? pronoun.type : [pronoun.type];
            
            for (const type of types) {
              if (context.references.lastMentioned && context.references.lastMentioned[type]) {
                const reference = context.references.lastMentioned[type];
                
                resolvedReferences.pronouns[cleanWord] = {
                  entity: reference.value,
                  entityId: reference.id,
                  entityType: reference.type
                };
                
                break;
              }
            }
          }
        }
      }
      
      return resolvedReferences;
    } catch (error) {
      logger.error(`Failed to resolve references for context ${contextId}:`, error.message);
      return { pronouns: {}, entities: {} };
    }
  }
  
  /**
   * Get active entities from context
   * @param {string} contextId - Context ID
   * @param {Array<string>} entityTypes - Entity types to filter by
   * @returns {Promise<Object>} - Active entities
   */
  async getActiveEntities(contextId, entityTypes = null) {
    if (!this.initialized) {
      throw new Error('Context Management Service not initialized');
    }
    
    try {
      // Get context
      const context = await this.getContext(contextId);
      
      if (!context) {
        throw new Error(`Context ${contextId} not found`);
      }
      
      const result = {};
      
      // Filter by entity types if provided
      if (entityTypes && Array.isArray(entityTypes)) {
        for (const type of entityTypes) {
          if (context.entities[type]) {
            result[type] = context.entities[type];
          }
        }
      } else {
        // Return all entities
        Object.assign(result, context.entities);
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to get active entities for context ${contextId}:`, error.message);
      return {};
    }
  }
  
  /**
   * Get recent intents from context
   * @param {string} contextId - Context ID
   * @param {number} limit - Maximum number of intents to return
   * @returns {Promise<Array>} - Recent intents
   */
  async getRecentIntents(contextId, limit = 5) {
    if (!this.initialized) {
      throw new Error('Context Management Service not initialized');
    }
    
    try {
      // Get context
      const context = await this.getContext(contextId);
      
      if (!context) {
        throw new Error(`Context ${contextId} not found`);
      }
      
      // Return the most recent intents
      return context.intents.slice(-limit);
    } catch (error) {
      logger.error(`Failed to get recent intents for context ${contextId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Get conversation history
   * @param {string} contextId - Context ID
   * @param {number} limit - Maximum number of messages to return
   * @returns {Promise<Array>} - Conversation history
   */
  async getConversationHistory(contextId, limit = 10) {
    if (!this.initialized) {
      throw new Error('Context Management Service not initialized');
    }
    
    try {
      // Get context
      const context = await this.getContext(contextId);
      
      if (!context) {
        throw new Error(`Context ${contextId} not found`);
      }
      
      // Return the most recent messages
      return context.messages.slice(-limit);
    } catch (error) {
      logger.error(`Failed to get conversation history for context ${contextId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Close a context
   * @param {string} contextId - Context ID
   * @returns {Promise<boolean>} - True if context was closed successfully
   */
  async closeContext(contextId) {
    if (!this.initialized) {
      throw new Error('Context Management Service not initialized');
    }
    
    try {
      // Remove from memory
      this.activeContexts.delete(contextId);
      
      // Update in storage (mark as closed)
      await this.storage.updateOne(
        { _id: contextId },
        { $set: { closed: true, closedAt: Date.now() } }
      );
      
      logger.info(`Closed context ${contextId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to close context ${contextId}:`, error.message);
      return false;
    }
  }
  
  /**
   * Start cleanup interval for expired contexts
   * @private
   */
  _startCleanupInterval() {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this._cleanupExpiredContexts();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Clean up expired contexts
   * @private
   */
  async _cleanupExpiredContexts() {
    try {
      const now = Date.now();
      const expiredContextIds = [];
      
      // Find expired contexts in memory
      for (const [contextId, context] of this.activeContexts.entries()) {
        if (now - context.lastActivity > this.contextTTL) {
          expiredContextIds.push(contextId);
        }
      }
      
      // Remove expired contexts from memory
      for (const contextId of expiredContextIds) {
        this.activeContexts.delete(contextId);
      }
      
      // Update in storage
      if (expiredContextIds.length > 0) {
        await this.storage.updateMany(
          { _id: { $in: expiredContextIds } },
          { $set: { expired: true, expiredAt: now } }
        );
        
        logger.info(`Cleaned up ${expiredContextIds.length} expired contexts`);
      }
    } catch (error) {
      logger.error('Failed to clean up expired contexts:', error.message);
    }
  }
  
  /**
   * Clean up old contexts for a user
   * @param {string} userId - User ID
   * @private
   */
  async _cleanupUserContexts(userId) {
    try {
      // Count active contexts for the user
      const count = await this.storage.count({
        userId,
        closed: { $ne: true },
        expired: { $ne: true }
      });
      
      // If the user has too many active contexts, close the oldest ones
      if (count > this.maxContextsPerUser) {
        const excessCount = count - this.maxContextsPerUser;
        
        // Find the oldest contexts
        const oldestContexts = await this.storage.find(
          {
            userId,
            closed: { $ne: true },
            expired: { $ne: true }
          },
          {
            sort: { lastActivity: 1 },
            limit: excessCount
          }
        );
        
        // Close them
        for (const context of oldestContexts) {
          await this.closeContext(context._id);
        }
        
        logger.info(`Closed ${oldestContexts.length} old contexts for user ${userId}`);
      }
    } catch (error) {
      logger.error(`Failed to clean up old contexts for user ${userId}:`, error.message);
    }
  }
}

// Create singleton instance
const contextManagementService = new ContextManagementService();

module.exports = contextManagementService;
