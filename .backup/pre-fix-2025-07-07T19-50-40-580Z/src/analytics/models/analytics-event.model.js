/**
 * Analytics Event Model
 * 
 * Represents an analytics event in the system for tracking user behavior,
 * subscription events, and other important metrics.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AnalyticsEventSchema = new Schema({
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  eventData: {
    type: Object,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  source: {
    type: String,
    enum: ['web', 'mobile', 'api', 'system', 'other'],
    default: 'web'
  },
  sessionId: {
    type: String,
    index: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

// Compound indexes for common queries
AnalyticsEventSchema.index({ tenantId: 1, eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ tenantId: 1, userId: 1, timestamp: -1 });

/**
 * Static method to find events by date range
 * @param {Object} params - Query parameters
 * @param {String} params.tenantId - Tenant ID
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 * @param {String} [params.eventType] - Optional event type filter
 * @returns {Promise<Array>} - Array of event documents
 */
AnalyticsEventSchema.statics.findByDateRange = function(params) {
  const { tenantId, startDate, endDate, eventType } = params;
  
  const query = { tenantId };
  
  if (eventType) {
    query.eventType = eventType;
  }
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

/**
 * Static method to get event counts by type
 * @param {Object} params - Query parameters
 * @param {String} params.tenantId - Tenant ID
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 * @returns {Promise<Object>} - Event counts by type
 */
AnalyticsEventSchema.statics.getCountsByType = async function(params) {
  const { tenantId, startDate, endDate } = params;
  
  const query = { tenantId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  const counts = await this.aggregate([
    { $match: query },
    { $group: {
      _id: '$eventType',
      count: { $sum: 1 }
    }},
    { $sort: { count: -1 } }
  ]);
  
  // Convert to object format
  const result = {};
  counts.forEach(item => {
    result[item._id] = item.count;
  });
  
  return result;
};

/**
 * Static method to get event counts by day
 * @param {Object} params - Query parameters
 * @param {String} params.tenantId - Tenant ID
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 * @param {String} [params.eventType] - Optional event type filter
 * @returns {Promise<Object>} - Event counts by day
 */
AnalyticsEventSchema.statics.getCountsByDay = async function(params) {
  const { tenantId, startDate, endDate, eventType } = params;
  
  const query = { tenantId };
  
  if (eventType) {
    query.eventType = eventType;
  }
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  const counts = await this.aggregate([
    { $match: query },
    { $group: {
      _id: {
        year: { $year: '$timestamp' },
        month: { $month: '$timestamp' },
        day: { $dayOfMonth: '$timestamp' }
      },
      count: { $sum: 1 }
    }},
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  // Convert to object format with ISO date strings as keys
  const result = {};
  counts.forEach(item => {
    const { year, month, day } = item._id;
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    result[dateKey] = item.count;
  });
  
  return result;
};

/**
 * Static method to get unique user counts
 * @param {Object} params - Query parameters
 * @param {String} params.tenantId - Tenant ID
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 * @returns {Promise<Object>} - Unique user counts
 */
AnalyticsEventSchema.statics.getUniqueUserCounts = async function(params) {
  const { tenantId, startDate, endDate } = params;
  
  const query = { 
    tenantId,
    userId: { $exists: true, $ne: null }
  };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }
  
  const result = await this.aggregate([
    { $match: query },
    { $group: {
      _id: {
        userId: '$userId',
        day: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
        }
      }
    }},
    { $group: {
      _id: '$_id.day',
      uniqueUsers: { $sum: 1 }
    }},
    { $sort: { _id: 1 } }
  ]);
  
  // Convert to object format
  const dailyUsers = {};
  result.forEach(item => {
    dailyUsers[item._id] = item.uniqueUsers;
  });
  
  // Calculate total unique users
  const totalUniqueUsers = await this.aggregate([
    { $match: query },
    { $group: {
      _id: '$userId'
    }},
    { $group: {
      _id: null,
      count: { $sum: 1 }
    }}
  ]);
  
  return {
    totalUniqueUsers: totalUniqueUsers.length > 0 ? totalUniqueUsers[0].count : 0,
    dailyUniqueUsers: dailyUsers
  };
};

const AnalyticsEvent = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);

module.exports = AnalyticsEvent;
