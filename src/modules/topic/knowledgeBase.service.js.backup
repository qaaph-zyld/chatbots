/**
 * Knowledge Base Service
 * 
 * Handles CRUD operations for knowledge bases and knowledge items
 */

require('@src/modules\database\schemas\knowledgeBase.schema');
require('@src/modules\database\schemas\chatbot.schema');
require('@src/modules\utils');
require('@src/modules\utils\errors');

/**
 * Create a new knowledge base
 * @param {Object} knowledgeBaseData - Knowledge base data
 * @returns {Promise<Object>} Created knowledge base
 */
exports.createKnowledgeBase = async (knowledgeBaseData) => {
  try {
    // Validate chatbot exists
    const chatbotExists = await Chatbot.exists({ _id: knowledgeBaseData.chatbotId });
    if (!chatbotExists) {
      throw new NotFoundError(`Chatbot with ID ${knowledgeBaseData.chatbotId} not found`);
    }
    
    // Create knowledge base
    const knowledgeBase = new KnowledgeBase(knowledgeBaseData);
    await knowledgeBase.save();
    
    logger.info(`Created new knowledge base: ${knowledgeBase._id} (${knowledgeBase.name})`);
    
    return knowledgeBase;
  } catch (error) {
    logger.error('Error creating knowledge base:', error.message);
    throw error;
  }
};

/**
 * Get all knowledge bases for a chatbot
 * @param {string} chatbotId - Chatbot ID
 * @returns {Promise<Array>} List of knowledge bases
 */
exports.getKnowledgeBasesByChatbotId = async (chatbotId) => {
  try {
    // Validate chatbot exists
    const chatbotExists = await Chatbot.exists({ _id: chatbotId });
    if (!chatbotExists) {
      throw new NotFoundError(`Chatbot with ID ${chatbotId} not found`);
    }
    
    // Get knowledge bases
    const knowledgeBases = await KnowledgeBase.find({ chatbotId });
    
    logger.info(`Retrieved ${knowledgeBases.length} knowledge bases for chatbot ${chatbotId}`);
    
    return knowledgeBases;
  } catch (error) {
    logger.error(`Error fetching knowledge bases for chatbot ${chatbotId}:`, error.message);
    throw error;
  }
};

/**
 * Get knowledge base by ID
 * @param {string} id - Knowledge base ID
 * @returns {Promise<Object>} Knowledge base
 */
exports.getKnowledgeBaseById = async (id) => {
  try {
    const knowledgeBase = await KnowledgeBase.findById(id);
    
    if (!knowledgeBase) {
      throw new NotFoundError(`Knowledge base with ID ${id} not found`);
    }
    
    logger.info(`Retrieved knowledge base: ${id}`);
    
    return knowledgeBase;
  } catch (error) {
    logger.error(`Error fetching knowledge base ${id}:`, error.message);
    throw error;
  }
};

/**
 * Update knowledge base
 * @param {string} id - Knowledge base ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated knowledge base
 */
exports.updateKnowledgeBase = async (id, updateData) => {
  try {
    const knowledgeBase = await KnowledgeBase.findById(id);
    
    if (!knowledgeBase) {
      throw new NotFoundError(`Knowledge base with ID ${id} not found`);
    }
    
    // Update fields
    Object.keys(updateData).forEach(key => {
      // Don't update items array directly, use specific methods for that
      if (key !== 'items' && key !== 'chatbotId') {
        knowledgeBase[key] = updateData[key];
      }
    });
    
    await knowledgeBase.save();
    
    logger.info(`Updated knowledge base ${id}`);
    
    return knowledgeBase;
  } catch (error) {
    logger.error(`Error updating knowledge base ${id}:`, error.message);
    throw error;
  }
};

/**
 * Delete knowledge base
 * @param {string} id - Knowledge base ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteKnowledgeBase = async (id) => {
  try {
    const result = await KnowledgeBase.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundError(`Knowledge base with ID ${id} not found`);
    }
    
    logger.info(`Deleted knowledge base ${id}`);
    
    return true;
  } catch (error) {
    logger.error(`Error deleting knowledge base ${id}:`, error.message);
    throw error;
  }
};

/**
 * Add knowledge item to knowledge base
 * @param {string} knowledgeBaseId - Knowledge base ID
 * @param {Object} itemData - Knowledge item data
 * @returns {Promise<Object>} Updated knowledge base
 */
exports.addKnowledgeItem = async (knowledgeBaseId, itemData) => {
  try {
    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    
    if (!knowledgeBase) {
      throw new NotFoundError(`Knowledge base with ID ${knowledgeBaseId} not found`);
    }
    
    // Validate required fields
    if (!itemData.title || !itemData.content) {
      throw new ValidationError('Knowledge item title and content are required');
    }
    
    // Add item
    await knowledgeBase.addItem(itemData);
    
    logger.info(`Added knowledge item to knowledge base ${knowledgeBaseId}`);
    
    return knowledgeBase;
  } catch (error) {
    logger.error(`Error adding knowledge item to knowledge base ${knowledgeBaseId}:`, error.message);
    throw error;
  }
};

