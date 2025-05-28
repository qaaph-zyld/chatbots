/**
 * Reference Service
 * 
 * Provides reference resolution capabilities for chatbots
 */

const { logger } = require('../utils');
const contextService = require('./context.service');
const entityService = require('./entity.service');

/**
 * Reference Service class
 */
class ReferenceService {
  /**
   * Constructor
   */
  constructor() {
    this.confidenceThreshold = 0.6; // Minimum confidence for reference resolution
    
    logger.info('Reference Service initialized');
  }
  
  /**
   * Resolve references in text
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {string} text - Text to resolve references in
   * @returns {Promise<Object>} - Resolved references and text
   */
  async resolveReferences(chatbotId, userId, conversationId, text) {
    try {
      // Get context
      const context = await contextService.getContext(chatbotId, userId, conversationId);
      
      // Extract pronouns and other references
      const references = this.extractReferences(text);
      const resolvedReferences = {};
      let resolvedText = text;
      
      // Resolve each reference
      for (const [referenceId, reference] of Object.entries(references)) {
        const resolved = await this.resolveReference(chatbotId, userId, conversationId, reference, context);
        
        if (resolved) {
          resolvedReferences[referenceId] = {
            original: reference.value,
            resolved: resolved.value,
            type: resolved.type,
            confidence: resolved.confidence
          };
          
          // Optionally replace in text if confidence is high enough
          if (resolved.confidence >= 0.8) {
            // Only replace standalone pronouns, not part of larger words
            const regex = new RegExp(`\\b${reference.value}\\b`, 'gi');
            resolvedText = resolvedText.replace(regex, `${reference.value} (${resolved.value})`);
          }
        }
      }
      
      // Store resolved references in context
      await contextService.updateContext(chatbotId, userId, conversationId, {
        references: resolvedReferences
      });
      
      return {
        originalText: text,
        resolvedText,
        references: resolvedReferences
      };
    } catch (error) {
      logger.error(`Error resolving references for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return {
        originalText: text,
        resolvedText: text,
        references: {}
      };
    }
  }
  
  /**
   * Extract references from text
   * @param {string} text - Text to extract references from
   * @returns {Object} - Extracted references
   */
  extractReferences(text) {
    const references = {};
    
    // Extract pronouns
    this.extractPronouns(text, references);
    
    // Extract demonstratives
    this.extractDemonstratives(text, references);
    
    // Extract time references
    this.extractTimeReferences(text, references);
    
    return references;
  }
  
  /**
   * Extract pronouns from text
   * @param {string} text - Text to extract pronouns from
   * @param {Object} references - References object to add to
   * @private
   */
  extractPronouns(text, references) {
    // Personal pronouns
    const personalPronounRegex = /\b(he|she|it|they|him|her|them|his|hers|its|their|theirs)\b/gi;
    const personalPronounMatches = [...text.matchAll(personalPronounRegex)];
    
    for (const match of personalPronounMatches) {
      const pronoun = match[0].toLowerCase();
      const position = match.index;
      const id = `pronoun:${pronoun}@${position}`;
      
      references[id] = {
        type: 'pronoun',
        subtype: 'personal',
        value: pronoun,
        position,
        context: this.getWordContext(text, position, pronoun.length)
      };
    }
    
    // Possessive pronouns
    const possessivePronounRegex = /\b(my|your|his|her|its|our|their)\b/gi;
    const possessivePronounMatches = [...text.matchAll(possessivePronounRegex)];
    
    for (const match of possessivePronounMatches) {
      const pronoun = match[0].toLowerCase();
      const position = match.index;
      const id = `pronoun:${pronoun}@${position}`;
      
      references[id] = {
        type: 'pronoun',
        subtype: 'possessive',
        value: pronoun,
        position,
        context: this.getWordContext(text, position, pronoun.length)
      };
    }
  }
  
  /**
   * Extract demonstratives from text
   * @param {string} text - Text to extract demonstratives from
   * @param {Object} references - References object to add to
   * @private
   */
  extractDemonstratives(text, references) {
    const demonstrativeRegex = /\b(this|that|these|those)\b/gi;
    const demonstrativeMatches = [...text.matchAll(demonstrativeRegex)];
    
    for (const match of demonstrativeMatches) {
      const demonstrative = match[0].toLowerCase();
      const position = match.index;
      const id = `demonstrative:${demonstrative}@${position}`;
      
      references[id] = {
        type: 'demonstrative',
        value: demonstrative,
        position,
        context: this.getWordContext(text, position, demonstrative.length)
      };
    }
  }
  
  /**
   * Extract time references from text
   * @param {string} text - Text to extract time references from
   * @param {Object} references - References object to add to
   * @private
   */
  extractTimeReferences(text, references) {
    const timeRegex = /\b(now|today|yesterday|tomorrow|last|next|previous|earlier|later)\b/gi;
    const timeMatches = [...text.matchAll(timeRegex)];
    
    for (const match of timeMatches) {
      const timeRef = match[0].toLowerCase();
      const position = match.index;
      const id = `time:${timeRef}@${position}`;
      
      references[id] = {
        type: 'time',
        value: timeRef,
        position,
        context: this.getWordContext(text, position, timeRef.length)
      };
    }
  }
  
  /**
   * Get word context (surrounding words)
   * @param {string} text - Full text
   * @param {number} position - Position of word
   * @param {number} length - Length of word
   * @param {number} contextSize - Number of characters of context to include
   * @returns {string} - Context string
   * @private
   */
  getWordContext(text, position, length, contextSize = 20) {
    const start = Math.max(0, position - contextSize);
    const end = Math.min(text.length, position + length + contextSize);
    
    return text.substring(start, end);
  }
  
  /**
   * Resolve a single reference
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} reference - Reference to resolve
   * @param {Object} context - Conversation context
   * @returns {Promise<Object|null>} - Resolved reference or null
   * @private
   */
  async resolveReference(chatbotId, userId, conversationId, reference, context) {
    try {
      switch (reference.type) {
        case 'pronoun':
          return await this.resolvePronouns(chatbotId, userId, conversationId, reference, context);
        case 'demonstrative':
          return await this.resolveDemonstratives(chatbotId, userId, conversationId, reference, context);
        case 'time':
          return this.resolveTimeReference(reference);
        default:
          return null;
      }
    } catch (error) {
      logger.error(`Error resolving reference ${reference.type}:${reference.value}:`, error.message);
      return null;
    }
  }
  
  /**
   * Resolve pronouns
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} reference - Pronoun reference
   * @param {Object} context - Conversation context
   * @returns {Promise<Object|null>} - Resolved reference or null
   * @private
   */
  async resolvePronouns(chatbotId, userId, conversationId, reference, context) {
    const pronoun = reference.value.toLowerCase();
    
    // Get recent entities from context
    const recentEntities = Array.from(context.entities.values())
      .sort((a, b) => new Date(b.lastMentioned) - new Date(a.lastMentioned));
    
    // Define pronoun categories
    const personPronouns = ['he', 'she', 'him', 'her', 'his', 'hers'];
    const thingPronouns = ['it', 'its'];
    const pluralPronouns = ['they', 'them', 'their', 'theirs'];
    const firstPersonPronouns = ['i', 'me', 'my', 'mine'];
    const secondPersonPronouns = ['you', 'your', 'yours'];
    
    // Match pronoun to entity type
    let matchingEntityTypes = [];
    let confidence = 0.7; // Default confidence
    
    if (personPronouns.includes(pronoun)) {
      matchingEntityTypes = ['person', 'contact', 'user'];
    } else if (thingPronouns.includes(pronoun)) {
      matchingEntityTypes = ['product', 'item', 'location', 'organization', 'event'];
    } else if (pluralPronouns.includes(pronoun)) {
      // Any entity type could match plural pronouns, but prefer groups
      matchingEntityTypes = ['group', 'organization', 'location', 'product'];
      confidence = 0.6; // Lower confidence for plural
    } else if (firstPersonPronouns.includes(pronoun)) {
      // First person pronouns refer to the user
      return {
        type: 'user',
        value: userId,
        confidence: 0.9
      };
    } else if (secondPersonPronouns.includes(pronoun)) {
      // Second person pronouns refer to the chatbot
      return {
        type: 'chatbot',
        value: chatbotId,
        confidence: 0.9
      };
    }
    
    // Find matching entity
    for (const entity of recentEntities) {
      if (matchingEntityTypes.includes(entity.type)) {
        return {
          type: entity.type,
          value: entity.value,
          confidence
        };
      }
    }
    
    // No matching entity found
    return null;
  }
  
  /**
   * Resolve demonstratives
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} reference - Demonstrative reference
   * @param {Object} context - Conversation context
   * @returns {Promise<Object|null>} - Resolved reference or null
   * @private
   */
  async resolveDemonstratives(chatbotId, userId, conversationId, reference, context) {
    const demonstrative = reference.value.toLowerCase();
    
    // Get recent entities from context
    const recentEntities = Array.from(context.entities.values())
      .sort((a, b) => new Date(b.lastMentioned) - new Date(a.lastMentioned));
    
    // Get most recent messages from context
    const recentMessages = context.shortTermMemory
      .filter(item => item.type === 'message')
      .map(item => item.data)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Define demonstrative categories
    const singularProximal = ['this']; // Near and singular
    const singularDistal = ['that']; // Far and singular
    const pluralProximal = ['these']; // Near and plural
    const pluralDistal = ['those']; // Far and plural
    
    let matchingEntityTypes = [];
    let confidence = 0.6; // Default confidence
    let preferPlural = false;
    
    if (singularProximal.includes(demonstrative) || singularDistal.includes(demonstrative)) {
      // Singular demonstratives can refer to any entity type
      matchingEntityTypes = ['product', 'item', 'location', 'organization', 'event', 'person', 'contact', 'user'];
    } else if (pluralProximal.includes(demonstrative) || pluralDistal.includes(demonstrative)) {
      // Plural demonstratives prefer groups
      matchingEntityTypes = ['group', 'organization', 'location', 'product'];
      preferPlural = true;
    }
    
    // Try to find entity in context
    if (recentEntities.length > 0) {
      // For plural demonstratives, prefer entities that might be plural
      if (preferPlural) {
        for (const entity of recentEntities) {
          if (matchingEntityTypes.includes(entity.type) && 
              (entity.type === 'group' || entity.type === 'organization')) {
            return {
              type: entity.type,
              value: entity.value,
              confidence: 0.7
            };
          }
        }
      }
      
      // Fall back to most recent entity of matching type
      for (const entity of recentEntities) {
        if (matchingEntityTypes.includes(entity.type)) {
          return {
            type: entity.type,
            value: entity.value,
            confidence
          };
        }
      }
    }
    
    // If no entity found, try to extract from recent messages
    if (recentMessages.length > 0) {
      // Demonstratives often refer to the most recent non-user message
      const botMessages = recentMessages.filter(msg => msg.role !== 'user');
      
      if (botMessages.length > 0) {
        return {
          type: 'message',
          value: botMessages[0].content,
          confidence: 0.5 // Lower confidence for message reference
        };
      }
    }
    
    // No matching reference found
    return null;
  }
  
  /**
   * Resolve time references
   * @param {Object} reference - Time reference
   * @returns {Object|null} - Resolved reference or null
   * @private
   */
  resolveTimeReference(reference) {
    const timeRef = reference.value.toLowerCase();
    const now = new Date();
    
    switch (timeRef) {
      case 'now':
        return {
          type: 'time',
          value: now.toISOString(),
          confidence: 0.9
        };
      case 'today':
        return {
          type: 'time',
          value: now.toISOString().split('T')[0],
          confidence: 0.9
        };
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          type: 'time',
          value: yesterday.toISOString().split('T')[0],
          confidence: 0.9
        };
      }
      case 'tomorrow': {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          type: 'time',
          value: tomorrow.toISOString().split('T')[0],
          confidence: 0.9
        };
      }
      case 'last':
      case 'previous':
      case 'earlier':
        // These are relative and need more context
        return {
          type: 'time',
          value: 'past',
          confidence: 0.6
        };
      case 'next':
      case 'later':
        // These are relative and need more context
        return {
          type: 'time',
          value: 'future',
          confidence: 0.6
        };
      default:
        return null;
    }
  }
  
  /**
   * Apply resolved references to a message
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - Message object
   * @returns {Promise<Object>} - Message with resolved references
   */
  async applyResolvedReferences(chatbotId, userId, conversationId, message) {
    try {
      // Skip if message has no content
      if (!message.content) {
        return message;
      }
      
      // Resolve references in message content
      const { resolvedText, references } = await this.resolveReferences(
        chatbotId,
        userId,
        conversationId,
        message.content
      );
      
      // Create a new message with resolved content
      const resolvedMessage = {
        ...message,
        content: resolvedText,
        metadata: {
          ...(message.metadata || {}),
          resolvedReferences: references
        }
      };
      
      return resolvedMessage;
    } catch (error) {
      logger.error(`Error applying resolved references for chatbot ${chatbotId}, user ${userId}:`, error.message);
      return message;
    }
  }
}

// Create singleton instance
const referenceService = new ReferenceService();

module.exports = referenceService;
