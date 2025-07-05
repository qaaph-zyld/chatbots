/**
 * API Verification Tests
 * 
 * These tests verify that the API endpoints are functioning correctly
 * after deployment. They are run as part of the deployment verification
 * process before switching traffic to the new deployment.
 */

const axios = require('axios');

// Get the base URL from environment or use default
const BASE_URL = process.env.TEST_URL || 'https://chatbot-platform.example.com';
const API_VERSION = 'v1';

describe('API Verification Tests', () => {
  // Authentication
  describe('Authentication API', () => {
    it('should return 200 OK for login endpoint with valid credentials', async () => {
      try {
        const response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
          email: process.env.TEST_USER_EMAIL || 'test@example.com',
          password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
        });
        
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('token');
        expect(response.data).toHaveProperty('user');
      } catch (error) {
        console.error('Login test failed:', error.response?.data || error.message);
        throw error;
      }
    });

    it('should return 401 for login with invalid credentials', async () => {
      try {
        await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
          email: 'invalid@example.com',
          password: 'InvalidPassword123!'
        });
        // Should not reach here
        throw new Error('Expected 401 error but got success response');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  // Chatbot Management
  describe('Chatbot Management API', () => {
    let authToken;
    let chatbotId;

    beforeAll(async () => {
      // Login to get auth token
      const response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
      });
      authToken = response.data.token;
    });

    it('should create a new chatbot', async () => {
      const chatbotData = {
        name: `Test Chatbot ${Date.now()}`,
        description: 'Created during deployment verification',
        type: 'customer-support'
      };

      const response = await axios.post(
        `${BASE_URL}/api/${API_VERSION}/chatbots`,
        chatbotData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data.name).toBe(chatbotData.name);
      
      chatbotId = response.data.id;
    });

    it('should retrieve the created chatbot', async () => {
      const response = await axios.get(
        `${BASE_URL}/api/${API_VERSION}/chatbots/${chatbotId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', chatbotId);
    });

    it('should update the chatbot', async () => {
      const updateData = {
        description: 'Updated during deployment verification'
      };

      const response = await axios.patch(
        `${BASE_URL}/api/${API_VERSION}/chatbots/${chatbotId}`,
        updateData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('description', updateData.description);
    });

    it('should delete the chatbot', async () => {
      const response = await axios.delete(
        `${BASE_URL}/api/${API_VERSION}/chatbots/${chatbotId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(204);
    });
  });

  // Subscription Management
  describe('Subscription Management API', () => {
    let authToken;

    beforeAll(async () => {
      // Login to get auth token
      const response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
      });
      authToken = response.data.token;
    });

    it('should retrieve subscription plans', async () => {
      const response = await axios.get(
        `${BASE_URL}/api/${API_VERSION}/billing/plans`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should retrieve current subscription', async () => {
      const response = await axios.get(
        `${BASE_URL}/api/${API_VERSION}/billing/subscription`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
    });
  });

  // Analytics
  describe('Analytics API', () => {
    let authToken;

    beforeAll(async () => {
      // Login to get auth token
      const response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
      });
      authToken = response.data.token;
    });

    it('should retrieve analytics summary', async () => {
      const response = await axios.get(
        `${BASE_URL}/api/${API_VERSION}/analytics/summary`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('conversations');
      expect(response.data).toHaveProperty('users');
      expect(response.data).toHaveProperty('satisfaction');
    });

    it('should retrieve conversation analytics', async () => {
      const response = await axios.get(
        `${BASE_URL}/api/${API_VERSION}/analytics/conversations`,
        { 
          headers: { Authorization: `Bearer ${authToken}` },
          params: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          }
        }
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  // System Health
  describe('System Health', () => {
    it('should return 200 OK for health endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'ok');
    });

    it('should return correct version information', async () => {
      const response = await axios.get(`${BASE_URL}/health/version`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('version');
      expect(response.data).toHaveProperty('buildNumber');
      expect(response.data).toHaveProperty('environment');
    });

    it('should return database health status', async () => {
      const response = await axios.get(`${BASE_URL}/health/database`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'connected');
      expect(response.data).toHaveProperty('latency');
      expect(response.data.latency).toBeLessThan(1000); // Database response should be under 1 second
    });
  });
});