/**
 * Update knowledge item
 * @param {string} knowledgeBaseId - Knowledge base ID
 * @param {string} itemId - Knowledge item ID
 * @param {Object} itemData - Knowledge item data
 * @returns {Promise<Object>} Updated knowledge base
 */
exports.updateKnowledgeItem = async (knowledgeBaseId, itemId, itemData) => {
  try {
    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    
    if (!knowledgeBase) {
      throw new NotFoundError(`Knowledge base with ID ${knowledgeBaseId} not found`);
    }
    
    // Find item
    const item = knowledgeBase.items.id(itemId);
    if (!item) {
      throw new NotFoundError(`Knowledge item with ID ${itemId} not found`);
    }
    
    // Update item
    const updatedKnowledgeBase = await knowledgeBase.updateItem(itemId, itemData);
    
    logger.info(`Updated knowledge item ${itemId} in knowledge base ${knowledgeBaseId}`);
    
    return updatedKnowledgeBase;
  } catch (error) {
    logger.error(`Error updating knowledge item ${itemId} in knowledge base ${knowledgeBaseId}:`, error.message);
    throw error;
  }
};

/**
 * Delete knowledge item
 * @param {string} knowledgeBaseId - Knowledge base ID
 * @param {string} itemId - Knowledge item ID
 * @returns {Promise<Object>} Updated knowledge base
 */
exports.deleteKnowledgeItem = async (knowledgeBaseId, itemId) => {
  try {
    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    
    if (!knowledgeBase) {
      throw new NotFoundError(`Knowledge base with ID ${knowledgeBaseId} not found`);
    }
    
    // Find item
    const item = knowledgeBase.items.id(itemId);
    if (!item) {
      throw new NotFoundError(`Knowledge item with ID ${itemId} not found`);
    }
    
    // Remove item
    await knowledgeBase.removeItem(itemId);
    
    logger.info(`Deleted knowledge item ${itemId} from knowledge base ${knowledgeBaseId}`);
    
    return knowledgeBase;
  } catch (error) {
    logger.error(`Error deleting knowledge item ${itemId} from knowledge base ${knowledgeBaseId}:`, error.message);
    throw error;
  }
};

/**
 * Search knowledge items
 * @param {string} knowledgeBaseId - Knowledge base ID
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Array>} Search results
 */
exports.searchKnowledgeItems = async (knowledgeBaseId, query, options = {}) => {
  try {
    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    
    if (!knowledgeBase) {
      throw new NotFoundError(`Knowledge base with ID ${knowledgeBaseId} not found`);
    }
    
    // Search items
    const results = knowledgeBase.searchItems(query, options);
    
    logger.info(`Searched knowledge base ${knowledgeBaseId} for "${query}", found ${results.length} results`);
    
    return results;
  } catch (error) {
    logger.error(`Error searching knowledge base ${knowledgeBaseId}:`, error.message);
    throw error;
  }
};

/**
 * Get knowledge for message context
 * @param {string} chatbotId - Chatbot ID
 * @param {string} message - User message
 * @returns {Promise<Array>} Relevant knowledge items
 */
exports.getKnowledgeForMessage = async (chatbotId, message) => {
  try {
    // Get all active knowledge bases for the chatbot
    const knowledgeBases = await KnowledgeBase.find({ 
      chatbotId, 
      isActive: true 
    });
    
    if (knowledgeBases.length === 0) {
      logger.debug(`No active knowledge bases found for chatbot ${chatbotId}`);
      return [];
    }
    
    // Search each knowledge base for relevant items
    let allResults = [];
    
    for (const kb of knowledgeBases) {
      const { retrievalMethod, relevanceThreshold, maxResults } = kb.settings;
      
      // Search for relevant items
      const results = kb.searchItems(message, { limit: maxResults });
      
      // Add to results with source information
      const resultsWithSource = results.map(item => ({
        ...item.toObject(),
        source: {
          knowledgeBaseId: kb._id,
          knowledgeBaseName: kb.name
        }
      }));
      
      allResults = [...allResults, ...resultsWithSource];
    }
    
    // Sort by relevance (in a real implementation, this would use more sophisticated ranking)
    // For now, we'll just return all results up to a maximum
    const MAX_TOTAL_RESULTS = 10;
    allResults = allResults.slice(0, MAX_TOTAL_RESULTS);
    
    logger.info(`Retrieved ${allResults.length} knowledge items for chatbot ${chatbotId} based on message context`);
    
    return allResults;
  } catch (error) {
    logger.error(`Error retrieving knowledge for chatbot ${chatbotId}:`, error.message);
    throw error;
  }
};
