const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
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
    required: false, // Anonymous sessions allowed
    index: true
  },
  context: {
    currentIntent: String,
    entities: [{
      name: String,
      value: mongoose.Schema.Types.Mixed,
      confidence: Number
    }],
    variables: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: new Map()
    },
    conversationState: {
      type: String,
      enum: ['active', 'waiting', 'completed', 'abandoned'],
      default: 'active'
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    platform: String,
    language: {
      type: String,
      default: 'en'
    },
    timezone: String,
    location: {
      country: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  analytics: {
    messageCount: {
      type: Number,
      default: 0
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: Date,
    duration: Number, // in milliseconds
    satisfactionRating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    sentimentScores: [{
      timestamp: Date,
      score: {
        type: Number,
        min: -1,
        max: 1
      },
      magnitude: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    averageSentiment: {
      type: Number,
      min: -1,
      max: 1,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Sessions expire after 24 hours of inactivity
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    },
    index: { expireAfterSeconds: 0 }
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
sessionSchema.index({ chatbotId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ 'context.lastActivity': 1 });
sessionSchema.index({ createdAt: -1 });

// Virtual for conversation messages
sessionSchema.virtual('messages', {
  ref: 'Conversation',
  localField: 'sessionId',
  foreignField: 'sessionId'
});

// Pre-save middleware
sessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.context.lastActivity = new Date();
  
  // Update expiration time
  this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  next();
});

// Instance methods
sessionSchema.methods.updateContext = function(updates) {
  Object.assign(this.context, updates);
  this.context.lastActivity = new Date();
  return this.save();
};

sessionSchema.methods.addEntity = function(name, value, confidence = 1) {
  const existingEntity = this.context.entities.find(e => e.name === name);
  if (existingEntity) {
    existingEntity.value = value;
    existingEntity.confidence = confidence;
  } else {
    this.context.entities.push({ name, value, confidence });
  }
  return this.save();
};

sessionSchema.methods.setVariable = function(key, value) {
  this.context.variables.set(key, value);
  return this.save();
};

sessionSchema.methods.getVariable = function(key) {
  return this.context.variables.get(key);
};

sessionSchema.methods.incrementMessageCount = function() {
  this.analytics.messageCount += 1;
  return this.save();
};

sessionSchema.methods.addSentimentScore = function(score, magnitude) {
  this.analytics.sentimentScores.push({
    timestamp: new Date(),
    score,
    magnitude
  });
  
  // Update average sentiment
  const scores = this.analytics.sentimentScores.map(s => s.score);
  this.analytics.averageSentiment = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  return this.save();
};

sessionSchema.methods.endSession = function(satisfactionRating, feedback) {
  this.context.conversationState = 'completed';
  this.analytics.endTime = new Date();
  this.analytics.duration = this.analytics.endTime - this.analytics.startTime;
  this.isActive = false;
  
  if (satisfactionRating) {
    this.analytics.satisfactionRating = satisfactionRating;
  }
  
  if (feedback) {
    this.analytics.feedback = feedback;
  }
  
  return this.save();
};

// Static methods
sessionSchema.statics.findActiveByChatbot = function(chatbotId) {
  return this.find({ chatbotId, isActive: true });
};

sessionSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

sessionSchema.statics.createSession = function(sessionId, chatbotId, userId, metadata = {}) {
  return this.create({
    sessionId,
    chatbotId,
    userId,
    metadata
  });
};

sessionSchema.statics.cleanupExpiredSessions = function() {
  const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.updateMany(
    { 'context.lastActivity': { $lt: expiredDate }, isActive: true },
    { 
      $set: { 
        isActive: false, 
        'context.conversationState': 'abandoned' 
      } 
    }
  );
};

module.exports = mongoose.model('Session', sessionSchema);
