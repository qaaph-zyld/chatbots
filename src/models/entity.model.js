/**
 * Entity Model
 * 
 * Represents entities that can be tracked across conversations,
 * such as people, places, organizations, etc.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EntitySchema = new Schema({
  // Entity type (person, location, organization, etc.)
  type: {
    type: String,
    required: true,
    index: true
  },
  
  // Entity name
  name: {
    type: String,
    required: true,
    index: true
  },
  
  // Alternative names/identifiers for this entity
  aliases: {
    type: [String],
    default: []
  },
  
  // Confidence score for this entity (0-1)
  confidence: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  },
  
  // Additional entity metadata (flexible schema)
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // User who owns this entity
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Chatbot this entity belongs to
  chatbotId: {
    type: String,
    required: true,
    index: true
  },
  
  // Creation timestamp
  created: {
    type: Date,
    default: Date.now
  },
  
  // Last update timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
EntitySchema.index({ userId: 1, chatbotId: 1, type: 1 });
EntitySchema.index({ userId: 1, chatbotId: 1, name: 1 });

module.exports = mongoose.model('Entity', EntitySchema);
