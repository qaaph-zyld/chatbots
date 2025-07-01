/**
 * Lead Model
 * 
 * Defines the schema for sales leads and prospects
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Lead Schema
 * Tracks potential customers in the sales pipeline
 */
const LeadSchema = new Schema({
  company: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    website: String,
    industry: String,
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    }
  },
  contact: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    phone: String,
    jobTitle: String
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'conference', 'webinar', 'social', 'email_campaign', 'partner', 'other'],
    default: 'website'
  },
  sourceDetails: String,
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
    default: 'new',
    index: true
  },
  stage: {
    type: Number,
    default: 0,
    min: 0,
    max: 6
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    content: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  activities: [{
    type: {
      type: String,
      enum: ['email', 'call', 'meeting', 'demo', 'proposal', 'follow_up', 'other']
    },
    subject: String,
    description: String,
    scheduledAt: Date,
    completedAt: Date,
    outcome: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  interestedIn: [{
    type: String,
    enum: ['starter', 'professional', 'enterprise', 'custom']
  }],
  requirements: {
    chatbots: Number,
    conversations: Number,
    knowledgeBases: Number,
    customIntegrations: Boolean,
    selfHosting: Boolean,
    whiteLabel: Boolean
  },
  estimatedValue: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    recurring: {
      type: Boolean,
      default: true
    }
  },
  timeline: {
    expectedCloseDate: Date,
    followUpDate: Date
  },
  tags: [String],
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  convertedToCustomer: {
    type: Boolean,
    default: false
  },
  convertedAt: Date,
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant'
  }
});

// Pre-save hook to update the updatedAt field
LeadSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for performance
LeadSchema.index({ 'contact.email': 1 });
LeadSchema.index({ status: 1, createdAt: -1 });
LeadSchema.index({ assignedTo: 1 });

/**
 * Add a note to the lead
 */
LeadSchema.methods.addNote = async function(content, userId) {
  this.notes.push({
    content,
    createdBy: userId,
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

/**
 * Add an activity to the lead
 */
LeadSchema.methods.addActivity = async function(activityData, userId) {
  this.activities.push({
    ...activityData,
    createdBy: userId,
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

/**
 * Update lead status
 */
LeadSchema.methods.updateStatus = async function(newStatus, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Update stage based on status
  const stageMap = {
    'new': 0,
    'contacted': 1,
    'qualified': 2,
    'proposal': 3,
    'negotiation': 4,
    'closed_won': 5,
    'closed_lost': 6
  };
  
  this.stage = stageMap[newStatus] || this.stage;
  
  // Add status change activity
  this.activities.push({
    type: 'other',
    subject: 'Status Change',
    description: `Status changed from ${oldStatus} to ${newStatus}`,
    completedAt: new Date(),
    createdBy: userId,
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

/**
 * Convert lead to customer
 */
LeadSchema.methods.convertToCustomer = async function(userId) {
  this.convertedToCustomer = true;
  this.convertedAt = new Date();
  this.status = 'closed_won';
  
  // Add conversion activity
  this.activities.push({
    type: 'other',
    subject: 'Conversion',
    description: 'Lead converted to customer',
    completedAt: new Date(),
    createdBy: userId,
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

/**
 * Find leads by status
 */
LeadSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

/**
 * Find leads assigned to a user
 */
LeadSchema.statics.findByAssignee = function(userId) {
  return this.find({ assignedTo: userId });
};

/**
 * Find leads created in a date range
 */
LeadSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

const Lead = mongoose.model('Lead', LeadSchema);
module.exports = Lead;
