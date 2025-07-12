/**
 * Conversation Model
 * 
 * Mongoose model for chatbot conversations
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Message Schema (Subdocument)
 */
const messageSchema = new Schema({
  sender: {
    type: String,
    enum: ['user', 'bot', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'file', 'rich'],
    default: 'text'
  },
  metadata: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

/**
 * Conversation Schema
 */
const conversationSchema = new Schema({
  chatbotId: {
    type: Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  sessionId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'abandoned'],
    default: 'active'
  },
  channel: {
    type: String,
    enum: ['web', 'mobile', 'api', 'widget', 'messenger', 'whatsapp', 'slack', 'telegram', 'other'],
    default: 'web'
  },
  messages: [messageSchema],
  context: {
    type: Object,
    default: {}
  },
  metadata: {
    type: Object,
    default: {}
  },
  metrics: {
    duration: {
      type: Number,
      default: 0
    },
    messageCount: {
      type: Number,
      default: 0
    },
    userMessageCount: {
      type: Number,
      default: 0
    },
    botMessageCount: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    timestamp: {
      type: Date
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
conversationSchema.index({ chatbotId: 1, sessionId: 1 }, { unique: true });
conversationSchema.index({ userId: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ startedAt: 1 });
conversationSchema.index({ lastActivityAt: 1 });

// Methods
conversationSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.lastActivityAt = new Date();
  
  // Update metrics
  this.metrics.messageCount += 1;
  if (message.sender === 'user') {
    this.metrics.userMessageCount += 1;
  } else if (message.sender === 'bot') {
    this.metrics.botMessageCount += 1;
  }
  
  return this.save();
};

conversationSchema.methods.updateContext = function(contextData) {
  this.context = { ...this.context, ...contextData };
  this.lastActivityAt = new Date();
  return this.save();
};

conversationSchema.methods.endConversation = function(status = 'completed') {
  this.status = status;
  this.endedAt = new Date();
  this.metrics.duration = (this.endedAt - this.startedAt) / 1000; // Duration in seconds
  return this.save();
};

conversationSchema.methods.addFeedback = function(rating, comment = '') {
  this.feedback = {
    rating,
    comment,
    timestamp: new Date()
  };
  return this.save();
};

// Statics
conversationSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ lastActivityAt: -1 });
};

conversationSchema.statics.findActiveByChatbot = function(chatbotId) {
  return this.find({
    chatbotId,
    status: 'active'
  }).sort({ lastActivityAt: -1 });
};

conversationSchema.statics.findRecentByChatbot = function(chatbotId, limit = 10) {
  return this.find({ chatbotId })
    .sort({ lastActivityAt: -1 })
    .limit(limit);
};

// Create the model
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
