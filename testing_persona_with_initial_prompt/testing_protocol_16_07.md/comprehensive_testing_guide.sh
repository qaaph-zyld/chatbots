# Comprehensive Testing Framework Development Guide

## Quick Fix Implementation

### 1. Immediate Solution for Jest Mock Error

The error occurs because Jest's `jest.mock()` factory function cannot reference variables from outer scopes. Here's the step-by-step fix:

```bash
# Step 1: Replace your existing test file with the fixed version
cp rate-limit.middleware.test.js tests/unit/middleware/rate-limit/rate-limit.middleware.test.js

# Step 2: Run the test automation script
node test-automation.js

# Step 3: Execute specific test with validation
npm test -- tests/unit/middleware/rate-limit/rate-limit.middleware.test.js --verbose
```

### 2. Core Mock Pattern Fix

**Before (Problematic):**
```javascript
const RedisStore = require('rate-limit-redis');
jest.mock('rate-limit-redis', () => ({
  __esModule: true,
  default: RedisStore  // ❌ Out-of-scope variable
}));
```

**After (Fixed):**
```javascript
jest.mock('rate-limit-redis', () => {
  const mockRedisStore = jest.fn().mockImplementation(() => ({
    incr: jest.fn(),
    decrement: jest.fn(),
    resetKey: jest.fn(),
    resetAll: jest.fn(),
    shutdown: jest.fn()
  }));
  
  return {
    __esModule: true,
    default: mockRedisStore  // ✅ Defined within factory
  };
});
```

## Project Development Framework

### 3. Automated Testing Pipeline

#### 3.1 Setup Commands
```bash
# Install framework dependencies
npm install --save-dev jest @babel/core @babel/preset-env
npm install --save-dev supertest express chalk

# Initialize automation framework
node test-automation.js --init

# Create project structure
mkdir -p tests/{unit,integration,e2e}
mkdir -p src/{middleware,utils,config}
```

#### 3.2 Configuration Files

**babel.config.js:**
```javascript
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' }
    }]
  ]
};
```

**package.json scripts:**
```json
{
  "scripts": {
    "test": "node test-automation.js",
    "test:watch": "node test-automation.js --watch",
    "test:coverage": "node test-automation.js --coverage-only",
    "test:fix": "node test-automation.js --fix-mocks"
  }
}
```

### 4. Advanced Mock Patterns

#### 4.1 Redis Store Mock Implementation
```javascript
// Mock factory with comprehensive functionality
jest.mock('rate-limit-redis', () => {
  const mockRedisStore = jest.fn().mockImplementation((options = {}) => {
    const store = {
      incr: jest.fn().mockResolvedValue(1),
      decrement: jest.fn().mockResolvedValue(true),
      resetKey: jest.fn().mockResolvedValue(true),
      resetAll: jest.fn().mockResolvedValue(true),
      shutdown: jest.fn().mockResolvedValue(true),
      // Store configuration
      prefix: options.prefix || 'rl:',
      client: options.client
    };
    
    // Simulate Redis operations
    store.incr.mockImplementation((key) => {
      return Promise.resolve(Math.floor(Math.random() * 10) + 1);
    });
    
    return store;
  });
  
  return {
    __esModule: true,
    default: mockRedisStore
  };
});
```

#### 4.2 Express Rate Limit Mock
```javascript
jest.mock('express-rate-limit', () => {
  return jest.fn().mockImplementation((options = {}) => {
    const middleware = jest.fn((req, res, next) => {
      // Simulate rate limiting logic
      const hits = parseInt(req.headers['x-ratelimit-hits'] || '0');
      const limit = options.max || 100;
      
      if (hits >= limit) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: options.message || 'Rate limit exceeded',
          retryAfter: Math.ceil(options.windowMs / 1000)
        });
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': limit,
        'X-RateLimit-Remaining': limit - hits - 1,
        'X-RateLimit-Reset': Date.now() + options.windowMs
      });
      
      next();
    });
    
    // Attach configuration to middleware
    middleware.options = options;
    return middleware;
  });
});
```

### 5. Comprehensive Test Suite Structure

#### 5.1 Test Organization
```
tests/
├── unit/
│   ├── middleware/
│   │   ├── rate-limit/
│   │   │   ├── rate-limit.middleware.test.js
│   │   │   └── rate-limit.integration.test.js
│   │   └── auth/
│   ├── utils/
│   └── services/
├── integration/
│   ├── api/
│   └── database/
├── e2e/
│   ├── user-flows/
│   └── performance/
├── fixtures/
│   ├── mock-data/
│   └── test-configs/
├── helpers/
│   ├── test-utils.js
│   └── mock-factories.js
└── setup.js
```

