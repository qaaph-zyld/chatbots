/**
 * Main Application Entry Point
 * Reorganized Express application with clean architecture
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Core services
const logger = require('../core/services/logger.service');
const config = require('../core/services/config.service');

// Middleware
const { errorHandler } = require('../infrastructure/middleware/error.middleware');

// Routes
const apiRoutes = require('./routes');

class Application {
  constructor() {
    this.app = express();
    this.port = config.get('port', 3000);
    this.initialize();
  }

  initialize() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: config.get('cors.origin', '*'),
      credentials: config.get('cors.credentials', true),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Logging
    if (config.isDevelopment()) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Static files
    this.app.use(express.static(path.join(__dirname, '../../public')));
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', apiRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Chatbot Platform API',
        version: process.env.npm_package_version || '1.0.0',
        environment: config.getEnvironment(),
        timestamp: new Date().toISOString()
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Initialize database connections, cache, etc.
      await this.initializeServices();

      // Start server
      this.server = this.app.listen(this.port, () => {
        logger.info(`Server running on port ${this.port} in ${config.getEnvironment()} mode`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

      return this.server;
    } catch (error) {
      logger.error('Failed to start application', { error: error.message });
      process.exit(1);
    }
  }

  async initializeServices() {
    // Initialize database
    // await this.initializeDatabase();
    
    // Initialize cache
    // await this.initializeCache();
    
    // Initialize other services
    logger.info('Services initialized successfully');
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  getApp() {
    return this.app;
  }
}

// Create and export application instance
const application = new Application();

// Start application if this file is run directly
if (require.main === module) {
  application.start();
}

module.exports = application;
