/**
 * Basic Smoke Tests
 * 
 * These tests verify that the application is running correctly after deployment.
 * They check core functionality without going into detailed testing.
 */

const axios = require('axios');

// Get the base URL from environment or use default
const BASE_URL = process.env.TEST_URL || 'https://chatbot-platform.example.com';

describe('Smoke Tests', () => {
  // Basic health check
  describe('Application Health', () => {
    it('should return 200 OK for health endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'ok');
    });
  });

  // Core pages load
  describe('Core Pages', () => {
    it('should load the home page', async () => {
      const response = await axios.get(BASE_URL, {
        headers: { Accept: 'text/html' }
      });
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should load the login page', async () => {
      const response = await axios.get(`${BASE_URL}/login`, {
        headers: { Accept: 'text/html' }
      });
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/html');
    });
  });

  // API endpoints
  describe('API Endpoints', () => {
    it('should return 200 OK for public API endpoints', async () => {
      const response = await axios.get(`${BASE_URL}/api/v1/status`);
      expect(response.status).toBe(200);
    });

    it('should return 401 for protected endpoints without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/v1/protected`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  // Static assets
  describe('Static Assets', () => {
    it('should serve JavaScript files', async () => {
      const response = await axios.get(`${BASE_URL}/static/js/main.js`);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/javascript');
    });

    it('should serve CSS files', async () => {
      const response = await axios.get(`${BASE_URL}/static/css/main.css`);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/css');
    });
  });
});
