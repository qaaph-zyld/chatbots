/**
 * MongoDB Connection Test Script
 * 
 * Diagnoses MongoDB connection issues and provides recommendations
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('@src/utils\logger');
require('@src/utils\mongo-connection-helper');
require('@src/config\mongodb');

// Ensure test results directory exists
const testResultsDir = path.join(process.cwd(), 'test-results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

// Path to test results file
const testResultsFile = path.join(testResultsDir, 'manual-test-results.txt');

/**
 * Append results to the test results file
 * @param {string} content Content to append
 */
function appendToResults(content) {
  const timestamp = new Date().toISOString();
  const entry = `\n[${timestamp}] MongoDB Connection Test\n${content}\n${'='.repeat(80)}\n`;
  
  try {
    fs.appendFileSync(testResultsFile, entry);
    console.log('Results saved to', testResultsFile);
  } catch (error) {
    console.error('Failed to save results:', error);
  }
}

/**
 * Run MongoDB connection diagnostics
 */
async function runDiagnostics() {
  console.log('Starting MongoDB connection diagnostics...');
  
  // Check if MongoDB is running
  console.log('Checking if MongoDB is running...');
  
  // Test connections with different configurations directly
  console.log('Testing different MongoDB connection configurations...');
  
  let defaultConnection = false;
  let testConnection = false;
  let customConnection = false;
  let error = null;
  let successfulUri = null;
  
  // Try default connection
  try {
    console.log('Testing default MongoDB connection (mongodb://localhost:27017/chatbots)...');
    await mongoose.connect('mongodb://localhost:27017/chatbots', {
      serverSelectionTimeoutMS: 5000
    });
    defaultConnection = true;
    successfulUri = 'mongodb://localhost:27017/chatbots';
    await mongoose.disconnect();
    console.log('✅ Default MongoDB connection successful');
  } catch (err) {
    console.log('❌ Default MongoDB connection failed:', err.message);
    error = err.message;
  }
  
  // Try test database connection
  if (!defaultConnection) {
    try {
      console.log('\nTesting test database MongoDB connection (mongodb://localhost:27017/chatbots-test)...');
      await mongoose.connect('mongodb://localhost:27017/chatbots-test', {
        serverSelectionTimeoutMS: 5000
      });
      testConnection = true;
      successfulUri = 'mongodb://localhost:27017/chatbots-test';
      await mongoose.disconnect();
      console.log('✅ Test database MongoDB connection successful');
    } catch (err) {
      console.log('❌ Test database MongoDB connection failed:', err.message);
      if (!error) error = err.message;
    }
  }
  
  // Try custom connection if provided
  const customUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (customUri && !defaultConnection && !testConnection) {
    try {
      console.log(`\nTesting custom MongoDB connection (${customUri})...`);
      await mongoose.connect(customUri, {
        serverSelectionTimeoutMS: 5000
      });
      customConnection = true;
      successfulUri = customUri;
      await mongoose.disconnect();
      console.log('✅ Custom MongoDB connection successful');
    } catch (err) {
      console.log('❌ Custom MongoDB connection failed:', err.message);
      if (!error) error = err.message;
    }
  }
  
  const isRunning = defaultConnection || testConnection || customConnection;
  
  const connectionResults = {
    defaultConnection,
    testConnection,
    customConnection,
    error,
    successfulUri
  };
  
  if (isRunning) {
    console.log('✅ MongoDB is running and accessible');
  } else {
    console.log('❌ MongoDB is not running or not accessible');
  }
  
  // We already have the connection results from our direct testing above
  console.log('\nSummarizing MongoDB connection configurations...');
  
  console.log('\nConnection Test Results:');
  console.log(`Default Connection (mongodb://localhost:27017/chatbots): ${connectionResults.defaultConnection ? '✅ Success' : '❌ Failed'}`);
  console.log(`Test Database (mongodb://localhost:27017/chatbots-test): ${connectionResults.testConnection ? '✅ Success' : '❌ Failed'}`);
  console.log(`Custom URI Connection: ${connectionResults.customConnection ? '✅ Success' : '❌ Failed'}`);
  
  if (connectionResults.error) {
    console.log(`\nError Message: ${connectionResults.error}`);
  }
  
  // Provide recommendations
  console.log('\nRecommendations:');
  
  if (connectionResults.successfulUri) {
    console.log(`✅ Use this connection URI: ${connectionResults.successfulUri}`);
    console.log('✅ Add this URI to your .env file as MONGODB_URI');
  } else {
    console.log('❌ No successful connections found. Please check:');
    console.log('  1. Is MongoDB installed and running?');
    console.log('  2. Is MongoDB accessible at localhost:27017?');
    console.log('  3. Are there any network/firewall issues?');
    console.log('  4. Is MongoDB configured to accept connections?');
  }
  
  // Save results
  const resultContent = `
MongoDB Connection Diagnostics Results:
--------------------------------------
MongoDB Running: ${isRunning ? 'Yes' : 'No'}

Connection Test Results:
- Default Connection: ${connectionResults.defaultConnection ? 'Success' : 'Failed'}
- Test Database: ${connectionResults.testConnection ? 'Success' : 'Failed'}
- Custom URI Connection: ${connectionResults.customConnection ? 'Success' : 'Failed'}

${connectionResults.error ? `Error Message: ${connectionResults.error}` : ''}

Recommended URI: ${connectionResults.successfulUri || 'None (All connections failed)'}

Recommendations:
${connectionResults.successfulUri ? 
  `- Use this connection URI: ${connectionResults.successfulUri}\n- Add this URI to your .env file as MONGODB_URI` : 
  '- Check if MongoDB is installed and running\n- Verify MongoDB is accessible at localhost:27017\n- Check for network/firewall issues\n- Ensure MongoDB is configured to accept connections'}
`;

  appendToResults(resultContent);
  
  // Update environment if successful connection found
  if (connectionResults.successfulUri) {
    process.env.MONGODB_URI = connectionResults.successfulUri;
    console.log('\nEnvironment updated with working MongoDB URI');
    
    // Save successful URI for future use
    mongoConfig.saveSuccessfulUri(connectionResults.successfulUri);
    console.log('Successful MongoDB URI saved for future use');
  }
  
  return connectionResults;
}

// Run diagnostics and handle results
runDiagnostics()
  .then(results => {
    if (results.successfulUri) {
      console.log('\nDiagnostics completed successfully');
      process.exit(0);
    } else {
      console.log('\nDiagnostics completed with issues');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Error running diagnostics:', error);
    process.exit(1);
  });
