const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');

// Import models (assuming they exist in models directory)
const Store = require('../../models/Store');

describe('Database Model Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Store Model', () => {
    test('should create a valid store', async () => {
      const storeData = {
        name: 'Test Store',
        platform: 'shopify',
        api_credentials: {
          api_key: 'test-key',
          api_secret: 'test-secret',
          shop_domain: 'test-shop.myshopify.com'
        },
        settings: {
          auto_sync: true,
          sync_frequency: 'hourly',
          notification_email: 'admin@teststore.com'
        }
      };

      const store = new Store(storeData);
      const savedStore = await store.save();

      expect(savedStore._id).toBeDefined();
      expect(savedStore.name).toBe(storeData.name);
      expect(savedStore.platform).toBe(storeData.platform);
      expect(savedStore.api_credentials.api_key).toBe(storeData.api_credentials.api_key);
      expect(savedStore.settings.auto_sync).toBe(true);
      expect(savedStore.created_at).toBeDefined();
    });

    test('should require name field', async () => {
      const storeData = {
        platform: 'shopify',
        api_credentials: {
          api_key: 'test-key',
          api_secret: 'test-secret'
        }
      };

      const store = new Store(storeData);
      
      await expect(store.save()).rejects.toThrow();
    });

    test('should require platform field', async () => {
      const storeData = {
        name: 'Test Store',
        api_credentials: {
          api_key: 'test-key',
          api_secret: 'test-secret'
        }
      };

      const store = new Store(storeData);
      
      await expect(store.save()).rejects.toThrow();
    });

    test('should require api_credentials field', async () => {
      const storeData = {
        name: 'Test Store',
        platform: 'shopify'
      };

      const store = new Store(storeData);
      
      await expect(store.save()).rejects.toThrow();
    });

    test('should validate platform enum values', async () => {
      const storeData = {
        name: 'Test Store',
        platform: 'invalid-platform',
        api_credentials: {
          api_key: 'test-key',
          api_secret: 'test-secret'
        }
      };

      const store = new Store(storeData);
      
      await expect(store.save()).rejects.toThrow();
    });

    test('should set default values correctly', async () => {
      const storeData = {
        name: 'Test Store',
        platform: 'shopify',
        api_credentials: {
          api_key: 'test-key',
          api_secret: 'test-secret'
        }
      };

      const store = new Store(storeData);
      const savedStore = await store.save();

      expect(savedStore.settings.auto_sync).toBe(true);
      expect(savedStore.settings.sync_frequency).toBe('daily');
      expect(savedStore.is_active).toBe(true);
      expect(savedStore.escalation_rules.max_attempts).toBe(3);
      expect(savedStore.escalation_rules.escalate_after_minutes).toBe(30);
    });

    test('should find stores by platform', async () => {
      const shopifyStore = new Store({
        name: 'Shopify Store',
        platform: 'shopify',
        api_credentials: { api_key: 'key1', api_secret: 'secret1' }
      });

      const wooStore = new Store({
        name: 'WooCommerce Store',
        platform: 'woocommerce',
        api_credentials: { api_key: 'key2', api_secret: 'secret2' }
      });

      await shopifyStore.save();
      await wooStore.save();

      const shopifyStores = await Store.find({ platform: 'shopify' });
      expect(shopifyStores).toHaveLength(1);
      expect(shopifyStores[0].name).toBe('Shopify Store');
    });

    test('should update store settings', async () => {
      const store = new Store({
        name: 'Test Store',
        platform: 'shopify',
        api_credentials: { api_key: 'key', api_secret: 'secret' }
      });

      const savedStore = await store.save();
      
      savedStore.settings.sync_frequency = 'hourly';
      savedStore.settings.notification_email = 'new@email.com';
      
      const updatedStore = await savedStore.save();
      
      expect(updatedStore.settings.sync_frequency).toBe('hourly');
      expect(updatedStore.settings.notification_email).toBe('new@email.com');
    });

    test('should soft delete store', async () => {
      const store = new Store({
        name: 'Test Store',
        platform: 'shopify',
        api_credentials: { api_key: 'key', api_secret: 'secret' }
      });

      const savedStore = await store.save();
      
      savedStore.is_active = false;
      savedStore.deleted_at = new Date();
      
      const deletedStore = await savedStore.save();
      
      expect(deletedStore.is_active).toBe(false);
      expect(deletedStore.deleted_at).toBeDefined();
    });
  });

  describe('Database Connection Tests', () => {
    test('should maintain database connection', () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });

    test('should handle database operations', async () => {
      const collections = await mongoose.connection.db.listCollections().toArray();
      expect(Array.isArray(collections)).toBe(true);
    });
  });

  describe('Database Performance Tests', () => {
    test('should create multiple stores efficiently', async () => {
      const startTime = Date.now();
      
      const stores = [];
      for (let i = 0; i < 10; i++) {
        stores.push({
          name: `Store ${i}`,
          platform: 'shopify',
          api_credentials: { api_key: `key${i}`, api_secret: `secret${i}` }
        });
      }

      await Store.insertMany(stores);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
      
      const count = await Store.countDocuments();
      expect(count).toBe(10);
    });

    test('should query stores efficiently', async () => {
      // Create test data
      const stores = [];
      for (let i = 0; i < 50; i++) {
        stores.push({
          name: `Store ${i}`,
          platform: i % 2 === 0 ? 'shopify' : 'woocommerce',
          api_credentials: { api_key: `key${i}`, api_secret: `secret${i}` }
        });
      }

      await Store.insertMany(stores);

      const startTime = Date.now();
      const shopifyStores = await Store.find({ platform: 'shopify' });
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(shopifyStores.length).toBe(25);
    });
  });
});
