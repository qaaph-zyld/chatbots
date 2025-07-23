const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');

// Create Express app for performance testing
const app = express();
app.use(express.json());

// Mock data store for performance testing
const mockProducts = [];
const mockOrders = [];
const mockUsers = [];

// Generate mock data
const generateMockData = () => {
  // Generate 1000 mock products
  for (let i = 0; i < 1000; i++) {
    mockProducts.push({
      id: `prod_${i}`,
      name: `Product ${i}`,
      price: Math.floor(Math.random() * 1000) + 10,
      category: `Category ${i % 10}`,
      stock: Math.floor(Math.random() * 100),
      description: `Description for product ${i}`.repeat(5),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    });
  }

  // Generate 500 mock orders
  for (let i = 0; i < 500; i++) {
    mockOrders.push({
      id: `order_${i}`,
      user_id: `user_${i % 100}`,
      products: mockProducts.slice(i % 10, (i % 10) + 3),
      total: Math.floor(Math.random() * 5000) + 100,
      status: ['pending', 'processing', 'shipped', 'delivered'][i % 4],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    });
  }

  // Generate 100 mock users
  for (let i = 0; i < 100; i++) {
    mockUsers.push({
      id: `user_${i}`,
      email: `user${i}@test.com`,
      name: `User ${i}`,
      orders: mockOrders.filter(order => order.user_id === `user_${i}`),
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    });
  }
};

generateMockData();

// Performance test endpoints
app.get('/api/performance/products', (req, res) => {
  const { page = 1, limit = 20, category, search } = req.query;
  const startTime = Date.now();
  
  let filteredProducts = mockProducts;
  
  // Apply category filter
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category === category);
  }
  
  // Apply search filter
  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
  
  const processingTime = Date.now() - startTime;
  
  res.json({
    products: paginatedProducts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredProducts.length,
      pages: Math.ceil(filteredProducts.length / limit)
    },
    performance: {
      processing_time_ms: processingTime,
      total_products: mockProducts.length,
      filtered_products: filteredProducts.length
    }
  });
});

app.get('/api/performance/orders', (req, res) => {
  const { user_id, status, page = 1, limit = 10 } = req.query;
  const startTime = Date.now();
  
  let filteredOrders = mockOrders;
  
  if (user_id) {
    filteredOrders = filteredOrders.filter(o => o.user_id === user_id);
  }
  
  if (status) {
    filteredOrders = filteredOrders.filter(o => o.status === status);
  }
  
  // Sort by created_at descending
  filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
  
  const processingTime = Date.now() - startTime;
  
  res.json({
    orders: paginatedOrders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredOrders.length,
      pages: Math.ceil(filteredOrders.length / limit)
    },
    performance: {
      processing_time_ms: processingTime
    }
  });
});

app.get('/api/performance/analytics', (req, res) => {
  const startTime = Date.now();
  
  // Simulate complex analytics calculations
  const analytics = {
    total_products: mockProducts.length,
    total_orders: mockOrders.length,
    total_users: mockUsers.length,
    total_revenue: mockOrders.reduce((sum, order) => sum + order.total, 0),
    average_order_value: mockOrders.reduce((sum, order) => sum + order.total, 0) / mockOrders.length,
    orders_by_status: mockOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {}),
    top_categories: mockProducts.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {}),
    monthly_revenue: mockOrders.reduce((acc, order) => {
      const month = new Date(order.created_at).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + order.total;
      return acc;
    }, {})
  };
  
  const processingTime = Date.now() - startTime;
  
  res.json({
    analytics,
    performance: {
      processing_time_ms: processingTime,
      data_points_processed: mockProducts.length + mockOrders.length + mockUsers.length
    }
  });
});

