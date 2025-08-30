/**
 * Simple Topic Service Test
 * 
 * Tests basic Topic Service functionality using MongoDB Memory Server
 * to avoid dependency on a local MongoDB installation
 */

const fs = require('fs');
const path = require('path');
const mongoConfig = require('../../config/mongodb');

// Set test environment
process.env.NODE_ENV = 'test';

// Create test results directory if it doesn't exist
const testResultsDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}
const testResultsFile = path.join(testResultsDir, 'manual-test-results.txt');

// Log test start
const timestamp = new Date().toISOString();
fs.appendFileSync(testResultsFile, `\n[${timestamp}] Starting Simple Topic Service Test\n`);

// Setup MongoDB Memory Server
async function setupMongoMemoryServer() {
  try {
    console.log('Setting up MongoDB Memory Server...');
    
    // Check if mongodb-memory-server is available
    const isAvailable = await mongoConfig.isMemoryServerAvailable();
    if (!isAvailable) {
      const message = 'mongodb-memory-server is not installed. Installing it now...';
      console.log(message);
      fs.appendFileSync(testResultsFile, `${message}\n`);
      
      // Recommend installation
      console.log('Please run: npm install --save-dev mongodb-memory-server');
      fs.appendFileSync(testResultsFile, 'Please run: npm install --save-dev mongodb-memory-server\n');
      
      // Fall back to previous successful URI if available
      const connectionResultsPath = path.join(testResultsDir, 'mongodb-connection.json');
      if (fs.existsSync(connectionResultsPath)) {
        try {
          const connectionResults = JSON.parse(fs.readFileSync(connectionResultsPath, 'utf8'));
          if (connectionResults.successfulUri) {
            process.env.MONGODB_URI = connectionResults.successfulUri;
            console.log(`Using previously successful MongoDB URI: ${process.env.MONGODB_URI}`);
            fs.appendFileSync(testResultsFile, `Using previously successful MongoDB URI: ${process.env.MONGODB_URI}\n`);
            return false;
          }
        } catch (error) {
          // Ignore errors
        }
      }
      
      // Fall back to default URI
      process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbots-test';
      console.log(`Falling back to default URI: ${process.env.MONGODB_URI}`);
      fs.appendFileSync(testResultsFile, `Falling back to default URI: ${process.env.MONGODB_URI}\n`);
      return false;
    }
    
    // Initialize MongoDB Memory Server
    const uri = await mongoConfig.getTestUri();
    process.env.MONGODB_URI = uri;
    
    console.log(`Using MongoDB Memory Server: ${uri}`);
    fs.appendFileSync(testResultsFile, `Using MongoDB Memory Server: ${uri}\n`);
    return true;
  } catch (error) {
    console.error('Failed to setup MongoDB Memory Server:', error.message);
    fs.appendFileSync(testResultsFile, `Failed to setup MongoDB Memory Server: ${error.message}\n`);
    
    // Fall back to default URI
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbots-test';
    console.log(`Falling back to default URI: ${process.env.MONGODB_URI}`);
    fs.appendFileSync(testResultsFile, `Falling back to default URI: ${process.env.MONGODB_URI}\n`);
    return false;
  }
}

const topicService = require('../../services/topic.service');
const { databaseService } = require('../../data');

async function runSimpleTest() {
  console.log('Starting simple topic service test');
  
  let usingMemoryServer = false;
  
  try {
    // Setup MongoDB Memory Server
    usingMemoryServer = await setupMongoMemoryServer();
    console.log('Database URI:', process.env.MONGODB_URI);
    
    // Connect to database with retry mechanism
    console.log('Connecting to MongoDB...');
    await databaseService.connect();
    console.log('✅ Connected to MongoDB successfully');
    fs.appendFileSync(testResultsFile, '✅ Connected to MongoDB successfully\n');
    
    // Create a test topic
    const topicData = {
      name: 'SimpleTestTopic',
      category: 'test',
      chatbotId: 'test-chatbot-123',
      description: 'Simple test topic',
      isActive: true
    };
    
    console.log('Creating test topic...');
    const topic = await topicService.createTopic(topicData);
    console.log('✅ Topic created successfully:', topic._id);
    fs.appendFileSync(testResultsFile, `✅ Topic created successfully: ${topic._id}\n`);
    
    // Retrieve the created topic to verify
    console.log('Retrieving created topic...');
    const retrievedTopic = await topicService.getTopicByName('SimpleTestTopic');
    console.log('✅ Topic retrieved successfully:', retrievedTopic.name);
    fs.appendFileSync(testResultsFile, `✅ Topic retrieved successfully: ${retrievedTopic.name}\n`);
    
    // Save test results
    const timestamp = new Date().toISOString();
    const testResults = `
[${timestamp}] Simple Topic Service Test
--------------------------------------
Database URI: ${process.env.MONGODB_URI}
Using Memory Server: ${usingMemoryServer ? 'Yes' : 'No'}
Test Topic ID: ${topic._id}
Test Topic Name: ${topic.name}
Test Result: SUCCESS
${'='.repeat(80)}
`;
    
    fs.appendFileSync(testResultsFile, testResults);
    console.log(`Test results saved to ${testResultsFile}`);
    
    // Test complete
    console.log('✅ Test completed successfully');
    await databaseService.disconnect();
    
    // Stop memory server if used
    if (usingMemoryServer) {
      console.log('Stopping MongoDB Memory Server...');
      await mongoConfig.stopMemoryServer();
      console.log('✅ MongoDB Memory Server stopped');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    fs.appendFileSync(testResultsFile, `❌ Test failed: ${error.message}\n`);
    
    // Save error details
    const timestamp = new Date().toISOString();
    const errorResults = `
[${timestamp}] Simple Topic Service Test
--------------------------------------
Database URI: ${process.env.MONGODB_URI}
Using Memory Server: ${usingMemoryServer ? 'Yes' : 'No'}
Test Result: FAILED
Error: ${error.message}
Stack: ${error.stack}
${'='.repeat(80)}
`;
    
    fs.appendFileSync(testResultsFile, errorResults);
    console.log(`Error details saved to ${testResultsFile}`);
    
    // Cleanup
    await databaseService.disconnect().catch(() => {});
    
    // Stop memory server if used
    if (usingMemoryServer) {
      console.log('Stopping MongoDB Memory Server...');
      await mongoConfig.stopMemoryServer().catch(() => {});
    }
    
    process.exit(1);
  }
}

// Run the test
runSimpleTest();
