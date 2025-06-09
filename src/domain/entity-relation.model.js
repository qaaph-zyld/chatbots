/**
 * Entity Relation Model
 * 
 * Represents relationships between entities across conversations,
 * such as "person works at organization" or "person visited location".
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EntityRelationSchema = new Schema({
  // Source entity ID
  sourceEntityId: {
    type: Schema.Types.ObjectId,
    ref: 'Entity',
    required: true,
    index: true
  },
  
  // Target entity ID
  targetEntityId: {
    type: Schema.Types.ObjectId,
    ref: 'Entity',
    required: true,
    index: true
  },
  
  // Relation type (e.g., "works_at", "visited", "knows")
  relationType: {
    type: String,
    required: true,
    index: true
  },
  
  // Confidence score for this relation (0-1)
  confidence: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  },
  
  // Additional relation metadata (flexible schema)
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // User who owns this relation
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Chatbot this relation belongs to
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
EntityRelationSchema.index({ userId: 1, chatbotId: 1, sourceEntityId: 1 });
EntityRelationSchema.index({ userId: 1, chatbotId: 1, targetEntityId: 1 });
EntityRelationSchema.index({ userId: 1, chatbotId: 1, relationType: 1 });
EntityRelationSchema.index({ sourceEntityId: 1, targetEntityId: 1, relationType: 1 });

module.exports = mongoose.model('EntityRelation', EntityRelationSchema);
