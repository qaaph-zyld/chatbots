const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');
const Store = require('../../models/Store');
const Conversation = require('../../models/Conversation');

describe('Conversation Model Tests', () => {
  let testStore;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create a test store for conversations
    testStore = await new Store({
      name: 'Test Store',
      platform: 'shopify',
      api_credentials: { api_key: 'test_key' }
    }).save();
  });

  describe('Conversation Creation', () => {
    test('should create a valid conversation', async () => {
      const conversationData = {
        store_id: testStore._id,
        customer_id: 'customer_123',
        session_id: 'session_456',
        status: 'active',
        metadata: { source: 'website' }
      };

      const conversation = new Conversation(conversationData);
      const savedConversation = await conversation.save();

      expect(savedConversation._id).toBeDefined();
      expect(savedConversation.store_id.toString()).toBe(testStore._id.toString());
      expect(savedConversation.customer_id).toBe(conversationData.customer_id);
      expect(savedConversation.session_id).toBe(conversationData.session_id);
      expect(savedConversation.status).toBe('active');
      expect(savedConversation.createdAt).toBeDefined();
    });

    test('should set default status to active', async () => {
      const conversation = new Conversation({
        store_id: testStore._id,
        customer_id: 'customer_123',
        session_id: 'session_456'
      });

      const savedConversation = await conversation.save();
      expect(savedConversation.status).toBe('active');
    });

    test('should fail without required fields', async () => {
      const conversation = new Conversation({});
      await expect(conversation.save()).rejects.toThrow();
    });
  });

  describe('Conversation Status Management', () => {
    test('should validate status enum values', async () => {
      const conversation = new Conversation({
        store_id: testStore._id,
        customer_id: 'customer_123',
        session_id: 'session_456',
        status: 'invalid_status'
      });

      await expect(conversation.save()).rejects.toThrow();
    });

    test('should allow valid status values', async () => {
      const validStatuses = ['active', 'completed', 'abandoned'];
      
      for (const status of validStatuses) {
        const conversation = new Conversation({
          store_id: testStore._id,
          customer_id: `customer_${status}`,
          session_id: `session_${status}`,
          status: status
        });

        const saved = await conversation.save();
        expect(saved.status).toBe(status);
      }
    });
  });

  describe('Conversation Queries', () => {
    beforeEach(async () => {
      const conversations = [
        {
          store_id: testStore._id,
          customer_id: 'customer_1',
          session_id: 'session_1',
          status: 'active'
        },
        {
          store_id: testStore._id,
          customer_id: 'customer_2',
          session_id: 'session_2',
          status: 'completed'
        },
        {
          store_id: testStore._id,
          customer_id: 'customer_1',
          session_id: 'session_3',
          status: 'abandoned'
        }
      ];

      await Conversation.insertMany(conversations);
    });

    test('should find conversations by store', async () => {
      const conversations = await Conversation.find({ store_id: testStore._id });
      expect(conversations).toHaveLength(3);
    });

    test('should find conversations by customer', async () => {
      const conversations = await Conversation.find({ customer_id: 'customer_1' });
      expect(conversations).toHaveLength(2);
    });

    test('should find active conversations', async () => {
      const activeConversations = await Conversation.find({ status: 'active' });
      expect(activeConversations).toHaveLength(1);
    });

    test('should populate store information', async () => {
      const conversation = await Conversation.findOne({ customer_id: 'customer_1' })
        .populate('store_id');
      
      expect(conversation.store_id.name).toBe('Test Store');
      expect(conversation.store_id.platform).toBe('shopify');
    });
  });
});
