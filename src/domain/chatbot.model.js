/**
 * Chatbot Model
 * 
 * Mongoose model for chatbot configuration
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Chatbot Schema
 */
const chatbotSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['customer-support', 'sales', 'personal-assistant', 'knowledge-base', 'custom'],
    default: 'custom'
  },
  engine: {
    type: String,
    enum: ['botpress', 'huggingface', 'openai', 'azure', 'custom'],
    default: 'botpress'
  },
  engineConfig: {
    type: Object,
    default: {}
  },
  personality: {
    type: Object,
    default: {
      tone: 'professional',
      style: 'helpful',
      knowledge: 'general'
    }
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  integrations: [{
    type: Schema.Types.ObjectId,
    ref: 'Integration'
  }],
  knowledgeBase: {
    type: Schema.Types.ObjectId,
    ref: 'KnowledgeBase'
  },
  trainingData: {
    type: Schema.Types.ObjectId,
    ref: 'TrainingData'
  },
  settings: {
    type: Object,
    default: {
      maxTokens: 2048,
      temperature: 0.7,
      contextLength: 10,
      welcomeMessage: 'Hello! How can I help you today?'
    }
  },
  stats: {
    conversations: {
      type: Number,
      default: 0
    },
    messages: {
      type: Number,
      default: 0
    },
    uniqueUsers: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Indexes
chatbotSchema.index({ name: 1, ownerId: 1 }, { unique: true });
chatbotSchema.index({ isPublic: 1 });
chatbotSchema.index({ isActive: 1 });
chatbotSchema.index({ type: 1 });

// Virtual for public URL
chatbotSchema.virtual('publicUrl').get(function() {
  return `/chatbot/${this._id}`;
});

// Method to check if user has access to this chatbot
chatbotSchema.methods.hasAccess = function(userId) {
  return (
    this.ownerId.toString() === userId.toString() ||
    this.isPublic ||
    this.allowedUsers.some(id => id.toString() === userId.toString())
  );
};

// Statics
chatbotSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { ownerId: userId },
      { allowedUsers: userId },
      { isPublic: true }
    ]
  });
};

chatbotSchema.statics.findPublic = function() {
  return this.find({ isPublic: true, isActive: true });
};

// Create the model
const Chatbot = mongoose.model('Chatbot', chatbotSchema);

module.exports = Chatbot;
