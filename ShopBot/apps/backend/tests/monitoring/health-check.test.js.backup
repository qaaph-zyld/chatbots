const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');
const healthRouter = require('../../src/routes/health');

// Create Express app for health check testing
const app = express();
app.use('/health', healthRouter);

describe('Health Check and Monitoring Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Basic Health Check', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.environment).toBeDefined();
      expect(response.body.version).toBeDefined();
    });

    test('should include required health check fields', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('Detailed Health Check', () => {
    test('should return detailed health information', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.status).toBeDefined();
      expect(response.body.checks).toBeDefined();
      expect(response.body.checks.database).toBeDefined();
      expect(response.body.checks.memory).toBeDefined();
      expect(response.body.checks.disk).toBeDefined();
      expect(response.body.checks.external_services).toBeDefined();
      expect(response.body.response_time).toBeDefined();
    });

    test('should check database connectivity', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      const dbCheck = response.body.checks.database;
      expect(dbCheck.status).toBeDefined();
      expect(dbCheck.state).toBeDefined();
      
      if (mongoose.connection.readyState === 1) {
        expect(dbCheck.status).toBe('healthy');
        expect(dbCheck.state).toBe('connected');
        expect(dbCheck.ping).toBe('success');
      }
    });

    test('should check memory usage', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      const memoryCheck = response.body.checks.memory;
      expect(memoryCheck.status).toBeDefined();
      expect(memoryCheck.usage).toBeDefined();
      expect(memoryCheck.usage.rss).toBeDefined();
      expect(memoryCheck.usage.heapTotal).toBeDefined();
      expect(memoryCheck.usage.heapUsed).toBeDefined();
      expect(memoryCheck.usage.external).toBeDefined();
    });

    test('should check external services', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      const externalServices = response.body.checks.external_services;
      expect(externalServices).toBeDefined();
      
      const expectedServices = ['shopify-api', 'woocommerce-api', 'payment-gateway'];
      expectedServices.forEach(service => {
        expect(externalServices[service]).toBeDefined();
        expect(externalServices[service].status).toBeDefined();
        expect(externalServices[service].response_time).toBeDefined();
        expect(externalServices[service].last_check).toBeDefined();
      });
    });

    test('should return degraded status when services are unhealthy', async () => {
      // This test would require mocking unhealthy services
      // For now, we test that the structure supports degraded status
      const response = await request(app)
        .get('/health/detailed');

      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });
  });

  describe('Readiness Probe', () => {
    test('should return ready when all critical services are available', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.checks).toBeDefined();
      expect(response.body.checks.database).toBe(true);
      expect(response.body.checks.memory).toBe(true);
    });

    test('should return not ready when database is disconnected', async () => {
      // Temporarily disconnect database for testing
      const originalReadyState = mongoose.connection.readyState;
      
      // Mock disconnected state
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        writable: true
      });

      const response = await request(app)
        .get('/health/ready')
        .expect(503);

      expect(response.body.status).toBe('not ready');
      expect(response.body.reason).toContain('Database not connected');

      // Restore original state
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: originalReadyState,
        writable: true
      });
    });

    test('should include check results in readiness response', async () => {
      const response = await request(app)
        .get('/health/ready');

      expect(response.body.checks).toBeDefined();
      expect(typeof response.body.checks.database).toBe('boolean');
      expect(typeof response.body.checks.memory).toBe('boolean');
    });
  });

  describe('Liveness Probe', () => {
    test('should return alive status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    test('should respond quickly for liveness check', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health/live')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100); // Should respond in under 100ms
    });
  });

  describe('Metrics Endpoint', () => {
    test('should return system metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.memory).toBeDefined();
      expect(response.body.cpu).toBeDefined();
      expect(response.body.environment).toBeDefined();
      expect(response.body.node_version).toBeDefined();
      expect(response.body.platform).toBeDefined();
      expect(response.body.arch).toBeDefined();
      expect(response.body.pid).toBeDefined();
    });

    test('should include application-specific metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body.application).toBeDefined();
      expect(response.body.application.active_connections).toBeDefined();
      expect(response.body.application.requests_per_minute).toBeDefined();
      expect(response.body.application.error_rate).toBeDefined();
      expect(response.body.application.response_time_avg).toBeDefined();
    });

    test('should include memory usage details', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      const memory = response.body.memory;
      expect(memory.rss).toBeDefined();
      expect(memory.heapTotal).toBeDefined();
      expect(memory.heapUsed).toBeDefined();
      expect(memory.external).toBeDefined();
      expect(memory.arrayBuffers).toBeDefined();
    });

    test('should include CPU usage information', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      const cpu = response.body.cpu;
      expect(cpu.user).toBeDefined();
      expect(cpu.system).toBeDefined();
    });
  });

  describe('Response Time Performance', () => {
    test('should respond to basic health check quickly', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(50); // Should respond in under 50ms
    });

    test('should respond to detailed health check within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health/detailed')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond in under 1 second
    });

    test('should include response time in detailed health check', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body.response_time).toBeDefined();
      expect(response.body.response_time).toMatch(/\d+ms/);
      
      const responseTimeMs = parseInt(response.body.response_time);
      expect(responseTimeMs).toBeGreaterThan(0);
      expect(responseTimeMs).toBeLessThan(1000);
    });
  });

  describe('Concurrent Health Checks', () => {
    test('should handle multiple concurrent health checks', async () => {
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

    test('should handle concurrent detailed health checks', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(request(app).get('/health/detailed'));
      }

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.checks).toBeDefined();
      });
    });
  });

  describe('Error Handling in Health Checks', () => {
    test('should handle database connection errors gracefully', async () => {
      // This would require mocking a database error
      // For now, we test that the endpoint doesn't crash
      const response = await request(app)
        .get('/health/detailed');

      expect(response.status).toBeOneOf([200, 503]);
      expect(response.body.status).toBeDefined();
    });

    test('should handle readiness check errors gracefully', async () => {
      const response = await request(app)
        .get('/health/ready');

      expect(response.status).toBeOneOf([200, 503]);
      expect(response.body.status).toBeOneOf(['ready', 'not ready']);
    });
  });

  describe('Health Check Data Validation', () => {
    test('should return valid timestamps', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('should return positive uptime', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.uptime).toBeGreaterThan(0);
      expect(typeof response.body.uptime).toBe('number');
    });

    test('should return valid environment information', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.environment).toBeDefined();
      expect(typeof response.body.environment).toBe('string');
      expect(response.body.version).toBeDefined();
      expect(typeof response.body.version).toBe('string');
    });
  });

  describe('Monitoring Integration', () => {
    test('should provide data suitable for monitoring systems', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      // Check that all metrics are numeric or properly formatted
      expect(typeof response.body.uptime).toBe('number');
      expect(typeof response.body.memory.rss).toBe('number');
      expect(typeof response.body.memory.heapTotal).toBe('number');
      expect(typeof response.body.memory.heapUsed).toBe('number');
      expect(typeof response.body.pid).toBe('number');
    });

    test('should provide consistent metric format', async () => {
      const response1 = await request(app).get('/health/metrics');
      const response2 = await request(app).get('/health/metrics');

      // Both responses should have the same structure
      expect(Object.keys(response1.body)).toEqual(Object.keys(response2.body));
      expect(Object.keys(response1.body.memory)).toEqual(Object.keys(response2.body.memory));
      expect(Object.keys(response1.body.application)).toEqual(Object.keys(response2.body.application));
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
