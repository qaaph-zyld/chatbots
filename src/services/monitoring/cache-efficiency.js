/**
 * Cache Efficiency Monitoring Service
 * 
 * Tracks and analyzes cache efficiency metrics, particularly for the Adaptive TTL feature.
 * Provides insights into cache hit rates, response times, and TTL effectiveness.
 */

const redis = require('@services/redis').client;
const { logger } = require('@utils');

// Redis keys for storing monitoring data
const KEYS = {
  BASELINE_METRICS: 'monitoring:cache:baseline',
  ADAPTIVE_METRICS: 'monitoring:cache:adaptive',
  COMPARISON_DATA: 'monitoring:cache:comparison',
  HISTORICAL_DATA: 'monitoring:cache:historical'
};

// Default monitoring configuration
const DEFAULT_CONFIG = {
  sampleInterval: 3600, // 1 hour in seconds
  retentionPeriod: 30, // 30 days
  baselineSampleSize: 1000, // Number of requests to establish baseline
  comparisonThreshold: 100 // Minimum number of requests before comparison
};

/**
 * Initialize the cache efficiency monitoring service
 * @param {Object} config - Optional configuration overrides
 * @returns {Promise<void>}
 */
async function initMonitoring(config = {}) {
  try {
    // Merge default config with provided config
    const monitoringConfig = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    // Store the configuration
    await redis.set('monitoring:cache:config', JSON.stringify(monitoringConfig));
    
    logger.info('Cache efficiency monitoring initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize cache efficiency monitoring:', error);
    return false;
  }
}

/**
 * Record a cache access event for monitoring
 * @param {String} resourceType - Type of resource (e.g., 'api', 'db')
 * @param {String} resourceKey - Specific resource identifier
 * @param {Boolean} isHit - Whether the cache access was a hit or miss
 * @param {Number} responseTime - Response time in milliseconds
 * @param {Number} ttl - TTL value assigned to the resource
 * @param {Boolean} isAdaptive - Whether adaptive TTL was used
 * @returns {Promise<void>}
 */
async function recordCacheAccess(resourceType, resourceKey, isHit, responseTime, ttl, isAdaptive) {
  try {
    const timestamp = Date.now();
    const metricKey = isAdaptive ? KEYS.ADAPTIVE_METRICS : KEYS.BASELINE_METRICS;
    
    // Create a record of this cache access
    const accessRecord = {
      resourceType,
      resourceKey,
      isHit,
      responseTime,
      ttl,
      timestamp
    };
    
    // Add to the appropriate list, keeping only recent records
    await redis.lpush(`${metricKey}:${resourceType}:${resourceKey}`, JSON.stringify(accessRecord));
    await redis.ltrim(`${metricKey}:${resourceType}:${resourceKey}`, 0, 999); // Keep last 1000 records
    
    // Update summary metrics
    const summaryKey = `${metricKey}:summary:${resourceType}:${resourceKey}`;
    const summary = JSON.parse(await redis.get(summaryKey) || '{}');
    
    // Initialize summary if it doesn't exist
    if (!Object.keys(summary).length) {
      summary.totalAccesses = 0;
      summary.hits = 0;
      summary.totalResponseTime = 0;
      summary.ttlValues = [];
      summary.firstAccess = timestamp;
    }
    
    // Update summary data
    summary.totalAccesses++;
    if (isHit) summary.hits++;
    summary.totalResponseTime += responseTime;
    summary.ttlValues.push(ttl);
    summary.lastAccess = timestamp;
    
    // Keep only the last 100 TTL values for analysis
    if (summary.ttlValues.length > 100) {
      summary.ttlValues = summary.ttlValues.slice(-100);
    }
    
    // Save updated summary
    await redis.set(summaryKey, JSON.stringify(summary));
    
    return true;
  } catch (error) {
    logger.error('Failed to record cache access for monitoring:', error);
    return false;
  }
}

/**
 * Generate a comparison report between baseline and adaptive TTL performance
 * @returns {Promise<Object>} Comparison metrics
 */
