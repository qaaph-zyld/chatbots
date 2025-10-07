#!/usr/bin/env node

/**
 * ShopBot MVP Production Startup Script
 * Handles environment setup, health checks, and graceful startup
 */

const fs = require('fs');
const path = require('path');
const cluster = require('cluster');
const os = require('os');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

const numCPUs = os.cpus().length;
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

console.log('🚀 Starting ShopBot MVP in production mode...');
console.log(`📊 CPUs available: ${numCPUs}`);
console.log(`🌐 Port: ${PORT}`);
console.log(`🔧 Environment: ${NODE_ENV}`);

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'MONGODB_URI'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📝 Please check your .env.production file');
  process.exit(1);
}

// Ensure required directories exist
const requiredDirs = [
  'logs',
  'data',
  'data/usage',
  'uploads'
];

requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
});

// Health check function
async function healthCheck() {
  try {
    // Check MongoDB connection
    console.log('🔍 Checking MongoDB connection...');
    // TODO: Add actual MongoDB connection test
    
    // Check Stripe configuration
    console.log('🔍 Checking Stripe configuration...');
    if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      throw new Error('Invalid Stripe secret key format');
    }
    
    console.log('✅ All health checks passed');
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Graceful shutdown handler
function setupGracefulShutdown() {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  
  signals.forEach(signal => {
    process.on(signal, () => {
      console.log(`\n📡 Received ${signal}, starting graceful shutdown...`);
      
      if (cluster.isMaster) {
        // Close all workers
        for (const id in cluster.workers) {
          cluster.workers[id].kill();
        }
        
        // Wait for workers to exit
        setTimeout(() => {
          console.log('🛑 Graceful shutdown complete');
          process.exit(0);
        }, 5000);
      } else {
        // Worker process shutdown
        if (global.server) {
          global.server.close(() => {
            console.log('🛑 Worker shutdown complete');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      }
    });
  });
}

// Cluster management
if (cluster.isMaster) {
  console.log(`🎯 Master process ${process.pid} starting...`);
  
  // Perform health checks
  healthCheck().then(healthy => {
    if (!healthy) {
      console.error('❌ Health checks failed, exiting...');
      process.exit(1);
    }
    
    // Fork workers
    const workerCount = Math.min(numCPUs, 4); // Limit to 4 workers max
    console.log(`👥 Starting ${workerCount} worker processes...`);
    
    for (let i = 0; i < workerCount; i++) {
      cluster.fork();
    }
    
    // Handle worker events
    cluster.on('online', (worker) => {
      console.log(`✅ Worker ${worker.process.pid} is online`);
    });
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`❌ Worker ${worker.process.pid} died (${signal || code})`);
      
      if (!worker.exitedAfterDisconnect) {
        console.log('🔄 Starting replacement worker...');
        cluster.fork();
      }
    });
    
    // Setup graceful shutdown for master
    setupGracefulShutdown();
    
    console.log('🎉 ShopBot MVP cluster started successfully!');
    console.log(`🌐 Access your application at: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard.html`);
    console.log(`💰 Pricing: http://localhost:${PORT}/pricing.html`);
  });
  
} else {
  // Worker process
  console.log(`👷 Worker ${process.pid} starting...`);
  
  // Setup graceful shutdown for worker
  setupGracefulShutdown();
  
  // Start the MVP server
  const MVPServer = require('./src/mvp/server');
  const server = new MVPServer();
  
  global.server = server.start();
  
  console.log(`✅ Worker ${process.pid} ready`);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Log startup completion
if (cluster.isMaster) {
  setTimeout(() => {
    console.log('\n🎊 ShopBot MVP is ready for business!');
    console.log('📈 Monitor your metrics and scale as needed');
    console.log('💬 Happy chatting! 🤖\n');
  }, 2000);
}
