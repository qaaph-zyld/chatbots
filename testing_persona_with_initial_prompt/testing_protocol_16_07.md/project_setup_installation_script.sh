#!/bin/bash

# Project Setup & Installation Script
# Automates complete test framework setup for Node.js projects

set -e

echo "🚀 Setting up comprehensive test automation framework..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $REQUIRED_VERSION or higher is required. Current version: $NODE_VERSION"
    exit 1
fi

print_status "Node.js version check passed: $NODE_VERSION"

# Create project structure
echo "📁 Creating project structure..."
mkdir -p tests/{unit,integration,e2e}/{middleware,utils,services}
mkdir -p tests/fixtures/{mock-data,test-configs}
mkdir -p tests/helpers
mkdir -p src/{middleware,utils,config}
mkdir -p coverage
mkdir -p docs

print_status "Project structure created"

# Install dependencies
echo "📦 Installing dependencies..."

# Core testing dependencies
npm install --save-dev \
    jest@^29.0.0 \
    @babel/core@^7.20.0 \
    @babel/preset-env@^7.20.0 \
    babel-jest@^29.0.0 \
    supertest@^6.3.0 \
    chalk@^4.1.2 \
    jest-environment-node@^29.0.0

# Additional testing utilities
npm install --save-dev \
    autocannon@^7.9.0 \
    ioredis-mock@^8.9.0 \
    nock@^13.3.0 \
    jest-extended@^3.2.0

# Development dependencies
npm install --save-dev \
    husky@^8.0.0 \
    lint-staged@^13.0.0 \
    eslint@^8.0.0 \
    prettier@^2.8.0

print_status "Dependencies installed"

# Create configuration files
echo "⚙️  Creating configuration files..."

# Create babel.config.js
cat > babel.config.js << 'EOF'
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: { node: 'current' }
    }]
  ]
};
EOF

# Create jest.config.js
cat > jest.config.js << 'EOF'
module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  maxWorkers: '50%',
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  verbose: true,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
EOF

# Create test setup file
cat > tests/setup.js << 'EOF'
// Global test setup
import 'jest-extended';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
global.testUtils = {
  delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  mockDate: (date) => {
    const mockDate = new Date(date);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  },
  restoreDate: () => {
    global.Date.mockRestore();
  }
};

// Setup and teardown hooks
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
EOF

# Create ESLint configuration
cat > .eslintrc.js << 'EOF'
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
EOF

# Create Prettier configuration
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/
test-report.json

# Runtime
.env
.env.local
.env.test

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
EOF

# Update package.json scripts
echo "📝 Updating package.json scripts..."

# Create or update package.json scripts
node -e "
const fs = require('fs');
const path = 'package.json';
let pkg = {};

if (fs.existsSync(path)) {
  pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
}

pkg.scripts = {
  ...pkg.scripts,
  'test': 'node test-automation.js',
  'test:watch': 'node test-automation.js --watch',
  'test:coverage': 'node test-automation.js --coverage-only',
  'test:fix': 'node test-automation.js --fix-mocks',
  'test:unit': 'jest tests/unit',
  'test:integration': 'jest tests/integration',
  'test:e2e': 'jest tests/e2e',
  'lint': 'eslint src tests',
  'lint:fix': 'eslint src tests --fix',
  'format': 'prettier --write src tests',
  'prepare': 'husky install'
};

fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
"

print_status "Package.json scripts updated"

# Initialize Husky
echo "🪝 Setting up Git hooks..."
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npm run test:fix && npm run lint"

# Create pre-push hook
npx husky add .husky/pre-push "npm run test:coverage"

print_status "Git hooks configured"

# Create sample test files
echo "📋 Creating sample test files..."

# Create test utilities
cat > tests/helpers/test-utils.js << 'EOF'
const express = require('express');
const request = require('supertest');

class TestUtils {
  static createTestApp(middleware = []) {
    const app = express();
    app.use(express.json());
    
    middleware.forEach(mw => app.use(mw));
    
    app.get('/health', (req, res) => res.json({ status: 'ok' }));
    app.get('/test', (req, res) => res.json({ message: 'success' }));
    app.post('/test', (req, res) => res.json({ received: req.body }));
    
    return app;
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
      connected: true
    };
  }
}

module.exports = TestUtils;
EOF

# Create mock factories
cat > tests/helpers/mock-factories.js << 'EOF'
class MockFactories {
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
EOF

# Create sample unit test
cat > tests/unit/sample.test.js << 'EOF'
const TestUtils = require('../helpers/test-utils');
const MockFactories = require('../helpers/mock-factories');

describe('Sample Unit Test', () => {
  test('should create test app successfully', () => {
    const app = TestUtils.createTestApp();
    expect(app).toBeDefined();
  });
  
  test('should create mock logger', () => {
    const logger = MockFactories.createLogger();
    expect(logger.info).toBeInstanceOf(Function);
  });
});
EOF

print_status "Sample test files created"

# Create GitHub Actions workflow
echo "🚀 Creating CI/CD pipeline..."
mkdir -p .github/workflows

cat > .github/workflows/test.yml << 'EOF'
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
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
EOF

print_status "CI/CD pipeline created"

# Create documentation
echo "📚 Creating documentation..."

cat > docs/TESTING.md << 'EOF'
# Testing Guide

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Fix mock issues
npm run test:fix
```

## Test Structure

- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests  
- `tests/e2e/` - End-to-end tests
- `tests/helpers/` - Test utilities
- `tests/fixtures/` - Test data

## Writing Tests

See the comprehensive guide in the project framework documentation.
EOF

print_status "Documentation created"

# Make scripts executable
chmod +x test-automation.js 2>/dev/null || true

# Final validation
echo "🔍 Running final validation..."

# Test the setup
if npm test -- --passWithNoTests; then
    print_status "Test framework setup completed successfully!"
else
    print_warning "Test framework setup completed with warnings"
fi

# Display summary
echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Copy your fixed test file to: tests/unit/middleware/rate-limit/rate-limit.middleware.test.js"
echo "2. Run: npm test"
echo "3. Check coverage: open coverage/index.html"
echo ""
echo "Available commands:"
echo "- npm test                 # Run all tests"
echo "- npm run test:watch       # Watch mode"
echo "- npm run test:coverage    # Coverage report"
echo "- npm run test:fix         # Fix mock issues"
echo "- npm run lint             # Code linting"
echo "- npm run format           # Code formatting"
echo ""
echo "Happy testing! 🧪"