/**
 * Integration Tests Setup
 * 
 * This file contains setup code that runs before each integration test
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { logger } = require('../../utils');

// Disable logging during tests
logger.silent = true;

// MongoDB Memory Server instance
let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Create MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to in-memory database
  await mongoose.connect(mongoUri);
  
  console.log(`Connected to in-memory MongoDB at ${mongoUri}`);
});

// Cleanup after all tests
afterAll(async () => {
  // Disconnect from database
  await mongoose.disconnect();
  
  // Stop MongoDB Memory Server
  await mongoServer.stop();
  
  console.log('Disconnected from in-memory MongoDB');
});

// Clear database between tests
afterEach(async () => {
  // Get all collections
  const collections = mongoose.connection.collections;
  
  // Clear each collection
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});
