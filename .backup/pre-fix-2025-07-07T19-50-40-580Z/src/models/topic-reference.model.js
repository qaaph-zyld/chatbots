/**
 * Topic Reference Model
 * 
 * Tracks when and where topics are detected in conversations,
 * allowing for cross-conversation topic tracking.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TopicReferenceSchema = new Schema({
  // Referenced topic ID
  topicId: {
    type: Schema.Types.ObjectId,
    ref: 'Topic',
    required: true,
    index: true
  },
  
  // Conversation where the topic was detected
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
  
  // Confidence score for this topic reference (0-1)
  confidence: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
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
TopicReferenceSchema.index({ userId: 1, chatbotId: 1, conversationId: 1 });
TopicReferenceSchema.index({ topicId: 1, conversationId: 1 });
TopicReferenceSchema.index({ userId: 1, topicId: 1 });

module.exports = mongoose.model('TopicReference', TopicReferenceSchema);
