/**
 * Knowledge Base Schema
 * 
 * Defines the structure for knowledge bases that can be attached to chatbots
 */

const mongoose = require('mongoose');

// Schema for individual knowledge items
const KnowledgeItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Knowledge item title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Knowledge item content is required']
  },
  tags: {
    type: [String],
    default: []
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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

// Pre-save hook to update the updatedAt field
KnowledgeItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Main Knowledge Base Schema
const KnowledgeBaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Knowledge base name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: [true, 'Chatbot ID is required']
  },
  items: [KnowledgeItemSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      retrievalMethod: 'semantic', // Options: 'semantic', 'keyword', 'hybrid'
      relevanceThreshold: 0.7,     // Minimum relevance score (0-1) for including knowledge
      maxResults: 5                // Maximum number of knowledge items to retrieve
    }
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

// Pre-save hook to update the updatedAt field
KnowledgeBaseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add a knowledge item
KnowledgeBaseSchema.methods.addItem = function(itemData) {
  this.items.push(itemData);
  return this.save();
};

// Method to remove a knowledge item
KnowledgeBaseSchema.methods.removeItem = function(itemId) {
  this.items.id(itemId).remove();
  return this.save();
};

// Method to update a knowledge item
KnowledgeBaseSchema.methods.updateItem = function(itemId, itemData) {
  const item = this.items.id(itemId);
  if (!item) return null;
  
  Object.keys(itemData).forEach(key => {
    item[key] = itemData[key];
  });
  
  return this.save();
};

// Method to search for knowledge items
KnowledgeBaseSchema.methods.searchItems = function(query, options = {}) {
  const { tags, limit = 10 } = options;
  
  // Filter by tags if provided
  let filteredItems = this.items;
  if (tags && tags.length > 0) {
    filteredItems = filteredItems.filter(item => {
      return tags.some(tag => item.tags.includes(tag));
    });
  }
  
  // Simple keyword search (in a real implementation, this would be more sophisticated)
  const searchResults = filteredItems.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
    const contentMatch = item.content.toLowerCase().includes(query.toLowerCase());
    return titleMatch || contentMatch;
  });
  
  return searchResults.slice(0, limit);
};

// Create and export the model
const KnowledgeBase = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);

module.exports = KnowledgeBase;
