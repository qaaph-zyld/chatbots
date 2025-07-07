/**
 * Entity Reference Model
 * 
 * Tracks when and where entities are referenced in conversations,
 * allowing for cross-conversation entity tracking.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EntityReferenceSchema = new Schema({
  // Referenced entity ID
  entityId: {
    type: Schema.Types.ObjectId,
    ref: 'Entity',
    required: true,
    index: true
  },
  
  // Conversation where the entity was referenced
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  
  // User who owns this reference
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Chatbot this reference belongs to
  chatbotId: {
    type: String,
    required: true,
    index: true
  },
  
  // Context of the reference (e.g., "mentioned", "asked about", etc.)
  context: {
    type: String,
    default: 'mentioned in conversation'
  },
  
  // Timestamp of the reference
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Create compound indexes for efficient querying
EntityReferenceSchema.index({ userId: 1, chatbotId: 1, conversationId: 1 });
EntityReferenceSchema.index({ entityId: 1, conversationId: 1 });
EntityReferenceSchema.index({ userId: 1, entityId: 1 });

module.exports = mongoose.model('EntityReference', EntityReferenceSchema);
