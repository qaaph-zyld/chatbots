/**
 * Cache Configuration
 * 
 * Environment-specific cache configurations for different API endpoints
 */

// Default cache TTL values in seconds
const defaultTTL = {
  development: {
    sentiment: 300,      // 5 minutes in development
    conversation: 120,   // 2 minutes in development
    user: 600,           // 10 minutes in development
    default: 60          // 1 minute default in development
  },
  test: {
    sentiment: 10,       // 10 seconds in test
    conversation: 10,    // 10 seconds in test
    user: 10,            // 10 seconds in test
    default: 5           // 5 seconds default in test
  },
  production: {
    sentiment: 3600,     // 1 hour in production
    conversation: 1800,  // 30 minutes in production
    user: 7200,          // 2 hours in production
    default: 600         // 10 minutes default in production
  }
};

// Cache prefixes for different resource types
const prefixes = {
  sentiment: 'sentiment',
  conversation: 'conversation',
  user: 'user',
  default: 'api'
};

// Cache monitoring configuration
const monitoring = {
  enabled: process.env.CACHE_MONITORING_ENABLED !== 'false',
  sampleRate: process.env.CACHE_MONITORING_SAMPLE_RATE || 1.0, // Sample 100% by default
  logLevel: process.env.CACHE_MONITORING_LOG_LEVEL || 'info',
  metricsInterval: process.env.CACHE_METRICS_INTERVAL || 60000, // 1 minute
  retentionPeriod: process.env.CACHE_METRICS_RETENTION || 86400000 // 24 hours
};

// Cache warming configuration
const warming = {
  enabled: process.env.CACHE_WARMING_ENABLED !== 'false',
  interval: process.env.CACHE_WARMING_INTERVAL || 300000, // 5 minutes
  maxItems: process.env.CACHE_WARMING_MAX_ITEMS || 100,
  minHits: process.env.CACHE_WARMING_MIN_HITS || 5
};

/**
 * Get TTL for a specific resource type and environment
 * 
 * @param {string} resourceType - Type of resource (sentiment, conversation, etc.)
 * @param {string} env - Environment (development, test, production)
 * @returns {number} TTL in seconds
 */
const getTTL = (resourceType, env = process.env.NODE_ENV || 'development') => {
  const environment = defaultTTL[env] || defaultTTL.development;
  return environment[resourceType] || environment.default;
};

/**
 * Get prefix for a specific resource type
 * 
 * @param {string} resourceType - Type of resource (sentiment, conversation, etc.)
 * @returns {string} Cache key prefix
 */
const getPrefix = (resourceType) => {
  return prefixes[resourceType] || prefixes.default;
};

/**
 * Get complete cache configuration for a resource type
 * 
 * @param {string} resourceType - Type of resource (sentiment, conversation, etc.)
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} Complete cache configuration
 */
const getConfig = (resourceType, overrides = {}) => {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    ttl: getTTL(resourceType, env),
    prefix: getPrefix(resourceType),
    enabled: process.env.CACHE_ENABLED !== 'false',
    bypassHeader: 'X-Bypass-Cache',
    bypassQuery: '_nocache',
    monitoring: monitoring.enabled,
    ...overrides
  };
};

module.exports = {
  getTTL,
  getPrefix,
  getConfig,
  defaultTTL,
  prefixes,
  monitoring,
  warming
};
