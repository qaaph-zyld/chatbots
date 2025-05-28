/**
 * Topic Service
 * 
 * Provides topic tracking and management capabilities for chatbots
 */

const mongoose = require('mongoose');
const { logger } = require('../utils');
const contextService = require('./context.service');

// Define topic schema
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
  relatedEntities: [String],
  parentTopic: {
    type: String,
    default: null
  },
  childTopics: [String],
  defaultResponse: String,
  examples: [String],
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
const Topic = mongoose.model('Topic', TopicSchema);

/**
 * Topic Service class
 */
class TopicService {
  /**
   * Constructor
   */
  constructor() {
    this.topicSwitchThreshold = 0.7; // Minimum confidence to switch topics
    this.topicRetentionTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    logger.info('Topic Service initialized');
  }
  
  /**
   * Create a new topic
   * @param {Object} topicData - Topic data
   * @returns {Promise<Object>} - Created topic
   */
  async createTopic(topicData) {
    try {
      const { chatbotId, name, description, keywords, relatedEntities, parentTopic, defaultResponse, examples } = topicData;
      
      // Check if topic already exists
      const existingTopic = await Topic.findOne({
        chatbotId,
        name
      });
      
      if (existingTopic) {
        throw new Error(`Topic '${name}' already exists for this chatbot`);
      }
      
      // Create new topic
      const topic = new Topic({
        chatbotId,
        name,
        description,
        keywords: keywords || [],
        relatedEntities: relatedEntities || [],
        parentTopic: parentTopic || null,
        defaultResponse,
        examples: examples || []
      });
      
      // If parent topic is specified, add this topic as a child
      if (parentTopic) {
        const parent = await Topic.findOne({
          chatbotId,
          name: parentTopic
        });
        
        if (parent) {
          if (!parent.childTopics.includes(name)) {
            parent.childTopics.push(name);
            await parent.save();
          }
        }
      }
      
      await topic.save();
      logger.info(`Created new topic '${name}' for chatbot ${chatbotId}`);
      
      return topic;
    } catch (error) {
      logger.error('Error creating topic:', error.message);
      throw error;
    }
  }
  
