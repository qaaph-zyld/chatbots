/**
 * User Engagement Service
 * 
 * This service tracks and analyzes user engagement metrics such as
 * session duration, retention rates, feature usage, and satisfaction.
 */

require('@src/utils');
require('@src/analytics\conversation\tracking.service');
const { v4: uuidv4 } = require('uuid');

/**
 * User Engagement Service class
 */
class UserEngagementService {
  /**
   * Initialize the user engagement service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800'), // seconds (default: 30 minutes)
      retentionPeriods: [1, 7, 30, 90], // days
      enableSatisfactionTracking: process.env.ENABLE_SATISFACTION_TRACKING === 'true' || false,
      ...options
    };

    // Initialize storage
    this.storage = {
      sessions: new Map(),
      users: new Map(),
      metrics: {
        daily: new Map(),
        weekly: new Map()
      }
    };

    logger.info('User Engagement Service initialized');
  }

  /**
   * Track a user session
   * @param {Object} event - Session event
   * @returns {Promise<Object>} - Session data
   */
  async trackSession(event) {
    try {
      const { userId, sessionId = uuidv4(), action, timestamp = new Date().toISOString() } = event;
      
      if (!userId) {
        throw new Error('userId is required for session tracking');
      }

      // Get or create session
      let session = this.storage.sessions.get(sessionId);
      
      if (!session) {
        // Create a new session
        session = {
          id: sessionId,
          userId,
          startTime: timestamp,
          lastActivity: timestamp,
          duration: 0,
          messageCount: 0,
          events: []
        };
        this.storage.sessions.set(sessionId, session);
      } else {
        // Update existing session
        const currentTime = new Date(timestamp);
        const lastActivity = new Date(session.lastActivity);
        
        // Check if session has timed out
        const timeDiff = (currentTime - lastActivity) / 1000; // in seconds
        
        if (timeDiff > this.options.sessionTimeout && action !== 'start') {
          // Session timed out, end previous session and create new one
          await this._endSession(session);
          
          // Create new session
          session = {
            id: sessionId,
            userId,
            startTime: timestamp,
            lastActivity: timestamp,
            duration: 0,
            messageCount: 0,
            events: []
          };
          this.storage.sessions.set(sessionId, session);
        } else {
          // Update session duration
          if (action !== 'start') {
            session.duration += timeDiff;
          }
          session.lastActivity = timestamp;
        }
      }

      // Handle specific actions
      switch (action) {
        case 'start':
          session.startTime = timestamp;
          session.lastActivity = timestamp;
          session.duration = 0;
          session.messageCount = 0;
          session.events = [];
          break;
        
        case 'message':
          session.messageCount++;
          break;
        
        case 'end':
          await this._endSession(session);
          this.storage.sessions.delete(sessionId);
          break;
      }

      // Add event to session history
      session.events.push({
        action,
        timestamp
      });

      // Update user data
      await this._updateUserData(userId, session, action);

      return session;
    } catch (error) {
      logger.error('Error tracking session:', error.message);
      throw error;
    }
  }

