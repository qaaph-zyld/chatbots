const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');

// Create comprehensive Express app for API testing
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || token !== 'Bearer valid-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = { id: 'user123', role: 'admin' };
  next();
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  if (email === 'test@example.com' && password === 'password123') {
    return res.status(200).json({ 
      token: 'valid-token',
      user: { id: 'user123', email, role: 'admin' }
    });
  }
  
  res.status(401).json({ error: 'Invalid credentials' });
});

// Protected store endpoints
app.get('/api/stores', mockAuth, (req, res) => {
  res.status(200).json({
    stores: [
      { id: '1', name: 'Test Store', platform: 'shopify' },
      { id: '2', name: 'Demo Store', platform: 'woocommerce' }
    ]
  });
});

app.post('/api/stores', mockAuth, (req, res) => {
  const { name, platform, api_credentials } = req.body;
  
  if (!name || !platform || !api_credentials) {
    return res.status(400).json({ 
      error: 'Name, platform, and API credentials required' 
    });
  }
  
  res.status(201).json({
    id: 'new-store-id',
    name,
    platform,
    created_at: new Date().toISOString()
  });
});

// Chat endpoint
app.post('/api/chat', (req, res) => {
  const { message, store_id } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  if (!store_id) {
    return res.status(400).json({ error: 'Store ID is required' });
  }
  
  res.status(200).json({
    response: `AI Response to: ${message}`,
    store_id,
    timestamp: new Date().toISOString()
  });
});

// Error handling endpoint
app.get('/api/error', (req, res) => {
  throw new Error('Test error');
});

// Error handling middleware
app.use((error, req, res, next) => {
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

describe('Comprehensive API Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Health Check API', () => {
    test('GET /api/health should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
    });
  });

  describe('Authentication API', () => {
    test('POST /api/auth/login should authenticate valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    test('POST /api/auth/login should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('POST /api/auth/login should require email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password required');
    });
  });

  describe('Store Management API', () => {
    test('GET /api/stores should require authentication', async () => {
      await request(app)
        .get('/api/stores')
        .expect(401);
    });

    test('GET /api/stores should return stores for authenticated user', async () => {
      const response = await request(app)
        .get('/api/stores')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body).toHaveProperty('stores');
      expect(Array.isArray(response.body.stores)).toBe(true);
    });

    test('POST /api/stores should create new store', async () => {
      const storeData = {
        name: 'New Test Store',
        platform: 'shopify',
        api_credentials: {
          api_key: 'test-key',
          api_secret: 'test-secret'
        }
      };

      const response = await request(app)
        .post('/api/stores')
        .set('Authorization', 'Bearer valid-token')
        .send(storeData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', storeData.name);
      expect(response.body).toHaveProperty('platform', storeData.platform);
    });

    test('POST /api/stores should validate required fields', async () => {
      const response = await request(app)
        .post('/api/stores')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Incomplete Store' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Chat API', () => {
    test('POST /api/chat should process chat message', async () => {
      const chatData = {
        message: 'Hello, I need help with my order',
        store_id: 'store123'
      };

      const response = await request(app)
        .post('/api/chat')
        .send(chatData)
        .expect(200);

      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('store_id', chatData.store_id);
      expect(response.body).toHaveProperty('timestamp');
    });

    test('POST /api/chat should require message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ store_id: 'store123' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Message is required');
    });

    test('POST /api/chat should require store_id', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Store ID is required');
    });
  });

  describe('Error Handling', () => {
    test('should handle server errors gracefully', async () => {
      const response = await request(app)
        .get('/api/error')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
      expect(response.body).toHaveProperty('message');
    });

    test('should handle 404 for non-existent endpoints', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });
  });
});
