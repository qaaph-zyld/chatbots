/**
 * Entity Recognition Service
 * 
 * Provides advanced entity recognition capabilities for chatbots
 */

const nlpService = require('./nlp.service');
const { logger } = require('../utils');

/**
 * Entity types
 * @enum {string}
 */
const EntityType = {
  PERSON: 'PERSON',
  LOCATION: 'LOCATION',
  ORGANIZATION: 'ORGANIZATION',
  DATE: 'DATE',
  TIME: 'TIME',
  MONEY: 'MONEY',
  PERCENTAGE: 'PERCENTAGE',
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  URL: 'URL',
  PRODUCT: 'PRODUCT',
  EVENT: 'EVENT',
  CUSTOM: 'CUSTOM'
};

/**
 * Entity Recognition Service class
 */
class EntityService {
  /**
   * Constructor
   * @param {Object} options - Entity service options
   */
  constructor(options = {}) {
    this.options = {
      confidenceThreshold: 0.7,
      ...options
    };
    
    // Custom entity patterns (regex)
    this.customPatterns = new Map();
    
    // Initialize default patterns
    this._initializeDefaultPatterns();
    
    logger.info('Entity Recognition Service initialized');
  }
  
  /**
   * Initialize default entity patterns
   * @private
   */
  _initializeDefaultPatterns() {
    // Email pattern
    this.customPatterns.set(EntityType.EMAIL, {
      pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
      processor: (match) => ({ value: match[0], type: EntityType.EMAIL })
    });
    
    // Phone pattern
    this.customPatterns.set(EntityType.PHONE, {
      pattern: /\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/,
      processor: (match) => ({ value: match[0], type: EntityType.PHONE })
    });
    
    // URL pattern
    this.customPatterns.set(EntityType.URL, {
      pattern: /\b(https?:\/\/)?[A-Za-z0-9]+([\-\.]{1}[A-Za-z0-9]+)*\.[A-Za-z]{2,}(:[0-9]{1,5})?(\/[^\s]*)?\b/,
      processor: (match) => ({ value: match[0], type: EntityType.URL })
    });
    
    // Money pattern
    this.customPatterns.set(EntityType.MONEY, {
      pattern: /\b(\$|€|£|¥)?\s?\d+(\.\d+)?\s?(\$|€|£|¥|USD|EUR|GBP|JPY)?\b/,
      processor: (match) => ({ value: match[0], type: EntityType.MONEY })
    });
    
    // Date pattern (simple)
    this.customPatterns.set(EntityType.DATE, {
      pattern: /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/,
      processor: (match) => ({ value: match[0], type: EntityType.DATE })
    });
  }
  
  /**
   * Add a custom entity pattern
   * @param {string} name - Pattern name
   * @param {RegExp} pattern - Regular expression pattern
   * @param {Function} processor - Function to process matches
   * @returns {EntityService} - This instance for chaining
   */
  addCustomPattern(name, pattern, processor) {
    this.customPatterns.set(name, { pattern, processor });
    return this;
  }
  
  /**
   * Remove a custom entity pattern
   * @param {string} name - Pattern name to remove
   * @returns {boolean} - True if pattern was removed, false otherwise
   */
  removeCustomPattern(name) {
    return this.customPatterns.delete(name);
  }
  
  /**
   * Extract entities from text using regex patterns
   * @param {string} text - Text to extract entities from
   * @returns {Array} - Array of extracted entities
   */
  extractEntitiesWithPatterns(text) {
    const entities = [];
    
    // Apply each pattern
    for (const [type, { pattern, processor }] of this.customPatterns.entries()) {
      const matches = text.matchAll(new RegExp(pattern, 'g'));
      
      for (const match of matches) {
        const entity = processor(match);
        entities.push({
          type,
          value: entity.value,
          text: entity.value,
          confidence: 1.0, // Regex matches are certain
          metadata: entity.metadata || {}
        });
      }
    }
    
    return entities;
  }
  
