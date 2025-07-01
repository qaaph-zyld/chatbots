/**
 * Revenue Analytics Service
 * 
 * Provides business logic for tracking and analyzing revenue metrics
 */

const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const Subscription = require('../../billing/models/subscription.model');
const Tenant = require('../../tenancy/models/tenant.model');

/**
 * Service for revenue analytics and reporting
 */
class RevenueAnalyticsService {
  /**
   * Get monthly recurring revenue (MRR)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} MRR data
   */
  async getMonthlyRecurringRevenue(options = {}) {
    try {
      const endDate = options.endDate || new Date();
      const startDate = options.startDate || new Date(endDate);
      startDate.setMonth(startDate.getMonth() - (options.months || 6));
      
      // Aggregate MRR by month
      const mrrData = await Subscription.aggregate([
        {
          $match: {
            status: { $in: ['active', 'trialing'] },
            createdAt: { $lte: endDate }
          }
        },
        {
          $project: {
            yearMonth: { 
              $dateToString: { format: "%Y-%m", date: "$createdAt" } 
            },
            monthlyRevenue: { 
              $cond: [
                { $eq: ["$plan.billingCycle", "annual"] },
                { $divide: ["$plan.price", 12] },
                "$plan.price"
              ]
            },
            status: 1,
            tier: "$plan.name"
          }
        },
        {
          $group: {
            _id: {
              yearMonth: "$yearMonth",
              tier: "$tier"
            },
            revenue: { $sum: "$monthlyRevenue" },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { "_id.yearMonth": 1 }
        }
      ]);
      
      // Format data for chart display
      const months = [];
      const tiers = {};
      const totalByMonth = {};
      
      // Initialize months array with all months in range
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const yearMonth = currentDate.toISOString().substring(0, 7);
        months.push(yearMonth);
        totalByMonth[yearMonth] = 0;
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Populate data
      mrrData.forEach(item => {
        const { yearMonth, tier } = item._id;
        if (!tiers[tier]) {
          tiers[tier] = months.reduce((acc, month) => {
            acc[month] = 0;
            return acc;
          }, {});
        }
        
        tiers[tier][yearMonth] = item.revenue;
        totalByMonth[yearMonth] += item.revenue;
      });
      
      return {
        months,
        tiers,
        totalByMonth,
        currentMRR: Object.values(totalByMonth).pop() || 0
      };
    } catch (error) {
      logger.error(`Error getting MRR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get customer acquisition cost (CAC)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} CAC data
   */
  async getCustomerAcquisitionCost(options = {}) {
    try {
      // In a real implementation, this would calculate CAC based on marketing spend
      // For now, we'll return mock data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const marketingSpend = [5000, 7500, 10000, 12500, 15000, 17500];
      const newCustomers = [10, 25, 40, 60, 85, 120];
      
      const cacByMonth = months.map((month, index) => ({
        month,
        marketingSpend: marketingSpend[index],
        newCustomers: newCustomers[index],
        cac: marketingSpend[index] / newCustomers[index]
      }));
      
      return {
        cacByMonth,
        averageCac: marketingSpend.reduce((a, b) => a + b, 0) / newCustomers.reduce((a, b) => a + b, 0)
      };
    } catch (error) {
      logger.error(`Error getting CAC: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get customer lifetime value (LTV)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} LTV data
   */
  async getCustomerLifetimeValue(options = {}) {
    try {
      const subscriptions = await Subscription.find({
        status: { $in: ['active', 'trialing'] }
      });
      
      // Calculate average monthly revenue per customer
      const avgMonthlyRevenue = subscriptions.reduce((total, sub) => {
        const monthlyPrice = sub.plan.billingCycle === 'annual' 
          ? sub.plan.price / 12 
          : sub.plan.price;
        return total + monthlyPrice;
      }, 0) / (subscriptions.length || 1);
      
      // Assume average customer lifetime of 24 months
      const avgLifetimeMonths = 24;
      
      // Calculate LTV
      const ltv = avgMonthlyRevenue * avgLifetimeMonths;
      
      // Calculate LTV:CAC ratio (assuming CAC of $200)
      const cac = 200;
      const ltvCacRatio = ltv / cac;
      
      return {
        avgMonthlyRevenue,
        avgLifetimeMonths,
        ltv,
        ltvCacRatio
      };
    } catch (error) {
      logger.error(`Error getting LTV: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get churn rate
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Churn data
   */
  async getChurnRate(options = {}) {
    try {
      const endDate = options.endDate || new Date();
      const startDate = options.startDate || new Date(endDate);
      startDate.setMonth(startDate.getMonth() - (options.months || 6));
      
      // Get all subscriptions that were canceled in the period
      const canceledSubscriptions = await Subscription.find({
        status: 'canceled',
        updatedAt: { $gte: startDate, $lte: endDate }
      });
      
      // Group by month
      const churnByMonth = {};
      canceledSubscriptions.forEach(sub => {
        const yearMonth = sub.updatedAt.toISOString().substring(0, 7);
        if (!churnByMonth[yearMonth]) {
          churnByMonth[yearMonth] = { canceled: 0, total: 0 };
        }
        churnByMonth[yearMonth].canceled++;
      });
      
      // Get total active subscriptions at the beginning of each month
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const yearMonth = currentDate.toISOString().substring(0, 7);
        if (!churnByMonth[yearMonth]) {
          churnByMonth[yearMonth] = { canceled: 0, total: 0 };
        }
        
        // Count active subscriptions at the beginning of the month
        const activeCount = await Subscription.countDocuments({
          status: { $in: ['active', 'trialing'] },
          createdAt: { $lt: currentDate }
        });
        
        churnByMonth[yearMonth].total = activeCount;
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Calculate churn rate
      const churnData = Object.entries(churnByMonth).map(([month, data]) => ({
        month,
        canceled: data.canceled,
        total: data.total,
        churnRate: data.total > 0 ? (data.canceled / data.total) * 100 : 0
      }));
      
      // Calculate average churn rate
      const totalCanceled = churnData.reduce((sum, item) => sum + item.canceled, 0);
      const totalCustomers = churnData.reduce((sum, item) => sum + item.total, 0);
      const avgChurnRate = totalCustomers > 0 ? (totalCanceled / totalCustomers) * 100 : 0;
      
      return {
        churnData,
        avgChurnRate
      };
    } catch (error) {
      logger.error(`Error getting churn rate: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get revenue forecast
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Forecast data
   */
  async getRevenueForecast(options = {}) {
    try {
      const months = options.months || 12;
      
      // Get current MRR
      const mrrData = await this.getMonthlyRecurringRevenue();
      const currentMRR = mrrData.currentMRR;
      
      // Get churn rate
      const churnData = await this.getChurnRate();
      const monthlyChurnRate = churnData.avgChurnRate / 100;
      
      // Assume monthly growth rate
      const monthlyGrowthRate = options.growthRate || 0.1; // 10% growth
      
      // Calculate forecast
      const forecast = [];
      let mrr = currentMRR;
      
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        
        // Calculate new MRR
        const churnedMRR = mrr * monthlyChurnRate;
        const newMRR = mrr * monthlyGrowthRate;
        mrr = mrr - churnedMRR + newMRR;
        
        forecast.push({
          month: `${month} ${year}`,
          mrr,
          churnedMRR,
          newMRR
        });
      }
      
      return {
        forecast,
        projectedAnnualRevenue: forecast[forecast.length - 1].mrr * 12
      };
    } catch (error) {
      logger.error(`Error getting revenue forecast: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get subscription metrics
   * @returns {Promise<Object>} Subscription metrics
   */
  async getSubscriptionMetrics() {
    try {
      // Get counts by tier
      const tierCounts = await Subscription.aggregate([
        {
          $match: {
            status: { $in: ['active', 'trialing'] }
          }
        },
        {
          $group: {
            _id: "$plan.name",
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Get counts by billing cycle
      const cycleCounts = await Subscription.aggregate([
        {
          $match: {
            status: { $in: ['active', 'trialing'] }
          }
        },
        {
          $group: {
            _id: "$plan.billingCycle",
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Format data
      const tierData = tierCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
      
      const cycleData = cycleCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {});
      
      // Calculate total active subscriptions
      const totalActive = await Subscription.countDocuments({
        status: { $in: ['active', 'trialing'] }
      });
      
      // Calculate average revenue per user (ARPU)
      const subscriptions = await Subscription.find({
        status: { $in: ['active', 'trialing'] }
      });
      
      const totalRevenue = subscriptions.reduce((total, sub) => {
        return total + sub.plan.price;
      }, 0);
      
      const arpu = totalActive > 0 ? totalRevenue / totalActive : 0;
      
      return {
        totalActive,
        tierDistribution: tierData,
        billingCycleDistribution: cycleData,
        arpu
      };
    } catch (error) {
      logger.error(`Error getting subscription metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get revenue dashboard data
   * @returns {Promise<Object>} Dashboard data
   */
  async getRevenueDashboardData() {
    try {
      const [mrr, churn, ltv, metrics] = await Promise.all([
        this.getMonthlyRecurringRevenue(),
        this.getChurnRate(),
        this.getCustomerLifetimeValue(),
        this.getSubscriptionMetrics()
      ]);
      
      return {
        mrr: {
          current: mrr.currentMRR,
          trend: mrr.months.map((month, i) => ({
            month,
            value: mrr.totalByMonth[month] || 0
          }))
        },
        churn: {
          rate: churn.avgChurnRate,
          trend: churn.churnData
        },
        ltv: {
          value: ltv.ltv,
          ltvCacRatio: ltv.ltvCacRatio
        },
        subscriptions: {
          total: metrics.totalActive,
          byTier: metrics.tierDistribution,
          byCycle: metrics.billingCycleDistribution
        },
        arpu: metrics.arpu
      };
    } catch (error) {
      logger.error(`Error getting revenue dashboard data: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new RevenueAnalyticsService();
