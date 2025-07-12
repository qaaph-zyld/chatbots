/**
 * Subscription Analytics Service
 * 
 * Provides analytics and reporting functionality for subscription data
 */

const Subscription = require('../models/subscription.model');
const Tenant = require('../../tenancy/models/tenant.model');
const PaymentAttempt = require('../models/payment-attempt.model');
const logger = require('../../utils/logger');
const mongoose = require('mongoose');
const paymentRecoveryAnalytics = require('./payment-recovery-analytics');

/**
 * Service for subscription analytics
 */
class SubscriptionAnalyticsService {
  /**
   * Get monthly recurring revenue (MRR)
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start date for analysis
   * @param {Date} options.endDate - End date for analysis
   * @param {string} options.interval - Interval for data points (day, week, month)
   * @returns {Promise<Array>} - MRR data points
   */
  async getMonthlyRecurringRevenue(options = {}) {
    try {
      const { startDate, endDate, interval = 'month' } = options;
      
      // Set default date range if not provided (last 12 months)
      const end = endDate || new Date();
      const start = startDate || new Date(end);
      if (!startDate) {
        start.setMonth(start.getMonth() - 11); // Last 12 months
        start.setDate(1); // Start of month
      }
      
      // Get active subscriptions for each interval
      const datePoints = this._generateDatePoints(start, end, interval);
      const mrrData = [];
      
      for (const date of datePoints) {
        // Find active subscriptions at this date point
        const activeSubscriptions = await Subscription.find({
          $or: [
            { 
              status: 'active',
              createdAt: { $lte: date }
            },
            {
              status: 'canceled',
              createdAt: { $lte: date },
              canceledAt: { $gt: date }
            }
          ]
        });
        
        // Calculate MRR
        let mrr = 0;
        for (const subscription of activeSubscriptions) {
          // Convert to monthly rate based on billing cycle
          const monthlyRate = this._getMonthlyRate(subscription);
          mrr += monthlyRate;
        }
        
        mrrData.push({
          date: date.toISOString().split('T')[0],
          value: Math.round(mrr * 100) / 100, // Round to 2 decimal places
          subscriptionCount: activeSubscriptions.length
        });
      }
      
      return mrrData;
    } catch (error) {
      logger.error(`Error calculating MRR: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Get customer churn rate
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start date for analysis
   * @param {Date} options.endDate - End date for analysis
   * @param {string} options.interval - Interval for data points (day, week, month)
   * @returns {Promise<Array>} - Churn rate data points
   */
  async getChurnRate(options = {}) {
    try {
      const { startDate, endDate, interval = 'month' } = options;
      
      // Set default date range if not provided (last 12 months)
      const end = endDate || new Date();
      const start = startDate || new Date(end);
      if (!startDate) {
        start.setMonth(start.getMonth() - 11); // Last 12 months
        start.setDate(1); // Start of month
      }
      
      // Get churn rate for each interval
      const datePoints = this._generateDatePoints(start, end, interval);
      const churnData = [];
      
      for (let i = 1; i < datePoints.length; i++) {
        const currentDate = datePoints[i];
        const previousDate = datePoints[i - 1];
        
        // Count active subscriptions at the beginning of the period
        const startingSubscriptions = await Subscription.countDocuments({
          $or: [
            { 
              status: 'active',
              createdAt: { $lte: previousDate }
            },
            {
              status: 'canceled',
              createdAt: { $lte: previousDate },
              canceledAt: { $gt: previousDate }
            }
          ]
        });
        
        // Count canceled subscriptions during the period
        const canceledSubscriptions = await Subscription.countDocuments({
          status: 'canceled',
          canceledAt: { $gte: previousDate, $lt: currentDate }
        });
        
        // Calculate churn rate
        const churnRate = startingSubscriptions > 0 ? 
          (canceledSubscriptions / startingSubscriptions) * 100 : 0;
        
        churnData.push({
          date: currentDate.toISOString().split('T')[0],
          value: Math.round(churnRate * 100) / 100, // Round to 2 decimal places
          startingSubscriptions,
          canceledSubscriptions
        });
      }
      
      return churnData;
    } catch (error) {
      logger.error(`Error calculating churn rate: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Get customer lifetime value (LTV)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - LTV metrics
   */
  async getCustomerLifetimeValue(options = {}) {
    try {
      // Get average subscription value per month
      const subscriptions = await Subscription.find({ status: 'active' });
      
      if (subscriptions.length === 0) {
        return {
          averageMonthlyRevenue: 0,
          averageLifetimeMonths: 0,
          customerLTV: 0
        };
      }
      
      // Calculate average monthly revenue per customer
      let totalMonthlyRevenue = 0;
      for (const subscription of subscriptions) {
        const monthlyRate = this._getMonthlyRate(subscription);
        totalMonthlyRevenue += monthlyRate;
      }
      
      const averageMonthlyRevenue = totalMonthlyRevenue / subscriptions.length;
      
      // Calculate average customer lifetime in months
      const canceledSubscriptions = await Subscription.find({ status: 'canceled' });
      let totalLifetimeMonths = 0;
      
      for (const subscription of canceledSubscriptions) {
        const createdAt = new Date(subscription.createdAt);
        const canceledAt = new Date(subscription.canceledAt);
        const lifetimeMonths = (canceledAt - createdAt) / (1000 * 60 * 60 * 24 * 30.44); // Average days per month
        totalLifetimeMonths += lifetimeMonths;
      }
      
      // If no canceled subscriptions, use a default value
      const averageLifetimeMonths = canceledSubscriptions.length > 0 ? 
        totalLifetimeMonths / canceledSubscriptions.length : 12; // Default to 12 months if no data
      
      // Calculate LTV
      const customerLTV = averageMonthlyRevenue * averageLifetimeMonths;
      
      return {
        averageMonthlyRevenue: Math.round(averageMonthlyRevenue * 100) / 100,
        averageLifetimeMonths: Math.round(averageLifetimeMonths * 10) / 10,
        customerLTV: Math.round(customerLTV * 100) / 100
      };
    } catch (error) {
      logger.error(`Error calculating customer LTV: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Get revenue breakdown by plan
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Revenue breakdown by plan
   */
  async getRevenueByPlan(options = {}) {
    try {
      // Get active subscriptions
      const subscriptions = await Subscription.find({ status: 'active' });
      
      // Group by plan name
      const planRevenue = {};
      
      for (const subscription of subscriptions) {
        const planName = subscription.plan.name;
        const monthlyRate = this._getMonthlyRate(subscription);
        
        if (!planRevenue[planName]) {
          planRevenue[planName] = {
            planName,
            subscriptionCount: 0,
            monthlyRevenue: 0
          };
        }
        
        planRevenue[planName].subscriptionCount++;
        planRevenue[planName].monthlyRevenue += monthlyRate;
      }
      
      // Convert to array and sort by revenue
      const result = Object.values(planRevenue).map(plan => ({
        ...plan,
        monthlyRevenue: Math.round(plan.monthlyRevenue * 100) / 100
      }));
      
      return result.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue);
    } catch (error) {
      logger.error(`Error calculating revenue by plan: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Get payment success rate
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start date for analysis
   * @param {Date} options.endDate - End date for analysis
   * @returns {Promise<Object>} - Payment success metrics
   */
  async getPaymentSuccessRate(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // Set default date range if not provided (last 30 days)
      const end = endDate || new Date();
      const start = startDate || new Date(end);
      if (!startDate) {
        start.setDate(start.getDate() - 30); // Last 30 days
      }
      
      // Query payment attempts
      const paymentAttempts = await PaymentAttempt.find({
        attemptedAt: { $gte: start, $lte: end }
      });
      
      // Calculate success rate
      const totalAttempts = paymentAttempts.length;
      const successfulAttempts = paymentAttempts.filter(attempt => attempt.status === 'succeeded').length;
      const failedAttempts = totalAttempts - successfulAttempts;
      
      const successRate = totalAttempts > 0 ? 
        (successfulAttempts / totalAttempts) * 100 : 0;
      
      return {
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        successRate: Math.round(successRate * 100) / 100
      };
    } catch (error) {
      logger.error(`Error calculating payment success rate: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Get subscription growth
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start date for analysis
   * @param {Date} options.endDate - End date for analysis
   * @param {string} options.interval - Interval for data points (day, week, month)
   * @returns {Promise<Array>} - Subscription growth data points
   */
  async getSubscriptionGrowth(options = {}) {
    try {
      const { startDate, endDate, interval = 'month' } = options;
      
      // Set default date range if not provided (last 12 months)
      const end = endDate || new Date();
      const start = startDate || new Date(end);
      if (!startDate) {
        start.setMonth(start.getMonth() - 11); // Last 12 months
        start.setDate(1); // Start of month
      }
      
      // Get subscription counts for each interval
      const datePoints = this._generateDatePoints(start, end, interval);
      const growthData = [];
      
      for (const date of datePoints) {
        // Count new subscriptions in this period
        const newSubscriptions = await Subscription.countDocuments({
          createdAt: { $lte: date }
        });
        
        // Count canceled subscriptions in this period
        const canceledSubscriptions = await Subscription.countDocuments({
          status: 'canceled',
          canceledAt: { $lte: date }
        });
        
        // Calculate net subscriptions
        const netSubscriptions = newSubscriptions - canceledSubscriptions;
        
        growthData.push({
          date: date.toISOString().split('T')[0],
          total: netSubscriptions,
          new: newSubscriptions,
          canceled: canceledSubscriptions
        });
      }
      
      return growthData;
    } catch (error) {
      logger.error(`Error calculating subscription growth: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Get subscription dashboard summary
   * @returns {Promise<Object>} - Dashboard summary
   */
  async getDashboardSummary() {
    try {
      // Get active subscriptions count
      const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
      
      // Get total revenue this month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const subscriptionsThisMonth = await Subscription.find({
        status: 'active',
        createdAt: { $lte: now }
      });
      
      let monthlyRevenue = 0;
      for (const subscription of subscriptionsThisMonth) {
        const monthlyRate = this._getMonthlyRate(subscription);
        monthlyRevenue += monthlyRate;
      }
      
      // Get new subscriptions this month
      const newSubscriptionsThisMonth = await Subscription.countDocuments({
        createdAt: { $gte: firstDayOfMonth, $lte: now }
      });
      
      // Get canceled subscriptions this month
      const canceledSubscriptionsThisMonth = await Subscription.countDocuments({
        status: 'canceled',
        canceledAt: { $gte: firstDayOfMonth, $lte: now }
      });
      
      // Calculate churn rate this month
      const startOfMonthSubscriptions = await Subscription.countDocuments({
        $or: [
          { 
            status: 'active',
            createdAt: { $lt: firstDayOfMonth }
          },
          {
            status: 'canceled',
            createdAt: { $lt: firstDayOfMonth },
            canceledAt: { $gte: firstDayOfMonth }
          }
        ]
      });
      
      const churnRate = startOfMonthSubscriptions > 0 ? 
        (canceledSubscriptionsThisMonth / startOfMonthSubscriptions) * 100 : 0;
      
      // Get payment recovery metrics
      const paymentRecoveryMetrics = await paymentRecoveryAnalytics.getPaymentRecoveryMetrics();
      
      return {
        activeSubscriptions,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        newSubscriptionsThisMonth,
        canceledSubscriptionsThisMonth,
        churnRate: Math.round(churnRate * 100) / 100,
        netGrowthThisMonth: newSubscriptionsThisMonth - canceledSubscriptionsThisMonth,
        paymentRecovery: paymentRecoveryMetrics
      };
    } catch (error) {
      logger.error(`Error generating dashboard summary: ${error.message}`, { error });
      throw error;
    }
  }
  
  /**
   * Generate date points for time series data
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} interval - Interval (day, week, month)
   * @returns {Array<Date>} - Array of date points
   * @private
   */
  _generateDatePoints(startDate, endDate, interval) {
    const datePoints = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      datePoints.push(new Date(currentDate));
      
      // Increment date based on interval
      switch (interval) {
        case 'day':
          currentDate.setDate(currentDate.getDate() + 1);
          break;
        case 'week':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'month':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return datePoints;
  }
  
  /**
   * Convert subscription price to monthly rate
   * @param {Object} subscription - Subscription object
   * @returns {number} - Monthly rate
   * @private
   */
  _getMonthlyRate(subscription) {
    const price = subscription.totalAmount || subscription.plan.price;
    const billingCycle = subscription.plan.billingCycle || 'monthly';
    
    // Convert to monthly rate based on billing cycle
    switch (billingCycle) {
      case 'monthly':
        return price;
      case 'quarterly':
        return price / 3;
      case 'biannual':
        return price / 6;
      case 'annual':
        return price / 12;
      default:
        return price;
    }
  }
  
  /**
   * Get payment recovery analytics data
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start date for analysis
   * @param {Date} options.endDate - End date for analysis
   * @returns {Promise<Object>} - Payment recovery analytics data
   */
  async getPaymentRecoveryAnalytics(options = {}) {
    try {
      const { startDate, endDate } = options;
      
      // Set default date range if not provided (last 30 days)
      const end = endDate || new Date();
      const start = startDate || new Date(end);
      if (!startDate) {
        start.setDate(start.getDate() - 30); // Last 30 days
      }
      
      // Get payment recovery attempts
      const recoveryAttempts = await PaymentAttempt.find({
        type: 'recovery',
        createdAt: { $gte: start, $lte: end }
      }).lean();
      
      // Calculate success metrics
      const totalAttempts = recoveryAttempts.length;
      const successfulAttempts = recoveryAttempts.filter(attempt => attempt.status === 'succeeded').length;
      const failedAttempts = recoveryAttempts.filter(attempt => attempt.status === 'failed').length;
      const pendingAttempts = recoveryAttempts.filter(attempt => attempt.status === 'pending').length;
      
      // Calculate recovery rate
      const recoveryRate = totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 0;
      
      // Calculate revenue recovered
      const revenueRecovered = recoveryAttempts
        .filter(attempt => attempt.status === 'succeeded')
        .reduce((total, attempt) => total + (attempt.amount || 0), 0);
      
      // Generate time series data
      const datePoints = this._generateDatePoints(start, end, 'day');
      const timeSeries = datePoints.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        const dayAttempts = recoveryAttempts.filter(attempt => {
          const attemptDate = new Date(attempt.createdAt).toISOString().split('T')[0];
          return attemptDate === dateStr;
        });
        
        const successful = dayAttempts.filter(attempt => attempt.status === 'succeeded').length;
        const failed = dayAttempts.filter(attempt => attempt.status === 'failed').length;
        
        return {
          date: dateStr,
          total: dayAttempts.length,
          successful,
          failed
        };
      });
      
      // Get most common error codes
      const errorCounts = {};
      recoveryAttempts
        .filter(attempt => attempt.status === 'failed' && attempt.errorCode)
        .forEach(attempt => {
          const code = attempt.errorCode;
          errorCounts[code] = (errorCounts[code] || 0) + 1;
        });
      
      const mostCommonErrors = Object.keys(errorCounts)
        .map(code => ({ code, count: errorCounts[code] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 errors
      
      return {
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        pendingAttempts,
        recoveryRate,
        revenueRecovered,
        timeSeries,
        mostCommonErrors
      };
    } catch (error) {
      logger.error(`Error getting payment recovery analytics: ${error.message}`, { error });
      throw error;
    }
  }
}

module.exports = new SubscriptionAnalyticsService();
