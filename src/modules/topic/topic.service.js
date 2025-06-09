/**
 * Topic Service
 * 
 * Service for managing conversation topics in the chatbot platform
 * Refactored to use the MongoDB data abstraction layer with repository pattern
 */

require('@src/modules\utils');
require('@src/modules\data');

/**
 * Create a new topic
 * @param {Object} topicData - Topic data
 * @returns {Promise<Object>} Created topic
 */
const createTopic = async (topicData) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Create topic using repository
    const topic = await repositories.topic.create(topicData);
    
    logger.info(`Topic created: ${topic._id}`, { name: topic.name });
    return topic;
  } catch (error) {
    logger.error('Error creating topic', { error: error.message, name: topicData.name });
    throw error;
  }
};

/**
 * Get topic by ID
 * @param {string} topicId - Topic ID
 * @returns {Promise<Object>} Topic object
 */
const getTopicById = async (topicId) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Get topic using repository with caching
    const topic = await repositories.topic.findById(topicId);
    
    if (!topic) {
      logger.warn(`Topic not found: ${topicId}`);
      return null;
    }
    
    return topic;
  } catch (error) {
    logger.error('Error getting topic by ID', { error: error.message, topicId });
    throw error;
  }
};

/**
 * Get topic by name
 * @param {string} name - Topic name
 * @param {string} chatbotId - Chatbot ID
 * @returns {Promise<Object>} Topic object
 */
const getTopicByName = async (name, chatbotId) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Get topic by name using repository with caching
    const topic = await repositories.topic.findByName(name, chatbotId);
    
    if (!topic) {
      logger.warn(`Topic not found: ${name}`, { chatbotId });
      return null;
    }
    
    return topic;
  } catch (error) {
    logger.error('Error getting topic by name', { error: error.message, name, chatbotId });
    throw error;
  }
};

/**
 * Update a topic
 * @param {string} topicId - Topic ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated topic
 */
const updateTopic = async (topicId, updateData) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Update topic using repository with cache invalidation
    const topic = await repositories.topic.findByIdAndUpdate(
      topicId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!topic) {
      logger.warn(`Topic not found for update: ${topicId}`);
      return null;
    }
    
    logger.info(`Topic updated: ${topicId}`, { name: topic.name });
    return topic;
  } catch (error) {
    logger.error('Error updating topic', { error: error.message, topicId });
    throw error;
  }
};

/**
 * Delete a topic
 * @param {string} topicId - Topic ID
 * @returns {Promise<boolean>} True if deleted
 */
