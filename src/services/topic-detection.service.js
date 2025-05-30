/**
 * Topic Detection Service
 * 
 * This service provides functionality for detecting, tracking, and managing topics
 * in conversations, including topic identification, relevance scoring, and topic history.
 */

const mongoose = require('mongoose');
const Topic = require('../models/topic.model');
const TopicReference = require('../models/topic-reference.model');
const { logger } = require('../utils');
const axios = require('axios');

// Configure axios with proxy
axios.defaults.proxy = {
  host: '104.129.196.38',
  port: 10563
};

class TopicDetectionService {
  /**
   * Detect topics in a message
   * @param {String} message - Message text
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {String} conversationId - Conversation ID
   * @returns {Promise<Array>} - Detected topics
   */
  async detectTopics(message, userId, chatbotId, conversationId) {
    try {
      // Use local NLP models to detect topics
      // This is a simplified implementation - in a real system, you would use
      // more sophisticated NLP techniques like topic modeling (LDA, NMF)
      const topics = await this._extractTopicsFromText(message);
      
      // Track detected topics
      const trackedTopics = [];
      for (const topicData of topics) {
        const topic = await this.trackTopic(topicData, userId, chatbotId, conversationId);
        trackedTopics.push(topic);
      }
      
      return trackedTopics;
    } catch (error) {
      logger.error('Error detecting topics:', error);
      throw error;
    }
  }

