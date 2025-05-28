/**
 * End-to-End Tests Global Setup
 * 
 * This file contains setup code that runs once before all end-to-end tests
 */

const { spawn } = require('child_process');
const { logger } = require('../../utils');

// Server process
let serverProcess;

module.exports = async () => {
  // Disable logging during tests
  logger.silent = true;
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001'; // Use different port for tests
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.API_KEY_SECRET = 'test-api-key-secret';
  process.env.TEST_MONGODB_URI = 'mongodb://localhost:27017/chatbots-test';
  
  // Start server for E2E tests
  serverProcess = spawn('node', ['src/index.js'], {
    env: { ...process.env },
    stdio: 'pipe'
  });
  
  // Log server output
  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });
  
  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 5000));
  
  // Store server process in global object for teardown
  global.__SERVER__ = serverProcess;
  
  console.log('Global setup for E2E tests completed');
};
