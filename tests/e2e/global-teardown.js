/**
 * End-to-End Tests Global Teardown
 * 
 * This file contains teardown code that runs once after all end-to-end tests
 */

module.exports = async () => {
  // Get server process from global object
  const serverProcess = global.__SERVER__;
  
  if (serverProcess) {
    // Kill server process
    serverProcess.kill();
    console.log('Server process terminated');
  }
  
  console.log('Global teardown for E2E tests completed');
};
