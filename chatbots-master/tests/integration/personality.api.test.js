/**
 * Personality API Integration Tests
 * 
 * Tests for the personality API endpoints
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Personality = require('../../database/schemas/personality.schema');
const Chatbot = require('../../database/schemas/chatbot.schema');
const { connectDB, disconnectDB } = require('../../database/connection');

describe('Personality API', () => {
  let testChatbot;
  let testPersonality;

  // Connect to test database before running tests
  beforeAll(async () => {
    await connectDB();
    
    // Create a test chatbot
    testChatbot = await Chatbot.create({
      name: 'Test Chatbot',
      description: 'A chatbot for testing personality API',
      engine: 'botpress',
      engineConfig: {
        botId: 'test-bot-id',
        apiKey: 'test-api-key'
      }
    });
  });

  // Clean up test database after running tests
  afterAll(async () => {
    await Chatbot.deleteMany({});
    await Personality.deleteMany({});
    await disconnectDB();
  });

  // Clean up test data after each test
  afterEach(async () => {
    await Personality.deleteMany({});
  });

  describe('POST /api/chatbots/:chatbotId/personalities', () => {
    it('should create a new personality', async () => {
      const personalityData = {
        name: 'Friendly Assistant',
        description: 'A friendly and helpful assistant',
        traits: {
          friendliness: 'high',
          formality: 'medium',
          humor: 'medium'
        },
        tone: 'warm and approachable',
        languageStyle: 'casual but professional'
      };

      const res = await request(app)
        .post(`/api/chatbots/${testChatbot._id}/personalities`)
        .send(personalityData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.name).toBe('Friendly Assistant');
      expect(res.body.data.chatbotId.toString()).toBe(testChatbot._id.toString());
    });

    it('should return 400 if name is missing', async () => {
      const personalityData = {
        description: 'A friendly and helpful assistant',
        traits: {
          friendliness: 'high',
          formality: 'medium'
        }
      };

      const res = await request(app)
        .post(`/api/chatbots/${testChatbot._id}/personalities`)
        .send(personalityData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Personality name is required');
    });
  });

  describe('GET /api/chatbots/:chatbotId/personalities', () => {
    it('should get all personalities for a chatbot', async () => {
      // Create test personalities
      await Personality.create([
        {
          name: 'Friendly Assistant',
          description: 'A friendly and helpful assistant',
          chatbotId: testChatbot._id,
          traits: { friendliness: 'high' }
        },
        {
          name: 'Professional Assistant',
          description: 'A professional and formal assistant',
          chatbotId: testChatbot._id,
          traits: { formality: 'high' }
        }
      ]);

      const res = await request(app)
        .get(`/api/chatbots/${testChatbot._id}/personalities`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[1]).toHaveProperty('name');
    });

    it('should return empty array if no personalities exist', async () => {
      const res = await request(app)
        .get(`/api/chatbots/${testChatbot._id}/personalities`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/personalities/:id', () => {
    it('should get a personality by ID', async () => {
      // Create test personality
      testPersonality = await Personality.create({
        name: 'Friendly Assistant',
        description: 'A friendly and helpful assistant',
        chatbotId: testChatbot._id,
        traits: { friendliness: 'high' }
      });

      const res = await request(app)
        .get(`/api/personalities/${testPersonality._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.name).toBe('Friendly Assistant');
    });

    it('should return 404 if personality not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/personalities/${fakeId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(`Personality with ID ${fakeId} not found`);
    });
  });

  describe('PUT /api/personalities/:id', () => {
    it('should update a personality', async () => {
      // Create test personality
      testPersonality = await Personality.create({
        name: 'Friendly Assistant',
        description: 'A friendly and helpful assistant',
        chatbotId: testChatbot._id,
        traits: { friendliness: 'high' }
      });

      const updateData = {
        name: 'Updated Assistant',
        description: 'An updated description',
        traits: {
          friendliness: 'medium',
          humor: 'high'
        }
      };

      const res = await request(app)
        .put(`/api/personalities/${testPersonality._id}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Assistant');
      expect(res.body.data.description).toBe('An updated description');
      expect(res.body.data.traits.friendliness).toBe('medium');
      expect(res.body.data.traits.humor).toBe('high');
    });

    it('should return 404 if personality not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .put(`/api/personalities/${fakeId}`)
        .send({ name: 'Updated Name' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(`Personality with ID ${fakeId} not found`);
    });
  });

  describe('DELETE /api/personalities/:id', () => {
    it('should delete a personality', async () => {
      // Create test personality
      testPersonality = await Personality.create({
        name: 'Friendly Assistant',
        description: 'A friendly and helpful assistant',
        chatbotId: testChatbot._id,
        traits: { friendliness: 'high' }
      });

      const res = await request(app)
        .delete(`/api/personalities/${testPersonality._id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(`Personality with ID ${testPersonality._id} successfully deleted`);

      // Verify personality is deleted
      const personality = await Personality.findById(testPersonality._id);
      expect(personality).toBeNull();
    });

    it('should return 404 if personality not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .delete(`/api/personalities/${fakeId}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(`Personality with ID ${fakeId} not found`);
    });
  });

  describe('POST /api/personalities/:id/default', () => {
    it('should set a personality as default', async () => {
      // Create test personality
      testPersonality = await Personality.create({
        name: 'Friendly Assistant',
        description: 'A friendly and helpful assistant',
        chatbotId: testChatbot._id,
        traits: { friendliness: 'high' }
      });

      const res = await request(app)
        .post(`/api/personalities/${testPersonality._id}/default`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isDefault).toBe(true);
    });

    it('should return 404 if personality not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .post(`/api/personalities/${fakeId}/default`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(`Personality with ID ${fakeId} not found`);
    });
  });

  describe('GET /api/personalities/:id/prompt-modifier', () => {
    it('should generate a prompt modifier for a personality', async () => {
      // Create test personality
      testPersonality = await Personality.create({
        name: 'Friendly Assistant',
        description: 'A friendly and helpful assistant',
        chatbotId: testChatbot._id,
        traits: { 
          friendliness: 'high',
          formality: 'low',
          humor: 'medium'
        },
        tone: 'warm and approachable',
        languageStyle: 'casual but professional'
      });

      const res = await request(app)
        .get(`/api/personalities/${testPersonality._id}/prompt-modifier`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('promptModifier');
      expect(res.body.data.personalityId).toBe(testPersonality._id.toString());
      expect(res.body.data.personalityName).toBe('Friendly Assistant');
      expect(typeof res.body.data.promptModifier).toBe('string');
    });

    it('should return 404 if personality not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/personalities/${fakeId}/prompt-modifier`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe(`Personality with ID ${fakeId} not found`);
    });
  });

  describe('POST /api/chatbots/:chatbotId/personalities/default', () => {
    it('should create a default personality for a chatbot', async () => {
      const res = await request(app)
        .post(`/api/chatbots/${testChatbot._id}/personalities/default`)
        .send({ name: 'Custom Default' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Custom Default');
      expect(res.body.data.isDefault).toBe(true);
      expect(res.body.data.chatbotId.toString()).toBe(testChatbot._id.toString());
    });

    it('should create a default personality with default name if name not provided', async () => {
      const res = await request(app)
        .post(`/api/chatbots/${testChatbot._id}/personalities/default`)
        .send({});

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Default');
      expect(res.body.data.isDefault).toBe(true);
    });
  });
});
