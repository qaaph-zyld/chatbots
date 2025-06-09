/**
 * Analytics Model
 * 
 * Mongoose model for analytics data
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Analytics Schema
 */
const analyticsSchema = new Schema({
  chatbotId: {
    type: Schema.Types.ObjectId,
    ref: 'Chatbot',
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    conversations: {
      total: {
        type: Number,
        default: 0
      },
      new: {
        type: Number,
        default: 0
      },
      completed: {
        type: Number,
        default: 0
      },
      abandoned: {
        type: Number,
        default: 0
      }
    },
    messages: {
      total: {
        type: Number,
        default: 0
      },
      user: {
        type: Number,
        default: 0
      },
      bot: {
        type: Number,
        default: 0
      }
    },
    users: {
      total: {
        type: Number,
        default: 0
      },
      new: {
        type: Number,
        default: 0
      },
      returning: {
        type: Number,
        default: 0
      }
    },
    engagement: {
      averageSessionDuration: {
        type: Number,
        default: 0
      },
      averageMessagesPerConversation: {
        type: Number,
        default: 0
      },
      averageResponseTime: {
        type: Number,
        default: 0
      }
    },
    performance: {
      successfulResponses: {
        type: Number,
        default: 0
      },
      failedResponses: {
        type: Number,
        default: 0
      },
      handoffs: {
        type: Number,
        default: 0
      }
    },
    satisfaction: {
      averageRating: {
        type: Number,
        default: 0
      },
      feedbackCount: {
        type: Number,
        default: 0
      },
      positiveCount: {
        type: Number,
        default: 0
      },
      negativeCount: {
        type: Number,
        default: 0
      }
    }
  },
  topIntents: [{
    intent: {
      type: String
    },
    count: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  }],
  topEntities: [{
    entity: {
      type: String
    },
    count: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0
    }
  }],
  topQueries: [{
    query: {
      type: String
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  trafficSources: [{
    source: {
      type: String
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  deviceStats: {
    desktop: {
      type: Number,
      default: 0
    },
    mobile: {
      type: Number,
      default: 0
    },
    tablet: {
      type: Number,
      default: 0
    },
    other: {
      type: Number,
      default: 0
    }
  },
  geographicStats: [{
    country: {
      type: String
    },
    count: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

// Indexes
analyticsSchema.index({ chatbotId: 1, period: 1, date: 1 }, { unique: true });
analyticsSchema.index({ date: 1 });
analyticsSchema.index({ period: 1 });

// Statics
analyticsSchema.statics.findByDateRange = function(chatbotId, startDate, endDate, period = 'daily') {
  return this.find({
    chatbotId,
    period,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });
};

analyticsSchema.statics.getLatestByPeriod = function(chatbotId, period = 'daily', limit = 30) {
  return this.find({
    chatbotId,
    period
  })
  .sort({ date: -1 })
  .limit(limit);
};

// Create the model
const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
