const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
let isConnected = false;

// Setup test database with better error handling
const setupTestDB = async () => {
  try {
    // Only create if not already created
    if (!mongoServer) {
      mongoServer = await MongoMemoryServer.create({
        instance: {
          port: 0, // Use random available port
          dbName: 'shopbot-test',
        },
        binary: {
          version: '6.0.0', // Use stable version
        },
      });
    }
    
    const mongoUri = mongoServer.getUri();
    
    // Only connect if not already connected
    if (!isConnected) {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
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
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
      isConnected = false;
    }
    
    if (mongoServer) {
      // Use force stop to avoid permission issues on Windows
      await mongoServer.stop({ doCleanup: false, force: true });
      mongoServer = null;
    }
  } catch (error) {
    // Log but don't throw - cleanup errors shouldn't fail tests
    console.warn('Warning during test cleanup:', error.message);
    
    // Force cleanup
    if (mongoServer) {
      try {
        await mongoServer.stop({ doCleanup: false, force: true });
      } catch (forceError) {
        console.warn('Force cleanup also failed:', forceError.message);
      }
      mongoServer = null;
    }
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

module.exports = {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  globalSetup,
  globalTeardown
};
