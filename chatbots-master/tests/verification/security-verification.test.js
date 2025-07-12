/**
 * Security Verification Tests
 * 
 * These tests verify that the application meets security requirements
 * after deployment. They are run as part of the deployment verification
 * process before switching traffic to the new deployment.
 */

const axios = require('axios');

// Get the base URL from environment or use default
const BASE_URL = process.env.TEST_URL || 'https://chatbot-platform.example.com';
const API_VERSION = 'v1';

describe('Security Verification Tests', () => {
  // HTTP Headers
  describe('Security Headers', () => {
    let headers;

    beforeAll(async () => {
      const response = await axios.get(`${BASE_URL}/`);
      headers = response.headers;
    });

    it('should have Content-Security-Policy header', () => {
      expect(headers).toHaveProperty('content-security-policy');
      const csp = headers['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
    });

    it('should have X-XSS-Protection header', () => {
      expect(headers).toHaveProperty('x-xss-protection');
      expect(headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('should have X-Content-Type-Options header', () => {
      expect(headers).toHaveProperty('x-content-type-options');
      expect(headers['x-content-type-options']).toBe('nosniff');
    });

    it('should have Strict-Transport-Security header', () => {
      expect(headers).toHaveProperty('strict-transport-security');
      expect(headers['strict-transport-security']).toContain('max-age=');
    });

    it('should have X-Frame-Options header', () => {
      expect(headers).toHaveProperty('x-frame-options');
      expect(['DENY', 'SAMEORIGIN']).toContain(headers['x-frame-options']);
    });

    it('should have Referrer-Policy header', () => {
      expect(headers).toHaveProperty('referrer-policy');
    });
  });

  // Authentication Security
  describe('Authentication Security', () => {
    it('should require authentication for protected endpoints', async () => {
      try {
        await axios.get(`${BASE_URL}/api/${API_VERSION}/chatbots`);
        // Should not reach here
        throw new Error('Expected 401 error but got success response');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should reject invalid JWT tokens', async () => {
      try {
        await axios.get(
          `${BASE_URL}/api/${API_VERSION}/chatbots`,
          { headers: { Authorization: 'Bearer invalid.token.here' } }
        );
        // Should not reach here
        throw new Error('Expected 401 error but got success response');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should have CSRF protection', async () => {
      // Get CSRF token
      const response = await axios.get(`${BASE_URL}/csrf-token`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('csrfToken');
      
      // Try to make a POST request without CSRF token
      try {
        await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
          email: 'test@example.com',
          password: 'password123'
        });
        // Should not reach here
        throw new Error('Expected CSRF error but got success response');
      } catch (error) {
        expect(error.response.status).toBe(403);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('CSRF');
      }
    });
  });

  // Rate Limiting
  describe('Rate Limiting', () => {
    it('should have rate limiting on login endpoint', async () => {
      const requests = [];
      
      // Make 20 rapid requests to trigger rate limiting
      for (let i = 0; i < 20; i++) {
        requests.push(
          axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
            email: `test${i}@example.com`,
            password: 'WrongPassword123!'
          }).catch(error => error.response)
        );
      }
      
      const responses = await Promise.all(requests);
      
      // At least some of the later responses should be rate limited (429)
      const rateLimitedResponses = responses.filter(response => response.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  // Input Validation
  describe('Input Validation', () => {
    it('should validate email format', async () => {
      try {
        await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
          email: 'not-an-email',
          password: 'password123'
        });
        // Should not reach here
        throw new Error('Expected validation error but got success response');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('email');
      }
    });

    it('should validate password requirements', async () => {
      try {
        await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/register`, {
          email: 'test@example.com',
          password: '123', // Too short
          name: 'Test User'
        });
        // Should not reach here
        throw new Error('Expected validation error but got success response');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('error');
        expect(error.response.data.error).toContain('password');
      }
    });

    it('should sanitize user input to prevent XSS', async () => {
      try {
        // Login first
        const loginResponse = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
          email: process.env.TEST_USER_EMAIL || 'test@example.com',
          password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
        });
        
        const authToken = loginResponse.data.token;
        
        // Try to create a chatbot with XSS payload
        const response = await axios.post(
          `${BASE_URL}/api/${API_VERSION}/chatbots`,
          {
            name: '<script>alert("XSS")</script>',
            description: 'Test chatbot'
          },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        expect(response.status).toBe(201);
        expect(response.data.name).not.toBe('<script>alert("XSS")</script>');
      } catch (error) {
        // Either sanitized or rejected
        if (error.response && error.response.status === 400) {
          expect(error.response.data).toHaveProperty('error');
        } else {
          throw error;
        }
      }
    });
  });

  // SQL Injection Prevention
  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in query parameters', async () => {
      try {
        await axios.get(`${BASE_URL}/api/${API_VERSION}/users?id=1' OR '1'='1`);
        // Should not reach here or should return empty result
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  // Cookie Security
  describe('Cookie Security', () => {
    let cookies;

    beforeAll(async () => {
      const response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/login`, {
        email: process.env.TEST_USER_EMAIL || 'test@example.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
      });
      
      cookies = response.headers['set-cookie'];
    });

    it('should set secure cookies', () => {
      expect(cookies).toBeDefined();
      
      // Check if at least one cookie has secure flag
      const hasCookieWithSecureFlag = cookies.some(cookie => 
        cookie.includes('Secure') && cookie.includes('HttpOnly')
      );
      
      expect(hasCookieWithSecureFlag).toBe(true);
    });
  });
});
