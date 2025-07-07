/**
 * Usage Model
 * 
 * Stores individual usage records for chatbots
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usageSchema = new Schema({
  // Type of usage record
  type: {
    type: String,
    enum: ['message', 'session', 'error', 'feedback', 'integration'],
    required: true,
    index: true
  },
  
  // Chatbot ID
  chatbotId: {
    type: Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true,
    index: true
  },
  
  // User ID
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Platform (web, slack, etc.)
  platform: {
    type: String,
    index: true
  },
  
  // Integration ID (if applicable)
  integrationId: {
    type: Schema.Types.ObjectId,
    ref: 'Integration',
    index: true
  },
  
  // Session ID (if applicable)
  sessionId: {
    type: String,
    index: true
  },
  
  // Message content (if type is message)
  message: {
    content: String,
    role: {
      type: String,
      enum: ['user', 'assistant', 'system']
    },
    tokens: Number
  },
  
  // Error details (if type is error)
  error: {
    code: String,
    message: String,
    stack: String
  },
  
  // Feedback details (if type is feedback)
  feedback: {
    rating: Number,
    comment: String
  },
  
  // Additional metadata
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Create compound indexes for common queries
usageSchema.index({ chatbotId: 1, type: 1, timestamp: -1 });
usageSchema.index({ chatbotId: 1, userId: 1, timestamp: -1 });
usageSchema.index({ chatbotId: 1, platform: 1, timestamp: -1 });

module.exports = mongoose.model('Usage', usageSchema);
