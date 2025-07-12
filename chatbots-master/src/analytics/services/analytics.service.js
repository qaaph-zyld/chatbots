/**
 * Analytics Service
 * 
 * Handles collection, processing, and retrieval of analytics data
 * for subscriptions, revenue, and user behavior.
 */

const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/analytics-event.model');
const logger = require('../../utils/logger');

class AnalyticsService {
  /**
   * Track an analytics event
   * @param {Object} params - Event parameters
   * @param {string} params.tenantId - Tenant ID
   * @param {string} params.userId - User ID (optional)
   * @param {string} params.eventType - Event type
   * @param {Object} params.eventData - Event data
   * @returns {Promise<Object>} - Created event
   */
  async trackEvent(params) {
    const { tenantId, userId, eventType, eventData } = params;

    try {
      const event = new AnalyticsEvent({
        tenantId,
        userId,
        eventType,
        eventData,
        timestamp: new Date()
      });

      await event.save();
      logger.debug(`Tracked event ${eventType} for tenant ${tenantId}`);

      return event;
    } catch (error) {
      logger.error(`Error tracking event: ${error.message}`);
      // Don't throw error to prevent disrupting user flow
      return null;
    }
  }

  /**
   * Get events by type
   * @param {Object} params - Query parameters
   * @param {string} params.tenantId - Tenant ID
   * @param {string} params.eventType - Event type
   * @param {Date} [params.startDate] - Start date
   * @param {Date} [params.endDate] - End date
   * @param {number} [params.limit=100] - Maximum number of events to return
   * @returns {Promise<Array>} - Array of events
   */
  async getEventsByType(params) {
    const { tenantId, eventType, startDate, endDate, limit = 100 } = params;

    try {
      const query = {
        tenantId,
        eventType
      };

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      return await AnalyticsEvent.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
      logger.error(`Error getting events by type: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription analytics
   * @param {Object} params - Query parameters
   * @param {string} params.tenantId - Tenant ID
   * @param {Date} [params.startDate] - Start date
   * @param {Date} [params.endDate] - End date
   * @returns {Promise<Object>} - Subscription analytics
   */
  async getSubscriptionAnalytics(params) {
    const { tenantId, startDate, endDate } = params;

    try {
      // Define date range
      const query = {
        tenantId,
        eventType: { $in: ['subscription_created', 'subscription_canceled', 'subscription_renewed'] }
      };

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      // Get all subscription events
      const events = await AnalyticsEvent.find(query).sort({ timestamp: 1 });

      // Process events to calculate metrics
      const metrics = {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        canceledSubscriptions: 0,
        renewalRate: 0,
        churnRate: 0,
        mrr: 0, // Monthly Recurring Revenue
        planDistribution: {}
      };

      // Track subscriptions by ID
      const subscriptions = {};

      for (const event of events) {
        const { eventType, eventData } = event;

        switch (eventType) {
          case 'subscription_created':
            metrics.totalSubscriptions++;
            
            if (!subscriptions[eventData.subscriptionId]) {
              subscriptions[eventData.subscriptionId] = {
                status: 'active',
                planId: eventData.planId,
                price: eventData.price,
                currency: eventData.currency
              };
            }
            
            // Update plan distribution
            if (!metrics.planDistribution[eventData.planId]) {
              metrics.planDistribution[eventData.planId] = 0;
            }
            metrics.planDistribution[eventData.planId]++;
            break;
            
          case 'subscription_canceled':
            if (subscriptions[eventData.subscriptionId]) {
              subscriptions[eventData.subscriptionId].status = 'canceled';
              metrics.canceledSubscriptions++;
            }
            break;
            
          case 'subscription_renewed':
            if (subscriptions[eventData.subscriptionId]) {
              subscriptions[eventData.subscriptionId].status = 'active';
            }
            break;
        }
      }

      // Calculate active subscriptions and MRR
      for (const [id, subscription] of Object.entries(subscriptions)) {
        if (subscription.status === 'active') {
          metrics.activeSubscriptions++;
          
          // Calculate MRR (normalize to monthly)
          let monthlyPrice = subscription.price;
          if (subscription.planId.includes('yearly')) {
            monthlyPrice = subscription.price / 12;
          }
          
          metrics.mrr += monthlyPrice;
        }
      }

      // Calculate rates
      if (metrics.totalSubscriptions > 0) {
        metrics.churnRate = metrics.canceledSubscriptions / metrics.totalSubscriptions;
        metrics.renewalRate = 1 - metrics.churnRate;
      }

      return metrics;
    } catch (error) {
      logger.error(`Error getting subscription analytics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get revenue report
   * @param {Object} params - Query parameters
   * @param {string} params.tenantId - Tenant ID
   * @param {Date} [params.startDate] - Start date
   * @param {Date} [params.endDate] - End date
   * @param {string} [params.currency='USD'] - Currency for the report
   * @returns {Promise<Object>} - Revenue report
   */
  async getRevenueReport(params) {
    const { tenantId, startDate, endDate, currency = 'USD' } = params;

    try {
      // Define date range
      const query = {
        tenantId,
        eventType: { $in: ['payment_succeeded', 'payment_refunded'] }
      };

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      // Get all payment events
      const events = await AnalyticsEvent.find(query).sort({ timestamp: 1 });

      // Process events to calculate metrics
      const report = {
        totalRevenue: 0,
        netRevenue: 0,
        refunds: 0,
        averageOrderValue: 0,
        transactionCount: 0,
        revenueByPlan: {},
        revenueByMonth: {},
        currency
      };

      for (const event of events) {
        const { eventType, eventData, timestamp } = event;
        
        // Convert currency if needed
        let amount = eventData.amount;
        if (eventData.currency !== currency) {
          // In a real implementation, we would use a currency conversion service
          // For now, we'll just use the amount as is
          amount = eventData.amount;
        }

        // Get month key for grouping
        const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
        
        if (!report.revenueByMonth[monthKey]) {
          report.revenueByMonth[monthKey] = 0;
        }

        switch (eventType) {
          case 'payment_succeeded':
            report.totalRevenue += amount;
            report.netRevenue += amount;
            report.transactionCount++;
            
            // Update revenue by plan
            if (eventData.planId) {
              if (!report.revenueByPlan[eventData.planId]) {
                report.revenueByPlan[eventData.planId] = 0;
              }
              report.revenueByPlan[eventData.planId] += amount;
            }
            
            // Update revenue by month
            report.revenueByMonth[monthKey] += amount;
            break;
            
          case 'payment_refunded':
            report.refunds += amount;
            report.netRevenue -= amount;
            
            // Update revenue by month (negative for refunds)
            report.revenueByMonth[monthKey] -= amount;
            break;
        }
      }

      // Calculate average order value
      if (report.transactionCount > 0) {
        report.averageOrderValue = report.totalRevenue / report.transactionCount;
      }

      return report;
    } catch (error) {
      logger.error(`Error getting revenue report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get revenue breakdown by currency
   * @param {Object} params - Query parameters
   * @param {string} params.tenantId - Tenant ID
   * @param {Date} [params.startDate] - Start date
   * @param {Date} [params.endDate] - End date
   * @returns {Promise<Object>} - Revenue by currency
   */
  async getRevenueByCurrency(params) {
    const { tenantId, startDate, endDate } = params;

    try {
      // Define date range
      const query = {
        tenantId,
        eventType: 'payment_succeeded'
      };

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      // Get all payment events
      const events = await AnalyticsEvent.find(query);

      // Group by currency
      const revenueByCurrency = {};

      for (const event of events) {
        const { eventData } = event;
        const currency = eventData.currency.toUpperCase();
        
        if (!revenueByCurrency[currency]) {
          revenueByCurrency[currency] = 0;
        }
        
        revenueByCurrency[currency] += eventData.amount;
      }

      return revenueByCurrency;
    } catch (error) {
      logger.error(`Error getting revenue by currency: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user engagement metrics
   * @param {Object} params - Query parameters
   * @param {string} params.tenantId - Tenant ID
   * @param {Date} [params.startDate] - Start date
   * @param {Date} [params.endDate] - End date
   * @returns {Promise<Object>} - User engagement metrics
   */
  async getUserEngagementMetrics(params) {
    const { tenantId, startDate, endDate } = params;

    try {
      // Define date range
      const query = {
        tenantId,
        eventType: { $in: ['user_login', 'chat_started', 'template_used'] }
      };

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      // Get all engagement events
      const events = await AnalyticsEvent.find(query);

      // Process events to calculate metrics
      const metrics = {
        totalLogins: 0,
        uniqueUsers: new Set(),
        chatsSessions: 0,
        templatesUsed: 0,
        activeUsersByDay: {},
        engagementByHour: Array(24).fill(0)
      };

      for (const event of events) {
        const { eventType, userId, timestamp } = event;
        
        // Track unique users
        if (userId) {
          metrics.uniqueUsers.add(userId);
        }
        
        // Track by day
        const dayKey = timestamp.toISOString().split('T')[0];
        if (!metrics.activeUsersByDay[dayKey]) {
          metrics.activeUsersByDay[dayKey] = new Set();
        }
        if (userId) {
          metrics.activeUsersByDay[dayKey].add(userId);
        }
        
        // Track by hour
        const hour = timestamp.getHours();
        metrics.engagementByHour[hour]++;
        
        // Track by event type
        switch (eventType) {
          case 'user_login':
            metrics.totalLogins++;
            break;
            
          case 'chat_started':
            metrics.chatsSessions++;
            break;
            
          case 'template_used':
            metrics.templatesUsed++;
            break;
        }
      }

      // Convert Sets to counts
      metrics.uniqueUsers = metrics.uniqueUsers.size;
      
      for (const day in metrics.activeUsersByDay) {
        metrics.activeUsersByDay[day] = metrics.activeUsersByDay[day].size;
      }

      return metrics;
    } catch (error) {
      logger.error(`Error getting user engagement metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get dashboard summary
   * @param {Object} params - Query parameters
   * @param {string} params.tenantId - Tenant ID
   * @returns {Promise<Object>} - Dashboard summary
   */
  async getDashboardSummary(params) {
    const { tenantId } = params;

    try {
      // Define date ranges
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixtyDaysAgo = new Date(now);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Get subscription analytics for last 30 days
      const subscriptionAnalytics = await this.getSubscriptionAnalytics({
        tenantId,
        startDate: thirtyDaysAgo,
        endDate: now
      });

      // Get revenue report for last 30 days
      const revenueReport = await this.getRevenueReport({
        tenantId,
        startDate: thirtyDaysAgo,
        endDate: now
      });

      // Get previous period revenue for comparison
      const previousRevenueReport = await this.getRevenueReport({
        tenantId,
        startDate: sixtyDaysAgo,
        endDate: thirtyDaysAgo
      });

      // Get user engagement metrics for last 30 days
      const engagementMetrics = await this.getUserEngagementMetrics({
        tenantId,
        startDate: thirtyDaysAgo,
        endDate: now
      });

      // Calculate growth rates
      const revenueGrowth = previousRevenueReport.totalRevenue > 0
        ? (revenueReport.totalRevenue - previousRevenueReport.totalRevenue) / previousRevenueReport.totalRevenue
        : 0;

      // Compile summary
      const summary = {
        activeSubscriptions: subscriptionAnalytics.activeSubscriptions,
        mrr: subscriptionAnalytics.mrr,
        revenueThisMonth: revenueReport.totalRevenue,
        revenueGrowth,
        churnRate: subscriptionAnalytics.churnRate,
        activeUsers: engagementMetrics.uniqueUsers,
        totalChatSessions: engagementMetrics.chatsSessions,
        topPlans: Object.entries(subscriptionAnalytics.planDistribution)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([planId, count]) => ({ planId, count }))
      };

      return summary;
    } catch (error) {
      logger.error(`Error getting dashboard summary: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
