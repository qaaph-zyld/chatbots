/**
 * Topic Model
 * 
 * Represents topics that can be detected and tracked across conversations.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TopicSchema = new Schema({
  // Topic name
  name: {
    type: String,
    required: true,
    index: true
  },
  
  // Confidence score for this topic (0-1)
  confidence: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  },
  
  // Keywords associated with this topic
  keywords: {
    type: [String],
    default: []
  },
  
  // Additional topic metadata (flexible schema)
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // User who owns this topic
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Chatbot this topic belongs to
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
TopicSchema.index({ userId: 1, chatbotId: 1, name: 1 });

module.exports = mongoose.model('Topic', TopicSchema);
