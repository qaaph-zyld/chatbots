/**
 * Adaptive TTL Strategy
 * 
 * Dynamically adjusts cache TTL based on usage patterns
 * - Frequently accessed resources get longer TTL
 * - Resources with high miss rates get shorter TTL
 * - Resources with high latency get longer TTL
 */

const { redisClient } = require('./redis.client');
const logger = require('@src/utils/logger');
const cacheMonitoring = require('@services/monitoring/cache-efficiency');

// Default TTL values in seconds
const DEFAULT_TTL = 3600; // 1 hour
const MIN_TTL = 300; // 5 minutes
const MAX_TTL = 86400; // 24 hours

// Weights for different factors
let WEIGHTS = {
  accessFrequency: 0.5,
  missRate: 0.3,
  latency: 0.2
};

// Store original weights for reference
const ORIGINAL_WEIGHTS = {
  accessFrequency: 0.5,
  missRate: 0.3,
  latency: 0.2
};

// Weight adjustment limits
const MIN_WEIGHT = 0.1;
const MAX_WEIGHT = 0.7;

/**
 * Calculate adaptive TTL for a resource
 * 
 * @param {string} resourceType - Type of resource (e.g., 'sentiment', 'translation')
 * @param {string} resourceKey - Unique identifier for the resource
 * @param {boolean} isHit - Whether this calculation is for a cache hit
 * @param {number} responseTime - Response time in milliseconds (if available)
 * @returns {Promise<number>} - TTL in seconds
 */
const calculateAdaptiveTTL = async (resourceType, resourceKey, isHit = false, responseTime = 0) => {
  try {
    // Default TTL if adaptive strategy is disabled
    if (process.env.ENABLE_ADAPTIVE_TTL !== 'true') {
      return DEFAULT_TTL;
    }

    // Get metrics for this resource
    const metricsKey = 'cache:metrics:current';
    const metricsData = await redisClient.get(metricsKey);
    
    if (!metricsData) {
      return DEFAULT_TTL;
    }

    const metrics = JSON.parse(metricsData);
    const resourceMetrics = metrics.resources[resourceType];
    
    if (!resourceMetrics) {
      return DEFAULT_TTL;
    }

    // Get access tracking data
    const accessKey = 'cache:access:tracking';
    const accessData = await redisClient.get(accessKey);
    
    if (!accessData) {
      return DEFAULT_TTL;
    }

    const accessTracking = JSON.parse(accessData);
    const resourceAccess = accessTracking[resourceType]?.[resourceKey];
    
    if (!resourceAccess) {
      return DEFAULT_TTL;
    }

    // Calculate factors for TTL adjustment
    
    // 1. Access Frequency Factor (higher frequency = longer TTL)
    // Normalize access count against the highest access count in this resource type
    const maxAccess = Object.values(accessTracking[resourceType] || {})
      .reduce((max, access) => Math.max(max, access.count), 1);
    const accessFrequencyFactor = resourceAccess.count / maxAccess;
    
    // 2. Miss Rate Factor (higher miss rate = shorter TTL)
    // Invert miss rate so higher values mean lower miss rate
    const missRate = resourceMetrics.misses / (resourceMetrics.hits + resourceMetrics.misses);
    const missRateFactor = 1 - missRate;
    
    // 3. Latency Factor (higher latency = longer TTL)
    // Normalize latency against average latency
    const latencyFactor = resourceMetrics.avgLatency > 100 ? 1 : resourceMetrics.avgLatency / 100;
    
    // Calculate weighted score (0-1 range)
    const score = (
      WEIGHTS.accessFrequency * accessFrequencyFactor +
      WEIGHTS.missRate * missRateFactor +
      WEIGHTS.latency * latencyFactor
    );
    
    // Map score to TTL range
    const ttl = MIN_TTL + Math.floor(score * (MAX_TTL - MIN_TTL));
    
    // Log TTL calculation
    logger.debug(`Adaptive TTL for ${resourceType}:${resourceKey}: ${ttl}s (score: ${score.toFixed(2)})`);
    
    // Record this TTL calculation in monitoring
    await cacheMonitoring.recordCacheAccess(
      resourceType,
      resourceKey,
      isHit,
      responseTime,
      ttl,
      true // This is an adaptive TTL
    );
    
    return ttl;
  } catch (error) {
    logger.error('Error calculating adaptive TTL:', error);
    return DEFAULT_TTL;
  }
};

/**
 * Update access tracking for a resource
 * 
 * @param {string} resourceType - Type of resource
 * @param {string} resourceKey - Unique identifier for the resource
 * @param {boolean} isHit - Whether this was a cache hit
 * @param {number} responseTime - Response time in milliseconds
 * @returns {Promise<void>}
 */
