/**
 * Topic Detection Service
 * 
 * Provides capabilities for detecting, tracking, and managing topics
 * in conversations to enhance context awareness.
 */

const mongoose = require('mongoose');
require('@src/utils');
const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');

// Define topic schema if not already defined in advanced-context.service.js
let Topic;
try {
  Topic = mongoose.model('Topic');
} catch (error) {
  const TopicSchema = new mongoose.Schema({
    chatbotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chatbot',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    keywords: [String],
    parentTopic: String,
    childTopics: [String],
    relatedTopics: [{
      name: String,
      relationStrength: Number
    }],
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
  TopicSchema.index({ chatbotId: 1, name: 1 }, { unique: true });
  
  Topic = mongoose.model('Topic', TopicSchema);
}

// Define topic tracking schema for conversation-specific topic tracking
const TopicTrackingSchema = new mongoose.Schema({
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
  topics: [{
    name: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      default: 0.5
    },
    firstMentionedAt: {
      type: Date,
      default: Date.now
    },
    lastMentionedAt: {
      type: Date,
      default: Date.now
    },
    mentionCount: {
      type: Number,
      default: 1
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    }
  }],
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
const TopicTracking = mongoose.model('TopicTracking', TopicTrackingSchema);

/**
 * Topic Detection Service class
 */
class TopicDetectionService {
  /**
   * Constructor
   */
  constructor() {
    this.proxyConfig = null;
    this.httpClient = axios.create({
      httpAgent: new HttpsProxyAgent(this.proxyConfig),
      httpsAgent: new HttpsProxyAgent(this.proxyConfig)
    });
    
    this.topicDetectionThreshold = 0.5; // Minimum confidence for topic detection
    this.maxTopicsPerConversation = 10; // Maximum number of active topics per conversation
    
    logger.info('Topic Detection Service initialized');
  }
  
  /**
   * Create or update topic
   * @param {string} chatbotId - Chatbot ID
   * @param {Object} topicData - Topic data
   * @returns {Promise<Object>} - Created or updated topic
   */
  async createOrUpdateTopic(chatbotId, topicData) {
    try {
      const { name, description, keywords, parentTopic, metadata } = topicData;
      
      if (!name) {
        throw new Error('Topic name is required');
      }
      
      // Find existing topic
      let topic = await Topic.findOne({
        chatbotId,
        name
      });
      
      if (topic) {
        // Update existing topic
        topic.description = description || topic.description;
        
        // Update keywords
        if (keywords && Array.isArray(keywords)) {
          // Add new keywords without duplicates
          for (const keyword of keywords) {
            if (!topic.keywords.includes(keyword)) {
              topic.keywords.push(keyword);
            }
          }
        }
        
        // Update parent topic
        if (parentTopic !== undefined) {
          topic.parentTopic = parentTopic;
        }
        
        // Update metadata
        if (metadata && typeof metadata === 'object') {
          for (const [key, value] of Object.entries(metadata)) {
            topic.metadata.set(key, value);
          }
        }
        
        topic.updatedAt = new Date();
        await topic.save();
        
        logger.info(`Updated topic ${name} for chatbot ${chatbotId}`);
      } else {
        // Create new topic
        topic = new Topic({
          chatbotId,
          name,
          description,
          keywords: keywords || [],
          parentTopic,
          childTopics: [],
          relatedTopics: [],
          metadata: new Map(Object.entries(metadata || {}))
        });
        
        await topic.save();
        logger.info(`Created new topic ${name} for chatbot ${chatbotId}`);
        
        // Update parent topic's children if parent exists
        if (parentTopic) {
          const parent = await Topic.findOne({
            chatbotId,
            name: parentTopic
          });
          
          if (parent) {
            if (!parent.childTopics.includes(name)) {
              parent.childTopics.push(name);
              parent.updatedAt = new Date();
              await parent.save();
            }
          }
        }
      }
      
      return topic.toObject();
    } catch (error) {
      logger.error(`Error creating/updating topic for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get topic by name
   * @param {string} chatbotId - Chatbot ID
   * @param {string} name - Topic name
   * @returns {Promise<Object>} - Topic
   */
  async getTopicByName(chatbotId, name) {
    try {
      const topic = await Topic.findOne({
        chatbotId,
        name
      });
      
      if (!topic) {
        throw new Error(`Topic not found: ${name}`);
      }
      
      return topic.toObject();
    } catch (error) {
      logger.error(`Error getting topic ${name}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get all topics for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array<Object>>} - Topics
   */
  async getAllTopics(chatbotId) {
    try {
      const topics = await Topic.find({ chatbotId })
        .sort({ name: 1 });
      
      return topics.map(topic => topic.toObject());
    } catch (error) {
      logger.error(`Error getting topics for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Delete topic
   * @param {string} chatbotId - Chatbot ID
   * @param {string} name - Topic name
   * @returns {Promise<boolean>} - Success status
   */
  async deleteTopic(chatbotId, name) {
    try {
      // Get topic to check for relationships
      const topic = await Topic.findOne({
        chatbotId,
        name
      });
      
      if (!topic) {
        throw new Error(`Topic not found: ${name}`);
      }
      
      // Update parent topic if exists
      if (topic.parentTopic) {
        const parent = await Topic.findOne({
          chatbotId,
          name: topic.parentTopic
        });
        
        if (parent) {
          parent.childTopics = parent.childTopics.filter(child => child !== name);
          parent.updatedAt = new Date();
          await parent.save();
        }
      }
      
      // Update child topics
      for (const childName of topic.childTopics) {
        const child = await Topic.findOne({
          chatbotId,
          name: childName
        });
        
        if (child) {
          child.parentTopic = topic.parentTopic || null;
          child.updatedAt = new Date();
          await child.save();
        }
      }
      
      // Update related topics
      for (const relatedTopic of topic.relatedTopics) {
        const related = await Topic.findOne({
          chatbotId,
          name: relatedTopic.name
        });
        
        if (related) {
          related.relatedTopics = related.relatedTopics.filter(rt => rt.name !== name);
          related.updatedAt = new Date();
          await related.save();
        }
      }
      
      // Delete topic
      await Topic.deleteOne({
        chatbotId,
        name
      });
      
      logger.info(`Deleted topic ${name} for chatbot ${chatbotId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting topic ${name}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Add related topic
   * @param {string} chatbotId - Chatbot ID
   * @param {string} sourceName - Source topic name
   * @param {string} targetName - Target topic name
   * @param {number} relationStrength - Relation strength (0-1)
   * @returns {Promise<Object>} - Updated source topic
   */
  async addRelatedTopic(chatbotId, sourceName, targetName, relationStrength = 0.5) {
    try {
      // Verify both topics exist
      const [sourceTopic, targetTopic] = await Promise.all([
        Topic.findOne({ chatbotId, name: sourceName }),
        Topic.findOne({ chatbotId, name: targetName })
      ]);
      
      if (!sourceTopic) {
        throw new Error(`Source topic not found: ${sourceName}`);
      }
      
      if (!targetTopic) {
        throw new Error(`Target topic not found: ${targetName}`);
      }
      
      // Check if relation already exists
      const existingRelation = sourceTopic.relatedTopics.find(rt => rt.name === targetName);
      
      if (existingRelation) {
        // Update existing relation
        existingRelation.relationStrength = relationStrength;
      } else {
        // Add new relation
        sourceTopic.relatedTopics.push({
          name: targetName,
          relationStrength
        });
      }
      
      sourceTopic.updatedAt = new Date();
      await sourceTopic.save();
      
      // Add reciprocal relation if it doesn't exist
      const reciprocalRelation = targetTopic.relatedTopics.find(rt => rt.name === sourceName);
      
      if (!reciprocalRelation) {
        targetTopic.relatedTopics.push({
          name: sourceName,
          relationStrength
        });
        
        targetTopic.updatedAt = new Date();
        await targetTopic.save();
      }
      
      logger.info(`Added relation from topic ${sourceName} to ${targetName}`);
      
      return sourceTopic.toObject();
    } catch (error) {
      logger.error(`Error adding related topic:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get topic hierarchy
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Object>} - Topic hierarchy
   */
  async getTopicHierarchy(chatbotId) {
    try {
      const topics = await Topic.find({ chatbotId });
      
      // Build hierarchy
      const hierarchy = {};
      const topLevelTopics = [];
      
      // First pass: create nodes
      for (const topic of topics) {
        hierarchy[topic.name] = {
          name: topic.name,
          description: topic.description,
          children: [],
          related: topic.relatedTopics.map(rt => ({
            name: rt.name,
            strength: rt.relationStrength
          }))
        };
        
        if (!topic.parentTopic) {
          topLevelTopics.push(topic.name);
        }
      }
      
      // Second pass: build tree
      for (const topic of topics) {
        if (topic.parentTopic && hierarchy[topic.parentTopic]) {
          hierarchy[topic.parentTopic].children.push(hierarchy[topic.name]);
        }
      }
      
      // Build result with top-level topics
      const result = topLevelTopics.map(name => hierarchy[name]);
      
      return result;
    } catch (error) {
      logger.error(`Error getting topic hierarchy for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get related topics
   * @param {string} chatbotId - Chatbot ID
   * @param {string} topicName - Topic name
   * @param {number} minStrength - Minimum relation strength
   * @param {number} maxDepth - Maximum depth for related topics traversal
   * @returns {Promise<Array<Object>>} - Related topics
   */
  async getRelatedTopics(chatbotId, topicName, minStrength = 0.3, maxDepth = 2) {
    try {
      const topic = await Topic.findOne({
        chatbotId,
        name: topicName
      });
      
      if (!topic) {
        throw new Error(`Topic not found: ${topicName}`);
      }
      
      // Get directly related topics
      const relatedTopics = topic.relatedTopics
        .filter(rt => rt.relationStrength >= minStrength)
        .map(rt => ({
          name: rt.name,
          relationStrength: rt.relationStrength,
          path: [topicName],
          depth: 1
        }));
      
      // Traverse deeper if needed
      if (maxDepth > 1) {
        const visited = new Set([topicName]);
        const result = [...relatedTopics];
        
        for (let depth = 2; depth <= maxDepth; depth++) {
          const currentDepthTopics = result.filter(rt => rt.depth === depth - 1);
          
          for (const currentTopic of currentDepthTopics) {
            if (visited.has(currentTopic.name)) {
              continue;
            }
            
            visited.add(currentTopic.name);
            
            const nextTopic = await Topic.findOne({
              chatbotId,
              name: currentTopic.name
            });
            
            if (!nextTopic) {
              continue;
            }
            
            for (const related of nextTopic.relatedTopics) {
              if (
                related.relationStrength >= minStrength && 
                !visited.has(related.name) && 
                related.name !== topicName
              ) {
                result.push({
                  name: related.name,
                  relationStrength: related.relationStrength * currentTopic.relationStrength, // Weaken with distance
                  path: [...currentTopic.path, currentTopic.name],
                  depth
                });
              }
            }
          }
        }
        
        // Sort by strength
        result.sort((a, b) => b.relationStrength - a.relationStrength);
        
        return result;
      }
      
      // Sort by strength
      relatedTopics.sort((a, b) => b.relationStrength - a.relationStrength);
      
      return relatedTopics;
    } catch (error) {
      logger.error(`Error getting related topics for ${topicName}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Detect topics in text
   * @param {string} chatbotId - Chatbot ID
   * @param {string} text - Text to analyze
   * @returns {Promise<Array<Object>>} - Detected topics
   */
  async detectTopics(chatbotId, text) {
    try {
      if (!text || typeof text !== 'string') {
        return [];
      }
      
      // Get all topics for the chatbot
      const allTopics = await Topic.find({ chatbotId });
      
      if (allTopics.length === 0) {
        return [];
      }
      
      const detectedTopics = [];
      const lowercaseText = text.toLowerCase();
      
      // Check for topic names and keywords in text
      for (const topic of allTopics) {
        let detected = false;
        let confidence = 0;
        
        // Check topic name
        if (lowercaseText.includes(topic.name.toLowerCase())) {
          detected = true;
          confidence = Math.max(confidence, 0.8);
        }
        
        // Check keywords
        for (const keyword of topic.keywords) {
          if (lowercaseText.includes(keyword.toLowerCase())) {
            detected = true;
            confidence = Math.max(confidence, 0.6);
          }
        }
        
        if (detected && confidence >= this.topicDetectionThreshold) {
          detectedTopics.push({
            name: topic.name,
            confidence
          });
        }
      }
      
      return detectedTopics;
    } catch (error) {
      logger.error(`Error detecting topics in text:`, error.message);
      return [];
    }
  }
  
  /**
   * Track topics in conversation
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {Array<Object>} detectedTopics - Detected topics
   * @returns {Promise<Array<Object>>} - Updated active topics
   */
  async trackTopics(chatbotId, userId, conversationId, detectedTopics) {
    try {
      if (!detectedTopics || detectedTopics.length === 0) {
        return [];
      }
      
      // Find existing tracking
      let tracking = await TopicTracking.findOne({
        chatbotId,
        userId,
        conversationId
      });
      
      if (!tracking) {
        // Create new tracking
        tracking = new TopicTracking({
          chatbotId,
          userId,
          conversationId,
          topics: []
        });
      }
      
      const now = new Date();
      
      // Update tracked topics
      for (const detectedTopic of detectedTopics) {
        const existingTopic = tracking.topics.find(t => t.name === detectedTopic.name);
        
        if (existingTopic) {
          // Update existing topic
          existingTopic.confidence = Math.max(existingTopic.confidence, detectedTopic.confidence);
          existingTopic.lastMentionedAt = now;
          existingTopic.mentionCount += 1;
        } else {
          // Add new topic
          tracking.topics.push({
            name: detectedTopic.name,
            confidence: detectedTopic.confidence,
            firstMentionedAt: now,
            lastMentionedAt: now,
            mentionCount: 1
          });
        }
      }
      
      // Sort by mention count and recency
      tracking.topics.sort((a, b) => {
        // First sort by mention count
        const countDiff = b.mentionCount - a.mentionCount;
        if (countDiff !== 0) return countDiff;
        
        // Then by recency
        return b.lastMentionedAt - a.lastMentionedAt;
      });
      
      // Limit to max topics
      if (tracking.topics.length > this.maxTopicsPerConversation) {
        tracking.topics = tracking.topics.slice(0, this.maxTopicsPerConversation);
      }
      
      tracking.updatedAt = now;
      await tracking.save();
      
      return tracking.topics;
    } catch (error) {
      logger.error(`Error tracking topics for conversation ${conversationId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get active topics for a conversation
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Array<Object>>} - Active topics
   */
  async getActiveTopics(chatbotId, userId, conversationId) {
    try {
      const tracking = await TopicTracking.findOne({
        chatbotId,
        userId,
        conversationId
      });
      
      if (!tracking) {
        return [];
      }
      
      return tracking.topics;
    } catch (error) {
      logger.error(`Error getting active topics for conversation ${conversationId}:`, error.message);
      throw error;
    }
  }
}

// Create singleton instance
const topicDetectionService = new TopicDetectionService();

module.exports = topicDetectionService;
