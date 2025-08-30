const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true,
    unique: true,
    index: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[\\\\\\\w-\\\\\\.]+@([\\\\\\\w-]+\\\\\\.)+[\\\\\\\w-]{2,4}$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  first_name: {
    type: String,
    trim: true
  },
  last_name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[\\\\\\+]?[1-9][\\\\\\\d]{0,15}$/.test(v.replace(/[\\\\\\\s\\\\\\-\\\\\\(\\\\\\)]/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  preferences: {
    language: {
      type: String,
      default: 'en',
      maxlength: 5
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    communication_channel: {
      type: String,
      enum: ['email', 'sms', 'phone', 'chat'],
      default: 'email'
    },
    marketing_consent: {
      type: Boolean,
      default: false
    },
    notifications: {
      order_updates: {
        type: Boolean,
        default: true
      },
      promotions: {
        type: Boolean,
        default: false
      },
      support_updates: {
        type: Boolean,
        default: true
      }
    }
  },
  profile: {
    date_of_birth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    occupation: String,
    interests: [String]
  },
  statistics: {
    total_orders: {
      type: Number,
      default: 0,
      min: 0
    },
    total_spent: {
      type: Number,
      default: 0,
      min: 0
    },
    average_order_value: {
      type: Number,
      default: 0,
      min: 0
    },
    last_order_date: Date,
    first_order_date: Date,
    lifetime_value: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  segments: [{
    type: String,
    enum: ['new_customer', 'returning_customer', 'vip', 'at_risk', 'loyal', 'high_value', 'low_value']
  }],
  tags: [{
    type: String,
    trim: true
  }],
  notes: [{
    content: {
      type: String,
      required: true
    },
    author: String,
    author_type: {
      type: String,
      enum: ['system', 'agent', 'bot'],
      default: 'system'
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  support_history: {
    total_conversations: {
      type: Number,
      default: 0,
      min: 0
    },
    total_messages: {
      type: Number,
      default: 0,
      min: 0
    },
    average_resolution_time: {
      type: Number,
      default: 0,
      min: 0
    },
    satisfaction_rating: {
      type: Number,
      min: 1,
      max: 5
    },
    last_contact_date: Date,
    escalation_count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked', 'pending_verification'],
    default: 'active',
    index: true
  },
  verification: {
    email_verified: {
      type: Boolean,
      default: false
    },
    phone_verified: {
      type: Boolean,
      default: false
    },
    identity_verified: {
      type: Boolean,
      default: false
    },
    verification_date: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  last_activity: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
customerSchema.index({ name: 'text', email: 'text' });
customerSchema.index({ 'statistics.total_spent': -1 });
customerSchema.index({ 'statistics.total_orders': -1 });
customerSchema.index({ segments: 1 });
customerSchema.index({ status: 1, last_activity: -1 });

// Methods
customerSchema.methods.isActive = function() {
  return this.status === 'active';
};

customerSchema.methods.isVIP = function() {
  return this.segments.includes('vip') || this.segments.includes('high_value');
};

customerSchema.methods.addOrder = function(orderValue, orderDate) {
  this.statistics.total_orders += 1;
  this.statistics.total_spent += orderValue;
  this.statistics.average_order_value = this.statistics.total_spent / this.statistics.total_orders;
  this.statistics.last_order_date = orderDate || new Date();
  
  if (!this.statistics.first_order_date) {
    this.statistics.first_order_date = orderDate || new Date();
  }
  
  this.updateSegments();
  this.updateActivity();
  return this.save();
};

customerSchema.methods.addConversation = function(messageCount, resolutionTime, satisfactionRating) {
  this.support_history.total_conversations += 1;
  this.support_history.total_messages += messageCount || 0;
  this.support_history.last_contact_date = new Date();
  
  if (resolutionTime) {
    const currentAvg = this.support_history.average_resolution_time || 0;
    const totalConversations = this.support_history.total_conversations;
    this.support_history.average_resolution_time = 
      (currentAvg * (totalConversations - 1) + resolutionTime) / totalConversations;
  }
  
  if (satisfactionRating) {
    this.support_history.satisfaction_rating = satisfactionRating;
  }
  
  this.updateActivity();
  return this.save();
};

customerSchema.methods.addEscalation = function() {
  this.support_history.escalation_count += 1;
  return this.save();
};

customerSchema.methods.addNote = function(content, author, authorType) {
  this.notes.push({
    content: content,
    author: author,
    author_type: authorType
  });
  return this.save();
};

customerSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

customerSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

customerSchema.methods.addSegment = function(segment) {
  if (!this.segments.includes(segment)) {
    this.segments.push(segment);
    return this.save();
  }
  return Promise.resolve(this);
};

customerSchema.methods.removeSegment = function(segment) {
  this.segments = this.segments.filter(s => s !== segment);
  return this.save();
};

customerSchema.methods.updateSegments = function() {
  // Clear existing segments
  this.segments = [];
  
  // Determine segments based on statistics
  if (this.statistics.total_orders === 0) {
    this.segments.push('new_customer');
  } else if (this.statistics.total_orders > 10) {
    this.segments.push('loyal');
  } else {
    this.segments.push('returning_customer');
  }
  
  // Value-based segments
  if (this.statistics.total_spent > 1000) {
    this.segments.push('high_value');
  } else if (this.statistics.total_spent < 100) {
    this.segments.push('low_value');
  }
  
  // VIP status
  if (this.statistics.total_spent > 5000 || this.statistics.total_orders > 20) {
    this.segments.push('vip');
  }
  
  // At-risk customers (no orders in last 6 months)
  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
  if (this.statistics.last_order_date && this.statistics.last_order_date < sixMonthsAgo) {
    this.segments.push('at_risk');
  }
};

customerSchema.methods.updateActivity = function() {
  this.last_activity = new Date();
};

customerSchema.methods.calculateLifetimeValue = function() {
  // Simple LTV calculation: average order value * order frequency * customer lifespan
  const daysSinceFirstOrder = this.statistics.first_order_date ? 
    (Date.now() - this.statistics.first_order_date.getTime()) / (1000 * 60 * 60 * 24) : 0;
  
  if (daysSinceFirstOrder > 0 && this.statistics.total_orders > 0) {
    const orderFrequency = this.statistics.total_orders / (daysSinceFirstOrder / 30); // orders per month
    const estimatedLifespan = 24; // 24 months estimated
    this.statistics.lifetime_value = this.statistics.average_order_value * orderFrequency * estimatedLifespan;
  }
  
  return this.statistics.lifetime_value;
};

customerSchema.methods.verifyEmail = function() {
  this.verification.email_verified = true;
  this.verification.verification_date = new Date();
  return this.save();
};

customerSchema.methods.verifyPhone = function() {
  this.verification.phone_verified = true;
  this.verification.verification_date = new Date();
  return this.save();
};

// Static methods
customerSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

customerSchema.statics.findBySegment = function(segment, limit = 50) {
  return this.find({ segments: segment })
    .sort({ 'statistics.total_spent': -1 })
    .limit(limit);
};

customerSchema.statics.findHighValue = function(threshold = 1000, limit = 50) {
  return this.find({ 'statistics.total_spent': { $gte: threshold } })
    .sort({ 'statistics.total_spent': -1 })
    .limit(limit);
};

customerSchema.statics.findAtRisk = function(monthsThreshold = 6, limit = 50) {
  const thresholdDate = new Date(Date.now() - monthsThreshold * 30 * 24 * 60 * 60 * 1000);
  return this.find({
    'statistics.last_order_date': { $lt: thresholdDate },
    'statistics.total_orders': { $gt: 0 }
  })
    .sort({ 'statistics.last_order_date': 1 })
    .limit(limit);
};

customerSchema.statics.searchCustomers = function(searchTerm, limit = 20) {
  return this.find(
    { $text: { $search: searchTerm } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit);
};

customerSchema.statics.getAnalytics = function(startDate, endDate) {
  const match = {};
  
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
        total_customers: { $sum: 1 },
        active_customers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        verified_customers: { $sum: { $cond: ['$verification.email_verified', 1, 0] } },
        avg_total_spent: { $avg: '$statistics.total_spent' },
        avg_total_orders: { $avg: '$statistics.total_orders' },
        avg_lifetime_value: { $avg: '$statistics.lifetime_value' },
        high_value_customers: { 
          $sum: { $cond: [{ $gte: ['$statistics.total_spent', 1000] }, 1, 0] } 
        }
      }
    }
  ]);
};

customerSchema.statics.getSegmentDistribution = function() {
  return this.aggregate([
    { $unwind: '$segments' },
    {
      $group: {
        _id: '$segments',
        count: { $sum: 1 },
        avg_spent: { $avg: '$statistics.total_spent' },
        avg_orders: { $avg: '$statistics.total_orders' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  if (this.first_name && this.last_name) {
    return `${this.first_name} ${this.last_name}`;
  }
  return this.name;
});

// Virtual for display name
customerSchema.virtual('displayName').get(function() {
  return this.fullName || this.email;
});

// Virtual for days since last order
customerSchema.virtual('daysSinceLastOrder').get(function() {
  if (!this.statistics.last_order_date) return null;
  return Math.floor((Date.now() - this.statistics.last_order_date.getTime()) / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
customerSchema.pre('save', function(next) {
  // Update segments and LTV on save
  if (this.isModified('statistics')) {
    this.updateSegments();
    this.calculateLifetimeValue();
  }
  
  // Update activity timestamp
  this.updateActivity();
  
  next();
});

// Ensure virtual fields are serialized
customerSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Customer', customerSchema);