const trackResourceAccess = async (resourceType, resourceKey, isHit = false, responseTime = 0) => {
  try {
    // If adaptive TTL is disabled, record this as a baseline metric
    if (process.env.ENABLE_ADAPTIVE_TTL !== 'true') {
      await cacheMonitoring.recordCacheAccess(
        resourceType,
        resourceKey,
        isHit,
        responseTime,
        DEFAULT_TTL,
        false // This is a baseline (non-adaptive) TTL
      );
      return;
    }

    const accessKey = 'cache:access:tracking';
    
    // Get current access tracking data
    let accessData = await redisClient.get(accessKey);
    let accessTracking = accessData ? JSON.parse(accessData) : {};
    
    // Initialize if needed
    if (!accessTracking[resourceType]) {
      accessTracking[resourceType] = {};
    }
    
    if (!accessTracking[resourceType][resourceKey]) {
      accessTracking[resourceType][resourceKey] = {
        count: 0,
        lastAccess: Date.now()
      };
    }
    
    // Update access count and timestamp
    accessTracking[resourceType][resourceKey].count++;
    accessTracking[resourceType][resourceKey].lastAccess = Date.now();
    
    // Save updated tracking data
    await redisClient.set(accessKey, JSON.stringify(accessTracking), 'EX', 86400 * 7); // 7 days TTL
  } catch (error) {
    logger.error('Error tracking resource access:', error);
  }
};

/**
 * Periodically decay access counts to prevent indefinite growth
 * Should be called on a schedule (e.g., daily)
 * 
 * @returns {Promise<void>}
 */
const decayAccessCounts = async () => {
  try {
    const accessKey = 'cache:access:tracking';
    
    // Get current access tracking data
    let accessData = await redisClient.get(accessKey);
    if (!accessData) return;
    
    let accessTracking = JSON.parse(accessData);
    const now = Date.now();
    const DAY_MS = 86400 * 1000;
    
    // Decay counts based on last access time
    for (const resourceType in accessTracking) {
      for (const resourceKey in accessTracking[resourceType]) {
        const resource = accessTracking[resourceType][resourceKey];
        const daysSinceAccess = (now - resource.lastAccess) / DAY_MS;
        
        if (daysSinceAccess > 7) {
          // Remove entries not accessed for over a week
          delete accessTracking[resourceType][resourceKey];
        } else if (daysSinceAccess > 1) {
          // Decay count by 25% for each day of inactivity
          const decayFactor = Math.pow(0.75, daysSinceAccess);
          resource.count = Math.max(1, Math.floor(resource.count * decayFactor));
        }
      }
      
      // Clean up empty resource types
      if (Object.keys(accessTracking[resourceType]).length === 0) {
        delete accessTracking[resourceType];
      }
    }
    
    // Save updated tracking data
    await redisClient.set(accessKey, JSON.stringify(accessTracking), 'EX', 86400 * 7); // 7 days TTL
    
    logger.info('Completed access count decay process');
  } catch (error) {
    logger.error('Error decaying access counts:', error);
  }
};

/**
 * Initialize the monitoring for adaptive TTL
 * 
 * @returns {Promise<void>}
 */
const initMonitoring = async () => {
  try {
    await cacheMonitoring.initMonitoring({
      sampleInterval: 3600, // 1 hour
      retentionPeriod: 30, // 30 days
      baselineSampleSize: 1000,
      comparisonThreshold: 100
    });
    logger.info('Adaptive TTL monitoring initialized');
  } catch (error) {
    logger.error('Failed to initialize adaptive TTL monitoring:', error);
  }
};

/**
 * Generate a report on cache efficiency improvements
 * 
 * @returns {Promise<Object>} The comparison report
 */
const generateEfficiencyReport = async () => {
  try {
    return await cacheMonitoring.generateComparisonReport();
  } catch (error) {
    logger.error('Failed to generate cache efficiency report:', error);
    return { error: error.message };
  }
};

/**
 * Get current status of cache efficiency monitoring
 * 
 * @returns {Promise<Object>} The monitoring status
 */
const getMonitoringStatus = async () => {
  try {
    return await cacheMonitoring.getMonitoringStatus();
  } catch (error) {
    logger.error('Failed to get cache monitoring status:', error);
    return { error: error.message };
  }
};

/**
 * Automatically tune the weights used in TTL calculation based on performance metrics
 * 
 * @returns {Promise<Object>} The updated weights and performance impact
 */
