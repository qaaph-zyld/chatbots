/**
 * Unit tests for advanced context routes
 */

const request = require('supertest');
const express = require('express');

// Mock the advanced context controller module with inline mock functions
jest.mock('../../../../src/api/controllers/advanced-context.controller', () => ({
  processMessage: jest.fn(),
  getConversationContext: jest.fn(),
  getCrossConversationContext: jest.fn(),
  applyContextToResponses: jest.fn(),
  resetUserContext: jest.fn(),
  trackEntity: jest.fn(),
  createEntityRelation: jest.fn(),
  referenceEntity: jest.fn(),
  getUserEntities: jest.fn(),
  getConversationEntities: jest.fn(),
  getEntityRelations: jest.fn(),
  deleteEntity: jest.fn(),
  detectTopics: jest.fn(),
  getConversationTopics: jest.fn(),
  getUserTopicHistory: jest.fn(),
  getTopicsInTimePeriod: jest.fn(),
  deleteTopic: jest.fn(),
  setPreference: jest.fn(),
  inferPreferences: jest.fn(),
  getUserPreferences: jest.fn(),
  applyPreferencesToResponses: jest.fn(),
  deletePreference: jest.fn(),
  resetUserPreferences: jest.fn()
}));

// Import the controller after mocking
const advancedContextController = require('../../../../src/api/controllers/advanced-context.controller');

// Mock the auth middleware
jest.mock('../../../../src/api/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  authorize: () => (req, res, next) => next()
}));

// Mock the validate middleware
jest.mock('../../../../src/api/middleware/validate', () => ({
  validateBody: () => (req, res, next) => next(),
  validateParams: () => (req, res, next) => next()
}));

// Import after mocking
const advancedContextRoutes = require('../../../../src/api/routes/advanced-context.routes');

// Increase Jest timeout for these tests
jest.setTimeout(30000);

describe('Advanced Context Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    // Mount routes at the API root to match the test requests
    app.use('/api', advancedContextRoutes);
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/process-message', () => {
    it('should process message and extract context', async () => {
      // Mock controller response
      advancedContextController.processMessage.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          context: {
            entities: ['product', 'feature'],
            topics: ['support', 'pricing'],
            sentiment: 'positive'
          }
        });
      });

      // Test data
      const message = { message: 'I love your product and its features!' };

      // Make request
      const response = await request(app)
        .post('/api/chatbots/chatbot123/users/user456/conversations/conv789/process-message')
        .send(message)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('context');
      expect(response.body.context).toHaveProperty('entities');
      expect(response.body.context).toHaveProperty('topics');
      expect(advancedContextController.processMessage).toHaveBeenCalled();
    });
  });

  describe('GET /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/context', () => {
    it('should get conversation context', async () => {
      // Mock controller response
      advancedContextController.getConversationContext.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          context: {
            entities: ['product', 'feature'],
            topics: ['support', 'pricing'],
            sentiment: 'positive'
          }
        });
      });

      // Make request
      const response = await request(app)
        .get('/api/chatbots/chatbot123/users/user456/conversations/conv789/context')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('context');
      expect(advancedContextController.getConversationContext).toHaveBeenCalled();
    });
  });

  describe('GET /api/chatbots/:chatbotId/users/:userId/cross-conversation-context', () => {
    it('should get cross-conversation context', async () => {
      // Mock controller response
      advancedContextController.getCrossConversationContext.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          context: {
            frequentTopics: ['billing', 'support'],
            preferences: { theme: 'dark' },
            recentEntities: ['subscription', 'payment']
          }
        });
      });

      // Make request
      const response = await request(app)
        .get('/api/chatbots/chatbot123/users/user456/cross-conversation-context')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('context');
      expect(advancedContextController.getCrossConversationContext).toHaveBeenCalled();
    });
  });

  describe('POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/apply-context', () => {
    it('should apply context to responses', async () => {
      // Mock controller response
      advancedContextController.applyContextToResponses.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          responses: [
            { original: 'Hello there', contextual: 'Hello John, welcome back!' },
            { original: 'How can I help?', contextual: 'Do you need more help with your subscription?' }
          ]
        });
      });

      // Test data
      const requestBody = {
        responses: ['Hello there', 'How can I help?']
      };

      // Make request
      const response = await request(app)
        .post('/api/chatbots/chatbot123/users/user456/conversations/conv789/apply-context')
        .send(requestBody)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('responses');
      expect(response.body.responses).toBeInstanceOf(Array);
      expect(advancedContextController.applyContextToResponses).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/chatbots/:chatbotId/users/:userId/context', () => {
    it('should reset user context', async () => {
      // Mock controller response
      advancedContextController.resetUserContext.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          message: 'User context reset successfully'
        });
      });

      // Make request
      const response = await request(app)
        .delete('/api/chatbots/chatbot123/users/user456/context')
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(advancedContextController.resetUserContext).toHaveBeenCalled();
    });
  });

  // Entity tracking endpoints
  describe('POST /api/chatbots/:chatbotId/users/:userId/conversations/:conversationId/track-entity', () => {
    it('should track entity', async () => {
      // Mock controller response
      advancedContextController.trackEntity.mockImplementation((req, res) => {
        return res.status(201).json({
          success: true,
          entity: {
            id: 'entity123',
            type: 'product',
            name: 'Premium Plan',
            confidence: 0.95
          }
        });
      });

      // Test data
      const entityData = {
        type: 'product',
        name: 'Premium Plan',
        confidence: 0.95
      };

      // Make request
      const response = await request(app)
        .post('/api/chatbots/chatbot123/users/user456/conversations/conv789/track-entity')
        .send(entityData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('entity');
      expect(advancedContextController.trackEntity).toHaveBeenCalled();
    });
  });

  // Add one test for preferences
  describe('POST /api/chatbots/:chatbotId/users/:userId/preferences', () => {
    it('should set user preference', async () => {
      // Mock controller response
      advancedContextController.setPreference.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          preference: {
            category: 'ui',
            key: 'theme',
            value: 'dark'
          }
        });
      });

      // Test data
      const preferenceData = {
        category: 'ui',
        key: 'theme',
        value: 'dark'
      };

      // Make request
      const response = await request(app)
        .post('/api/chatbots/chatbot123/users/user456/preferences')
        .send(preferenceData)
        .expect('Content-Type', /json/)
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('preference');
      expect(advancedContextController.setPreference).toHaveBeenCalled();
    });
  });
});
