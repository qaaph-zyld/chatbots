/**
 * MongoDB Configuration
 * 
 * Centralized MongoDB connection configuration with support for:
 * - Environment-specific configuration
 * - Connection retry logic
 * - MongoDB Memory Server for testing
 * - Automatic URI detection and persistence
 */

const fs = require('fs');
const path = require('path');

// Default MongoDB URIs
const DEFAULT_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbots';
const TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/chatbots-test';

// MongoDB connection options
const DEFAULT_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000
};

// Retry configuration
const RETRY_CONFIG = {
  attempts: 3,
  delay: 2000 // milliseconds
};

// MongoDB Memory Server reference (lazy loaded)
let mongoMemoryServer = null;
let memoryServerUri = null;

/**
 * Get MongoDB configuration
 * @param {Object} overrides - Configuration overrides
 * @returns {Object} MongoDB configuration
 */
function getMongoConfig(overrides = {}) {
  // Get URI from environment variables or default
  let uri = getMongoUri();
  
  // Apply overrides
  if (overrides.uri) {
    uri = overrides.uri;
  }
  
  const options = { ...DEFAULT_OPTIONS, ...(overrides.options || {}) };
  const retry = { ...RETRY_CONFIG, ...(overrides.retry || {}) };
  
  return { uri, options, retry };
}

/**
 * Get MongoDB URI from various sources with priority order
 * @returns {string} MongoDB URI
 */
function getMongoUri() {
  // Priority order:
  // 1. Memory server URI (if available and in test mode)
  // 2. Environment variable MONGODB_URI
  // 3. Environment variable DATABASE_URL
  // 4. Saved successful URI
  // 5. Default URI based on environment
  
  // Check for memory server URI in test mode
  if (process.env.NODE_ENV === 'test' && memoryServerUri) {
    return memoryServerUri;
  }
  
  // Check for environment variables
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Check for saved successful URI
  try {
    const connectionResultsPath = path.join(process.cwd(), 'test-results', 'mongodb-connection.json');
    
    if (fs.existsSync(connectionResultsPath)) {
      const connectionResults = JSON.parse(fs.readFileSync(connectionResultsPath, 'utf8'));
      if (connectionResults.successfulUri) {
        return connectionResults.successfulUri;
      }
    }
  } catch (error) {
    // Ignore errors reading saved URI
  }
  
  // Default URI based on environment
  return process.env.NODE_ENV === 'test' ? TEST_URI : DEFAULT_URI;
}

/**
 * Save successful MongoDB URI for future use
 * @param {string} uri - Successful MongoDB URI
 */
function saveSuccessfulUri(uri) {
  if (!uri) return;
  
  try {
    // Create test-results directory if it doesn't exist
    const testResultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    const connectionResultsPath = path.join(testResultsDir, 'mongodb-connection.json');
    
    // Read existing results or create new object
    let connectionResults = {};
    if (fs.existsSync(connectionResultsPath)) {
      try {
        connectionResults = JSON.parse(fs.readFileSync(connectionResultsPath, 'utf8'));
      } catch (error) {
        // Ignore JSON parse errors
      }
    }
    
    // Update with successful URI
    connectionResults.successfulUri = uri;
    connectionResults.timestamp = new Date().toISOString();
    
    // Save to file
    fs.writeFileSync(
      connectionResultsPath,
      JSON.stringify(connectionResults, null, 2),
      'utf8'
    );
  } catch (error) {
    // Ignore file system errors
  }
}

/**
 * Initialize MongoDB Memory Server for testing
 * Note: This requires mongodb-memory-server to be installed
 * @returns {Promise<string>} MongoDB Memory Server URI
 */
async function initMemoryServer() {
  try {
    // Check if mongodb-memory-server is installed
    const isAvailable = await isMemoryServerAvailable();
    if (!isAvailable) {
      throw new Error('mongodb-memory-server is not installed. Run: npm install --save-dev mongodb-memory-server');
    }
    
    // Dynamically import mongodb-memory-server
    const { MongoMemoryServer } = await dynamicImport('mongodb-memory-server');
    
    // Create MongoDB Memory Server instance
    mongoMemoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'chatbots-test'
      }
    });
    
    // Get URI
    memoryServerUri = mongoMemoryServer.getUri();
    return memoryServerUri;
  } catch (error) {
    console.error('Failed to initialize MongoDB Memory Server:', error.message);
    throw error;
  }
}

/**
 * Stop MongoDB Memory Server
 * @returns {Promise<void>}
 */
async function stopMemoryServer() {
  if (mongoMemoryServer) {
    try {
      await mongoMemoryServer.stop();
    } catch (error) {
      console.error('Error stopping MongoDB Memory Server:', error.message);
    } finally {
      mongoMemoryServer = null;
      memoryServerUri = null;
    }
  }
}

/**
 * Check if MongoDB Memory Server is available
 * @returns {Promise<boolean>} True if MongoDB Memory Server is available
 */
async function isMemoryServerAvailable() {
  try {
    await dynamicImport('mongodb-memory-server');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Dynamic import helper (works in both ESM and CommonJS)
 * @param {string} moduleName - Module to import
 * @returns {Promise<any>} Imported module
 */
async function dynamicImport(moduleName) {
  try {
    // Try ESM import first
    return await import(moduleName);
  } catch (error) {
    // Fall back to CommonJS require
    return require(moduleName);
  }
}

/**
 * Get MongoDB Memory Server URI for testing
 * @returns {Promise<string>} MongoDB Memory Server URI
 */
async function getTestUri() {
  if (memoryServerUri) {
    return memoryServerUri;
  }
  
  return await initMemoryServer();
}

module.exports = {
  getMongoConfig,
  getMongoUri,
  saveSuccessfulUri,
  getTestUri,
  initMemoryServer,
  stopMemoryServer,
  isMemoryServerAvailable,
  DEFAULT_URI,
  TEST_URI,
  DEFAULT_OPTIONS,
  RETRY_CONFIG
};