async function generateComparisonReport() {
  try {
    // Get all baseline and adaptive summary keys
    const baselineKeys = await redis.keys(`${KEYS.BASELINE_METRICS}:summary:*`);
    const adaptiveKeys = await redis.keys(`${KEYS.ADAPTIVE_METRICS}:summary:*`);
    
    // Initialize report data
    const report = {
      timestamp: Date.now(),
      overall: {
        baseline: { totalAccesses: 0, hits: 0, avgResponseTime: 0 },
        adaptive: { totalAccesses: 0, hits: 0, avgResponseTime: 0 }
      },
      resources: {}
    };
    
    // Process baseline data
    for (const key of baselineKeys) {
      const summary = JSON.parse(await redis.get(key) || '{}');
      if (!Object.keys(summary).length) continue;
      
      // Extract resource identifiers from key
      const parts = key.split(':');
      const resourceType = parts[3];
      const resourceKey = parts.slice(4).join(':');
      const resourceId = `${resourceType}:${resourceKey}`;
      
      // Initialize resource in report if it doesn't exist
      if (!report.resources[resourceId]) {
        report.resources[resourceId] = {
          baseline: {},
          adaptive: {}
        };
      }
      
      // Calculate metrics
      const hitRate = summary.totalAccesses > 0 ? (summary.hits / summary.totalAccesses) * 100 : 0;
      const avgResponseTime = summary.totalAccesses > 0 ? summary.totalResponseTime / summary.totalAccesses : 0;
      const avgTTL = summary.ttlValues.length > 0 ? summary.ttlValues.reduce((a, b) => a + b, 0) / summary.ttlValues.length : 0;
      
      // Add to resource report
      report.resources[resourceId].baseline = {
        totalAccesses: summary.totalAccesses,
        hits: summary.hits,
        hitRate,
        avgResponseTime,
        avgTTL
      };
      
      // Add to overall report
      report.overall.baseline.totalAccesses += summary.totalAccesses;
      report.overall.baseline.hits += summary.hits;
      report.overall.baseline.avgResponseTime += summary.totalResponseTime;
    }
    
    // Calculate overall baseline metrics
    if (report.overall.baseline.totalAccesses > 0) {
      report.overall.baseline.hitRate = (report.overall.baseline.hits / report.overall.baseline.totalAccesses) * 100;
      report.overall.baseline.avgResponseTime = report.overall.baseline.avgResponseTime / report.overall.baseline.totalAccesses;
    }
    
    // Process adaptive data
    for (const key of adaptiveKeys) {
      const summary = JSON.parse(await redis.get(key) || '{}');
      if (!Object.keys(summary).length) continue;
      
      // Extract resource identifiers from key
      const parts = key.split(':');
      const resourceType = parts[3];
      const resourceKey = parts.slice(4).join(':');
      const resourceId = `${resourceType}:${resourceKey}`;
      
      // Initialize resource in report if it doesn't exist
      if (!report.resources[resourceId]) {
        report.resources[resourceId] = {
          baseline: {},
          adaptive: {}
        };
      }
      
      // Calculate metrics
      const hitRate = summary.totalAccesses > 0 ? (summary.hits / summary.totalAccesses) * 100 : 0;
      const avgResponseTime = summary.totalAccesses > 0 ? summary.totalResponseTime / summary.totalAccesses : 0;
      const avgTTL = summary.ttlValues.length > 0 ? summary.ttlValues.reduce((a, b) => a + b, 0) / summary.ttlValues.length : 0;
      
      // Add to resource report
      report.resources[resourceId].adaptive = {
        totalAccesses: summary.totalAccesses,
        hits: summary.hits,
        hitRate,
        avgResponseTime,
        avgTTL
      };
      
      // Add to overall report
      report.overall.adaptive.totalAccesses += summary.totalAccesses;
      report.overall.adaptive.hits += summary.hits;
      report.overall.adaptive.avgResponseTime += summary.totalResponseTime;
    }
    
    // Calculate overall adaptive metrics
    if (report.overall.adaptive.totalAccesses > 0) {
      report.overall.adaptive.hitRate = (report.overall.adaptive.hits / report.overall.adaptive.totalAccesses) * 100;
      report.overall.adaptive.avgResponseTime = report.overall.adaptive.avgResponseTime / report.overall.adaptive.totalAccesses;
    }
    
    // Calculate improvements
    if (report.overall.baseline.totalAccesses > 0 && report.overall.adaptive.totalAccesses > 0) {
      report.improvements = {
        hitRate: report.overall.adaptive.hitRate - report.overall.baseline.hitRate,
        responseTime: ((report.overall.baseline.avgResponseTime - report.overall.adaptive.avgResponseTime) / report.overall.baseline.avgResponseTime) * 100
      };
    }
    
    // Store the report
    await redis.lpush(KEYS.COMPARISON_DATA, JSON.stringify(report));
    await redis.ltrim(KEYS.COMPARISON_DATA, 0, 99); // Keep last 100 reports
    
    return report;
  } catch (error) {
    logger.error('Failed to generate cache efficiency comparison report:', error);
    return { error: error.message };
  }
}

/**
 * Get historical efficiency data for visualization
 * @param {Number} limit - Maximum number of data points to return
 * @returns {Promise<Array>} Historical data points
 */
async function getHistoricalData(limit = 30) {
  try {
    const reports = await redis.lrange(KEYS.COMPARISON_DATA, 0, limit - 1);
    return reports.map(report => JSON.parse(report));
  } catch (error) {
    logger.error('Failed to retrieve historical cache efficiency data:', error);
    return [];
  }
}

/**
 * Reset monitoring data
 * @param {String} type - Type of data to reset ('baseline', 'adaptive', 'all')
 * @returns {Promise<Boolean>} Success indicator
 */
async function resetMonitoringData(type = 'all') {
  try {
    let keys = [];
    
    if (type === 'all' || type === 'baseline') {
      const baselineKeys = await redis.keys(`${KEYS.BASELINE_METRICS}*`);
      keys = [...keys, ...baselineKeys];
    }
    
    if (type === 'all' || type === 'adaptive') {
      const adaptiveKeys = await redis.keys(`${KEYS.ADAPTIVE_METRICS}*`);
      keys = [...keys, ...adaptiveKeys];
    }
    
    if (type === 'all') {
      const comparisonKeys = await redis.keys(`${KEYS.COMPARISON_DATA}*`);
      const historicalKeys = await redis.keys(`${KEYS.HISTORICAL_DATA}*`);
      keys = [...keys, ...comparisonKeys, ...historicalKeys];
    }
    
    if (keys.length > 0) {
      await redis.del(keys);
    }
    
    logger.info(`Reset ${type} monitoring data (${keys.length} keys)`);
    return true;
  } catch (error) {
    logger.error('Failed to reset monitoring data:', error);
    return false;
  }
}

module.exports = {
  initMonitoring,
  recordCacheAccess,
  generateComparisonReport,
  getHistoricalData,
  resetMonitoringData
};
