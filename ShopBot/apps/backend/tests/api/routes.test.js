const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');

// Mock Express app for testing
const app = express();
app.use(express.json());

// Mock routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  res.status(200).json({ 
    response: `Echo: ${message}`,
    timestamp: new Date().toISOString()
  });
});

describe('API Routes Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Health Check', () => {
    test('GET /api/health should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Chat Endpoint', () => {
    test('POST /api/chat should return echo response', async () => {
      const testMessage = 'Hello, world!';
      
      const response = await request(app)
        .post('/api/chat')
        .send({ message: testMessage })
        .expect(200);

      expect(response.body).toHaveProperty('response', `Echo: ${testMessage}`);
      expect(response.body).toHaveProperty('timestamp');
    });

    test('POST /api/chat should return 400 for missing message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Message is required');
    });
  });
});