const deleteTopic = async (topicId) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Delete topic using repository with cache invalidation
    const result = await repositories.topic.deleteById(topicId);
    
    if (!result) {
      logger.warn(`Topic not found for deletion: ${topicId}`);
      return false;
    }
    
    logger.info(`Topic deleted: ${topicId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting topic', { error: error.message, topicId });
    throw error;
  }
};

/**
 * List topics for a chatbot
 * @param {string} chatbotId - Chatbot ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of topics
 */
const listTopics = async (chatbotId, options = {}) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Use repository to find topics by chatbot with filtering and sorting
    const topics = await repositories.topic.findByChatbot(chatbotId, options);
    
    logger.debug(`Listed ${topics.length} topics for chatbot`, { chatbotId });
    return topics;
  } catch (error) {
    logger.error('Error listing topics', { error: error.message, chatbotId });
    throw error;
  }
};

/**
 * Add a pattern to a topic
 * @param {string} topicId - Topic ID
 * @param {Object} patternData - Pattern data
 * @returns {Promise<Object>} Updated topic
 */
const addTopicPattern = async (topicId, patternData) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Add pattern using repository with transaction support
    const topic = await repositories.topic.addPattern(topicId, patternData);
    
    if (!topic) {
      logger.warn(`Topic not found for adding pattern: ${topicId}`);
      return null;
    }
    
    logger.info(`Pattern added to topic: ${topicId}`, { pattern: patternData.pattern });
    return topic;
  } catch (error) {
    logger.error('Error adding topic pattern', { error: error.message, topicId });
    throw error;
  }
};

/**
 * Remove a pattern from a topic
 * @param {string} topicId - Topic ID
 * @param {string} patternId - Pattern ID
 * @returns {Promise<Object>} Updated topic
 */
const removeTopicPattern = async (topicId, patternId) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Remove pattern using repository with transaction support
    const topic = await repositories.topic.removePattern(topicId, patternId);
    
    if (!topic) {
      logger.warn(`Topic not found for removing pattern: ${topicId}`);
      return null;
    }
    
    logger.info(`Pattern removed from topic: ${topicId}`, { patternId });
    return topic;
  } catch (error) {
    logger.error('Error removing topic pattern', { error: error.message, topicId, patternId });
    throw error;
  }
};

/**
 * Add a response to a topic
 * @param {string} topicId - Topic ID
 * @param {Object} responseData - Response data
 * @returns {Promise<Object>} Updated topic
 */
const addTopicResponse = async (topicId, responseData) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Add response using repository with transaction support
    const topic = await repositories.topic.addResponse(topicId, responseData);
    
    if (!topic) {
      logger.warn(`Topic not found for adding response: ${topicId}`);
      return null;
    }
    
    logger.info(`Response added to topic: ${topicId}`);
    return topic;
  } catch (error) {
    logger.error('Error adding topic response', { error: error.message, topicId });
    throw error;
  }
};

/**
 * Remove a response from a topic
 * @param {string} topicId - Topic ID
 * @param {string} responseId - Response ID
 * @returns {Promise<Object>} Updated topic
 */
const removeTopicResponse = async (topicId, responseId) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Remove response using repository with transaction support
    const topic = await repositories.topic.removeResponse(topicId, responseId);
    
    if (!topic) {
      logger.warn(`Topic not found for removing response: ${topicId}`);
      return null;
    }
    
    logger.info(`Response removed from topic: ${topicId}`, { responseId });
    return topic;
  } catch (error) {
    logger.error('Error removing topic response', { error: error.message, topicId, responseId });
    throw error;
  }
};

/**
 * Detect topics in text
 * @param {string} text - Text to analyze
 * @param {string} chatbotId - Chatbot ID
 * @returns {Promise<Array>} Detected topics with confidence scores
 */
const detectTopics = async (text, chatbotId) => {
  try {
    // Ensure database connection
    await databaseService.connect();
    
    // Use repository to get active topics with caching
    const topics = await repositories.topic.findActiveByChatbot(chatbotId);
    const detectedTopics = [];
    
    for (const topic of topics) {
      let maxConfidence = 0;
      let matchedPattern = null;
      
      for (const pattern of topic.patterns) {
        try {
          // Skip disabled patterns
          if (pattern.isActive === false) continue;
          
          let isMatch = false;
          let confidence = 0;
          
          if (pattern.type === 'regex') {
            // Regex pattern matching
            const regex = new RegExp(pattern.pattern, 'i');
            isMatch = regex.test(text);
            confidence = isMatch ? pattern.confidence || 0.8 : 0;
          } else if (pattern.type === 'keyword') {
            // Keyword matching
            isMatch = text.toLowerCase().includes(pattern.pattern.toLowerCase());
            confidence = isMatch ? pattern.confidence || 0.6 : 0;
          } else if (pattern.type === 'exact') {
            // Exact matching
            isMatch = text.toLowerCase() === pattern.pattern.toLowerCase();
            confidence = isMatch ? pattern.confidence || 1.0 : 0;
          }
          
          if (isMatch && confidence > maxConfidence) {
            maxConfidence = confidence;
            matchedPattern = pattern;
          }
        } catch (patternError) {
          logger.warn('Error processing pattern', { 
            error: patternError.message, 
            topicId: topic._id, 
            pattern: pattern.pattern 
          });
        }
      }
      
      if (maxConfidence > 0) {
        detectedTopics.push({
          topicId: topic._id,
          name: topic.name,
          category: topic.category,
          confidence: maxConfidence,
          matchedPattern: matchedPattern ? {
            id: matchedPattern._id,
            pattern: matchedPattern.pattern,
            type: matchedPattern.type
          } : null
        });
      }
    }
    
    // Sort by confidence (descending)
    detectedTopics.sort((a, b) => b.confidence - a.confidence);
    
    logger.debug(`Detected ${detectedTopics.length} topics in text`, { chatbotId });
    return detectedTopics;
  } catch (error) {
    logger.error('Error detecting topics', { error: error.message, chatbotId });
    throw error;
  }
};

module.exports = {
  createTopic,
  getTopicById,
  getTopicByName,
  updateTopic,
  deleteTopic,
  listTopics,
  addTopicPattern,
  removeTopicPattern,
  addTopicResponse,
  removeTopicResponse,
  detectTopics
};