  /**
   * Get topic by name
   * @param {string} chatbotId - Chatbot ID
   * @param {string} name - Topic name
   * @returns {Promise<Object>} - Topic object
   */
  async getTopicByName(chatbotId, name) {
    try {
      return await Topic.findOne({
        chatbotId,
        name
      });
    } catch (error) {
      logger.error(`Error getting topic '${name}' for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get all topics for a chatbot
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array>} - Topics
   */
  async getAllTopics(chatbotId) {
    try {
      return await Topic.find({ chatbotId });
    } catch (error) {
      logger.error(`Error getting topics for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Update a topic
   * @param {string} chatbotId - Chatbot ID
   * @param {string} name - Topic name
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated topic
   */
  async updateTopic(chatbotId, name, updateData) {
    try {
      const topic = await Topic.findOne({
        chatbotId,
        name
      });
      
      if (!topic) {
        throw new Error(`Topic '${name}' not found for chatbot ${chatbotId}`);
      }
      
      // Update fields
      if (updateData.description) topic.description = updateData.description;
      if (updateData.keywords) topic.keywords = updateData.keywords;
      if (updateData.relatedEntities) topic.relatedEntities = updateData.relatedEntities;
      if (updateData.defaultResponse) topic.defaultResponse = updateData.defaultResponse;
      if (updateData.examples) topic.examples = updateData.examples;
      
      // Handle parent topic change
      if (updateData.parentTopic !== undefined && updateData.parentTopic !== topic.parentTopic) {
        // Remove from old parent's children
        if (topic.parentTopic) {
          const oldParent = await Topic.findOne({
            chatbotId,
            name: topic.parentTopic
          });
          
          if (oldParent) {
            oldParent.childTopics = oldParent.childTopics.filter(child => child !== name);
            await oldParent.save();
          }
        }
        
        // Add to new parent's children
        if (updateData.parentTopic) {
          const newParent = await Topic.findOne({
            chatbotId,
            name: updateData.parentTopic
          });
          
          if (newParent) {
            if (!newParent.childTopics.includes(name)) {
              newParent.childTopics.push(name);
              await newParent.save();
            }
          }
        }
        
        topic.parentTopic = updateData.parentTopic || null;
      }
      
      // Update metadata
      if (updateData.metadata) {
        for (const [key, value] of Object.entries(updateData.metadata)) {
          topic.metadata.set(key, value);
        }
      }
      
      topic.updatedAt = new Date();
      await topic.save();
      
      logger.info(`Updated topic '${name}' for chatbot ${chatbotId}`);
      
      return topic;
    } catch (error) {
      logger.error(`Error updating topic '${name}' for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Delete a topic
   * @param {string} chatbotId - Chatbot ID
   * @param {string} name - Topic name
   * @returns {Promise<boolean>} - True if deleted
   */
  async deleteTopic(chatbotId, name) {
    try {
      const topic = await Topic.findOne({
        chatbotId,
        name
      });
      
      if (!topic) {
        throw new Error(`Topic '${name}' not found for chatbot ${chatbotId}`);
      }
      
      // Remove from parent's children
      if (topic.parentTopic) {
        const parent = await Topic.findOne({
          chatbotId,
          name: topic.parentTopic
        });
        
        if (parent) {
          parent.childTopics = parent.childTopics.filter(child => child !== name);
          await parent.save();
        }
      }
      
      // Update children to remove parent reference
      for (const childName of topic.childTopics) {
        const child = await Topic.findOne({
          chatbotId,
          name: childName
        });
        
        if (child) {
          child.parentTopic = null;
          await child.save();
        }
      }
      
      // Delete topic
      await Topic.deleteOne({
        chatbotId,
        name
      });
      
      logger.info(`Deleted topic '${name}' for chatbot ${chatbotId}`);
      
      return true;
    } catch (error) {
      logger.error(`Error deleting topic '${name}' for chatbot ${chatbotId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Detect topics in a message
   * @param {string} chatbotId - Chatbot ID
   * @param {string} message - Message text
   * @param {Object} nlpAnalysis - NLP analysis results
   * @returns {Promise<Array>} - Detected topics with confidence scores
   */
  async detectTopics(chatbotId, message, nlpAnalysis) {
    try {
      // Get all topics for this chatbot
      const allTopics = await this.getAllTopics(chatbotId);
      const detectedTopics = [];
      
      // Use intent from NLP analysis if available
      if (nlpAnalysis && nlpAnalysis.intent) {
        const topicByIntent = allTopics.find(topic => 
          topic.name.toLowerCase() === nlpAnalysis.intent.toLowerCase()
        );
        
        if (topicByIntent) {
          detectedTopics.push({
            name: topicByIntent.name,
            confidence: nlpAnalysis.intentConfidence || 0.8,
            source: 'intent'
          });
        }
      }
      
      // Check for keyword matches
      const messageLower = message.toLowerCase();
      
      for (const topic of allTopics) {
        // Skip if already detected by intent
        if (detectedTopics.some(t => t.name === topic.name)) {
          continue;
        }
        
        // Check keywords
        for (const keyword of topic.keywords) {
          if (messageLower.includes(keyword.toLowerCase())) {
            detectedTopics.push({
              name: topic.name,
              confidence: 0.7, // Default confidence for keyword match
              source: 'keyword',
              keyword
            });
            break;
          }
        }
      }
      
      // Check for entity matches
      if (nlpAnalysis && nlpAnalysis.entities && nlpAnalysis.entities.length > 0) {
        for (const topic of allTopics) {
          // Skip if already detected
          if (detectedTopics.some(t => t.name === topic.name)) {
            continue;
          }
          
          // Check related entities
          for (const entity of nlpAnalysis.entities) {
            const entityId = `${entity.type}:${entity.value}`;
            
            if (topic.relatedEntities.includes(entityId) || 
                topic.relatedEntities.includes(entity.type)) {
              detectedTopics.push({
                name: topic.name,
                confidence: 0.6, // Default confidence for entity match
                source: 'entity',
                entity: entityId
              });
              break;
            }
          }
        }
      }
      
      // Sort by confidence
      detectedTopics.sort((a, b) => b.confidence - a.confidence);
      
      return detectedTopics;
    } catch (error) {
      logger.error(`Error detecting topics for chatbot ${chatbotId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Track topic for a conversation
   * @param {string} chatbotId - Chatbot ID
   * @param {string} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {string} message - Message text
   * @param {Object} nlpAnalysis - NLP analysis results
   * @returns {Promise<Object>} - Current topic information
   */
  async trackTopic(chatbotId, userId, conversationId, message, nlpAnalysis) {
    try {
      // Detect topics in message
      const detectedTopics = await this.detectTopics(chatbotId, message, nlpAnalysis);
      
      // Get current context
      const context = await contextService.getContext(chatbotId, userId, conversationId);
      
      // Get current active topics from context
      const activeTopics = context.topics || [];
      
      // Determine if we should switch topics
      let currentTopic = null;
      
      if (detectedTopics.length > 0 && detectedTopics[0].confidence >= this.topicSwitchThreshold) {
        // High confidence in a new topic, switch to it
        currentTopic = detectedTopics[0];
      } else if (activeTopics.length > 0) {
        // Check if the most recent active topic is still relevant
        const mostRecentTopic = activeTopics.sort((a, b) => 
          new Date(b.lastMentionedAt) - new Date(a.lastMentionedAt)
        )[0];
        
        // Check if topic is still recent enough
        const topicAge = new Date() - new Date(mostRecentTopic.lastMentionedAt);
        
        if (topicAge <= this.topicRetentionTime) {
          // Topic is still recent, keep it
          currentTopic = {
            name: mostRecentTopic.name,
            confidence: mostRecentTopic.confidence,
            source: 'context'
          };
        } else if (detectedTopics.length > 0) {
          // Topic is old, switch to new detected topic
          currentTopic = detectedTopics[0];
        }
      } else if (detectedTopics.length > 0) {
        // No active topics, use detected topic
        currentTopic = detectedTopics[0];
      }
      
      // Update context with detected topics
      if (detectedTopics.length > 0) {
        await contextService.updateContext(chatbotId, userId, conversationId, {
          topics: detectedTopics.map(topic => ({
            name: topic.name,
            confidence: topic.confidence
          }))
        });
      }
      
      return {
        currentTopic: currentTopic ? currentTopic.name : null,
        confidence: currentTopic ? currentTopic.confidence : 0,
        detectedTopics,
        activeTopics: activeTopics.map(topic => topic.name)
      };
    } catch (error) {
      logger.error(`Error tracking topic for chatbot ${chatbotId}, conversation ${conversationId}:`, error.message);
      return {
        currentTopic: null,
        confidence: 0,
        detectedTopics: [],
        activeTopics: []
      };
    }
  }
  
  /**
   * Get topic hierarchy
   * @param {string} chatbotId - Chatbot ID
   * @returns {Promise<Array>} - Topic hierarchy
   */
  async getTopicHierarchy(chatbotId) {
    try {
      const allTopics = await this.getAllTopics(chatbotId);
      
      // Find root topics (no parent)
      const rootTopics = allTopics.filter(topic => !topic.parentTopic);
      
      // Build hierarchy recursively
      const buildHierarchy = (topic) => {
        const children = allTopics.filter(t => t.parentTopic === topic.name);
        
        return {
          name: topic.name,
          description: topic.description,
          children: children.map(buildHierarchy)
        };
      };
      
      return rootTopics.map(buildHierarchy);
    } catch (error) {
      logger.error(`Error getting topic hierarchy for chatbot ${chatbotId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Get related topics
   * @param {string} chatbotId - Chatbot ID
   * @param {string} topicName - Topic name
   * @returns {Promise<Array>} - Related topics
   */
  async getRelatedTopics(chatbotId, topicName) {
    try {
      const topic = await this.getTopicByName(chatbotId, topicName);
      
      if (!topic) {
        return [];
      }
      
      const allTopics = await this.getAllTopics(chatbotId);
      const relatedTopics = [];
      
      // Add parent topic
      if (topic.parentTopic) {
        const parent = allTopics.find(t => t.name === topic.parentTopic);
        if (parent) {
          relatedTopics.push({
            name: parent.name,
            relationship: 'parent',
            description: parent.description
          });
        }
      }
      
      // Add child topics
      for (const childName of topic.childTopics) {
        const child = allTopics.find(t => t.name === childName);
        if (child) {
          relatedTopics.push({
            name: child.name,
            relationship: 'child',
            description: child.description
          });
        }
      }
      
      // Add sibling topics (topics with same parent)
      if (topic.parentTopic) {
        const siblings = allTopics.filter(t => 
          t.parentTopic === topic.parentTopic && t.name !== topic.name
        );
        
        for (const sibling of siblings) {
          relatedTopics.push({
            name: sibling.name,
            relationship: 'sibling',
            description: sibling.description
          });
        }
      }
      
      return relatedTopics;
    } catch (error) {
      logger.error(`Error getting related topics for '${topicName}', chatbot ${chatbotId}:`, error.message);
      return [];
    }
  }
  
  /**
   * Get topic response
   * @param {string} chatbotId - Chatbot ID
   * @param {string} topicName - Topic name
   * @returns {Promise<string|null>} - Default response for topic
   */
  async getTopicResponse(chatbotId, topicName) {
    try {
      const topic = await this.getTopicByName(chatbotId, topicName);
      
      if (!topic || !topic.defaultResponse) {
        return null;
      }
      
      return topic.defaultResponse;
    } catch (error) {
      logger.error(`Error getting topic response for '${topicName}', chatbot ${chatbotId}:`, error.message);
      return null;
    }
  }
}

// Create singleton instance
const topicService = new TopicService();

module.exports = topicService;
