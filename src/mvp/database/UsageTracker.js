/**
 * Usage Tracker for ShopBot MVP
 * Tracks conversation usage for billing and analytics
 */

const fs = require('fs');
const path = require('path');

class UsageTracker {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(__dirname, '../../../data/usage');
    this.ensureDataDirectory();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Get usage file path for customer
   * @param {string} customerId - Customer ID
   * @returns {string} File path
   */
  getUsageFilePath(customerId) {
    return path.join(this.dataDir, `${customerId}.json`);
  }

  /**
   * Get current month key
   * @returns {string} Month key (YYYY-MM)
   */
  getCurrentMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Load usage data for customer
   * @param {string} customerId - Customer ID
   * @returns {Object} Usage data
   */
  loadUsageData(customerId) {
    const filePath = this.getUsageFilePath(customerId);
    
    if (!fs.existsSync(filePath)) {
      return {
        customerId,
        totalConversations: 0,
        monthlyUsage: {},
        dailyUsage: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error loading usage data for ${customerId}:`, error);
      return this.loadUsageData(customerId); // Return default structure
    }
  }

  /**
   * Save usage data for customer
   * @param {string} customerId - Customer ID
   * @param {Object} usageData - Usage data
   */
  saveUsageData(customerId, usageData) {
    const filePath = this.getUsageFilePath(customerId);
    usageData.updatedAt = new Date().toISOString();
    
    try {
      fs.writeFileSync(filePath, JSON.stringify(usageData, null, 2));
    } catch (error) {
      console.error(`Error saving usage data for ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Track conversation usage
   * @param {string} customerId - Customer ID
   * @param {number} count - Number of conversations to add
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Updated usage data
   */
  trackUsage(customerId, count = 1, metadata = {}) {
    const usageData = this.loadUsageData(customerId);
    const monthKey = this.getCurrentMonthKey();
    const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const timestamp = new Date().toISOString();

    // Update total conversations
    usageData.totalConversations += count;

    // Update monthly usage
    if (!usageData.monthlyUsage[monthKey]) {
      usageData.monthlyUsage[monthKey] = {
        conversations: 0,
        firstUsage: timestamp,
        lastUsage: timestamp
      };
    }
    usageData.monthlyUsage[monthKey].conversations += count;
    usageData.monthlyUsage[monthKey].lastUsage = timestamp;

    // Update daily usage
    if (!usageData.dailyUsage[dateKey]) {
      usageData.dailyUsage[dateKey] = {
        conversations: 0,
        sessions: new Set(),
        firstUsage: timestamp,
        lastUsage: timestamp
      };
    }
    usageData.dailyUsage[dateKey].conversations += count;
    usageData.dailyUsage[dateKey].lastUsage = timestamp;

    // Add session tracking if provided
    if (metadata.sessionId) {
      if (!usageData.dailyUsage[dateKey].sessions) {
        usageData.dailyUsage[dateKey].sessions = new Set();
      }
      usageData.dailyUsage[dateKey].sessions.add(metadata.sessionId);
      
      // Convert Set to Array for JSON serialization
      usageData.dailyUsage[dateKey].sessions = Array.from(usageData.dailyUsage[dateKey].sessions);
    }

    // Add metadata
    if (Object.keys(metadata).length > 0) {
      if (!usageData.metadata) {
        usageData.metadata = [];
      }
      usageData.metadata.push({
        timestamp,
        count,
        ...metadata
      });

      // Keep only last 1000 metadata entries
      if (usageData.metadata.length > 1000) {
        usageData.metadata = usageData.metadata.slice(-1000);
      }
    }

    this.saveUsageData(customerId, usageData);
    return usageData;
  }

  /**
   * Get current month usage for customer
   * @param {string} customerId - Customer ID
   * @returns {number} Current month usage count
   */
  getCurrentMonthUsage(customerId) {
    const usageData = this.loadUsageData(customerId);
    const monthKey = this.getCurrentMonthKey();
    
    return usageData.monthlyUsage[monthKey] ? usageData.monthlyUsage[monthKey].conversations : 0;
  }

  /**
   * Get usage statistics for customer
   * @param {string} customerId - Customer ID
   * @returns {Object} Usage statistics
   */
  getUsageStats(customerId) {
    const usageData = this.loadUsageData(customerId);
    const monthKey = this.getCurrentMonthKey();
    const dateKey = new Date().toISOString().split('T')[0];

    const currentMonth = usageData.monthlyUsage[monthKey] || { conversations: 0 };
    const today = usageData.dailyUsage[dateKey] || { conversations: 0, sessions: [] };

    // Calculate average daily usage for current month
    const monthlyData = usageData.monthlyUsage[monthKey];
    let avgDaily = 0;
    if (monthlyData) {
      const daysInMonth = new Date().getDate(); // Current day of month
      avgDaily = Math.round(monthlyData.conversations / daysInMonth * 100) / 100;
    }

    // Get last 7 days usage
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      const dayUsage = usageData.dailyUsage[key] || { conversations: 0 };
      last7Days.push({
        date: key,
        conversations: dayUsage.conversations,
        sessions: dayUsage.sessions ? dayUsage.sessions.length : 0
      });
    }

    return {
      customerId,
      totalConversations: usageData.totalConversations,
      currentMonth: {
        conversations: currentMonth.conversations,
        averageDaily: avgDaily
      },
      today: {
        conversations: today.conversations,
        sessions: today.sessions ? today.sessions.length : 0
      },
      last7Days,
      createdAt: usageData.createdAt,
      updatedAt: usageData.updatedAt
    };
  }

  /**
   * Get usage for specific date range
   * @param {string} customerId - Customer ID
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Object} Usage data for date range
   */
  getUsageByDateRange(customerId, startDate, endDate) {
    const usageData = this.loadUsageData(customerId);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const rangeUsage = [];
    let totalConversations = 0;
    let totalSessions = new Set();

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      const dayUsage = usageData.dailyUsage[dateKey] || { conversations: 0, sessions: [] };
      
      rangeUsage.push({
        date: dateKey,
        conversations: dayUsage.conversations,
        sessions: dayUsage.sessions ? dayUsage.sessions.length : 0
      });

      totalConversations += dayUsage.conversations;
      if (dayUsage.sessions) {
        dayUsage.sessions.forEach(session => totalSessions.add(session));
      }
    }

    return {
      customerId,
      startDate,
      endDate,
      totalConversations,
      totalSessions: totalSessions.size,
      dailyBreakdown: rangeUsage,
      averageDaily: rangeUsage.length > 0 ? Math.round(totalConversations / rangeUsage.length * 100) / 100 : 0
    };
  }

  /**
   * Reset monthly usage (called at beginning of new month)
   * @param {string} customerId - Customer ID
   * @returns {Object} Reset confirmation
   */
  resetMonthlyUsage(customerId) {
    const usageData = this.loadUsageData(customerId);
    const monthKey = this.getCurrentMonthKey();
    
    // Archive current month data if it exists
    if (usageData.monthlyUsage[monthKey]) {
      if (!usageData.archivedMonths) {
        usageData.archivedMonths = {};
      }
      usageData.archivedMonths[monthKey] = usageData.monthlyUsage[monthKey];
    }

    // Reset current month
    usageData.monthlyUsage[monthKey] = {
      conversations: 0,
      firstUsage: null,
      lastUsage: null
    };

    this.saveUsageData(customerId, usageData);
    
    return {
      customerId,
      monthKey,
      reset: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get all customers with usage data
   * @returns {Array} List of customer IDs
   */
  getAllCustomers() {
    try {
      const files = fs.readdirSync(this.dataDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Error reading usage directory:', error);
      return [];
    }
  }

  /**
   * Get aggregate usage statistics
   * @returns {Object} Aggregate statistics
   */
  getAggregateStats() {
    const customers = this.getAllCustomers();
    const monthKey = this.getCurrentMonthKey();
    
    let totalCustomers = customers.length;
    let totalConversations = 0;
    let monthlyConversations = 0;
    let activeCustomers = 0;

    customers.forEach(customerId => {
      const usageData = this.loadUsageData(customerId);
      totalConversations += usageData.totalConversations;
      
      const monthlyUsage = usageData.monthlyUsage[monthKey];
      if (monthlyUsage && monthlyUsage.conversations > 0) {
        monthlyConversations += monthlyUsage.conversations;
        activeCustomers++;
      }
    });

    return {
      totalCustomers,
      activeCustomers,
      totalConversations,
      monthlyConversations,
      averageConversationsPerCustomer: totalCustomers > 0 ? Math.round(totalConversations / totalCustomers * 100) / 100 : 0,
      averageMonthlyPerActive: activeCustomers > 0 ? Math.round(monthlyConversations / activeCustomers * 100) / 100 : 0,
      month: monthKey,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Clean up old usage data
   * @param {number} monthsToKeep - Number of months to keep (default: 12)
   */
  cleanupOldData(monthsToKeep = 12) {
    const customers = this.getAllCustomers();
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
    const cutoffKey = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}`;

    customers.forEach(customerId => {
      const usageData = this.loadUsageData(customerId);
      let modified = false;

      // Clean up old monthly usage
      Object.keys(usageData.monthlyUsage).forEach(monthKey => {
        if (monthKey < cutoffKey) {
          delete usageData.monthlyUsage[monthKey];
          modified = true;
        }
      });

      // Clean up old daily usage
      Object.keys(usageData.dailyUsage).forEach(dateKey => {
        const date = new Date(dateKey);
        if (date < cutoffDate) {
          delete usageData.dailyUsage[dateKey];
          modified = true;
        }
      });

      if (modified) {
        this.saveUsageData(customerId, usageData);
      }
    });

    console.log(`Cleaned up usage data older than ${monthsToKeep} months for ${customers.length} customers`);
  }
}

module.exports = UsageTracker;
