/**
 * Payment Recovery Analytics Service
 * 
 * Provides analytics and reporting functionality for payment recovery data
 */

const PaymentAttempt = require('../models/payment-attempt.model');
const logger = require('../../utils/logger');

/**
 * Service for payment recovery analytics
 */
class PaymentRecoveryAnalyticsService {
  /**
   * Get payment recovery metrics
   * @param {Object} options - Query options
   * @param {Date} options.startDate - Start date for analysis
   * @param {Date} options.endDate - End date for analysis
   * @returns {Promise<Object>} - Payment recovery metrics
   */
  async getPaymentRecoveryMetrics(options = {}) {
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
      
      // Calculate recovery metrics
      const totalAttempts = paymentAttempts.length;
      const successfulAttempts = paymentAttempts.filter(attempt => attempt.status === 'succeeded').length;
      const failedAttempts = paymentAttempts.filter(attempt => attempt.status === 'failed').length;
      const pendingAttempts = totalAttempts - successfulAttempts - failedAttempts;
      
      // Calculate recovery rate
      const recoveryRate = totalAttempts > 0 ? 
        (successfulAttempts / totalAttempts) * 100 : 0;
      
      // Calculate revenue recovered
      let revenueRecovered = 0;
      for (const attempt of paymentAttempts) {
        if (attempt.status === 'succeeded' && attempt.amount) {
          revenueRecovered += attempt.amount;
        }
      }
      
      // Get unique subscriptions with recovery attempts
      const subscriptionsWithRecoveryAttempts = new Set(
        paymentAttempts.map(attempt => attempt.subscriptionId.toString())
      );
      
      // Get most common error codes
      const errorCodes = {};
      for (const attempt of paymentAttempts) {
        if (attempt.status === 'failed' && attempt.errorCode) {
          errorCodes[attempt.errorCode] = (errorCodes[attempt.errorCode] || 0) + 1;
        }
      }
      
      const mostCommonErrors = Object.entries(errorCodes)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Get time-series data for recovery attempts
      const datePoints = this._generateDatePoints(start, end, 'day');
      const recoveryTimeSeries = [];
      
      for (const date of datePoints) {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const dayAttempts = paymentAttempts.filter(attempt => 
          attempt.attemptedAt >= date && attempt.attemptedAt < nextDay
        );
        
        const daySuccessful = dayAttempts.filter(attempt => attempt.status === 'succeeded').length;
        const dayFailed = dayAttempts.filter(attempt => attempt.status === 'failed').length;
        
        recoveryTimeSeries.push({
          date: date.toISOString().split('T')[0],
          total: dayAttempts.length,
          successful: daySuccessful,
          failed: dayFailed,
          rate: dayAttempts.length > 0 ? (daySuccessful / dayAttempts.length) * 100 : 0
        });
      }
      
      return {
        totalAttempts,
        successfulAttempts,
        failedAttempts,
        pendingAttempts,
        recoveryRate: Math.round(recoveryRate * 100) / 100,
        revenueRecovered: Math.round(revenueRecovered * 100) / 100,
        subscriptionsCount: subscriptionsWithRecoveryAttempts.size,
        mostCommonErrors,
        timeSeries: recoveryTimeSeries
      };
    } catch (error) {
      logger.error(`Error calculating payment recovery metrics: ${error.message}`, { error });
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
}

module.exports = new PaymentRecoveryAnalyticsService();
