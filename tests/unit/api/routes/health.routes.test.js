/**
 * Unit tests for health routes
 */

const request = require('supertest');
const express = require('express');

// Mock the health controller module with inline mock functions
jest.mock('../../../../src/api/controllers/health.controller', () => ({
  getHealth: jest.fn(),
  getReadiness: jest.fn(),
  getLiveness: jest.fn(),
  getDatabaseHealth: jest.fn(),
  getIntegrationsHealth: jest.fn(),
  getDetailedHealth: jest.fn()
}));

// Import after mocking
const healthRoutes = require('../../../../src/api/routes/health.routes');
const healthController = require('../../../../src/api/controllers/health.controller');

describe('Health Routes', () => {
  let app;
  
  // Increase Jest timeout for all tests
  jest.setTimeout(30000);

  beforeEach(() => {
    // Setup Express app for each test
    app = express();
    app.use(express.json());
    app.use('/health', healthRoutes);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return basic health status', async () => {
      // Mock controller response
      healthController.getHealth.mockImplementation((req, res) => {
        return res.status(200).json({
          status: 'ok',
          timestamp: new Date(),
          uptime: 123,
          version: '1.0.0'
        });
      });

      // Make request
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(healthController.getHealth).toHaveBeenCalled();
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      // Mock controller response
      healthController.getReadiness.mockImplementation((req, res) => {
        return res.status(200).json({
          status: 'ready',
          services: {
            database: 'connected',
            cache: 'connected'
          }
        });
      });

      // Make request
      const response = await request(app)
        .get('/health/ready')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('services');
      expect(healthController.getReadiness).toHaveBeenCalled();
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      // Mock controller response
      healthController.getLiveness.mockImplementation((req, res) => {
        return res.status(200).json({
          status: 'alive',
          uptime: 123
        });
      });

      // Make request
      const response = await request(app)
        .get('/health/live')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('uptime');
      expect(healthController.getLiveness).toHaveBeenCalled();
    });
  });

  describe('GET /health/database', () => {
    it('should return database health status', async () => {
      // Mock controller response
      healthController.getDatabaseHealth.mockImplementation((req, res) => {
        return res.status(200).json({
          status: 'connected',
          latency: 5,
          collections: ['users', 'chatbots']
        });
      });

      // Make request
      const response = await request(app)
        .get('/health/database')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('status', 'connected');
      expect(response.body).toHaveProperty('latency');
      expect(response.body).toHaveProperty('collections');
      expect(healthController.getDatabaseHealth).toHaveBeenCalled();
    });
  });

  describe('GET /health/integrations', () => {
    it('should return integrations health status', async () => {
      // Mock controller response
      healthController.getIntegrationsHealth.mockImplementation((req, res) => {
        return res.status(200).json({
          status: 'ok',
          services: {
            stripe: { status: 'connected', latency: 120 }
          }
        });
      });

      // Make request
      const response = await request(app)
        .get('/health/integrations')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('services');
      expect(healthController.getIntegrationsHealth).toHaveBeenCalled();
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      // Mock controller response
      healthController.getDetailedHealth.mockImplementation((req, res) => {
        return res.status(200).json({
          status: 'ok',
          timestamp: new Date(),
          uptime: 123,
          version: '1.0.0',
          system: {
            memory: { free: 1024, total: 8192 },
            cpu: { usage: 5.2 }
          },
          services: {
            database: { status: 'connected', latency: 5 },
            cache: { status: 'connected', latency: 2 },
            integrations: {
              stripe: { status: 'connected', latency: 120 }
            }
          }
        });
      });

      // Make request
      const response = await request(app)
        .get('/health/detailed')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('services');
      expect(healthController.getDetailedHealth).toHaveBeenCalled();
    });
  });
});
