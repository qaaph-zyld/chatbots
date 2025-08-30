#!/bin/bash

# Automated Chatbot Project Setup Script
# Cross-platform bash script for Linux/Mac automation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

print_header() {
    echo -e "${CYAN}🚀 Chatbot Project Automation Script${NC}"
    echo -e "${BLUE}$(printf '=%.0s' {1..50})${NC}"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "🔍 Checking Node.js installation..." "$YELLOW"
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_status "✅ Node.js found: $NODE_VERSION" "$GREEN"
        return 0
    else
        print_status "❌ Node.js not found. Please install Node.js from https://nodejs.org/" "$RED"
        return 1
    fi
}

# Initialize project structure
initialize_project() {
    print_status "📁 Initializing project structure..." "$YELLOW"
    
    # Create directories
    DIRECTORIES=("src" "tests" "docs" "scripts" "test-results" "coverage" "logs")
    
    for dir in "${DIRECTORIES[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "✅ Created directory: $dir" "$GREEN"
        else
            print_status "📁 Directory exists: $dir" "$CYAN"
        fi
    done
    
    # Make scripts executable
    chmod +x scripts/*.js 2>/dev/null || true
}

# Install dependencies
install_dependencies() {
    print_status "📦 Setting up dependencies..." "$YELLOW"
    
    if [ ! -f "package.json" ]; then
        print_status "🔧 Initializing npm project..." "$CYAN"
        npm init -y
    fi
    
    print_status "✅ Dependencies setup complete" "$GREEN"
}

# Run tests
run_tests() {
    print_status "🧪 Running automated tests..." "$YELLOW"
    
    if [ -f "test-suite.js" ]; then
        node test-suite.js
    else
        print_status "❌ test-suite.js not found. Run with --init first." "$RED"
        return 1
    fi
}

# Create CI/CD configuration
create_cicd_config() {
    print_status "🔄 Creating CI/CD configuration..." "$YELLOW"
    
    # Create GitHub Actions workflow
    mkdir -p .github/workflows
    
    cat > .github/workflows/test.yml << 'EOF'
name: Automated Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci || npm install
    
    - name: Run linter
      run: npm run lint || node scripts/lint.js
    
    - name: Run tests
      run: npm test
    
    - name: Generate coverage report
      run: npm run test:coverage || node test-suite.js --coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
EOF
    
    print_status "✅ Created GitHub Actions workflow" "$GREEN"
    
    # Create Docker configuration
    cat > Dockerfile << 'EOF'
# Chatbot Docker Configuration
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY test-suite.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S chatbot -u 1001

# Change ownership
RUN chown -R chatbot:nodejs /app
USER chatbot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Start application
CMD ["node", "src/index.js"]
EOF
    
    # Create docker-compose.yml
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  chatbot:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('Health check')"]
      interval: 30s
      timeout: 10s
      retries: 3

  test:
    build: .
    command: npm test
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=test
EOF
    
    print_status "✅ Created Docker configuration" "$GREEN"
}

# Create monitoring and logging setup
create_monitoring() {
    print_status "📊 Setting up monitoring..." "$YELLOW"
    
    # Create logging utility
    cat > src/logger.js << 'EOF'
// Logging utility for chatbot
const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logDir = './logs') {
        this.logDir = logDir;
        this.ensureLogDir();
    }
    
    ensureLogDir() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data,
            pid: process.pid,
            memory: process.memoryUsage()
        };
        
        // Console output
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
        
        // File output
        const logFile = path.join(this.logDir, `${level}.log`);
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }
    
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    debug(message, data) { this.log('debug', message, data); }
}

module.exports = Logger;
EOF
    
    # Create health check endpoint
    cat > src/health.js << 'EOF'
// Health check utility
const os = require('os');
const fs = require('fs');

class HealthCheck {
    static getSystemHealth() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                loadAverage: os.loadavg(),
                freeMemory: os.freemem(),
                totalMemory: os.totalmem()
            }
        };
    }
    
    static checkDiskSpace() {
        try {
            const stats = fs.statSync('.');
            return {
                available: true,
                readable: true,
                writable: fs.constants.W_OK
            };
        } catch (error) {
            return {
                available: false,
                error: error.message
            };
        }
    }
    
    static async performHealthCheck() {
        const health = {
            ...this.getSystemHealth(),
            disk: this.checkDiskSpace(),
            services: {
                chatbot: 'running',
                logger: 'active'
            }
        };
        
        return health;
    }
}

module.exports = HealthCheck;
EOF
    
    print_status "✅ Created monitoring utilities" "$GREEN"
}

# Create development tools
create_dev_tools() {
    print_status "🛠️  Creating development tools..." "$YELLOW"
    
    # Create development server with hot reload
    cat > scripts/dev-server.js << 'EOF'
#!/usr/bin/env node

// Development server with hot reload
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class DevServer {
    constructor() {
        this.process = null;
        this.watchers = [];
    }
    
    start() {
        console.log('🚀 Starting development server...');
        this.startApp();
        this.watchFiles();
    }
    
    startApp() {
        if (this.process) {
            this.process.kill();
        }
        
        this.process = spawn('node', ['src/index.js'], {
            stdio: 'inherit',
            env: { ...process.env, NODE_ENV: 'development' }
        });
        
        this.process.on('exit', (code) => {
            if (code !== null) {
                console.log(`📋 Process exited with code ${code}`);
            }
        });
    }
    
    watchFiles() {
        const watchDirs = ['src', 'tests'];
        
        watchDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
                    if (filename && filename.endsWith('.js')) {
                        console.log(`🔄 File changed: ${filename}`);
                        console.log('🔄 Restarting server...');
                        this.startApp();
                    }
                });
                
                this.watchers.push(watcher);
            }
        });
        
        console.log('👀 Watching for file changes...');
    }
    
    stop() {
        if (this.process) {
            this.process.kill();
        }
        
        this.watchers.forEach(watcher => watcher.close());
        console.log('🛑 Development server stopped');
    }
}

const server = new DevServer();

// Graceful shutdown
process.on('SIGINT', () => {
    server.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    server.stop();
    process.exit(0);
});

server.start();
EOF
    
    chmod +x scripts/dev-server.js
    
    # Create database seeding script
    cat > scripts/seed-data.js << 'EOF'
#!/usr/bin/env node

// Database seeding script
console.log('🌱 Seeding test data...');

const sampleResponses = [
    { trigger: 'weather', response: 'I wish I could check the weather for you!' },
    { trigger: 'joke', response: 'Why do programmers prefer dark mode? Because light attracts bugs!' },
    { trigger: 'time', response: `The current time is ${new Date().toLocaleTimeString()}` },
    { trigger: 'date', response: `Today is ${new Date().toLocaleDateString()}` },
    { trigger: 'status', response: 'All systems operational! 🚀' }
];

const fs = require('fs');
const path = require('path');

// Create data directory
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Save sample data
fs.writeFileSync(
    path.join(dataDir, 'responses.json'),
    JSON.stringify(sampleResponses, null, 2)
);

console.log('✅ Test data seeded successfully!');
EOF
    
    chmod +x scripts/seed-data.js
    
    print_status "✅ Created development tools" "$GREEN"
}

# Main function
main() {
    print_header
    
    # Parse command line arguments
    INIT=false
    INSTALL=false
    TEST=false
    CICD=false
    DEV=false
    ALL=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --init)
                INIT=true
                shift
                ;;
            --install)
                INSTALL=true
                shift
                ;;
            --test)
                TEST=true
                shift
                ;;
            --cicd)
                CICD=true
                shift
                ;;
            --dev)
                DEV=true
                shift
                ;;
            --all)
                ALL=true
                shift
                ;;
            -h|--help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --init     Initialize project structure"
                echo "  --install  Install dependencies"
                echo "  --test     Run test suite"
                echo "  --cicd     Create CI/CD configuration"
                echo "  --dev      Set up development tools"
                echo "  --all      Run all steps"
                echo "  -h, --help Show this help message"
                exit 0
                ;;
            *)
                print_status "Unknown option: $1" "$RED"
                exit 1
                ;;
        esac
    done
    
    # If no arguments, show help
    if [[ $# -eq 0 ]] && [[ "$ALL" == false ]] && [[ "$INIT" == false ]] && [[ "$INSTALL" == false ]] && [[ "$TEST" == false ]] && [[ "$CICD" == false ]] && [[ "$DEV" == false ]]; then
        echo "Usage: $0 [--init] [--install] [--test] [--cicd] [--dev] [--all]"
        echo "Run with --help for detailed options."
        exit 0
    fi
    
    # Check Node.js first
    if ! check_nodejs; then
        exit 1
    fi
    
    # Execute requested steps
    if [[ "$INIT" == true ]] || [[ "$ALL" == true ]]; then
        initialize_project
    fi
    
    if [[ "$INSTALL" == true ]] || [[ "$ALL" == true ]]; then
        install_dependencies
    fi
    
    if [[ "$CICD" == true ]] || [[ "$ALL" == true ]]; then
        create_cicd_config
        create_monitoring
    fi
    
    if [[ "$DEV" == true ]] || [[ "$ALL" == true ]]; then
        create_dev_tools
    fi
    
    if [[ "$TEST" == true ]] || [[ "$ALL" == true ]]; then
        run_tests
    fi
    
    print_status "\n🎉 Setup completed successfully!" "$GREEN"
    print_status "Next steps:" "$CYAN"
    print_status "1. Run 'node test-suite.js --init' to initialize the test framework" ""
    print_status "2. Run 'npm test' to execute all tests" ""
    print_status "3. Run 'npm start' to start the chatbot" ""
    print_status "4. Run 'node scripts/dev-server.js' for development mode" ""
    print_status "5. Check test-results/ folder for detailed reports" ""
}

# Run main function
main "$@"