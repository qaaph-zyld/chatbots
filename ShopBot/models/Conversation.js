const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  store_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Store',
    required: true,
    index: true
  },
  customer_id: { 
    type: String, 
    required: true,
    index: true
  },
  session_id: { 
    type: String, 
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'abandoned', 'escalated'],
    default: 'active',
    index: true
  },
  customer_email: {
    type: String,
    index: true,
    validate: {
      validator: function(v) {
        return !v || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  customer_name: {
    type: String,
    trim: true
  },
  channel: {
    type: String,
    enum: ['web', 'mobile', 'api', 'webhook'],
    default: 'web'
  },
  language: {
    type: String,
    default: 'en',
    maxlength: 5
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  escalation_reason: {
    type: String,
    enum: ['complex_issue', 'customer_request', 'timeout', 'keyword_trigger', 'manual']
  },
  escalated_at: {
    type: Date
  },
  escalated_to: {
    type: String // Agent ID or department
  },
  resolution_time: {
    type: Number // Time in seconds
  },
  satisfaction_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  satisfaction_feedback: {
    type: String,
    maxlength: 1000
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  context: {
    user_agent: String,
    ip_address: String,
    referrer: String,
    utm_source: String,
    utm_medium: String,
    utm_campaign: String
  },
  last_activity: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes
conversationSchema.index({ store_id: 1, status: 1 });
conversationSchema.index({ customer_id: 1, createdAt: -1 });
conversationSchema.index({ store_id: 1, createdAt: -1 });
conversationSchema.index({ status: 1, last_activity: 1 });

// Methods
conversationSchema.methods.isActive = function() {
  return this.status === 'active';
};

conversationSchema.methods.escalate = function(reason, agentId) {
  this.status = 'escalated';
  this.escalation_reason = reason;
  this.escalated_at = new Date();
  this.escalated_to = agentId;
  return this.save();
};

conversationSchema.methods.complete = function(resolutionTime) {
  this.status = 'completed';
  this.resolution_time = resolutionTime;
  return this.save();
};

conversationSchema.methods.abandon = function() {
  this.status = 'abandoned';
  return this.save();
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

conversationSchema.methods.updateActivity = function() {
  this.last_activity = new Date();
  return this.save();
};

conversationSchema.methods.setSatisfactionRating = function(rating, feedback) {
  this.satisfaction_rating = rating;
  if (feedback) {
    this.satisfaction_feedback = feedback;
  }
  return this.save();
};

// Static methods
conversationSchema.statics.findByStore = function(storeId, options = {}) {
  const query = { store_id: storeId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.customer_id) {
    query.customer_id = options.customer_id;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

conversationSchema.statics.findByCustomer = function(customerId, storeId) {
  return this.find({ 
    customer_id: customerId,
    store_id: storeId 
  }).sort({ createdAt: -1 });
};

conversationSchema.statics.findActive = function(storeId) {
  const query = { status: 'active' };
  if (storeId) {
    query.store_id = storeId;
  }
  return this.find(query).sort({ last_activity: -1 });
};

conversationSchema.statics.findStale = function(minutes = 30) {
  const staleTime = new Date(Date.now() - minutes * 60 * 1000);
  return this.find({
    status: 'active',
    last_activity: { $lt: staleTime }
  });
};

conversationSchema.statics.getAnalytics = function(storeId, startDate, endDate) {
  const match = { store_id: mongoose.Types.ObjectId(storeId) };
  
  if (startDate && endDate) {
    match.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total_conversations: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        escalated: { $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] } },
        abandoned: { $sum: { $cond: [{ $eq: ['$status', 'abandoned'] }, 1, 0] } },
        avg_resolution_time: { $avg: '$resolution_time' },
        avg_satisfaction: { $avg: '$satisfaction_rating' }
      }
    }
  ]);
};

// Virtual for duration
conversationSchema.virtual('duration').get(function() {
  if (this.resolution_time) {
    return this.resolution_time;
  }
  return Math.floor((Date.now() - this.createdAt.getTime()) / 1000);
});

// Virtual for customer display name
conversationSchema.virtual('customerDisplayName').get(function() {
  return this.customer_name || this.customer_email || this.customer_id;
});

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.resolution_time) {
    this.resolution_time = Math.floor((Date.now() - this.createdAt.getTime()) / 1000);
  }
  next();
});

// Ensure virtual fields are serialized
conversationSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Conversation', conversationSchema);
