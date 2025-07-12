/**
 * Deployment Verification Tests
 * 
 * These tests are run during the CI/CD pipeline to verify that a deployment
 * is functioning correctly before switching traffic to the new version.
 */

const axios = require('axios');
const { expect } = require('chai');

// Get test host from environment variable or use default
const TEST_HOST = process.env.TEST_HOST || 'localhost:3000';
const BASE_URL = `http://${TEST_HOST}`;

describe('Deployment Verification Tests', () => {
  // Health check endpoint
  describe('Health Check', () => {
    it('should return 200 OK for health endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status', 'ok');
    });

    it('should report all services as healthy', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.data).to.have.property('services');
      
      const services = response.data.services;
      Object.keys(services).forEach(service => {
        expect(services[service].status).to.equal('ok', `Service ${service} should be healthy`);
      });
    });
  });

  // API functionality
  describe('API Endpoints', () => {
    it('should return 200 OK for public API endpoints', async () => {
      const endpoints = [
        '/api/v1/status',
        '/api/v1/features'
      ];

      for (const endpoint of endpoints) {
        const response = await axios.get(`${BASE_URL}${endpoint}`);
        expect(response.status).to.equal(200, `Endpoint ${endpoint} should return 200 OK`);
      }
    });

    it('should properly reject unauthenticated requests', async () => {
      try {
        await axios.get(`${BASE_URL}/api/v1/protected`);
        throw new Error('Should have failed with 401');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });
  });

  // Database connectivity
  describe('Database Connectivity', () => {
    it('should confirm database connection is working', async () => {
      const response = await axios.get(`${BASE_URL}/health/database`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('connected', true);
    });
  });

  // External service integrations
  describe('External Integrations', () => {
    it('should verify external service connections', async () => {
      const response = await axios.get(`${BASE_URL}/health/integrations`);
      expect(response.status).to.equal(200);
      
      const integrations = response.data.integrations;
      Object.keys(integrations).forEach(integration => {
        expect(integrations[integration].status).to.equal('connected', 
          `Integration ${integration} should be connected`);
      });
    });
  });

  // Performance checks
  describe('Performance Checks', () => {
    it('should respond to API requests within acceptable time', async () => {
      const startTime = Date.now();
      await axios.get(`${BASE_URL}/api/v1/status`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).to.be.below(300, 'API response time should be under 300ms');
    });
  });

  // Frontend assets
  describe('Frontend Assets', () => {
    it('should serve static assets correctly', async () => {
      const response = await axios.get(`${BASE_URL}/static/js/main.js`, {
        validateStatus: () => true
      });
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('application/javascript');
    });

    it('should load the main application page', async () => {
      const response = await axios.get(`${BASE_URL}/`, {
        headers: {
          'Accept': 'text/html'
        }
      });
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('text/html');
      expect(response.data).to.include('<title>Chatbot Platform</title>');
    });
  });
});
