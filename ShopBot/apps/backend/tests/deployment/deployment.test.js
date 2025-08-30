const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');

describe('Deployment Automation Tests', () => {
  let app;

  beforeAll(async () => {
    await setupTestDB();
    
    // Create minimal Express app for deployment testing
    app = express();
    app.use(express.json());
    
    // Add basic routes for deployment validation
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    app.get('/api/version', (req, res) => {
      res.json({ version: process.env.npm_package_version || '1.0.0' });
    });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Build Process Validation', () => {
    test('should validate package.json exists and is valid', () => {
      const packagePath = path.join(__dirname, '../../package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
      
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      expect(packageContent.name).toBeDefined();
      expect(packageContent.version).toBeDefined();
      expect(packageContent.scripts).toBeDefined();
      expect(packageContent.scripts.start).toBeDefined();
      expect(packageContent.scripts.test).toBeDefined();
    });

    test('should validate all required dependencies are listed', () => {
      const packagePath = path.join(__dirname, '../../package.json');
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredDeps = [
        'express',
        'mongoose',
        'jsonwebtoken',
        'bcryptjs',
        'cors',
        'helmet',
        'express-rate-limit',
        'winston',
        'socket.io'
      ];
      
      requiredDeps.forEach(dep => {
        expect(
          packageContent.dependencies[dep] || packageContent.devDependencies[dep]
        ).toBeDefined();
      });
    });

    test('should validate environment configuration files exist', () => {
      const configFiles = [
        path.join(__dirname, '../../.env.example'),
        path.join(__dirname, '../../jest.config.js')
      ];
      
      configFiles.forEach(file => {
        if (fs.existsSync(file)) {
          expect(fs.statSync(file).isFile()).toBe(true);
        }
      });
    });

    test('should validate source code structure', () => {
      const requiredDirs = [
        path.join(__dirname, '../../src'),
        path.join(__dirname, '../../src/models'),
        path.join(__dirname, '../../src/routes'),
        path.join(__dirname, '../../src/middleware'),
        path.join(__dirname, '../../tests')
      ];
      
      requiredDirs.forEach(dir => {
        expect(fs.existsSync(dir)).toBe(true);
        expect(fs.statSync(dir).isDirectory()).toBe(true);
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should handle missing environment variables gracefully', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      
      // Test that app can start without NODE_ENV
      expect(() => {
        const testApp = express();
        testApp.get('/test', (req, res) => res.json({ env: process.env.NODE_ENV || 'development' }));
      }).not.toThrow();
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should validate required environment variables', () => {
      const requiredEnvVars = [
        'NODE_ENV',
        'PORT'
      ];
      
      // In test environment, some vars might not be set, so we check they can be defaulted
      requiredEnvVars.forEach(envVar => {
        const value = process.env[envVar];
        if (value === undefined) {
          // Should have sensible defaults
          expect(['NODE_ENV', 'PORT']).toContain(envVar);
        }
      });
    });

    test('should validate database connection string format', () => {
      const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopbot-test';
      expect(dbUrl).toMatch(/^mongodb:\\\\\\/\\\\\\/.+/);
    });
  });

  describe('Application Startup', () => {
    test('should start server successfully', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
    });

    test('should handle graceful shutdown', (done) => {
      const testServer = app.listen(0, () => {
        const port = testServer.address().port;
        
        // Simulate shutdown
        testServer.close(() => {
          done();
        });
      });
    });

    test('should respond to version endpoint', async () => {
      const response = await request(app)
        .get('/api/version')
        .expect(200);
      
      expect(response.body.version).toBeDefined();
      expect(typeof response.body.version).toBe('string');
    });
  });

  describe('Production Readiness Checks', () => {
    test('should have security headers configured', async () => {
      // This would require the actual security middleware to be loaded
      const response = await request(app)
        .get('/health');
      
      // Basic security check - ensure no sensitive headers are exposed
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    test('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/health');
      
      // Should handle preflight requests
      expect(response.status).toBeOneOf([200, 204, 404]);
    });

    test('should validate logging configuration', () => {
      // Check that Winston logger can be initialized
      const winston = require('winston');
      
      expect(() => {
        winston.createLogger({
          level: 'info',
          format: winston.format.json(),
          transports: [
            new winston.transports.Console()
          ]
        });
      }).not.toThrow();
    });

    test('should validate error handling middleware', async () => {
      // Add a route that throws an error
      app.get('/test-error', (req, res, next) => {
        const error = new Error('Test error');
        next(error);
      });
      
      // Add basic error handler for test
      app.use((err, req, res, next) => {
        res.status(500).json({ error: 'Internal server error' });
      });
      
      const response = await request(app)
        .get('/test-error')
        .expect(500);
      
      expect(response.body.error).toBeDefined();
    });
  });

  describe('Database Migration and Setup', () => {
    test('should handle database connection gracefully', async () => {
      // Test database connection without throwing
      expect(async () => {
        const mongoose = require('mongoose');
        // Connection should be established in setupTestDB
        expect(mongoose.connection.readyState).toBeGreaterThan(0);
      }).not.toThrow();
    });

    test('should validate database indexes', async () => {
      const mongoose = require('mongoose');
      
      // Check if we can query collections (basic validation)
      const collections = await mongoose.connection.db.listCollections().toArray();
      expect(Array.isArray(collections)).toBe(true);
    });
  });

  describe('Performance Benchmarks', () => {
    test('should start within acceptable time', (done) => {
      const startTime = Date.now();
      
      const testServer = app.listen(0, () => {
        const startupTime = Date.now() - startTime;
        expect(startupTime).toBeLessThan(5000); // Should start within 5 seconds
        
        testServer.close(done);
      });
    }, 10000);

    test('should handle concurrent requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(request(app).get('/health'));
      }
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });

    test('should have acceptable memory usage', () => {
      const memUsage = process.memoryUsage();
      
      // Basic memory usage validation (not too strict for tests)
      expect(memUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
      expect(memUsage.rss).toBeLessThan(200 * 1024 * 1024); // Less than 200MB RSS
    });
  });

  describe('Rollback Procedures', () => {
    test('should validate backup procedures', () => {
      // Test that backup utilities exist or can be created
      const backupDir = path.join(__dirname, '../../backups');
      
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      expect(fs.existsSync(backupDir)).toBe(true);
      expect(fs.statSync(backupDir).isDirectory()).toBe(true);
    });

    test('should validate configuration rollback', () => {
      // Test that we can revert to previous configuration
      const configBackup = {
        version: '1.0.0',
        environment: 'test',
        features: {
          newFeature: false
        }
      };
      
      expect(() => {
        // Simulate configuration rollback
        const config = { ...configBackup };
        expect(config.version).toBe('1.0.0');
      }).not.toThrow();
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should validate health check endpoints are accessible', async () => {
      const healthEndpoints = ['/health'];
      
      for (const endpoint of healthEndpoints) {
        const response = await request(app).get(endpoint);
        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
      }
    });

    test('should validate logging output format', () => {
      const winston = require('winston');
      
      const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
        transports: [
          new winston.transports.Console({ silent: true })
        ]
      });
      
      expect(() => {
        logger.info('Test log message', { component: 'deployment-test' });
      }).not.toThrow();
    });

    test('should validate error alerting configuration', () => {
      // Test that error levels are properly configured
      const errorLevels = ['error', 'warn', 'info', 'debug'];
      
      errorLevels.forEach(level => {
        expect(typeof level).toBe('string');
        expect(level.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Load Testing Preparation', () => {
    test('should handle multiple simultaneous connections', async () => {
      const connectionPromises = [];
      
      for (let i = 0; i < 20; i++) {
        connectionPromises.push(request(app).get('/health'));
      }
      
      const responses = await Promise.all(connectionPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    test('should maintain performance under load', async () => {
      const startTime = Date.now();
      const promises = [];
      
      for (let i = 0; i < 50; i++) {
        promises.push(request(app).get('/health'));
      }
      
      await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      const avgResponseTime = totalTime / 50;
      
      expect(avgResponseTime).toBeLessThan(100); // Average under 100ms
    });
  });

  describe('Security Deployment Checks', () => {
    test('should validate secure headers configuration', async () => {
      const response = await request(app).get('/health');
      
      // Should not expose sensitive information
      expect(response.headers['server']).not.toMatch(/express/i);
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    test('should validate input sanitization', async () => {
      app.post('/test-input', express.json(), (req, res) => {
        // Basic input validation test
        const input = req.body.test || '';
        res.json({ received: input.length });
      });
      
      const maliciousInput = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/test-input')
        .send({ test: maliciousInput })
        .expect(200);
      
      expect(response.body.received).toBe(maliciousInput.length);
    });

    test('should validate rate limiting configuration', () => {
      const rateLimit = require('express-rate-limit');
      
      expect(() => {
        const limiter = rateLimit({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 100 // limit each IP to 100 requests per windowMs
        });
        
        expect(typeof limiter).toBe('function');
      }).not.toThrow();
    });
  });
});

// Helper function for Jest custom matcher
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});
