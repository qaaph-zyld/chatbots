const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let isConnected = false;

// Setup test database with better error handling
const setupTestDB = async () => {
  try {
    // Skip MongoDB Memory Server setup - use real MongoDB connection for tests
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://qaaphzyld:zD1ZFt8Sf2BirMLV@cluster0.3lj0bmo.mongodb.net/shopbot-test?retryWrites=true&w=majority';
    
    // Only connect if not already connected
    if (!isConnected) {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
    }
    
    return mongoUri;
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

// Cleanup test database with better error handling
const teardownTestDB = async () => {
  try {
    if (isConnected && mongoose.connection.readyState === 1) {
      // Clear test data but don't drop the database
      await clearDatabase();
      await mongoose.connection.close();
      isConnected = false;
    }
  } catch (error) {
    // Log but don't throw - cleanup errors shouldn't fail tests
    console.warn('Warning during test cleanup:', error.message);
    isConnected = false;
  }
};

// Clear all collections
const clearDatabase = async () => {
  try {
    if (!isConnected || mongoose.connection.readyState !== 1) {
      return;
    }
    
    const collections = mongoose.connection.collections;
    const clearPromises = [];
    
    for (const key in collections) {
      const collection = collections[key];
      clearPromises.push(collection.deleteMany({}));
    }
    
    await Promise.all(clearPromises);
  } catch (error) {
    console.warn('Warning during database clear:', error.message);
  }
};

// Global setup for Jest
const globalSetup = async () => {
  try {
    await setupTestDB();
    console.log('Global test setup completed successfully');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  }
};

// Global teardown for Jest
const globalTeardown = async () => {
  try {
    await teardownTestDB();
    console.log('Global test teardown completed successfully');
  } catch (error) {
    console.warn('Global teardown warning:', error);
  }
};

// Export as default for Jest globalSetup/globalTeardown
module.exports = globalSetup;
module.exports.globalTeardown = globalTeardown;

// Named exports for use in individual tests
module.exports.setupTestDB = setupTestDB;
module.exports.teardownTestDB = teardownTestDB;
module.exports.clearDatabase = clearDatabase;