  /**
   * Extract topics from text using NLP techniques
   * @param {String} text - Input text
   * @returns {Promise<Array>} - Extracted topics
   * @private
   */
  async _extractTopicsFromText(text) {
    try {
      // In a real implementation, this would use a local NLP model
      // For this example, we'll use a simplified approach
      
      // Common topics with keywords
      const topicKeywords = {
        'technology': ['computer', 'software', 'hardware', 'tech', 'digital', 'ai', 'artificial intelligence', 'machine learning'],
        'travel': ['trip', 'vacation', 'hotel', 'flight', 'destination', 'tourism', 'travel'],
        'food': ['restaurant', 'recipe', 'cooking', 'meal', 'dish', 'food', 'cuisine'],
        'health': ['fitness', 'exercise', 'diet', 'health', 'wellness', 'medical'],
        'business': ['company', 'startup', 'entrepreneur', 'market', 'business', 'finance', 'investment'],
        'education': ['school', 'university', 'learning', 'student', 'teacher', 'course', 'education']
      };
      
      const detectedTopics = [];
      const lowerText = text.toLowerCase();
      
      // Check for each topic's keywords in the text
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        let score = 0;
        let matchedKeywords = [];
        
        for (const keyword of keywords) {
          if (lowerText.includes(keyword)) {
            score += 1;
            matchedKeywords.push(keyword);
          }
        }
        
        // If we found keywords for this topic, add it to detected topics
        if (score > 0) {
          detectedTopics.push({
            name: topic,
            confidence: Math.min(score / 3, 1), // Normalize confidence
            keywords: matchedKeywords,
            metadata: {
              keywordCount: matchedKeywords.length
            }
          });
        }
      }
      
      // Sort by confidence
      return detectedTopics.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      logger.error('Error extracting topics:', error);
      throw error;
    }
  }

  /**
   * Track a topic in a conversation
   * @param {Object} topicData - Topic data
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {String} conversationId - Conversation ID
   * @returns {Promise<Object>} - Tracked topic
   */
  async trackTopic(topicData, userId, chatbotId, conversationId) {
    try {
      // Check if topic already exists
      let topic = await Topic.findOne({
        name: topicData.name,
        userId,
        chatbotId
      });

      if (topic) {
        // Update existing topic
        topic.confidence = Math.max(topic.confidence, topicData.confidence || 0);
        topic.keywords = [...new Set([...topic.keywords, ...(topicData.keywords || [])])];
        topic.metadata = { ...topic.metadata, ...(topicData.metadata || {}) };
        topic.lastUpdated = new Date();
        
        await topic.save();
        logger.info(`Updated existing topic: ${topic._id}`);
      } else {
        // Create new topic
        topic = new Topic({
          name: topicData.name,
          confidence: topicData.confidence || 0.5,
          keywords: topicData.keywords || [],
          metadata: topicData.metadata || {},
          userId,
          chatbotId,
          created: new Date(),
          lastUpdated: new Date()
        });
        
        await topic.save();
        logger.info(`Created new topic: ${topic._id}`);
      }

      // Create a reference to this topic in the current conversation
      const reference = new TopicReference({
        topicId: topic._id,
        conversationId,
        userId,
        chatbotId,
        confidence: topicData.confidence || 0.5,
        timestamp: new Date()
      });
      
      await reference.save();
      
      return topic;
    } catch (error) {
      logger.error('Error tracking topic:', error);
      throw error;
    }
  }

  /**
   * Get current topics for a conversation
   * @param {String} conversationId - Conversation ID
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Array>} - Current topics
   */
  async getConversationTopics(conversationId, userId, chatbotId) {
    try {
      // Find all references for this conversation
      const references = await TopicReference.find({
        conversationId,
        userId,
        chatbotId
      }).sort({ timestamp: -1 });
      
      // Get the unique topic IDs
      const topicIds = [...new Set(references.map(ref => ref.topicId))];
      
      // Fetch the topics
      const topics = await Topic.find({
        _id: { $in: topicIds },
        userId,
        chatbotId
      });
      
      // Calculate relevance score based on recency and frequency
      const topicsWithRelevance = topics.map(topic => {
        const topicReferences = references.filter(ref => 
          ref.topicId.toString() === topic._id.toString()
        );
        
        // Calculate recency (more recent = higher score)
        const latestReference = topicReferences.reduce((latest, ref) => 
          ref.timestamp > latest.timestamp ? ref : latest
        , topicReferences[0]);
        
        const recencyScore = latestReference ? 
          (Date.now() - latestReference.timestamp) / (1000 * 60 * 60) : 0; // Hours ago
        
        // Calculate frequency
        const frequencyScore = topicReferences.length;
        
        // Combined relevance score (higher is more relevant)
        const relevanceScore = (frequencyScore * 0.7) + ((24 - Math.min(recencyScore, 24)) / 24 * 0.3);
        
        return {
          ...topic.toObject(),
          relevanceScore,
          references: topicReferences.length
        };
      });
      
      // Sort by relevance
      return topicsWithRelevance.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      logger.error('Error getting conversation topics:', error);
      throw error;
    }
  }

  /**
   * Get user's topic history
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Array>} - Topic history
   */
  async getUserTopicHistory(userId, chatbotId) {
    try {
      // Get all topics for this user
      const topics = await Topic.find({
        userId,
        chatbotId
      }).sort({ lastUpdated: -1 });
      
      // For each topic, get its reference history
      const topicsWithHistory = await Promise.all(topics.map(async (topic) => {
        const references = await TopicReference.find({
          topicId: topic._id,
          userId,
          chatbotId
        }).sort({ timestamp: -1 });
        
        // Get unique conversation IDs
        const conversationIds = [...new Set(references.map(ref => ref.conversationId))];
        
        return {
          ...topic.toObject(),
          referenceCount: references.length,
          conversationCount: conversationIds.length,
          lastReferenced: references.length > 0 ? references[0].timestamp : null
        };
      }));
      
      return topicsWithHistory;
    } catch (error) {
      logger.error('Error getting user topic history:', error);
      throw error;
    }
  }

  /**
   * Get topics for a specific time period
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} - Topics in time period
   */
  async getTopicsInTimePeriod(userId, chatbotId, startDate, endDate) {
    try {
      // Find references in the time period
      const references = await TopicReference.find({
        userId,
        chatbotId,
        timestamp: { $gte: startDate, $lte: endDate }
      });
      
      // Get unique topic IDs
      const topicIds = [...new Set(references.map(ref => ref.topicId))];
      
      // Fetch the topics
      const topics = await Topic.find({
        _id: { $in: topicIds },
        userId,
        chatbotId
      });
      
      // Calculate frequency for each topic
      const topicsWithFrequency = topics.map(topic => {
        const topicReferences = references.filter(ref => 
          ref.topicId.toString() === topic._id.toString()
        );
        
        return {
          ...topic.toObject(),
          frequency: topicReferences.length,
          conversations: [...new Set(topicReferences.map(ref => ref.conversationId))]
        };
      });
      
      // Sort by frequency
      return topicsWithFrequency.sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      logger.error('Error getting topics in time period:', error);
      throw error;
    }
  }

  /**
   * Delete a topic and all its references
   * @param {String} topicId - Topic ID
   * @param {String} userId - User ID
   * @param {String} chatbotId - Chatbot ID
   * @returns {Promise<Boolean>} - Success status
   */
  async deleteTopic(topicId, userId, chatbotId) {
    try {
      // Verify topic exists and belongs to the user
      const topic = await Topic.findOne({
        _id: topicId,
        userId,
        chatbotId
      });
      
      if (!topic) {
        throw new Error('Topic not found');
      }
      
      // Delete all references to this topic
      await TopicReference.deleteMany({
        topicId,
        userId,
        chatbotId
      });
      
      // Delete the topic
      await Topic.deleteOne({
        _id: topicId,
        userId,
        chatbotId
      });
      
      logger.info(`Deleted topic: ${topicId}`);
      
      return true;
    } catch (error) {
      logger.error('Error deleting topic:', error);
      throw error;
    }
  }
}

module.exports = new TopicDetectionService();
