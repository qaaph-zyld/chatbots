/**
 * Performance Verification Tests
 * 
 * These tests verify that the application meets performance requirements
 * after deployment. They are run as part of the deployment verification
 * process before switching traffic to the new deployment.
 */

const axios = require('axios');

// Get the base URL from environment or use default
const BASE_URL = process.env.TEST_URL || 'https://chatbot-platform.example.com';
const API_VERSION = 'v1';

// Test configuration
const CONFIG = {
  responseTimeThresholds: {
    api: 500, // API endpoints should respond within 500ms
    static: 200, // Static resources should load within 200ms
    health: 100 // Health endpoint should respond within 100ms
  },
  concurrentUsers: 10, // Number of simulated concurrent users
  requestsPerUser: 5 // Number of requests per user
};

describe('Performance Verification Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Login to get auth token
    try {
      const response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
      });
      authToken = response.data.token;
    } catch (error) {
      console.error('Failed to get auth token:', error.message);
      throw error;
    }
  });

  // Health endpoint response time
  describe('Health Endpoint Performance', () => {
    it(`should respond within ${CONFIG.responseTimeThresholds.health}ms`, async () => {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/health`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(CONFIG.responseTimeThresholds.health);
    });
  });

  // API endpoint response times
  describe('API Endpoint Performance', () => {
    it(`should get chatbots list within ${CONFIG.responseTimeThresholds.api}ms`, async () => {
      const startTime = Date.now();
      const response = await axios.get(
        `${BASE_URL}/api/${API_VERSION}/chatbots`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(CONFIG.responseTimeThresholds.api);
    });

    it(`should get analytics data within ${CONFIG.responseTimeThresholds.api}ms`, async () => {
      const startTime = Date.now();
      const response = await axios.get(
        `${BASE_URL}/api/${API_VERSION}/analytics/summary`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(CONFIG.responseTimeThresholds.api);
    });
  });

  // Static resource loading times
  describe('Static Resource Performance', () => {
    it(`should load main CSS within ${CONFIG.responseTimeThresholds.static}ms`, async () => {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/static/css/main.css`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(CONFIG.responseTimeThresholds.static);
    });

    it(`should load main JS within ${CONFIG.responseTimeThresholds.static}ms`, async () => {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/static/js/main.js`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(CONFIG.responseTimeThresholds.static);
    });
  });

  // Concurrent user simulation
  describe('Concurrent User Performance', () => {
    it(`should handle ${CONFIG.concurrentUsers} concurrent users making ${CONFIG.requestsPerUser} requests each`, async () => {
      // Create array of promises for concurrent requests
      const userPromises = [];

      for (let user = 0; user < CONFIG.concurrentUsers; user++) {
        const userRequests = [];
        
        for (let request = 0; request < CONFIG.requestsPerUser; request++) {
          // Add a small delay between requests to simulate real user behavior
          const delay = Math.floor(Math.random() * 100);
          
          userRequests.push(
            new Promise(resolve => setTimeout(resolve, delay))
              .then(() => {
                const startTime = Date.now();
                return axios.get(
                  `${BASE_URL}/api/${API_VERSION}/chatbots`,
                  { headers: { Authorization: `Bearer ${authToken}` } }
                ).then(response => {
                  const endTime = Date.now();
                  const responseTime = endTime - startTime;
                  return { status: response.status, responseTime };
                });
              })
          );
        }
        
        userPromises.push(Promise.all(userRequests));
      }

      // Wait for all requests to complete
      const results = await Promise.all(userPromises);
      
      // Flatten results array
      const flatResults = results.flat();
      
      // Calculate statistics
      const responseTimes = flatResults.map(result => result.responseTime);
      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const successfulRequests = flatResults.filter(result => result.status === 200).length;
      const totalRequests = flatResults.length;
      
      console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`Maximum response time: ${maxResponseTime}ms`);
      console.log(`Success rate: ${(successfulRequests / totalRequests * 100).toFixed(2)}%`);
      
      // Assertions
      expect(successfulRequests).toBe(totalRequests);
      expect(avgResponseTime).toBeLessThan(CONFIG.responseTimeThresholds.api * 2);
      expect(maxResponseTime).toBeLessThan(CONFIG.responseTimeThresholds.api * 5);
    });
  });

  // Database query performance
  describe('Database Query Performance', () => {
    it('should perform database health check with acceptable latency', async () => {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/health/database`);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('latency');
      expect(response.data.latency).toBeLessThan(500); // Database query should be under 500ms
    });
  });
});
