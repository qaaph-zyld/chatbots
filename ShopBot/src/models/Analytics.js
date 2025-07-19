const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  messageId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['user', 'bot'], required: true },
  content: { type: String, required: true },
  intent: String,
  confidence: Number,
  responseTime: Number
});

const AnalyticsSchema = new mongoose.Schema({
  // Daily aggregation
  date: { type: String, required: true, index: true }, // YYYY-MM-DD format
  
  // User information
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  conversationId: { type: String, index: true },
  
  // Session information
  sessionStart: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  activeSessions: { type: Number, default: 1 },
  
  // Message metrics
  messages: [MessageSchema],
  messageCount: { type: Number, default: 0 },
  
  // Performance metrics
  avgResponseTime: Number,
  errorCount: { type: Number, default: 0 },
  
  // System metrics
  deviceType: String,
  browser: String,
  os: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for common queries
AnalyticsSchema.index({ userId: 1, date: -1 });
AnalyticsSchema.index({ conversationId: 1, date: -1 });

// Pre-save hook to update timestamps
AnalyticsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
AnalyticsSchema.statics.getDailyStats = async function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$date',
        activeUsers: { $addToSet: '$userId' },
        totalMessages: { $sum: '$messageCount' },
        totalSessions: { $sum: 1 },
        avgResponseTime: { $avg: '$avgResponseTime' },
        errorCount: { $sum: '$errorCount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('Analytics', AnalyticsSchema);
