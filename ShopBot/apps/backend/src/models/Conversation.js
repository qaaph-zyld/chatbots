const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: false,
    index: true
  },
  messages: [{
    messageId: {
      type: String,
      required: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['user', 'bot', 'system'],
      required: true
    },
    content: {
      text: String,
      attachments: [{
        type: {
          type: String,
          enum: ['image', 'file', 'link', 'card']
        },
        url: String,
        title: String,
        description: String,
        metadata: mongoose.Schema.Types.Mixed
      }],
      quickReplies: [String],
      cards: [{
        title: String,
        subtitle: String,
        imageUrl: String,
        buttons: [{
          title: String,
          type: {
            type: String,
            enum: ['postback', 'web_url', 'phone_number']
          },
          value: String
        }]
      }]
    },
    intent: {
      name: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      }
    },
    entities: [{
      name: String,
      value: mongoose.Schema.Types.Mixed,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    sentiment: {
      score: {
        type: Number,
        min: -1,
        max: 1
      },
      magnitude: {
        type: Number,
        min: 0,
        max: 1
      },
      label: {
        type: String,
        enum: ['positive', 'negative', 'neutral']
      }
    },
    metadata: {
      processingTime: Number, // milliseconds
      engineResponse: mongoose.Schema.Types.Mixed,
      errorCode: String,
      errorMessage: String,
      retryCount: {
        type: Number,
        default: 0
      }
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  }],
  summary: {
    totalMessages: {
      type: Number,
      default: 0
    },
    userMessages: {
      type: Number,
      default: 0
    },
    botMessages: {
      type: Number,
      default: 0
    },
    averageResponseTime: Number,
    resolvedIntents: [String],
    extractedEntities: [{
      name: String,
      values: [mongoose.Schema.Types.Mixed],
      frequency: Number
    }],
    overallSentiment: {
      score: Number,
      label: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned', 'escalated'],
    default: 'active'
  },
  tags: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
conversationSchema.index({ sessionId: 1, chatbotId: 1 });
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ status: 1, createdAt: -1 });
conversationSchema.index({ 'messages.timestamp': -1 });
conversationSchema.index({ tags: 1 });

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Update summary statistics
  this.summary.totalMessages = this.messages.length;
  this.summary.userMessages = this.messages.filter(m => m.type === 'user').length;
  this.summary.botMessages = this.messages.filter(m => m.type === 'bot').length;
  
  // Calculate average response time
  const botMessages = this.messages.filter(m => m.type === 'bot' && m.metadata.processingTime);
  if (botMessages.length > 0) {
    this.summary.averageResponseTime = botMessages.reduce((sum, m) => sum + m.metadata.processingTime, 0) / botMessages.length;
  }
  
  // Extract resolved intents
  const intents = this.messages
    .filter(m => m.intent && m.intent.name)
    .map(m => m.intent.name);
  this.summary.resolvedIntents = [...new Set(intents)];
  
  // Calculate overall sentiment
  const sentimentScores = this.messages
    .filter(m => m.sentiment && m.sentiment.score !== undefined)
    .map(m => m.sentiment.score);
  
  if (sentimentScores.length > 0) {
    const avgScore = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
    this.summary.overallSentiment = {
      score: avgScore,
      label: avgScore > 0.1 ? 'positive' : avgScore < -0.1 ? 'negative' : 'neutral'
    };
  }
  
  next();
});

// Instance methods
conversationSchema.methods.addMessage = function(messageData) {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const message = {
    messageId,
    type: messageData.type,
    content: messageData.content,
    intent: messageData.intent,
    entities: messageData.entities || [],
    sentiment: messageData.sentiment,
    metadata: messageData.metadata || {},
    timestamp: new Date()
  };
  
  this.messages.push(message);
  return this.save();
};

conversationSchema.methods.getLastMessage = function() {
  return this.messages[this.messages.length - 1];
};

conversationSchema.methods.getMessagesByType = function(type) {
  return this.messages.filter(m => m.type === type);
};

conversationSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

conversationSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

conversationSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  return this.save();
};

conversationSchema.methods.markAsAbandoned = function() {
  this.status = 'abandoned';
  return this.save();
};

// Static methods
conversationSchema.statics.findBySession = function(sessionId) {
  return this.findOne({ sessionId }).populate('chatbotId');
};

conversationSchema.statics.findByChatbot = function(chatbotId, limit = 50) {
  return this.find({ chatbotId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('chatbotId');
};

conversationSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('chatbotId');
};

conversationSchema.statics.createConversation = function(sessionId, chatbotId, userId) {
  return this.create({
    sessionId,
    chatbotId,
    userId,
    messages: [],
    status: 'active'
  });
};

conversationSchema.statics.getAnalytics = function(chatbotId, dateRange = {}) {
  const matchStage = { chatbotId: new mongoose.Types.ObjectId(chatbotId) };
  
  if (dateRange.start || dateRange.end) {
    matchStage.createdAt = {};
    if (dateRange.start) matchStage.createdAt.$gte = new Date(dateRange.start);
    if (dateRange.end) matchStage.createdAt.$lte = new Date(dateRange.end);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        totalMessages: { $sum: '$summary.totalMessages' },
        averageMessagesPerConversation: { $avg: '$summary.totalMessages' },
        averageResponseTime: { $avg: '$summary.averageResponseTime' },
        sentimentDistribution: {
          $push: '$summary.overallSentiment.label'
        },
        statusDistribution: {
          $push: '$status'
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Conversation', conversationSchema);
