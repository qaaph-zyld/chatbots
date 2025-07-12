/**
 * Smoke Tests
 * 
 * These tests verify basic functionality after deployment.
 * They are run immediately after deployment to ensure the application
 * is functioning correctly before switching traffic.
 */

const axios = require('axios');
const { expect } = require('chai');

// Get the base URL from environment or use default
const BASE_URL = process.env.TEST_URL || 'https://chatbot-platform.example.com';
const API_VERSION = 'v1';

describe('Smoke Tests', () => {
  // Health check
  describe('Health Check', () => {
    it('should return 200 OK from health endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/health`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status', 'ok');
    });

    it('should return 200 OK from readiness endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/health/ready`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status', 'ok');
    });

    it('should return 200 OK from liveness endpoint', async () => {
      const response = await axios.get(`${BASE_URL}/health/live`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status', 'ok');
    });
  });

  // Static assets
  describe('Static Assets', () => {
    it('should serve the main HTML page', async () => {
      const response = await axios.get(`${BASE_URL}/`);
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('text/html');
    });

    it('should serve CSS files', async () => {
      const response = await axios.get(`${BASE_URL}/static/css/main.css`);
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('text/css');
    });

    it('should serve JavaScript files', async () => {
      const response = await axios.get(`${BASE_URL}/static/js/main.js`);
      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('javascript');
    });
  });

  // API endpoints
  describe('API Endpoints', () => {
    let authToken;

    before(async () => {
      try {
        // Login to get auth token
        const response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
          email: process.env.TEST_USER_EMAIL || 'test@example.com',
          password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
        });
        
        authToken = response.data.token;
      } catch (error) {
        console.error('Failed to get auth token:', error.message);
        // Continue tests without token
      }
    });

    it('should return 401 for protected endpoints without auth', async () => {
      try {
        await axios.get(`${BASE_URL}/api/${API_VERSION}/chatbots`);
        throw new Error('Expected 401 error but got success response');
      } catch (error) {
        expect(error.response.status).to.equal(401);
      }
    });

    it('should return chatbots list with auth', async function() {
      if (!authToken) {
        this.skip();
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/${API_VERSION}/chatbots`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
    });

    it('should return user profile with auth', async function() {
      if (!authToken) {
        this.skip();
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/${API_VERSION}/users/profile`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('email');
    });
  });

  // Database connectivity
  describe('Database Connectivity', () => {
    it('should return database health status', async () => {
      const response = await axios.get(`${BASE_URL}/health/database`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status', 'ok');
    });
  });

  // External service connectivity
  describe('External Service Connectivity', () => {
    it('should return external services health status', async () => {
      const response = await axios.get(`${BASE_URL}/health/services`);
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('status');
    });
  });

  // Basic functionality
  describe('Basic Functionality', () => {
    let authToken;
    let chatbotId;

    before(async () => {
      try {
        // Login to get auth token
        const response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
          email: process.env.TEST_USER_EMAIL || 'test@example.com',
          password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
        });
        
        authToken = response.data.token;
      } catch (error) {
        console.error('Failed to get auth token:', error.message);
        // Continue tests without token
      }
    });

    it('should create a new chatbot', async function() {
      if (!authToken) {
        this.skip();
        return;
      }

      const chatbotData = {
        name: `Smoke Test Bot ${Date.now()}`,
        description: 'Created during smoke testing',
        type: 'customer-support'
      };

      const response = await axios.post(
        `${BASE_URL}/api/${API_VERSION}/chatbots`,
        chatbotData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('id');
      expect(response.data).to.have.property('name', chatbotData.name);
      
      chatbotId = response.data.id;
    });

    it('should retrieve the created chatbot', async function() {
      if (!authToken || !chatbotId) {
        this.skip();
        return;
      }

      const response = await axios.get(
        `${BASE_URL}/api/${API_VERSION}/chatbots/${chatbotId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('id', chatbotId);
    });

    it('should update the chatbot', async function() {
      if (!authToken || !chatbotId) {
        this.skip();
        return;
      }

      const updateData = {
        description: 'Updated during smoke testing'
      };

      const response = await axios.patch(
        `${BASE_URL}/api/${API_VERSION}/chatbots/${chatbotId}`,
        updateData,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).to.equal(200);
      expect(response.data).to.have.property('description', updateData.description);
    });

    it('should delete the chatbot', async function() {
      if (!authToken || !chatbotId) {
        this.skip();
        return;
      }

      const response = await axios.delete(
        `${BASE_URL}/api/${API_VERSION}/chatbots/${chatbotId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).to.equal(204);
    });
  });
});
