/**
 * Usage Metric Model
 * 
 * Stores aggregated usage metrics for chatbots by date
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usageMetricSchema = new Schema({
  // Date (day) of the metrics
  date: {
    type: Date,
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
  
  // Platform (web, slack, etc.)
  platform: {
    type: String,
    required: true,
    index: true
  },
  
  // Counts by type
  counts: {
    message: {
      type: Number,
      default: 0
    },
    session: {
      type: Number,
      default: 0
    },
    error: {
      type: Number,
      default: 0
    },
    feedback: {
      type: Number,
      default: 0
    },
    integration: {
      type: Number,
      default: 0
    }
  },
  
  // Unique users for the day
  uniqueUsers: {
    type: [String],
    default: []
  },
  
  // Token usage
  tokens: {
    input: {
      type: Number,
      default: 0
    },
    output: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Average response time (ms)
  avgResponseTime: {
    type: Number,
    default: 0
  },
  
  // Last updated timestamp
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound index for date, chatbot, and platform
usageMetricSchema.index({ date: 1, chatbotId: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('UsageMetric', usageMetricSchema);
