const mongoose = require('mongoose');

const chatbotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  engine: {
    type: String,
    required: true,
    enum: ['botpress', 'huggingface', 'openai', 'custom'],
    default: 'botpress'
  },
  engineConfig: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(config) {
        // Basic validation - ensure config is an object
        return typeof config === 'object' && config !== null;
      },
      message: 'Engine configuration must be a valid object'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    welcomeMessage: {
      type: String,
      default: 'Hello! How can I help you today?'
    },
    fallbackMessage: {
      type: String,
      default: 'I\'m sorry, I didn\'t understand that. Could you please rephrase?'
    },
    maxConversationLength: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000
    },
    enableSentimentAnalysis: {
      type: Boolean,
      default: true
    },
    enableAnalytics: {
      type: Boolean,
      default: true
    },
    responseTimeout: {
      type: Number,
      default: 30000, // 30 seconds
      min: 1000,
      max: 120000
    }
  },
  knowledgeBase: [{
    title: String,
    content: String,
    tags: [String],
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  trainingData: [{
    input: String,
    output: String,
    intent: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  analytics: {
    totalConversations: {
      type: Number,
      default: 0
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0
    },
    satisfactionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    lastInteraction: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
chatbotSchema.index({ createdBy: 1, isActive: 1 });
chatbotSchema.index({ engine: 1 });
chatbotSchema.index({ 'knowledgeBase.tags': 1 });

// Virtual for conversation count
chatbotSchema.virtual('conversationCount', {
  ref: 'Conversation',
  localField: '_id',
  foreignField: 'chatbotId',
  count: true
});

// Pre-save middleware to update timestamps
chatbotSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
chatbotSchema.methods.addKnowledgeBaseEntry = function(entry) {
  this.knowledgeBase.push({
    title: entry.title,
    content: entry.content,
    tags: entry.tags || [],
    priority: entry.priority || 1
  });
  return this.save();
};

chatbotSchema.methods.addTrainingData = function(data) {
  this.trainingData.push({
    input: data.input,
    output: data.output,
    intent: data.intent,
    confidence: data.confidence
  });
  return this.save();
};

chatbotSchema.methods.updateAnalytics = function(metrics) {
  Object.assign(this.analytics, metrics);
  this.analytics.lastInteraction = new Date();
  return this.save();
};

// Static methods
chatbotSchema.statics.findActiveByUser = function(userId) {
  return this.find({ createdBy: userId, isActive: true });
};

chatbotSchema.statics.findByEngine = function(engine) {
  return this.find({ engine, isActive: true });
};

module.exports = mongoose.model('Chatbot', chatbotSchema);
