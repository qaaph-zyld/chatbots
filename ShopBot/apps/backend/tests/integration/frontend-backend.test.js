const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');

// Create integration test app simulating full frontend-backend flow
const app = express();
app.use(cors());
app.use(express.json());

// Mock session storage for integration testing
const sessions = new Map();

// Middleware to simulate frontend session handling
const sessionMiddleware = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId && sessions.has(sessionId)) {
    req.session = sessions.get(sessionId);
  } else {
    req.session = { id: Date.now().toString(), user: null };
    sessions.set(req.session.id, req.session);
    res.setHeader('x-session-id', req.session.id);
  }
  next();
};

app.use(sessionMiddleware);

// Integration endpoints simulating real application flow
app.post('/api/integration/onboard', (req, res) => {
  const { storeName, platform, apiCredentials, userEmail } = req.body;
  
  if (!storeName || !platform || !apiCredentials || !userEmail) {
    return res.status(400).json({ 
      error: 'Store name, platform, API credentials, and user email required' 
    });
  }

  // Simulate store creation and user onboarding
  const storeId = `store_${Date.now()}`;
  const userId = `user_${Date.now()}`;
  
  req.session.user = { id: userId, email: userEmail };
  req.session.store = { id: storeId, name: storeName, platform };
  
  res.status(201).json({
    success: true,
    store: {
      id: storeId,
      name: storeName,
      platform,
      status: 'active'
    },
    user: {
      id: userId,
      email: userEmail
    },
    sessionId: req.session.id
  });
});

app.post('/api/integration/chat', (req, res) => {
  const { message, context } = req.body;
  
  if (!req.session.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  if (!req.session.store) {
    return res.status(400).json({ error: 'No store associated with session' });
  }
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Simulate AI processing with store context
  const response = {
    id: `msg_${Date.now()}`,
    message: `AI Response for ${req.session.store.name}: ${message}`,
    context: {
      store: req.session.store,
      user: req.session.user,
      timestamp: new Date().toISOString(),
      ...context
    },
    suggestions: [
      'Check order status',
      'Update product information',
      'View analytics dashboard'
    ]
  };

  res.json(response);
});

app.get('/api/integration/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  if (!req.session.store) {
    return res.status(400).json({ error: 'No store associated with session' });
  }

  // Simulate dashboard data aggregation
  const dashboardData = {
    store: req.session.store,
    metrics: {
      totalOrders: Math.floor(Math.random() * 1000),
      totalRevenue: Math.floor(Math.random() * 50000),
      activeCustomers: Math.floor(Math.random() * 500),
      conversionRate: (Math.random() * 10).toFixed(2)
    },
    recentActivity: [
      { type: 'order', description: 'New order #12345', timestamp: new Date().toISOString() },
      { type: 'customer', description: 'New customer registered', timestamp: new Date().toISOString() },
      { type: 'product', description: 'Product updated', timestamp: new Date().toISOString() }
    ],
    alerts: [
      { level: 'info', message: 'Store sync completed successfully' },
      { level: 'warning', message: 'Low inventory on 3 products' }
    ]
  };

  res.json(dashboardData);
});

app.post('/api/integration/sync', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  if (!req.session.store) {
    return res.status(400).json({ error: 'No store associated with session' });
  }

  const { syncType = 'full' } = req.body;

  // Simulate platform sync process
  const syncResult = {
    syncId: `sync_${Date.now()}`,
    store: req.session.store,
    type: syncType,
    status: 'completed',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 5000).toISOString(),
    results: {
      products: { synced: 150, errors: 2 },
      orders: { synced: 45, errors: 0 },
      customers: { synced: 89, errors: 1 }
    }
  };

  res.json(syncResult);
});

app.get('/api/integration/session', (req, res) => {
  res.json({
    sessionId: req.session.id,
    user: req.session.user,
    store: req.session.store,
    isAuthenticated: !!req.session.user,
    hasStore: !!req.session.store
  });
});

app.delete('/api/integration/session', (req, res) => {
  if (req.session.id) {
    sessions.delete(req.session.id);
  }
  res.json({ message: 'Session cleared successfully' });
});