  /**
   * Extract entities from text using NLP service
   * @param {string} text - Text to extract entities from
   * @returns {Promise<Array>} - Array of extracted entities
   */
  async extractEntitiesWithNLP(text) {
    try {
      const entities = await nlpService.extractEntities(text);
      
      // Filter by confidence threshold
      return entities.filter(entity => 
        entity.confidence >= this.options.confidenceThreshold
      );
    } catch (error) {
      logger.error('Error extracting entities with NLP:', error.message);
      return [];
    }
  }
  
  /**
   * Extract all entities from text using both patterns and NLP
   * @param {string} text - Text to extract entities from
   * @returns {Promise<Array>} - Array of extracted entities
   */
  async extractEntities(text) {
    try {
      // Get entities from patterns
      const patternEntities = this.extractEntitiesWithPatterns(text);
      
      // Get entities from NLP
      const nlpEntities = await this.extractEntitiesWithNLP(text);
      
      // Merge entities, removing duplicates
      const allEntities = [...patternEntities, ...nlpEntities];
      
      // Remove duplicates based on type and value
      const uniqueEntities = [];
      const seen = new Set();
      
      for (const entity of allEntities) {
        const key = `${entity.type}:${entity.value}`;
        
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEntities.push(entity);
        }
      }
      
      return uniqueEntities;
    } catch (error) {
      logger.error('Error extracting all entities:', error.message);
      return [];
    }
  }
  
  /**
   * Extract entities of a specific type
   * @param {string} text - Text to extract entities from
   * @param {string} type - Entity type to extract
   * @returns {Promise<Array>} - Array of extracted entities
   */
  async extractEntitiesByType(text, type) {
    const entities = await this.extractEntities(text);
    return entities.filter(entity => entity.type === type);
  }
  
  /**
   * Normalize entity values (e.g., standardize dates, phone numbers)
   * @param {Object} entity - Entity to normalize
   * @returns {Object} - Normalized entity
   */
  normalizeEntity(entity) {
    try {
      switch (entity.type) {
        case EntityType.DATE:
          // Convert to ISO format if possible
          try {
            const date = new Date(entity.value);
            if (!isNaN(date.getTime())) {
              return {
                ...entity,
                normalized: date.toISOString().split('T')[0]
              };
            }
          } catch (e) {
            // If date parsing fails, return original
          }
          break;
          
        case EntityType.PHONE:
          // Strip non-numeric characters
          return {
            ...entity,
            normalized: entity.value.replace(/\D/g, '')
          };
          
        case EntityType.MONEY:
          // Extract numeric value
          const numericValue = entity.value.replace(/[^\d.]/g, '');
          return {
            ...entity,
            normalized: parseFloat(numericValue)
          };
          
        default:
          // No normalization for other types
          return entity;
      }
      
      return entity;
    } catch (error) {
      logger.error('Error normalizing entity:', error.message);
      return entity;
    }
  }
  
  /**
   * Process entities in a message and enrich with metadata
   * @param {string} text - Text to process
   * @returns {Promise<Object>} - Processed message with entities
   */
  async processMessage(text) {
    try {
      // Extract entities
      const entities = await this.extractEntities(text);
      
      // Normalize entities
      const normalizedEntities = entities.map(entity => this.normalizeEntity(entity));
      
      // Group entities by type
      const entitiesByType = normalizedEntities.reduce((acc, entity) => {
        if (!acc[entity.type]) {
          acc[entity.type] = [];
        }
        
        acc[entity.type].push(entity);
        return acc;
      }, {});
      
      return {
        text,
        entities: normalizedEntities,
        entitiesByType,
        hasEntities: normalizedEntities.length > 0
      };
    } catch (error) {
      logger.error('Error processing message for entities:', error.message);
      return {
        text,
        entities: [],
        entitiesByType: {},
        hasEntities: false
      };
    }
  }
}

// Create singleton instance
const entityService = new EntityService();

module.exports = {
  entityService,
  EntityType
};
