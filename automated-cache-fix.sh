#!/bin/bash
# automated-cache-fix.sh
# Automated cache configuration setup and testing

set -euo pipefail

# Configuration
PROJECT_ROOT="$(pwd)"
CONFIG_DIR="$PROJECT_ROOT/src/config"
TESTS_DIR="$PROJECT_ROOT/tests"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Step 1: Create directory structure
create_directory_structure() {
    log "Creating directory structure..."
    
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$TESTS_DIR/setup"
    mkdir -p "$TESTS_DIR/unit/middleware/cache"
    
    log "Directory structure created successfully"
}

# Step 2: Create cache configuration module
create_cache_config() {
    log "Creating cache configuration module..."
    
    cat > "$CONFIG_DIR/cache.config.js" << 'EOF'
'use strict';

/**
 * Cache Configuration Module
 * Centralized cache settings and monitoring configuration
 */

const config = {
  // Cache Strategy Configuration
  strategy: {
    type: process.env.CACHE_TYPE || 'memory',
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour default
    maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 1000,
    refreshAhead: process.env.CACHE_REFRESH_AHEAD === 'true' || false
  },

  // Redis Configuration (if using Redis)
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB) || 0,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'chatbot:cache:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  },

  // Monitoring Configuration
  monitoring: {
    enabled: process.env.CACHE_MONITORING_ENABLED !== 'false',
    metricsInterval: parseInt(process.env.CACHE_METRICS_INTERVAL) || 60000, // 1 minute
    alertThresholds: {
      hitRatio: parseFloat(process.env.CACHE_HIT_RATIO_THRESHOLD) || 0.8,
      errorRate: parseFloat(process.env.CACHE_ERROR_RATE_THRESHOLD) || 0.05,
      latency: parseInt(process.env.CACHE_LATENCY_THRESHOLD) || 100 // milliseconds
    },
    retention: {
      metrics: parseInt(process.env.CACHE_METRICS_RETENTION) || 3600, // 1 hour
      logs: parseInt(process.env.CACHE_LOGS_RETENTION) || 86400 // 24 hours
    }
  },

  // Performance Optimization
  performance: {
    compression: process.env.CACHE_COMPRESSION === 'true' || false,
    serialization: process.env.CACHE_SERIALIZATION || 'json',
    batchSize: parseInt(process.env.CACHE_BATCH_SIZE) || 100,
    concurrency: parseInt(process.env.CACHE_CONCURRENCY) || 10
  },

  // Security Configuration
  security: {
    encryption: process.env.CACHE_ENCRYPTION === 'true' || false,
    encryptionKey: process.env.CACHE_ENCRYPTION_KEY || null,
    sanitization: process.env.CACHE_SANITIZATION !== 'false'
  },

  // Development/Testing Configuration
  development: {
    debug: process.env.NODE_ENV === 'development' || process.env.CACHE_DEBUG === 'true',
    mockEnabled: process.env.NODE_ENV === 'test' || process.env.CACHE_MOCK === 'true',
    logLevel: process.env.CACHE_LOG_LEVEL || 'info'
  }
};

// Environment-specific overrides
if (process.env.NODE_ENV === 'test') {
  config.strategy.type = 'memory';
  config.monitoring.enabled = false;
  config.development.mockEnabled = true;
}

if (process.env.NODE_ENV === 'production') {
  config.development.debug = false;
  config.monitoring.enabled = true;
  config.security.encryption = true;
}

// Configuration validation
function validateConfig() {
  const errors = [];

  if (!['memory', 'redis', 'file'].includes(config.strategy.type)) {
    errors.push('Invalid cache strategy type');
  }

  if (config.strategy.ttl < 0) {
    errors.push('TTL must be non-negative');
  }

  if (config.strategy.maxSize < 1) {
    errors.push('Max size must be positive');
  }

  if (config.redis.port < 1 || config.redis.port > 65535) {
    errors.push('Invalid Redis port');
  }

  if (config.monitoring.alertThresholds.hitRatio < 0 || config.monitoring.alertThresholds.hitRatio > 1) {
    errors.push('Hit ratio threshold must be between 0 and 1');
  }

  if (errors.length > 0) {
    throw new Error(`Cache configuration validation failed: ${errors.join(', ')}`);
  }
}

// Initialize and validate configuration
try {
  validateConfig();
} catch (error) {
  console.error('Cache configuration error:', error.message);
  process.exit(1);
}

module.exports = config;
EOF
    
    log "Cache configuration module created"
}

# Step 3: Update Jest configuration
update_jest_config() {
    log "Updating Jest configuration..."
    
    cat > "$PROJECT_ROOT/jest.config.js" << 'EOF'
module.exports = {
  testEnvironment: 'node',
  
  // Module name mapping for path aliases
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1'
  },

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!src/**/index.js'
  ],

  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Performance optimization
  maxWorkers: '50%',
  
  // Error handling
  verbose: true,
  bail: false,
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Timeout configuration
  testTimeout: 10000
};
EOF
    
    log "Jest configuration updated"
}

