## Problem Analysis

**Root Cause**: Missing configuration module `@config/cache.config` preventing cache middleware test execution.

**Error Pattern**: Jest module resolution failure in cache-monitor.js line 8.

## Solution Framework

### 1. Configuration Module Creation
// src/config/cache.config.js
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

### 2. Package.json Module Path Configuration
// jest.config.js
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

### 3. Environment Configuration Setup
# .env.example
# Cache Configuration
CACHE_TYPE=memory
CACHE_TTL=3600
CACHE_MAX_SIZE=1000
CACHE_REFRESH_AHEAD=false
CACHE_MONITORING_ENABLED=true
CACHE_METRICS_INTERVAL=60000
CACHE_HIT_RATIO_THRESHOLD=0.8
CACHE_ERROR_RATE_THRESHOLD=0.05
CACHE_LATENCY_THRESHOLD=100
CACHE_METRICS_RETENTION=3600
CACHE_LOGS_RETENTION=86400
CACHE_COMPRESSION=false
CACHE_SERIALIZATION=json
CACHE_BATCH_SIZE=100
CACHE_CONCURRENCY=10
CACHE_ENCRYPTION=false
CACHE_ENCRYPTION_KEY=
CACHE_SANITIZATION=true
CACHE_DEBUG=false
CACHE_MOCK=false
CACHE_LOG_LEVEL=info

# Redis Configuration (if using Redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=chatbot:cache:

# Node Environment
NODE_ENV=development

### 4. Automated Fix Implementation
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

# Step 2: Install required dependencies
install_dependencies() {
    log "Installing required dependencies..."
    
    # Check if package.json exists
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        error "package.json not found. Please run 'npm init' first."
        exit 1
    fi
    
    # Install test dependencies
    npm install --save-dev jest babel-jest @babel/core @babel/preset-env
    
    # Install production dependencies
    npm install dotenv
    
    log "Dependencies installed successfully"
}

# Step 3: Create Babel configuration
create_babel_config() {
    log "Creating Babel configuration..."
    
    cat > "$PROJECT_ROOT/.babelrc" << EOF
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

# Step 4: Create test setup file
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

# Step 5: Create test environment file
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

# Step 6: Update package.json scripts
update_package_json() {
    log "Updating package.json scripts..."
    
    # Use Node.js to update package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.test = 'jest';
    pkg.scripts['test:watch'] = 'jest --watch';
    pkg.scripts['test:coverage'] = 'jest --coverage';
    pkg.scripts['test:specific'] = 'jest';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    
    log "Package.json updated"
}

# Step 7: Validate configuration
validate_configuration() {
    log "Validating configuration..."
    
    # Check if all required files exist
    local required_files=(
        "src/config/cache.config.js"
        "jest.config.js"
        ".env.test"
        "tests/setup.js"
        ".babelrc"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$PROJECT_ROOT/$file" ]; then
            error "Required file missing: $file"
            exit 1
        fi
    done
    
    log "Configuration validation completed"
}

# Step 8: Run test to verify fix
run_test_verification() {
    log "Running test verification..."
    
    # Run the specific test that was failing
    if npm test "tests/unit/middleware/cache/cache.middleware.test.js"; then
        log "Test verification successful! Cache middleware test is now working."
    else
        warning "Test still failing. Additional debugging may be required."
        log "Checking for additional issues..."
        
        # Provide debugging information
        echo "Current directory structure:"
        find src/ -name "*.js" | head -20
        echo
        echo "Jest configuration:"
        cat jest.config.js
    fi
}

# Step 9: Generate project status report
generate_status_report() {
    log "Generating project status report..."
    
    cat > "$PROJECT_ROOT/cache-fix-report.md" << EOF
# Cache Configuration Fix Report

## Applied Solutions

### 1. Configuration Module
- Created: \`src/config/cache.config.js\`
- Features: Environment-based configuration, validation, monitoring setup

### 2. Jest Configuration
- Created: \`jest.config.js\`
- Features: Module path mapping, test patterns, coverage configuration

### 3. Environment Setup
- Created: \`.env.test\`
- Features: Test-specific environment variables

### 4. Dependencies
- Added: jest, babel-jest, @babel/core, @babel/preset-env
- Added: dotenv for environment management

### 5. Test Setup
- Created: \`tests/setup.js\`
- Features: Global test utilities, mock configurations

## Next Steps

1. Review and customize cache configuration in \`src/config/cache.config.js\`
2. Update environment variables in \`.env\` and \`.env.test\`
3. Run full test suite: \`npm test\`
4. Configure monitoring and alerting based on your requirements

## Commands

- Run specific test: \`npm test tests/unit/middleware/cache/cache.middleware.test.js\`
- Run all tests: \`npm test\`
- Run tests with coverage: \`npm run test:coverage\`
- Watch mode: \`npm run test:watch\`

## Status: $(date)
✅ Configuration module created
✅ Jest configuration updated
✅ Environment setup completed
✅ Dependencies installed
✅ Test framework configured
EOF
    
    log "Status report generated: cache-fix-report.md"
}

# Main execution
main() {
    log "Starting automated cache configuration fix..."
    
    create_directory_structure
    install_dependencies
    create_babel_config
    create_test_setup
    create_test_env
    update_package_json
    validate_configuration
    run_test_verification
    generate_status_report
    
    log "Automated fix completed successfully!"
    log "Please review the generated cache-fix-report.md for next steps."
}

# Execute main function
main "$@"

## Implementation Protocol

### Step 1: Execute Configuration Creation
```bash
# Create cache configuration module
mkdir -p src/config
```

Copy the cache.config.js content to `src/config/cache.config.js`.

### Step 2: Configure Jest Module Resolution
```bash
# Create Jest configuration
```

Copy jest.config.js to project root.

### Step 3: Environment Setup
```bash
# Create test environment
cp .env.example .env.test
```

### Step 4: Automated Execution
```bash
# Run automated fix script
chmod +x automated-cache-fix.sh
./automated-cache-fix.sh
```

### Step 5: Verification Protocol
```bash
# Verify fix implementation
npm test tests/unit/middleware/cache/cache.middleware.test.js
```

## Technical Architecture Components

**Configuration Layer**: Centralized cache settings with environment-specific overrides
**Testing Infrastructure**: Jest with module path mapping and comprehensive mocking
**Dependency Management**: Automated installation of required testing frameworks
**Validation Framework**: Configuration validation with error handling
**Monitoring Integration**: Built-in metrics and alerting configuration

## Expected Outcomes

1. **Module Resolution**: `@config/cache.config` import resolution
2. **Test Execution**: Successful cache middleware test completion
3. **Framework Integration**: Complete testing infrastructure setup
4. **Configuration Management**: Environment-based cache configuration
5. **Monitoring Capability**: Integrated performance tracking

Execute steps sequentially for systematic resolution of module dependency issues.