describe('Frontend-Backend Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    sessions.clear();
  });

  describe('User Onboarding Flow', () => {
    test('should complete full onboarding process', async () => {
      const onboardingData = {
        storeName: 'Test Integration Store',
        platform: 'shopify',
        apiCredentials: {
          api_key: 'test-key',
          api_secret: 'test-secret',
          shop_domain: 'test-shop.myshopify.com'
        },
        userEmail: 'integration@test.com'
      };

      const response = await request(app)
        .post('/api/integration/onboard')
        .send(onboardingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.store.name).toBe(onboardingData.storeName);
      expect(response.body.user.email).toBe(onboardingData.userEmail);
      expect(response.headers['x-session-id']).toBeDefined();
    });

    test('should validate required onboarding fields', async () => {
      const incompleteData = {
        storeName: 'Incomplete Store'
      };

      const response = await request(app)
        .post('/api/integration/onboard')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toContain('required');
    });
  });

  describe('Chat Integration Flow', () => {
    let sessionId;

    beforeEach(async () => {
      // Setup session with onboarding
      const onboardResponse = await request(app)
        .post('/api/integration/onboard')
        .send({
          storeName: 'Chat Test Store',
          platform: 'shopify',
          apiCredentials: { api_key: 'key', api_secret: 'secret' },
          userEmail: 'chat@test.com'
        });
      
      sessionId = onboardResponse.headers['x-session-id'];
    });

    test('should process chat message with session context', async () => {
      const chatMessage = {
        message: 'Help me with my recent orders',
        context: { page: 'dashboard', section: 'orders' }
      };

      const response = await request(app)
        .post('/api/integration/chat')
        .set('x-session-id', sessionId)
        .send(chatMessage)
        .expect(200);

      expect(response.body.message).toContain('Chat Test Store');
      expect(response.body.context.store.name).toBe('Chat Test Store');
      expect(response.body.suggestions).toBeDefined();
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });

    test('should reject chat without authentication', async () => {
      const response = await request(app)
        .post('/api/integration/chat')
        .send({ message: 'Hello' })
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });

    test('should require message in chat request', async () => {
      const response = await request(app)
        .post('/api/integration/chat')
        .set('x-session-id', sessionId)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Message is required');
    });
  });

  describe('Dashboard Integration Flow', () => {
    let sessionId;

    beforeEach(async () => {
      const onboardResponse = await request(app)
        .post('/api/integration/onboard')
        .send({
          storeName: 'Dashboard Test Store',
          platform: 'woocommerce',
          apiCredentials: { api_key: 'key', api_secret: 'secret' },
          userEmail: 'dashboard@test.com'
        });
      
      sessionId = onboardResponse.headers['x-session-id'];
    });

    test('should load dashboard with store metrics', async () => {
      const response = await request(app)
        .get('/api/integration/dashboard')
        .set('x-session-id', sessionId)
        .expect(200);

      expect(response.body.store.name).toBe('Dashboard Test Store');
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.totalOrders).toBeDefined();
      expect(response.body.recentActivity).toBeDefined();
      expect(Array.isArray(response.body.recentActivity)).toBe(true);
      expect(response.body.alerts).toBeDefined();
    });

    test('should require authentication for dashboard', async () => {
      const response = await request(app)
        .get('/api/integration/dashboard')
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });
  });

  describe('Platform Sync Integration Flow', () => {
    let sessionId;

    beforeEach(async () => {
      const onboardResponse = await request(app)
        .post('/api/integration/onboard')
        .send({
          storeName: 'Sync Test Store',
          platform: 'shopify',
          apiCredentials: { api_key: 'key', api_secret: 'secret' },
          userEmail: 'sync@test.com'
        });
      
      sessionId = onboardResponse.headers['x-session-id'];
    });

    test('should perform full platform sync', async () => {
      const response = await request(app)
        .post('/api/integration/sync')
        .set('x-session-id', sessionId)
        .send({ syncType: 'full' })
        .expect(200);

      expect(response.body.syncId).toBeDefined();
      expect(response.body.store.name).toBe('Sync Test Store');
      expect(response.body.status).toBe('completed');
      expect(response.body.results.products).toBeDefined();
      expect(response.body.results.orders).toBeDefined();
      expect(response.body.results.customers).toBeDefined();
    });

    test('should perform incremental sync', async () => {
      const response = await request(app)
        .post('/api/integration/sync')
        .set('x-session-id', sessionId)
        .send({ syncType: 'incremental' })
        .expect(200);

      expect(response.body.type).toBe('incremental');
      expect(response.body.status).toBe('completed');
    });

    test('should require authentication for sync', async () => {
      const response = await request(app)
        .post('/api/integration/sync')
        .send({ syncType: 'full' })
        .expect(401);

      expect(response.body.error).toBe('User not authenticated');
    });
  });

  describe('Session Management Integration', () => {
    test('should create and manage session state', async () => {
      // Create session through onboarding
      const onboardResponse = await request(app)
        .post('/api/integration/onboard')
        .send({
          storeName: 'Session Test Store',
          platform: 'shopify',
          apiCredentials: { api_key: 'key', api_secret: 'secret' },
          userEmail: 'session@test.com'
        });

      const sessionId = onboardResponse.headers['x-session-id'];

      // Check session state
      const sessionResponse = await request(app)
        .get('/api/integration/session')
        .set('x-session-id', sessionId)
        .expect(200);

      expect(sessionResponse.body.isAuthenticated).toBe(true);
      expect(sessionResponse.body.hasStore).toBe(true);
      expect(sessionResponse.body.user.email).toBe('session@test.com');
      expect(sessionResponse.body.store.name).toBe('Session Test Store');
    });

    test('should clear session data', async () => {
      // Create session
      const onboardResponse = await request(app)
        .post('/api/integration/onboard')
        .send({
          storeName: 'Clear Test Store',
          platform: 'shopify',
          apiCredentials: { api_key: 'key', api_secret: 'secret' },
          userEmail: 'clear@test.com'
        });

      const sessionId = onboardResponse.headers['x-session-id'];

      // Clear session
      await request(app)
        .delete('/api/integration/session')
        .set('x-session-id', sessionId)
        .expect(200);

      // Verify session is cleared
      const sessionResponse = await request(app)
        .get('/api/integration/session')
        .set('x-session-id', sessionId)
        .expect(200);

      expect(sessionResponse.body.isAuthenticated).toBe(false);
      expect(sessionResponse.body.hasStore).toBe(false);
    });
  });

  describe('End-to-End User Workflows', () => {
    test('should complete full user journey: onboard -> chat -> dashboard -> sync', async () => {
      // Step 1: Onboarding
      const onboardResponse = await request(app)
        .post('/api/integration/onboard')
        .send({
          storeName: 'E2E Test Store',
          platform: 'shopify',
          apiCredentials: { api_key: 'key', api_secret: 'secret' },
          userEmail: 'e2e@test.com'
        })
        .expect(201);

      const sessionId = onboardResponse.headers['x-session-id'];
      expect(onboardResponse.body.success).toBe(true);

      // Step 2: Chat interaction
      const chatResponse = await request(app)
        .post('/api/integration/chat')
        .set('x-session-id', sessionId)
        .send({
          message: 'Show me my store performance',
          context: { intent: 'analytics' }
        })
        .expect(200);

      expect(chatResponse.body.message).toContain('E2E Test Store');

      // Step 3: Dashboard access
      const dashboardResponse = await request(app)
        .get('/api/integration/dashboard')
        .set('x-session-id', sessionId)
        .expect(200);

      expect(dashboardResponse.body.store.name).toBe('E2E Test Store');
      expect(dashboardResponse.body.metrics).toBeDefined();

      // Step 4: Platform sync
      const syncResponse = await request(app)
        .post('/api/integration/sync')
        .set('x-session-id', sessionId)
        .send({ syncType: 'full' })
        .expect(200);

      expect(syncResponse.body.status).toBe('completed');
      expect(syncResponse.body.store.name).toBe('E2E Test Store');
    });

    test('should handle error propagation across integration points', async () => {
      // Attempt chat without onboarding
      const chatResponse = await request(app)
        .post('/api/integration/chat')
        .send({ message: 'Hello' })
        .expect(401);

      expect(chatResponse.body.error).toBe('User not authenticated');

      // Attempt dashboard without onboarding
      const dashboardResponse = await request(app)
        .get('/api/integration/dashboard')
        .expect(401);

      expect(dashboardResponse.body.error).toBe('User not authenticated');

      // Attempt sync without onboarding
      const syncResponse = await request(app)
        .post('/api/integration/sync')
        .send({ syncType: 'full' })
        .expect(401);

      expect(syncResponse.body.error).toBe('User not authenticated');
    });
  });
});