# Step 4: Create test environment file
create_test_env() {
    log "Creating test environment file..."
    
    cat > "$PROJECT_ROOT/.env.test" << 'EOF'
NODE_ENV=test
CACHE_TYPE=memory
CACHE_TTL=3600
CACHE_MAX_SIZE=1000
CACHE_MONITORING_ENABLED=false
CACHE_DEBUG=true
CACHE_MOCK=true
CACHE_LOG_LEVEL=debug
EOF
    
    log "Test environment file created"
}

# Step 5: Create test setup file
create_test_setup() {
    log "Creating test setup file..."
    
    cat > "$TESTS_DIR/setup.js" << 'EOF'
// Test setup configuration
require('dotenv').config({ path: '.env.test' });

// Global test utilities
global.testUtils = {
  createMockLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }),
  
  createMockConfig: () => ({
    monitoring: {
      enabled: true,
      metricsInterval: 60000,
      alertThresholds: {
        hitRatio: 0.8,
        errorRate: 0.05,
        latency: 100
      }
    }
  })
};

// Mock external dependencies
jest.mock('@core/logger', () => global.testUtils.createMockLogger());
EOF
    
    log "Test setup file created"
}

# Step 6: Create Babel configuration
create_babel_config() {
    log "Creating Babel configuration..."
    
    cat > "$PROJECT_ROOT/.babelrc" << 'EOF'
{
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "node": "current"
        }
      }
    ]
  ]
}
EOF
    
    log "Babel configuration created"
}

# Step 7: Update cache middleware test file
update_cache_middleware_test() {
    log "Updating cache middleware test file..."
    
    cat > "$TESTS_DIR/unit/middleware/cache/cache.middleware.test.js" << 'EOF'
'use strict';

const cacheMiddleware = require('../../../../src/middleware/cache/cache.middleware');
const cacheConfig = require('../../../../src/config/cache.config');

// Mock dependencies
jest.mock('../../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../../../src/config/cache.config', () => ({
  strategy: {
    type: 'memory',
    ttl: 3600,
    maxSize: 1000,
    refreshAhead: false
  },
  monitoring: {
    enabled: false
  },
  development: {
    debug: true,
    mockEnabled: true
  }
}));

describe('Cache Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      path: '/api/test',
      method: 'GET',
      headers: {},
      query: {}
    };
    
    res = {
      statusCode: 200,
      locals: {},
      setHeader: jest.fn(),
      getHeader: jest.fn(),
      send: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      end: jest.fn()
    };
    
    next = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should bypass cache when caching is disabled', async () => {
    // Temporarily disable caching
    const originalEnabled = cacheConfig.monitoring.enabled;
    cacheConfig.monitoring.enabled = false;
    
    await cacheMiddleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.locals.cacheHit).toBeUndefined();
    
    // Restore original config
    cacheConfig.monitoring.enabled = originalEnabled;
  });
  
  test('should process request through cache when enabled', async () => {
    // Enable caching for this test
    const originalEnabled = cacheConfig.monitoring.enabled;
    cacheConfig.monitoring.enabled = true;
    
    await cacheMiddleware(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(res.locals.cacheKey).toBeDefined();
    
    // Restore original config
    cacheConfig.monitoring.enabled = originalEnabled;
  });
  
  test('should handle errors gracefully', async () => {
    // Force an error by making req null
    const badReq = null;
    
    await cacheMiddleware(badReq, res, next);
    
    expect(next).toHaveBeenCalled();
  });
});
EOF
    
    log "Cache middleware test file updated"
}

