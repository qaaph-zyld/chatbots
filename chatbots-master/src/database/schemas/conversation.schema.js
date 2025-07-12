/**
 * Conversation Schema
 * 
 * Mongoose schema for chatbot conversations
 */

const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: [true, 'Sender is required']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const ConversationSchema = new mongoose.Schema({
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: [true, 'Chatbot ID is required']
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true
  },
  userId: {
    type: String,
    default: 'anonymous'
  },
  messages: [MessageSchema],
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Create index for faster queries
ConversationSchema.index({ chatbotId: 1, sessionId: 1 });
ConversationSchema.index({ userId: 1 });
ConversationSchema.index({ startedAt: 1 });
ConversationSchema.index({ lastMessageAt: 1 });

// Pre-save hook to update lastMessageAt timestamp
ConversationSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    this.lastMessageAt = Date.now();
  }
  next();
});

// Method to add a message to the conversation
ConversationSchema.methods.addMessage = function(text, sender, metadata = {}) {
  this.messages.push({
    text,
    sender,
    timestamp: Date.now(),
    metadata
  });
  this.lastMessageAt = Date.now();
  return this.save();
};

// Method to get the last message in the conversation
ConversationSchema.methods.getLastMessage = function() {
  if (this.messages && this.messages.length > 0) {
    return this.messages[this.messages.length - 1];
  }
  return null;
};

module.exports = mongoose.model('Conversation', ConversationSchema);
