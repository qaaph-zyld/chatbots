// global-test-setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  // Start MongoDB memory server
  global.__MONGOD__ = await MongoMemoryServer.create();
  process.env.MONGO_URI = global.__MONGOD__.getUri();

  // Initialize other global resources here
};
