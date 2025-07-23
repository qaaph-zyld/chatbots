const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');
const Store = require('../../models/Store');

describe('Store Model Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Store Creation', () => {
    test('should create a valid store', async () => {
      const storeData = {
        name: 'Test Store',
        platform: 'shopify',
        api_credentials: {
          api_key: 'test_key',
          api_secret: 'test_secret',
          shop_domain: 'test-shop.myshopify.com'
        },
        settings: {
          business_hours: { start: '09:00', end: '17:00' },
          auto_responses: true
        }
      };

      const store = new Store(storeData);
      const savedStore = await store.save();

      expect(savedStore._id).toBeDefined();
      expect(savedStore.name).toBe(storeData.name);
      expect(savedStore.platform).toBe(storeData.platform);
      expect(savedStore.api_credentials).toEqual(storeData.api_credentials);
      expect(savedStore.createdAt).toBeDefined();
      expect(savedStore.updatedAt).toBeDefined();
    });

    test('should fail to create store without required fields', async () => {
      const store = new Store({});
      
      await expect(store.save()).rejects.toThrow();
    });

    test('should enforce unique store names', async () => {
      const storeData = {
        name: 'Unique Store',
        platform: 'shopify',
        api_credentials: { api_key: 'key1' }
      };

      await new Store(storeData).save();
      
      const duplicateStore = new Store(storeData);
      await expect(duplicateStore.save()).rejects.toThrow();
    });
  });

  describe('Store Validation', () => {
    test('should validate platform enum', async () => {
      const store = new Store({
        name: 'Test Store',
        platform: 'invalid_platform',
        api_credentials: { api_key: 'test' }
      });

      await expect(store.save()).rejects.toThrow();
    });

    test('should require api_credentials', async () => {
      const store = new Store({
        name: 'Test Store',
        platform: 'shopify'
      });

      await expect(store.save()).rejects.toThrow();
    });
  });

  describe('Store Queries', () => {
    beforeEach(async () => {
      const stores = [
        { name: 'Store 1', platform: 'shopify', api_credentials: { key: '1' } },
        { name: 'Store 2', platform: 'woocommerce', api_credentials: { key: '2' } },
        { name: 'Store 3', platform: 'shopify', api_credentials: { key: '3' } }
      ];

      await Store.insertMany(stores);
    });

    test('should find stores by platform', async () => {
      const shopifyStores = await Store.find({ platform: 'shopify' });
      expect(shopifyStores).toHaveLength(2);
    });

    test('should find store by name', async () => {
      const store = await Store.findOne({ name: 'Store 1' });
      expect(store).toBeTruthy();
      expect(store.platform).toBe('shopify');
    });
  });
});