app.post('/api/performance/bulk-create', (req, res) => {
  const { items, type } = req.body;
  const startTime = Date.now();
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array required' });
  }
  
  if (items.length > 1000) {
    return res.status(400).json({ error: 'Maximum 1000 items per bulk operation' });
  }
  
  // Simulate bulk creation processing
  const results = items.map((item, index) => ({
    id: `${type}_${Date.now()}_${index}`,
    ...item,
    created_at: new Date().toISOString(),
    processed: true
  }));
  
  const processingTime = Date.now() - startTime;
  
  res.json({
    created: results.length,
    items: results,
    performance: {
      processing_time_ms: processingTime,
      items_per_second: Math.round(results.length / (processingTime / 1000))
    }
  });
});

// Memory usage endpoint
app.get('/api/performance/memory', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`,
      arrayBuffers: `${Math.round(memoryUsage.arrayBuffers / 1024 / 1024)} MB`
    },
    uptime: `${Math.round(process.uptime())} seconds`
  });
});

// CPU intensive endpoint for stress testing
app.post('/api/performance/cpu-intensive', (req, res) => {
  const { iterations = 1000000 } = req.body;
  const startTime = Date.now();
  
  // Simulate CPU intensive task
  let result = 0;
  for (let i = 0; i < iterations; i++) {
    result += Math.sqrt(i) * Math.random();
  }
  
  const processingTime = Date.now() - startTime;
  
  res.json({
    result: Math.round(result),
    iterations,
    performance: {
      processing_time_ms: processingTime,
      iterations_per_second: Math.round(iterations / (processingTime / 1000))
    }
  });
});

describe('Performance Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('API Response Time Tests', () => {
    test('products endpoint should respond within 200ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/performance/products')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(200);
      expect(response.body.products).toBeDefined();
      expect(response.body.performance.processing_time_ms).toBeLessThan(100);
    });

    test('orders endpoint should respond within 200ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/performance/orders')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(200);
      expect(response.body.orders).toBeDefined();
      expect(response.body.performance.processing_time_ms).toBeLessThan(100);
    });

    test('analytics endpoint should respond within 500ms', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/performance/analytics')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(500);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.performance.processing_time_ms).toBeLessThan(300);
    });
  });

  describe('Load Testing', () => {
    test('should handle 50 concurrent requests to products endpoint', async () => {
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .get('/api/performance/products')
            .query({ page: (i % 10) + 1 })
        );
      }
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Total time should be reasonable (under 5 seconds for 50 requests)
      expect(totalTime).toBeLessThan(5000);
      
      // Average response time should be acceptable
      const avgResponseTime = totalTime / responses.length;
      expect(avgResponseTime).toBeLessThan(500);
    });

    test('should handle 20 concurrent analytics requests', async () => {
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app).get('/api/performance/analytics')
        );
      }
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.analytics).toBeDefined();
      });
      
      expect(totalTime).toBeLessThan(10000); // 10 seconds max for 20 analytics requests
    });
  });

  describe('Database Performance Tests', () => {
    test('should handle large dataset queries efficiently', async () => {
      // Test with large page size
      const response = await request(app)
        .get('/api/performance/products')
        .query({ limit: 100 })
        .expect(200);
      
      expect(response.body.products).toHaveLength(100);
      expect(response.body.performance.processing_time_ms).toBeLessThan(150);
    });

    test('should handle complex filtering efficiently', async () => {
      const response = await request(app)
        .get('/api/performance/products')
        .query({ 
          category: 'Category 1',
          search: 'Product',
          limit: 50
        })
        .expect(200);
      
      expect(response.body.performance.processing_time_ms).toBeLessThan(200);
      expect(response.body.products.length).toBeGreaterThan(0);
    });

    test('should handle sorting and pagination efficiently', async () => {
      const response = await request(app)
        .get('/api/performance/orders')
        .query({ 
          status: 'delivered',
          page: 5,
          limit: 20
        })
        .expect(200);
      
      expect(response.body.performance.processing_time_ms).toBeLessThan(100);
      expect(response.body.pagination).toBeDefined();
    });
  });

  describe('Bulk Operations Performance', () => {
    test('should handle bulk creation of 100 items efficiently', async () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        name: `Bulk Item ${i}`,
        value: i * 10
      }));
      
      const response = await request(app)
        .post('/api/performance/bulk-create')
        .send({ items, type: 'product' })
        .expect(200);
      
      expect(response.body.created).toBe(100);
      expect(response.body.performance.processing_time_ms).toBeLessThan(1000);
      expect(response.body.performance.items_per_second).toBeGreaterThan(50);
    });

    test('should handle bulk creation of 500 items efficiently', async () => {
      const items = Array.from({ length: 500 }, (_, i) => ({
        name: `Bulk Item ${i}`,
        value: i * 10
      }));
      
      const response = await request(app)
        .post('/api/performance/bulk-create')
        .send({ items, type: 'order' })
        .expect(200);
      
      expect(response.body.created).toBe(500);
      expect(response.body.performance.processing_time_ms).toBeLessThan(3000);
      expect(response.body.performance.items_per_second).toBeGreaterThan(100);
    });

    test('should reject bulk operations exceeding limits', async () => {
      const items = Array.from({ length: 1001 }, (_, i) => ({
        name: `Item ${i}`
      }));
      
      const response = await request(app)
        .post('/api/performance/bulk-create')
        .send({ items, type: 'product' })
        .expect(400);
      
      expect(response.body.error).toBe('Maximum 1000 items per bulk operation');
    });
  });

  describe('Memory Usage Tests', () => {
    test('should report memory usage', async () => {
      const response = await request(app)
        .get('/api/performance/memory')
        .expect(200);
      
      expect(response.body.memory.rss).toBeDefined();
      expect(response.body.memory.heapTotal).toBeDefined();
      expect(response.body.memory.heapUsed).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    test('should maintain reasonable memory usage under load', async () => {
      // Get initial memory usage
      const initialResponse = await request(app)
        .get('/api/performance/memory');
      const initialHeapUsed = parseInt(initialResponse.body.memory.heapUsed);
      
      // Perform multiple operations
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app).get('/api/performance/products'),
          request(app).get('/api/performance/orders'),
          request(app).get('/api/performance/analytics')
        );
      }
      
      await Promise.all(promises);
      
      // Check memory usage after load
      const finalResponse = await request(app)
        .get('/api/performance/memory');
      const finalHeapUsed = parseInt(finalResponse.body.memory.heapUsed);
      
      // Memory increase should be reasonable (less than 50MB)
      const memoryIncrease = finalHeapUsed - initialHeapUsed;
      expect(memoryIncrease).toBeLessThan(50);
    });
  });

  describe('CPU Performance Tests', () => {
    test('should handle CPU intensive tasks efficiently', async () => {
      const response = await request(app)
        .post('/api/performance/cpu-intensive')
        .send({ iterations: 100000 })
        .expect(200);
      
      expect(response.body.iterations).toBe(100000);
      expect(response.body.performance.processing_time_ms).toBeLessThan(1000);
      expect(response.body.performance.iterations_per_second).toBeGreaterThan(50000);
    });

    test('should handle multiple CPU intensive requests', async () => {
      const promises = [];
      const startTime = Date.now();
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/api/performance/cpu-intensive')
            .send({ iterations: 50000 })
        );
      }
      
      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.iterations).toBe(50000);
      });
      
      // Should complete all 5 requests in reasonable time
      expect(totalTime).toBeLessThan(5000);
    });
  });

  describe('Stress Testing', () => {
    test('should maintain performance under sustained load', async () => {
      const testDuration = 10000; // 10 seconds
      const requestInterval = 100; // Request every 100ms
      const startTime = Date.now();
      const responses = [];
      
      while (Date.now() - startTime < testDuration) {
        const response = await request(app)
          .get('/api/performance/products')
          .query({ page: Math.floor(Math.random() * 10) + 1 });
        
        responses.push(response);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }
      
      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      // Should have made multiple requests
      expect(responses.length).toBeGreaterThan(50);
      
      // Average response time should remain acceptable
      const avgProcessingTime = responses.reduce((sum, r) => 
        sum + r.body.performance.processing_time_ms, 0) / responses.length;
      expect(avgProcessingTime).toBeLessThan(150);
    });
  });
});
