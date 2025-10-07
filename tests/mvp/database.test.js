/**
 * Simple Database Tests
 */

const SimpleDB = require('../../src/mvp/database/SimpleDB');
const fs = require('fs');
const path = require('path');

describe('Simple Database', () => {
  let db;
  const testDataDir = './test-data';

  beforeEach(() => {
    // Clean up test data directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true });
    }
    db = new SimpleDB(testDataDir);
  });

  afterEach(() => {
    // Clean up test data directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true });
    }
  });

  test('creates data directory if it does not exist', () => {
    expect(fs.existsSync(testDataDir)).toBe(true);
  });

  test('inserts document into collection', () => {
    const doc = { name: 'Test Product', price: 99.99 };
    const result = db.insert('products', doc);
    
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Product');
    expect(result.price).toBe(99.99);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  test('finds all documents in collection', () => {
    db.insert('products', { name: 'Product 1', price: 10 });
    db.insert('products', { name: 'Product 2', price: 20 });
    
    const results = db.find('products');
    
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Product 1');
    expect(results[1].name).toBe('Product 2');
  });

  test('finds documents with query', () => {
    db.insert('products', { name: 'Laptop', category: 'Electronics', price: 999 });
    db.insert('products', { name: 'Book', category: 'Books', price: 15 });
    db.insert('products', { name: 'Phone', category: 'Electronics', price: 599 });
    
    const electronics = db.find('products', { category: 'Electronics' });
    
    expect(electronics).toHaveLength(2);
    expect(electronics.every(p => p.category === 'Electronics')).toBe(true);
  });

  test('finds documents with regex query', () => {
    db.insert('products', { name: 'MacBook Pro', category: 'Electronics' });
    db.insert('products', { name: 'MacBook Air', category: 'Electronics' });
    db.insert('products', { name: 'iPad', category: 'Electronics' });
    
    const macbooks = db.find('products', { 
      name: { $regex: 'macbook', $options: 'i' }
    });
    
    expect(macbooks).toHaveLength(2);
    expect(macbooks.every(p => p.name.toLowerCase().includes('macbook'))).toBe(true);
  });

  test('finds one document', () => {
    db.insert('products', { name: 'Product 1', price: 10 });
    db.insert('products', { name: 'Product 2', price: 20 });
    
    const result = db.findOne('products', { name: 'Product 1' });
    
    expect(result).toBeDefined();
    expect(result.name).toBe('Product 1');
    expect(result.price).toBe(10);
  });

  test('finds document by ID', () => {
    const inserted = db.insert('products', { name: 'Test Product' });
    const found = db.findById('products', inserted.id);
    
    expect(found).toBeDefined();
    expect(found.id).toBe(inserted.id);
    expect(found.name).toBe('Test Product');
  });

  test('updates document', () => {
    db.insert('products', { name: 'Old Name', price: 10 });
    
    const updated = db.update('products', { name: 'Old Name' }, { name: 'New Name', price: 15 });
    
    expect(updated).toBeDefined();
    expect(updated.name).toBe('New Name');
    expect(updated.price).toBe(15);
    expect(updated.updatedAt).toBeDefined();
  });

  test('updates document by ID', () => {
    const inserted = db.insert('products', { name: 'Test Product', price: 10 });
    
    const updated = db.updateById('products', inserted.id, { price: 20 });
    
    expect(updated).toBeDefined();
    expect(updated.price).toBe(20);
    expect(updated.name).toBe('Test Product'); // Should preserve other fields
  });

  test('deletes documents', () => {
    db.insert('products', { name: 'Product 1', category: 'A' });
    db.insert('products', { name: 'Product 2', category: 'B' });
    db.insert('products', { name: 'Product 3', category: 'A' });
    
    const deletedCount = db.delete('products', { category: 'A' });
    
    expect(deletedCount).toBe(2);
    
    const remaining = db.find('products');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].category).toBe('B');
  });

  test('deletes document by ID', () => {
    const inserted = db.insert('products', { name: 'Test Product' });
    
    const deletedCount = db.deleteById('products', inserted.id);
    
    expect(deletedCount).toBe(1);
    
    const found = db.findById('products', inserted.id);
    expect(found).toBeNull();
  });

  test('counts documents', () => {
    db.insert('products', { category: 'A' });
    db.insert('products', { category: 'B' });
    db.insert('products', { category: 'A' });
    
    const totalCount = db.count('products');
    const categoryACount = db.count('products', { category: 'A' });
    
    expect(totalCount).toBe(3);
    expect(categoryACount).toBe(2);
  });

  test('clears collection', () => {
    db.insert('products', { name: 'Product 1' });
    db.insert('products', { name: 'Product 2' });
    
    const cleared = db.clear('products');
    
    expect(cleared).toBe(true);
    
    const count = db.count('products');
    expect(count).toBe(0);
  });

  test('gets collection names', () => {
    db.insert('products', { name: 'Product' });
    db.insert('users', { name: 'User' });
    db.insert('orders', { total: 100 });
    
    const collections = db.getCollections();
    
    expect(collections).toContain('products');
    expect(collections).toContain('users');
    expect(collections).toContain('orders');
    expect(collections).toHaveLength(3);
  });

  test('gets database statistics', () => {
    db.insert('products', { name: 'Product 1' });
    db.insert('products', { name: 'Product 2' });
    db.insert('users', { name: 'User 1' });
    
    const stats = db.getStats();
    
    expect(stats.collections).toBe(2);
    expect(stats.documents).toBe(3);
    expect(stats.size).toBeGreaterThan(0);
  });

  test('generates unique IDs', () => {
    const id1 = db.generateId();
    const id2 = db.generateId();
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });

  test('handles empty collection gracefully', () => {
    const results = db.find('nonexistent');
    const count = db.count('nonexistent');
    const findOne = db.findOne('nonexistent', { id: 'test' });
    
    expect(results).toEqual([]);
    expect(count).toBe(0);
    expect(findOne).toBeNull();
  });

  test('persists data to file system', () => {
    const doc = { name: 'Persistent Product', price: 50 };
    db.insert('products', doc);
    
    // Create new database instance with same data directory
    const db2 = new SimpleDB(testDataDir);
    const results = db2.find('products');
    
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Persistent Product');
    expect(results[0].price).toBe(50);
  });
});