  /**
   * End a session and update metrics
   * @param {Object} session - Session data
   * @returns {Promise<void>}
   * @private
   */
  async _endSession(session) {
    try {
      // Calculate final session metrics
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.lastActivity);
      const duration = (endTime - startTime) / 1000; // in seconds
      
      // Update daily metrics
      const dateKey = startTime.toISOString().split('T')[0];
      
      let dailyMetrics = this.storage.metrics.daily.get(dateKey) || {
        date: dateKey,
        sessionCount: 0,
        totalDuration: 0,
        totalMessages: 0,
        uniqueUsers: new Set()
      };
      
      dailyMetrics.sessionCount++;
      dailyMetrics.totalDuration += duration;
      dailyMetrics.totalMessages += session.messageCount;
      dailyMetrics.uniqueUsers.add(session.userId);
      
      this.storage.metrics.daily.set(dateKey, dailyMetrics);
      
      // Update user's session history
      let userData = this.storage.users.get(session.userId) || {
        id: session.userId,
        firstSeen: session.startTime,
        lastSeen: session.lastActivity,
        totalSessions: 0,
        totalDuration: 0,
        totalMessages: 0,
        sessions: []
      };
      
      userData.lastSeen = session.lastActivity;
      userData.totalSessions++;
      userData.totalDuration += duration;
      userData.totalMessages += session.messageCount;
      
      // Add session summary to user history (limit to last 10)
      userData.sessions.unshift({
        id: session.id,
        startTime: session.startTime,
        endTime: session.lastActivity,
        duration,
        messageCount: session.messageCount
      });
      
      if (userData.sessions.length > 10) {
        userData.sessions = userData.sessions.slice(0, 10);
      }
      
      this.storage.users.set(session.userId, userData);
    } catch (error) {
      logger.error('Error ending session:', error.message);
    }
  }

  /**
   * Update user data based on session activity
   * @param {string} userId - User ID
   * @param {Object} session - Session data
   * @param {string} action - Action type
   * @returns {Promise<void>}
   * @private
   */
  async _updateUserData(userId, session, action) {
    try {
      // Get or create user data
      let userData = this.storage.users.get(userId) || {
        id: userId,
        firstSeen: session.startTime,
        lastSeen: session.lastActivity,
        totalSessions: 0,
        totalDuration: 0,
        totalMessages: 0,
        sessions: []
      };
      
      // Update user data
      userData.lastSeen = session.lastActivity;
      
      if (action === 'start') {
        userData.totalSessions++;
      } else if (action === 'message') {
        userData.totalMessages++;
      }
      
      this.storage.users.set(userId, userData);
    } catch (error) {
      logger.error('Error updating user data:', error.message);
    }
  }

  /**
   * Track user satisfaction
   * @param {Object} feedback - User feedback
   * @returns {Promise<Object>} - Feedback data
   */
  async trackSatisfaction(feedback) {
    try {
      if (!this.options.enableSatisfactionTracking) {
        logger.warn('Satisfaction tracking is disabled');
        return null;
      }

      const { userId, sessionId, rating, comment, timestamp = new Date().toISOString() } = feedback;
      
      if (!userId || !sessionId || rating === undefined) {
        throw new Error('userId, sessionId, and rating are required for satisfaction tracking');
      }

      // Validate rating
      const numericRating = parseInt(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        throw new Error('Rating must be a number between 1 and 5');
      }

      // Create feedback entry
      const feedbackEntry = {
        userId,
        sessionId,
        rating: numericRating,
        comment: comment || '',
        timestamp
      };

      // Store feedback with user data
      let userData = this.storage.users.get(userId);
      
      if (userData) {
        userData.feedback = userData.feedback || [];
        userData.feedback.unshift(feedbackEntry);
        
        // Limit to last 10 feedback entries
        if (userData.feedback.length > 10) {
          userData.feedback = userData.feedback.slice(0, 10);
        }
        
        this.storage.users.set(userId, userData);
      }

      return feedbackEntry;
    } catch (error) {
      logger.error('Error tracking satisfaction:', error.message);
      throw error;
    }
  }

  /**
   * Get user engagement metrics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Engagement metrics
   */
  async getEngagementMetrics(options = {}) {
    try {
      const { timeRange = 30, userId, botId } = options;
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);
      
      // Get conversations in time range
      const conversations = await conversationTrackingService.storage.find({
        startedAt: { $gte: startDate.toISOString() },
        updatedAt: { $lte: endDate.toISOString() },
        ...(userId ? { userId } : {}),
        ...(botId ? { botId } : {})
      });

      // Calculate metrics
      const metrics = {
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: timeRange
        },
        overview: {
          totalUsers: new Set(),
          totalSessions: 0,
          totalMessages: 0,
          averageSessionDuration: 0,
          averageMessagesPerSession: 0
        },
        retention: {},
        satisfaction: {
          average: 0,
          distribution: {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
          }
        },
        engagement: {
          daily: [],
          weekly: []
        }
      };

      // Process conversations for metrics
      let totalDuration = 0;
      let totalMessages = 0;
      
      conversations.forEach(conversation => {
        // Count unique users
        if (conversation.userId) {
          metrics.overview.totalUsers.add(conversation.userId);
        }
        
        // Count sessions
        metrics.overview.totalSessions++;
        
        // Count messages
        const messageCount = conversation.messages ? conversation.messages.length : 0;
        totalMessages += messageCount;
        
        // Calculate duration
        if (conversation.startedAt && conversation.updatedAt) {
          const duration = (new Date(conversation.updatedAt) - new Date(conversation.startedAt)) / 1000; // in seconds
          totalDuration += duration;
        }
      });

      // Calculate averages
      metrics.overview.totalUsers = metrics.overview.totalUsers.size;
      metrics.overview.totalMessages = totalMessages;
      
      if (metrics.overview.totalSessions > 0) {
        metrics.overview.averageSessionDuration = Math.round(totalDuration / metrics.overview.totalSessions);
        metrics.overview.averageMessagesPerSession = Math.round((totalMessages / metrics.overview.totalSessions) * 10) / 10;
      }

      // Calculate retention for different periods
      this.options.retentionPeriods.forEach(days => {
        metrics.retention[`${days}day`] = this._calculateRetention(days, startDate, endDate);
      });

      // Calculate satisfaction metrics if enabled
      if (this.options.enableSatisfactionTracking) {
        this._calculateSatisfactionMetrics(metrics, startDate, endDate);
      }

      // Generate daily engagement data
      metrics.engagement.daily = this._generateDailyEngagement(startDate, endDate);
      
      // Generate weekly engagement data
      metrics.engagement.weekly = this._generateWeeklyEngagement(startDate, endDate);

      return metrics;
    } catch (error) {
      logger.error('Error getting engagement metrics:', error.message);
      throw error;
    }
  }

  /**
   * Calculate user retention for a given period
   * @param {number} days - Number of days
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {number} - Retention rate (0-100)
   * @private
   */
  _calculateRetention(days, startDate, endDate) {
    try {
      const periodStart = new Date(startDate);
      periodStart.setDate(periodStart.getDate() + days);
      
      if (periodStart > endDate) {
        return 0; // Not enough data for this period
      }
      
      // Count users in first period
      let firstPeriodUsers = new Set();
      
      // Count returning users in second period
      let returningUsers = 0;
      
      // Process user data
      Array.from(this.storage.users.values()).forEach(userData => {
        const firstSeen = new Date(userData.firstSeen);
        const lastSeen = new Date(userData.lastSeen);
        
        // Check if user was first seen in first period
        if (firstSeen >= startDate && firstSeen < periodStart) {
          firstPeriodUsers.add(userData.id);
          
          // Check if user returned in second period
          if (lastSeen >= periodStart && lastSeen <= endDate) {
            returningUsers++;
          }
        }
      });
      
      // Calculate retention rate
      const retentionRate = firstPeriodUsers.size > 0 ? 
        (returningUsers / firstPeriodUsers.size) * 100 : 0;
      
      return Math.round(retentionRate);
    } catch (error) {
      logger.error('Error calculating retention:', error.message);
      return 0;
    }
  }

  /**
   * Calculate satisfaction metrics
   * @param {Object} metrics - Metrics object to update
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @private
   */
  _calculateSatisfactionMetrics(metrics, startDate, endDate) {
    try {
      let totalRating = 0;
      let ratingCount = 0;
      
      // Process user feedback
      Array.from(this.storage.users.values()).forEach(userData => {
        if (userData.feedback && userData.feedback.length > 0) {
          userData.feedback.forEach(feedback => {
            const feedbackDate = new Date(feedback.timestamp);
            
            if (feedbackDate >= startDate && feedbackDate <= endDate) {
              totalRating += feedback.rating;
              ratingCount++;
              metrics.satisfaction.distribution[feedback.rating]++;
            }
          });
        }
      });
      
      // Calculate average rating
      if (ratingCount > 0) {
        metrics.satisfaction.average = Math.round((totalRating / ratingCount) * 10) / 10;
      }
    } catch (error) {
      logger.error('Error calculating satisfaction metrics:', error.message);
    }
  }

  /**
   * Generate daily engagement data
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} - Daily engagement data
   * @private
   */
  _generateDailyEngagement(startDate, endDate) {
    try {
      const dailyData = [];
      const currentDate = new Date(startDate);
      
      // Generate data for each day in the range
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const dailyMetrics = this.storage.metrics.daily.get(dateKey);
        
        dailyData.push({
          date: dateKey,
          sessionCount: dailyMetrics ? dailyMetrics.sessionCount : 0,
          messageCount: dailyMetrics ? dailyMetrics.totalMessages : 0,
          uniqueUsers: dailyMetrics ? dailyMetrics.uniqueUsers.size : 0,
          averageDuration: dailyMetrics && dailyMetrics.sessionCount > 0 ? 
            Math.round(dailyMetrics.totalDuration / dailyMetrics.sessionCount) : 0
        });
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dailyData;
    } catch (error) {
      logger.error('Error generating daily engagement data:', error.message);
      return [];
    }
  }

  /**
   * Generate weekly engagement data
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} - Weekly engagement data
   * @private
   */
  _generateWeeklyEngagement(startDate, endDate) {
    try {
      const weeklyData = [];
      const weekMap = new Map();
      
      // Process daily metrics and group by week
      Array.from(this.storage.metrics.daily.entries()).forEach(([dateKey, metrics]) => {
        const date = new Date(dateKey);
        
        if (date >= startDate && date <= endDate) {
          // Get week number
          const weekStart = new Date(date);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
          const weekKey = weekStart.toISOString().split('T')[0];
          
          // Get or create week data
          let weekData = weekMap.get(weekKey) || {
            weekStart: weekKey,
            sessionCount: 0,
            messageCount: 0,
            uniqueUsers: new Set(),
            totalDuration: 0
          };
          
          // Update week data
          weekData.sessionCount += metrics.sessionCount;
          weekData.messageCount += metrics.totalMessages;
          metrics.uniqueUsers.forEach(userId => weekData.uniqueUsers.add(userId));
          weekData.totalDuration += metrics.totalDuration;
          
          weekMap.set(weekKey, weekData);
        }
      });
      
      // Convert to array and calculate averages
      Array.from(weekMap.entries()).forEach(([weekKey, data]) => {
        weeklyData.push({
          weekStart: weekKey,
          sessionCount: data.sessionCount,
          messageCount: data.messageCount,
          uniqueUsers: data.uniqueUsers.size,
          averageDuration: data.sessionCount > 0 ? 
            Math.round(data.totalDuration / data.sessionCount) : 0
        });
      });
      
      // Sort by week
      weeklyData.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
      
      return weeklyData;
    } catch (error) {
      logger.error('Error generating weekly engagement data:', error.message);
      return [];
    }
  }

  /**
   * Get user profile with engagement data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile
   */
  async getUserProfile(userId) {
    try {
      if (!userId) {
        throw new Error('userId is required');
      }

      // Get user data
      const userData = this.storage.users.get(userId);
      
      if (!userData) {
        return null;
      }

      // Calculate engagement metrics
      const totalSessionDuration = userData.totalDuration || 0;
      const averageSessionDuration = userData.totalSessions > 0 ? 
        Math.round(totalSessionDuration / userData.totalSessions) : 0;
      
      const averageMessagesPerSession = userData.totalSessions > 0 ? 
        Math.round((userData.totalMessages / userData.totalSessions) * 10) / 10 : 0;
      
      // Calculate satisfaction if available
      let satisfactionScore = null;
      
      if (this.options.enableSatisfactionTracking && userData.feedback && userData.feedback.length > 0) {
        const totalRating = userData.feedback.reduce((sum, feedback) => sum + feedback.rating, 0);
        satisfactionScore = Math.round((totalRating / userData.feedback.length) * 10) / 10;
      }

      // Create user profile
      const profile = {
        userId: userData.id,
        firstSeen: userData.firstSeen,
        lastSeen: userData.lastSeen,
        totalSessions: userData.totalSessions,
        totalMessages: userData.totalMessages,
        engagement: {
          averageSessionDuration,
          averageMessagesPerSession,
          satisfactionScore
        },
        recentSessions: userData.sessions || []
      };

      return profile;
    } catch (error) {
      logger.error('Error getting user profile:', error.message);
      throw error;
    }
  }
}

// Create and export service instance
const userEngagementService = new UserEngagementService();

module.exports = {
  UserEngagementService,
  userEngagementService
};
