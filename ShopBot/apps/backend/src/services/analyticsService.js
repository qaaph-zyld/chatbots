const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');

class AnalyticsService {
  constructor() {
    this.metrics = {
      activeUsers: new Set(),
      messageCount: 0,
      responseTimes: []
    };
  }

  // Track user activity
  async trackUserActivity(userId) {
    try {
      this.metrics.activeUsers.add(userId.toString());
      await Analytics.updateOne(
        { userId, date: this.getCurrentDate() },
        { $set: { lastActive: new Date() }, $inc: { activeSessions: 1 } },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  // Track message metrics
  async trackMessage(conversationId, message) {
    try {
      this.metrics.messageCount++;
      await Analytics.updateOne(
        { conversationId, date: this.getCurrentDate() },
        {
          $push: { messages: message },
          $inc: { messageCount: 1 },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error tracking message:', error);
    }
  }

  // Track response time
  trackResponseTime(startTime) {
    const responseTime = Date.now() - startTime;
    this.metrics.responseTimes.push(responseTime);
    // Keep only last 1000 samples
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }
  }

  // Get conversation metrics
  async getConversationMetrics(conversationId) {
    try {
      return await Analytics.findOne({ conversationId })
        .sort({ date: -1 })
        .limit(30); // Last 30 days
    } catch (error) {
      console.error('Error getting conversation metrics:', error);
      return null;
    }
  }

  // Get system metrics
  getSystemMetrics() {
    const responseTimes = this.metrics.responseTimes;
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    return {
      activeUsers: this.metrics.activeUsers.size,
      totalMessages: this.metrics.messageCount,
      avgResponseTime,
      uptime: process.uptime()
    };
  }

  // Get usage analytics
  async getUsageAnalytics(days = 30) {
    try {
      const date = new Date();
      date.setDate(date.getDate() - days);

      const results = await Analytics.aggregate([
        {
          $match: {
            date: { $gte: date }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            activeUsers: { $addToSet: '$userId' },
            messageCount: { $sum: '$messageCount' },
            sessions: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return results.map(day => ({
        date: day._id,
        activeUsers: day.activeUsers.filter(Boolean).length, // Filter out null/undefined
        messageCount: day.messageCount,
        sessions: day.sessions
      }));
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      return [];
    }
  }

  // Helper to get current date in YYYY-MM-DD format
  getCurrentDate() {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }
}

// Export singleton instance
module.exports = new AnalyticsService();