#### 5.2 Test Helper Utilities
```javascript
// tests/helpers/test-utils.js
const express = require('express');
const request = require('supertest');

class TestUtils {
  static createTestApp(middleware = []) {
    const app = express();
    app.use(express.json());
    
    // Apply middleware
    middleware.forEach(mw => app.use(mw));
    
    // Default test routes
    app.get('/health', (req, res) => res.json({ status: 'ok' }));
    app.get('/test', (req, res) => res.json({ message: 'success' }));
    app.post('/test', (req, res) => res.json({ received: req.body }));
    
    return app;
  }
  
  static async simulateRateLimit(app, endpoint, count, headers = {}) {
    const results = [];
    
    for (let i = 0; i < count; i++) {
      const response = await request(app)
        .get(endpoint)
        .set({
          'x-ratelimit-hits': i.toString(),
          ...headers
        });
      
      results.push({
        attempt: i + 1,
        status: response.status,
        headers: response.headers,
        body: response.body
      });
    }
    
    return results;
  }
  
  static createMockRedisClient() {
    return {
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(1),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
      connected: true,
      // Simulate Redis operations
      simulateIncrement: function(key, amount = 1) {
        const current = parseInt(this.get(key) || '0') + amount;
        this.set(key, current.toString());
        return Promise.resolve(current);
      }
    };
  }
}

module.exports = TestUtils;
```

#### 5.3 Mock Factory Pattern
```javascript
// tests/helpers/mock-factories.js
class MockFactories {
  static createRateLimitStore(options = {}) {
    return {
      incr: jest.fn().mockImplementation((key) => {
        const count = (options.initialCount || 0) + 1;
        return Promise.resolve(count);
      }),
      decrement: jest.fn().mockResolvedValue(true),
      resetKey: jest.fn().mockResolvedValue(true),
      resetAll: jest.fn().mockResolvedValue(true),
      shutdown: jest.fn().mockResolvedValue(true),
      prefix: options.prefix || 'rl:',
      client: options.client
    };
  }
  
  static createExpressRateLimit(customOptions = {}) {
    const defaultOptions = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many requests',
      standardHeaders: true,
      legacyHeaders: false
    };
    
    const options = { ...defaultOptions, ...customOptions };
    
    return jest.fn().mockImplementation(() => {
      return jest.fn((req, res, next) => {
        const hits = parseInt(req.headers['x-test-hits'] || '0');
        
        if (hits >= options.max) {
          return res.status(429).json({
            error: 'Too Many Requests',
            message: options.message
          });
        }
        
        next();
      });
    });
  }
  
  static createLogger(level = 'info') {
    return {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      level
    };
  }
}

module.exports = MockFactories;
```

### 6. Advanced Test Scenarios

#### 6.1 Integration Test Example
```javascript
// tests/integration/rate-limit.integration.test.js
const request = require('supertest');
const express = require('express');
const Redis = require('ioredis-mock');
const TestUtils = require('../helpers/test-utils');
const rateLimitMiddleware = require('../../src/middleware/rate-limit/rate-limit.middleware');

describe('Rate Limit Integration Tests', () => {
  let app;
  let redisClient;
  
  beforeAll(async () => {
    // Use Redis mock for integration tests
    redisClient = new Redis();
    await redisClient.flushall();
  });
  
  afterAll(async () => {
    await redisClient.quit();
  });
  
  beforeEach(async () => {
    await redisClient.flushall();
    
    const rateLimitMW = rateLimitMiddleware({
      redisClient,
      windowMs: 60000, // 1 minute
      max: 5,
      keyPrefix: 'test:'
    });
    
    app = TestUtils.createTestApp([rateLimitMW]);
  });
  
  test('should handle concurrent requests correctly', async () => {
    const concurrentRequests = 10;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        request(app)
          .get('/test')
          .set('x-forwarded-for', '127.0.0.1')
      );
    }
    
    const results = await Promise.all(promises);
    
    const successCount = results.filter(r => r.status === 200).length;
    const rateLimitedCount = results.filter(r => r.status === 429).length;
    
    expect(successCount).toBe(5);
    expect(rateLimitedCount).toBe(5);
  });
  
  test('should reset rate limit after window expires', async () => {
    const shortWindowApp = TestUtils.createTestApp([
      rateLimitMiddleware({
        redisClient,
        windowMs: 1000, // 1 second
        max: 2,
        keyPrefix: 'short:'
      })
    ]);
    
    // First two requests should succeed
    await request(shortWindowApp).get('/test').expect(200);
    await request(shortWindowApp).get('/test').expect(200);
    
    // Third request should be rate limited
    await request(shortWindowApp).get('/test').expect(429);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should succeed again
    await request(shortWindowApp).get('/test').expect(200);
  });
});
```

