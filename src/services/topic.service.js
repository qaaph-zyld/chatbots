/**
 * Topic Service
 * 
 * Service for managing conversation topics in the chatbot platform
 */

const { logger } = require('../utils');
const Topic = require('../models/topic.model');

/**
 * Create a new topic
 * @param {Object} topicData - Topic data
 * @returns {Promise<Object>} Created topic
 */
const createTopic = async (topicData) => {
  try {
    const topic = new Topic(topicData);
    await topic.save();
    
    logger.info(`Topic created: ${topic._id}`, { name: topic.name });
    return topic;
  } catch (error) {
    logger.error('Error creating topic', { error, topicData });
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
    const topic = await Topic.findById(topicId);
    
    if (!topic) {
      logger.warn(`Topic not found: ${topicId}`);
      return null;
    }
    
    return topic;
  } catch (error) {
    logger.error('Error getting topic by ID', { error, topicId });
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
    const topic = await Topic.findOne({ name, chatbotId });
    
    if (!topic) {
      logger.warn(`Topic not found: ${name}`, { chatbotId });
      return null;
    }
    
    return topic;
  } catch (error) {
    logger.error('Error getting topic by name', { error, name, chatbotId });
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
    const topic = await Topic.findByIdAndUpdate(
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
    logger.error('Error updating topic', { error, topicId, updateData });
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
    const result = await Topic.findByIdAndDelete(topicId);
    
    if (!result) {
      logger.warn(`Topic not found for deletion: ${topicId}`);
      return false;
    }
    
    logger.info(`Topic deleted: ${topicId}`, { name: result.name });
    return true;
  } catch (error) {
    logger.error('Error deleting topic', { error, topicId });
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
    const query = { chatbotId };
    
    if (options.category) {
      query.category = options.category;
    }
    
    if (options.isActive !== undefined) {
      query.isActive = options.isActive;
    }
    
    const topics = await Topic.find(query).sort({ priority: -1, name: 1 });
    
    logger.debug(`Listed ${topics.length} topics for chatbot`, { chatbotId });
    return topics;
  } catch (error) {
    logger.error('Error listing topics', { error, chatbotId });
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
    const topic = await Topic.findById(topicId);
    
    if (!topic) {
      logger.warn(`Topic not found for adding pattern: ${topicId}`);
      return null;
    }
    
    topic.patterns.push(patternData);
    await topic.save();
    
    logger.info(`Pattern added to topic: ${topicId}`, { pattern: patternData.pattern });
    return topic;
  } catch (error) {
    logger.error('Error adding topic pattern', { error, topicId, patternData });
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
    const topic = await Topic.findById(topicId);
    
    if (!topic) {
      logger.warn(`Topic not found for removing pattern: ${topicId}`);
      return null;
    }
    
    topic.patterns = topic.patterns.filter(p => p._id.toString() !== patternId);
    await topic.save();
    
    logger.info(`Pattern removed from topic: ${topicId}`, { patternId });
    return topic;
  } catch (error) {
    logger.error('Error removing topic pattern', { error, topicId, patternId });
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
    const topic = await Topic.findById(topicId);
    
    if (!topic) {
      logger.warn(`Topic not found for adding response: ${topicId}`);
      return null;
    }
    
    topic.responses.push(responseData);
    await topic.save();
    
    logger.info(`Response added to topic: ${topicId}`);
    return topic;
  } catch (error) {
    logger.error('Error adding topic response', { error, topicId, responseData });
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
    const topic = await Topic.findById(topicId);
    
    if (!topic) {
      logger.warn(`Topic not found for removing response: ${topicId}`);
      return null;
    }
    
    topic.responses = topic.responses.filter(r => r._id.toString() !== responseId);
    await topic.save();
    
    logger.info(`Response removed from topic: ${topicId}`, { responseId });
    return topic;
  } catch (error) {
    logger.error('Error removing topic response', { error, topicId, responseId });
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
    const topics = await Topic.find({ chatbotId, isActive: true });
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
    logger.error('Error detecting topics', { error, chatbotId });
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