# Step 8: Update cache middleware implementation
update_cache_middleware() {
    log "Updating cache middleware implementation..."
    
    mkdir -p "$PROJECT_ROOT/src/middleware/cache"
    
    cat > "$PROJECT_ROOT/src/middleware/cache/cache.middleware.js" << 'EOF'
'use strict';

/**
 * Cache Middleware
 * Provides HTTP response caching with configurable strategies
 */

const logger = require('../../utils/logger');
const cacheConfig = require('../../config/cache.config');

// In-memory cache store (for memory strategy)
const memoryCache = new Map();

/**
 * Generate a cache key from request
 * @param {Object} req - Express request object
 * @returns {String} Cache key
 */
function generateCacheKey(req) {
  const prefix = process.env.CACHE_KEY_PREFIX || 'api:';
  const path = req.path || '';
  const method = req.method || 'GET';
  const query = req.query ? JSON.stringify(req.query) : '';
  
  return `${prefix}${method}:${path}:${query}`;
}

/**
 * Track resource access for metrics and monitoring
 * @param {String} cacheKey - Cache key
 * @param {Boolean} hit - Whether this was a cache hit
 * @returns {Promise<void>}
 */
async function trackResourceAccess(cacheKey, hit) {
  try {
    if (!cacheConfig.monitoring.enabled) {
      return Promise.resolve();
    }
    
    // Here we would typically record metrics to a monitoring system
    logger.debug(`Cache ${hit ? 'HIT' : 'MISS'} for key: ${cacheKey}`);
    
    // Return a resolved promise to ensure async behavior
    return Promise.resolve();
  } catch (error) {
    logger.error(`Error tracking resource access: ${error.message}`);
    return Promise.reject(error);
  }
}

/**
 * Cache middleware function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @returns {Promise<void>}
 */
async function cacheMiddleware(req, res, next) {
  try {
    // Early return if caching is disabled
    if (!cacheConfig || !cacheConfig.monitoring || !cacheConfig.monitoring.enabled) {
      return next();
    }
    
    // Generate cache key
    const cacheKey = generateCacheKey(req);
    res.locals.cacheKey = cacheKey;
    
    // Check if we have a cached response
    if (memoryCache.has(cacheKey)) {
      const cachedData = memoryCache.get(cacheKey);
      
      // Track cache hit
      await trackResourceAccess(cacheKey, true);
      
      // Set cache hit flag
      res.locals.cacheHit = true;
      
      // Set cache headers
      res.set('X-Cache', 'HIT');
      
      // Return cached response
      return res.status(cachedData.status)
        .set(cachedData.headers)
        .send(cachedData.body);
    }
    
    // Track cache miss
    await trackResourceAccess(cacheKey, false);
    
    // Set cache miss flag
    res.locals.cacheHit = false;
    
    // Set cache headers
    res.set('X-Cache', 'MISS');
    
    // Capture the original send method
    const originalSend = res.send;
    
    // Override the send method to cache the response
    res.send = function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const ttl = cacheConfig.strategy.ttl * 1000; // Convert to milliseconds
        
        // Store in cache
        memoryCache.set(cacheKey, {
          status: res.statusCode,
          headers: res.getHeaders(),
          body: body,
          timestamp: Date.now(),
          expires: Date.now() + ttl
        });
        
        // Implement cache size limits
        if (memoryCache.size > cacheConfig.strategy.maxSize) {
          // Remove oldest entry
          const oldestKey = memoryCache.keys().next().value;
          memoryCache.delete(oldestKey);
        }
      }
      
      // Call the original send method
      return originalSend.call(this, body);
    };
    
    next();
  } catch (error) {
    logger.error(`Cache middleware error: ${error.message}`);
    next();
  }
}

module.exports = cacheMiddleware;
EOF
    
    log "Cache middleware implementation updated"
}

# Step 9: Create utils logger module
create_logger_module() {
    log "Creating logger module..."
    
    mkdir -p "$PROJECT_ROOT/src/utils"
    
    cat > "$PROJECT_ROOT/src/utils/logger.js" << 'EOF'
'use strict';

/**
 * Logger Module
 * Centralized logging utility with configurable levels
 */

// Default log level
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// Log levels with numeric values for comparison
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Check if the current log level allows logging at the specified level
function shouldLog(level) {
  return LOG_LEVELS[level] <= LOG_LEVELS[LOG_LEVEL];
}

// Format the log message
function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

// Logger implementation
const logger = {
  error: (message) => {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message));
    }
  },
  
  warn: (message) => {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message));
    }
  },
  
  info: (message) => {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message));
    }
  },
  
  debug: (message) => {
    if (shouldLog('debug')) {
      console.debug(formatMessage('debug', message));
    }
  }
};

module.exports = logger;
EOF
    
    log "Logger module created"
}

# Step 10: Validate configuration
validate_configuration() {
    log "Validating configuration..."
    
    # Check if all required files exist
    local required_files=(
        "src/config/cache.config.js"
        "jest.config.js"
        ".env.test"
        "tests/setup.js"
        ".babelrc"
        "src/middleware/cache/cache.middleware.js"
        "src/utils/logger.js"
        "tests/unit/middleware/cache/cache.middleware.test.js"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            error "Required file missing: $file"
            exit 1
        fi
    done
    
    log "Configuration validation completed"
}

# Step 11: Run tests
run_tests() {
    log "Running tests..."
    
    # Run the cache middleware tests
    npm test -- tests/unit/middleware/cache/cache.middleware.test.js --verbose
    
    log "Tests completed"
}

# Main execution
main() {
    log "Starting cache middleware fix..."
    
    create_directory_structure
    create_cache_config
    update_jest_config
    create_test_env
    create_test_setup
    create_babel_config
    update_cache_middleware_test
    update_cache_middleware
    create_logger_module
    validate_configuration
    run_tests
    
    log "Cache middleware fix completed successfully"
}

# Run the script
main