const autoTuneWeights = async () => {
  try {
    // Get current performance metrics
    const currentStatus = await cacheMonitoring.getMonitoringStatus();
    const efficiencyReport = await cacheMonitoring.generateComparisonReport();
    
    if (!currentStatus || !efficiencyReport) {
      logger.warn('Insufficient data for weight tuning');
      return { 
        success: false, 
        message: 'Insufficient monitoring data for weight tuning',
        weights: WEIGHTS 
      };
    }
    
    // Extract key performance indicators
    const { hitRate, avgLatency, resourceCoverage } = currentStatus;
    const { improvement } = efficiencyReport;
    
    // Calculate adjustment factors based on current performance
    let accessFrequencyAdjustment = 0;
    let missRateAdjustment = 0;
    let latencyAdjustment = 0;
    
    // If hit rate is below target, increase weight on access frequency
    if (hitRate < 0.75) {
      accessFrequencyAdjustment = 0.05;
      missRateAdjustment = -0.03;
    }
    
    // If latency improvement is minimal, increase latency weight
    if (improvement && improvement.latency < 10) {
      latencyAdjustment = 0.04;
      accessFrequencyAdjustment -= 0.02;
    }
    
    // If resource coverage is low, increase miss rate weight
    if (resourceCoverage < 0.6) {
      missRateAdjustment = 0.03;
      accessFrequencyAdjustment -= 0.01;
      latencyAdjustment -= 0.02;
    }
    
    // Apply adjustments with constraints
    const oldWeights = { ...WEIGHTS };
    
    WEIGHTS.accessFrequency = Math.max(MIN_WEIGHT, 
      Math.min(MAX_WEIGHT, WEIGHTS.accessFrequency + accessFrequencyAdjustment));
      
    WEIGHTS.missRate = Math.max(MIN_WEIGHT, 
      Math.min(MAX_WEIGHT, WEIGHTS.missRate + missRateAdjustment));
      
    WEIGHTS.latency = Math.max(MIN_WEIGHT, 
      Math.min(MAX_WEIGHT, WEIGHTS.latency + latencyAdjustment));
    
    // Normalize weights to ensure they sum to 1.0
    const sum = WEIGHTS.accessFrequency + WEIGHTS.missRate + WEIGHTS.latency;
    WEIGHTS.accessFrequency = parseFloat((WEIGHTS.accessFrequency / sum).toFixed(2));
    WEIGHTS.missRate = parseFloat((WEIGHTS.missRate / sum).toFixed(2));
    WEIGHTS.latency = parseFloat((WEIGHTS.latency / sum).toFixed(2));
    
    // Ensure weights sum to exactly 1.0 (handle rounding errors)
    const roundingError = 1.0 - (WEIGHTS.accessFrequency + WEIGHTS.missRate + WEIGHTS.latency);
    if (roundingError !== 0) {
      // Add the rounding error to the largest weight
      const largestWeight = Object.keys(WEIGHTS).reduce((a, b) => 
        WEIGHTS[a] > WEIGHTS[b] ? a : b);
      WEIGHTS[largestWeight] = parseFloat((WEIGHTS[largestWeight] + roundingError).toFixed(2));
    }
    
    // Log the weight adjustments
    logger.info('Adaptive TTL weights auto-tuned:', { 
      old: oldWeights, 
      new: WEIGHTS,
      performance: {
        hitRate,
        avgLatency,
        resourceCoverage,
        improvement: improvement || 'N/A'
      }
    });
    
    return {
      success: true,
      message: 'Weights auto-tuned successfully',
      oldWeights,
      newWeights: { ...WEIGHTS },
      performanceFactors: {
        hitRate,
        avgLatency,
        resourceCoverage,
        improvement: improvement || 'N/A'
      }
    };
  } catch (error) {
    logger.error('Failed to auto-tune weights:', error);
    return { 
      success: false, 
      error: error.message,
      weights: WEIGHTS 
    };
  }
};

/**
 * Reset weights to their original values
 * 
 * @returns {Object} The reset weights
 */
const resetWeights = () => {
  WEIGHTS = { ...ORIGINAL_WEIGHTS };
  logger.info('Adaptive TTL weights reset to defaults:', WEIGHTS);
  
  return {
    success: true,
    message: 'Weights reset to default values',
    weights: { ...WEIGHTS }
  };
};

module.exports = {
  calculateAdaptiveTTL,
  trackResourceAccess,
  decayAccessCounts,
  initMonitoring,
  generateEfficiencyReport,
  getMonitoringStatus,
  autoTuneWeights,
  resetWeights
};
