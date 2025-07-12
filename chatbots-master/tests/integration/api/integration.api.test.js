/**
 * Integration API Integration Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../../app');
const Integration = require('../../../models/integration.model');
const Chatbot = require('../../../models/chatbot.model');
const User = require('../../../models/user.model');
require('@tests/utils\test-helpers');

describe('Integration API', () => {
  let testUser;
  let testToken;
  let testChatbot;
  
  // Setup before all tests
  beforeAll(async () => {
    // Create test user
    testUser = await createTestUser({
      permissions: ['chatbot:read', 'chatbot:write', 'integration:read', 'integration:write', 'integration:delete']
    });
    
    // Generate token
    testToken = generateToken(testUser);
    
    // Create test chatbot
    testChatbot = await createTestChatbot({}, testUser);
  });
  
  // Clean up after all tests
  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Chatbot.deleteMany({});
    await Integration.deleteMany({});
  });
  
  // Test creating an integration
  describe('POST /api/integrations', () => {
    it('should create a new integration', async () => {
      // Integration data
      const integrationData = {
        name: 'Test Web Integration',
        platform: 'web',
        chatbotId: testChatbot._id.toString(),
        config: {
          webhook: 'https://example.com/webhook',
          apiKey: 'test-api-key'
        }
      };
      
      // Make request
      const response = await request(app)
        .post('/api/integrations')
        .set('Authorization', `Bearer ${testToken}`)
        .send(integrationData)
        .expect(201);
      
      // Check response
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe(integrationData.name);
      expect(response.body.data.platform).toBe(integrationData.platform);
      expect(response.body.data.chatbotId).toBe(integrationData.chatbotId);
      expect(response.body.data.status).toBe('inactive');
      
      // Check that integration was created in database
      const integration = await Integration.findById(response.body.data._id);
      expect(integration).not.toBeNull();
      expect(integration.name).toBe(integrationData.name);
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Integration data with missing fields
      const integrationData = {
        name: 'Test Web Integration',
        // Missing platform and chatbotId
        config: {
          webhook: 'https://example.com/webhook',
          apiKey: 'test-api-key'
        }
      };
      
      // Make request
      const response = await request(app)
        .post('/api/integrations')
        .set('Authorization', `Bearer ${testToken}`)
        .send(integrationData)
        .expect(400);
      
      // Check response
      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('required fields');
    });
    
    it('should return 401 if not authenticated', async () => {
      // Integration data
      const integrationData = {
        name: 'Test Web Integration',
        platform: 'web',
        chatbotId: testChatbot._id.toString(),
        config: {
          webhook: 'https://example.com/webhook',
          apiKey: 'test-api-key'
        }
      };
      
      // Make request without token
      await request(app)
        .post('/api/integrations')
        .send(integrationData)
        .expect(401);
    });
    
    it('should return 403 if missing required permissions', async () => {
      // Create user without permissions
      const userWithoutPermissions = await createTestUser({
        permissions: ['chatbot:read'] // Missing integration:write
      });
      
      // Generate token
      const tokenWithoutPermissions = generateToken(userWithoutPermissions);
      
      // Integration data
      const integrationData = {
        name: 'Test Web Integration',
        platform: 'web',
        chatbotId: testChatbot._id.toString(),
        config: {
          webhook: 'https://example.com/webhook',
          apiKey: 'test-api-key'
        }
      };
      
      // Make request
      await request(app)
        .post('/api/integrations')
        .set('Authorization', `Bearer ${tokenWithoutPermissions}`)
        .send(integrationData)
        .expect(403);
    });
  });
  
  // Test getting integrations
  describe('GET /api/integrations', () => {
    let testIntegrations = [];
    
    // Create test integrations
    beforeAll(async () => {
      // Create multiple integrations
      const integrations = [
        {
          name: 'Web Integration 1',
          platform: 'web',
          chatbotId: testChatbot._id,
          status: 'active',
          config: { webhook: 'https://example.com/webhook1' }
        },
        {
          name: 'Slack Integration',
          platform: 'slack',
          chatbotId: testChatbot._id,
          status: 'inactive',
          config: { botToken: 'xoxb-test-token' }
        }
      ];
      
      // Save integrations
      testIntegrations = await Integration.insertMany(integrations);
    });
    
    it('should return all integrations', async () => {
      // Make request
      const response = await request(app)
        .get('/api/integrations')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
      
      // Check response
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      
      // Check that our test integrations are included
      const integrationIds = response.body.data.map(i => i._id);
      expect(integrationIds).toContain(testIntegrations[0]._id.toString());
      expect(integrationIds).toContain(testIntegrations[1]._id.toString());
    });
    
    it('should filter integrations by platform', async () => {
      // Make request with platform filter
      const response = await request(app)
        .get('/api/integrations?platform=slack')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
      
      // Check response
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      
      // All returned integrations should be slack platform
      response.body.data.forEach(integration => {
        expect(integration.platform).toBe('slack');
      });
      
      // Should include our test slack integration
      const integrationIds = response.body.data.map(i => i._id);
      expect(integrationIds).toContain(testIntegrations[1]._id.toString());
    });
    
    it('should return 401 if not authenticated', async () => {
      // Make request without token
      await request(app)
        .get('/api/integrations')
        .expect(401);
    });
  });
  
  // Test getting integrations by chatbot ID
  describe('GET /api/chatbots/:chatbotId/integrations', () => {
    it('should return integrations for a specific chatbot', async () => {
      // Make request
      const response = await request(app)
        .get(`/api/chatbots/${testChatbot._id}/integrations`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
      
      // Check response
      expect(response.body.status).toBe('success');
      expect(response.body.data).toBeInstanceOf(Array);
      
      // All returned integrations should belong to the test chatbot
      response.body.data.forEach(integration => {
        expect(integration.chatbotId).toBe(testChatbot._id.toString());
      });
    });
    
    it('should return 404 if chatbot does not exist', async () => {
      // Generate non-existent ID
      const nonExistentId = new mongoose.Types.ObjectId();
      
      // Make request
      await request(app)
        .get(`/api/chatbots/${nonExistentId}/integrations`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });
  
  // Test activating an integration
  describe('POST /api/integrations/:id/activate', () => {
    let inactiveIntegration;
    
    // Create an inactive integration
    beforeAll(async () => {
      inactiveIntegration = await Integration.create({
        name: 'Inactive Integration',
        platform: 'web',
        chatbotId: testChatbot._id,
        status: 'inactive',
        config: { webhook: 'https://example.com/webhook-inactive' }
      });
    });
    
    it('should activate an integration', async () => {
      // Make request
      const response = await request(app)
        .post(`/api/integrations/${inactiveIntegration._id}/activate`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
      
      // Check response
      expect(response.body.status).toBe('success');
      expect(response.body.data.status).toBe('active');
      
      // Check that integration was updated in database
      const updatedIntegration = await Integration.findById(inactiveIntegration._id);
      expect(updatedIntegration.status).toBe('active');
    });
    
    it('should return 404 if integration does not exist', async () => {
      // Generate non-existent ID
      const nonExistentId = new mongoose.Types.ObjectId();
      
      // Make request
      await request(app)
        .post(`/api/integrations/${nonExistentId}/activate`)
        .set('Authorization', `Bearer ${testToken}`)
        .expect(404);
    });
  });
  
  // Test processing a message
  describe('POST /api/integrations/:id/message', () => {
    let activeIntegration;
    
    // Create an active integration
    beforeAll(async () => {
      activeIntegration = await Integration.create({
        name: 'Active Integration',
        platform: 'web',
        chatbotId: testChatbot._id,
        status: 'active',
        config: { webhook: 'https://example.com/webhook-active' }
      });
    });
    
    it('should process a message', async () => {
      // Message data
      const messageData = {
        text: 'Hello, world!',
        userId: 'test-user-123',
        type: 'text'
      };
      
      // Mock the chatbot service's processMessage method
      // This would normally be done with a proper mock of the chatbot service
      
      // Make request
      const response = await request(app)
        .post(`/api/integrations/${activeIntegration._id}/message`)
        .send(messageData)
        .expect(200);
      
      // Check response structure
      // The actual response content will depend on the chatbot implementation
      expect(response.body).toHaveProperty('status');
    });
    
    it('should return 400 if message data is invalid', async () => {
      // Invalid message data (missing required fields)
      const invalidMessageData = {
        // Missing text and userId
        type: 'text'
      };
      
      // Make request
      await request(app)
        .post(`/api/integrations/${activeIntegration._id}/message`)
        .send(invalidMessageData)
        .expect(400);
    });
    
    it('should return 404 if integration does not exist', async () => {
      // Generate non-existent ID
      const nonExistentId = new mongoose.Types.ObjectId();
      
      // Message data
      const messageData = {
        text: 'Hello, world!',
        userId: 'test-user-123',
        type: 'text'
      };
      
      // Make request
      await request(app)
        .post(`/api/integrations/${nonExistentId}/message`)
        .send(messageData)
        .expect(404);
    });
  });
});
