/**
 * Local Storage Service Unit Tests
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { v4: uuidv4 } = require('uuid');

// Mock the logger to prevent console output during tests
jest.mock('../../../utils', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('Local Storage Service', () => {
  let localStorageService;
  let tempDir;
  
  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `chatbot-test-${uuidv4()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    // Reset modules to ensure clean state for each test
    jest.resetModules();
    
    // Set environment variables for testing
    process.env.LOCAL_STORAGE_PATH = tempDir;
    process.env.SQLITE_DB_PATH = path.join(tempDir, 'test.db');
    
    // Import the service after setting environment variables
    localStorageService = require('../../../storage/local-storage.service');
  });
  
  afterEach(async () => {
    // Close the storage connection if it exists
    if (localStorageService && typeof localStorageService.close === 'function') {
      await localStorageService.close();
    }
    
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  });
  
  describe('File Storage', () => {
    beforeEach(async () => {
      process.env.LOCAL_STORAGE_TYPE = 'file';
      await localStorageService.initialize();
    });
    
    test('should initialize successfully', async () => {
      const initialized = await localStorageService.initialize();
      expect(initialized).toBe(true);
      
      // Check if directories were created
      const subdirs = ['conversations', 'users', 'bots', 'messages', 'settings'];
      for (const subdir of subdirs) {
        const dirPath = path.join(tempDir, subdir);
        const stats = await fs.stat(dirPath);
        expect(stats.isDirectory()).toBe(true);
      }
    });
    
    test('should store and retrieve data', async () => {
      const testId = 'test-user-123';
      const testData = {
        name: 'Test User',
        email: 'test@example.com'
      };
      
      // Store data
      const storedData = await localStorageService.store('users', testId, testData);
      expect(storedData.id).toBe(testId);
      expect(storedData.name).toBe(testData.name);
      expect(storedData.email).toBe(testData.email);
      expect(storedData.created_at).toBeDefined();
      expect(storedData.updated_at).toBeDefined();
      
      // Retrieve data
      const retrievedData = await localStorageService.retrieve('users', testId);
      expect(retrievedData).toEqual(storedData);
    });
    
    test('should generate ID if not provided', async () => {
      const testData = {
        name: 'Auto ID User',
        email: 'auto@example.com'
      };
      
      // Store data without ID
      const storedData = await localStorageService.store('users', null, testData);
      expect(storedData.id).toBeDefined();
      expect(storedData.name).toBe(testData.name);
      
      // Retrieve data with generated ID
      const retrievedData = await localStorageService.retrieve('users', storedData.id);
      expect(retrievedData).toEqual(storedData);
    });
    
    test('should query data', async () => {
      // Store multiple items
      await localStorageService.store('users', 'user1', { name: 'User One', role: 'admin' });
      await localStorageService.store('users', 'user2', { name: 'User Two', role: 'user' });
      await localStorageService.store('users', 'user3', { name: 'User Three', role: 'admin' });
      
      // Query by exact match
      const adminUsers = await localStorageService.query('users', { role: 'admin' });
      expect(adminUsers.length).toBe(2);
      expect(adminUsers.map(u => u.id).sort()).toEqual(['user1', 'user3'].sort());
      
      // Query with limit
      const limitedUsers = await localStorageService.query('users', {}, { limit: 2 });
      expect(limitedUsers.length).toBe(2);
    });
    
    test('should delete data', async () => {
      const testId = 'delete-test-user';
      
      // Store data
      await localStorageService.store('users', testId, { name: 'Delete Test' });
      
      // Verify it exists
      const beforeDelete = await localStorageService.retrieve('users', testId);
      expect(beforeDelete).not.toBeNull();
      
      // Delete data
      const deleteResult = await localStorageService.delete('users', testId);
      expect(deleteResult).toBe(true);
      
      // Verify it's gone
      const afterDelete = await localStorageService.retrieve('users', testId);
      expect(afterDelete).toBeNull();
    });
  });
  
  describe('SQLite Storage', () => {
    beforeEach(async () => {
      process.env.LOCAL_STORAGE_TYPE = 'sqlite';
      await localStorageService.initialize();
    });
    
    test('should initialize successfully', async () => {
      const initialized = await localStorageService.initialize();
      expect(initialized).toBe(true);
      
      // Check if database file was created
      const dbPath = process.env.SQLITE_DB_PATH;
      const stats = await fs.stat(dbPath);
      expect(stats.isFile()).toBe(true);
    });
    
    test('should store and retrieve data', async () => {
      const testId = 'sqlite-test-user';
      const testData = {
        name: 'SQLite Test User',
        email: 'sqlite@example.com'
      };
      
      // Store data
      const storedData = await localStorageService.store('users', testId, testData);
      expect(storedData.id).toBe(testId);
      expect(storedData.name).toBe(testData.name);
      
      // Retrieve data
      const retrievedData = await localStorageService.retrieve('users', testId);
      expect(retrievedData.id).toBe(testId);
      expect(retrievedData.name).toBe(testData.name);
      expect(retrievedData.email).toBe(testData.email);
    });
    
    test('should query data', async () => {
      // Store multiple items
      await localStorageService.store('bots', 'bot1', { name: 'Bot One', type: 'support' });
      await localStorageService.store('bots', 'bot2', { name: 'Bot Two', type: 'sales' });
      await localStorageService.store('bots', 'bot3', { name: 'Bot Three', type: 'support' });
      
      // Query by exact match
      const supportBots = await localStorageService.query('bots', { type: 'support' });
      expect(supportBots.length).toBe(2);
      expect(supportBots.map(b => b.id).sort()).toEqual(['bot1', 'bot3'].sort());
    });
    
    test('should delete data', async () => {
      const testId = 'sqlite-delete-test';
      
      // Store data
      await localStorageService.store('conversations', testId, { title: 'Test Conversation' });
      
      // Verify it exists
      const beforeDelete = await localStorageService.retrieve('conversations', testId);
      expect(beforeDelete).not.toBeNull();
      
      // Delete data
      const deleteResult = await localStorageService.delete('conversations', testId);
      expect(deleteResult).toBe(true);
      
      // Verify it's gone
      const afterDelete = await localStorageService.retrieve('conversations', testId);
      expect(afterDelete).toBeNull();
    });
    
    test('should handle settings collection specially', async () => {
      // Store setting by key
      await localStorageService.store('settings', 'theme', { value: 'dark' });
      
      // Retrieve by key
      const theme = await localStorageService.retrieve('settings', 'theme');
      expect(theme.value).toBe('dark');
      
      // Update setting
      await localStorageService.store('settings', 'theme', { value: 'light' });
      
      // Verify update
      const updatedTheme = await localStorageService.retrieve('settings', 'theme');
      expect(updatedTheme.value).toBe('light');
    });
  });
});