#### 6.2 Performance Test Implementation
```javascript
// tests/e2e/performance/rate-limit.performance.test.js
const autocannon = require('autocannon');
const TestUtils = require('../../helpers/test-utils');
const rateLimitMiddleware = require('../../../src/middleware/rate-limit/rate-limit.middleware');

describe('Rate Limit Performance Tests', () => {
  let server;
  let app;
  
  beforeAll(async () => {
    const mockRedisClient = TestUtils.createMockRedisClient();
    
    const rateLimitMW = rateLimitMiddleware({
      redisClient: mockRedisClient,
      windowMs: 60000,
      max: 1000,
      keyPrefix: 'perf:'
    });
    
    app = TestUtils.createTestApp([rateLimitMW]);
    server = app.listen(0);
  });
  
  afterAll(async () => {
    if (server) {
      server.close();
    }
  });
  
  test('should handle high throughput requests', async () => {
    const port = server.address().port;
    
    const result = await autocannon({
      url: `http://localhost:${port}/test`,
      connections: 100,
      duration: 10,
      headers: {
        'x-forwarded-for': '127.0.0.1'
      }
    });
    
    expect(result.non2xx).toBeLessThan(result.requests.total * 0.1); // Less than 10% errors
    expect(result.requests.average).toBeGreaterThan(100); // At least 100 req/sec
  });
});
```

### 7. Continuous Integration Setup

#### 7.1 GitHub Actions Configuration
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
        redis-version: [6, 7]
    
    services:
      redis:
        image: redis:${{ matrix.redis-version }}
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run test automation framework
        run: node test-automation.js
        env:
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

#### 7.2 Pre-commit Hook Setup
```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running pre-commit tests..."
node test-automation.js --fix-mocks
npm run test:coverage

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Commit aborted."
  exit 1
fi

echo "✅ All tests passed!"
```

### 8. Monitoring and Alerting

#### 8.1 Test Metrics Collection
```javascript
// tests/helpers/metrics-collector.js
class MetricsCollector {
  constructor() {
    this.metrics = {
      testDuration: {},
      mockCallCounts: {},
      coverageData: {},
      errorPatterns: []
    };
  }
  
  recordTestDuration(testName, duration) {
    this.metrics.testDuration[testName] = duration;
  }
  
  recordMockCalls(mockName, callCount) {
    this.metrics.mockCallCounts[mockName] = callCount;
  }
  
  recordCoverage(coverageData) {
    this.metrics.coverageData = coverageData;
  }
  
  recordError(error, context) {
    this.metrics.errorPatterns.push({
      error: error.message,
      context,
      timestamp: new Date().toISOString()
    });
  }
  
  generateReport() {
    return {
      summary: {
        totalTests: Object.keys(this.metrics.testDuration).length,
        averageDuration: this.calculateAverageDuration(),
        totalMockCalls: Object.values(this.metrics.mockCallCounts).reduce((a, b) => a + b, 0),
        errorCount: this.metrics.errorPatterns.length
      },
      details: this.metrics
    };
  }
  
  calculateAverageDuration() {
    const durations = Object.values(this.metrics.testDuration);
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }
}

module.exports = MetricsCollector;
```

### 9. Troubleshooting Guide

#### 9.1 Common Jest Mock Issues

**Issue: "Cannot access before initialization"**
```javascript
// ❌ Wrong - hoisting issue
const mockFunction = jest.fn();
jest.mock('./module', () => mockFunction);

// ✅ Correct - define within factory
jest.mock('./module', () => jest.fn());
```

**Issue: "Mock not working in ES6 modules"**
```javascript
// ✅ Always include __esModule for ES6 modules
jest.mock('./module', () => ({
  __esModule: true,
  default: jest.fn(),
  namedExport: jest.fn()
}));
```

**Issue: "Async mock not resolving"**
```javascript
// ✅ Proper async mock setup
jest.mock('./async-module', () => ({
  asyncFunction: jest.fn().mockResolvedValue('result')
}));
```

#### 9.2 Debug Commands
```bash
# Run single test with full debugging
node --inspect-brk node_modules/.bin/jest --runInBand --no-cache tests/specific-test.js

# Check mock validation
node test-automation.js --fix-mocks

# Generate detailed coverage report
node test-automation.js --coverage-only --verbose

# Watch mode for development
node test-automation.js --watch
```

### 10. Best Practices Summary

#### 10.1 Mock Design Principles
- Always define mocks within Jest factory functions
- Use descriptive mock names prefixed with "mock"
- Implement realistic mock behavior
- Reset mocks between tests
- Validate mock calls in assertions

#### 10.2 Test Organization
- Group related tests in describe blocks
- Use beforeEach/afterEach for setup/teardown
- Keep tests isolated and independent
- Use meaningful test descriptions
- Implement comprehensive error scenarios

#### 10.3 Performance Optimization
- Use parallel test execution
- Implement proper cleanup
- Mock heavy dependencies
- Use test-specific configurations
- Monitor test execution times

#### 10.4 Maintenance Guidelines
- Regular dependency updates
- Continuous mock validation
- Performance monitoring
- Coverage threshold enforcement
- Documentation updates

This comprehensive framework ensures robust, maintainable, and automated testing for your rate limiting middleware and entire application stack.