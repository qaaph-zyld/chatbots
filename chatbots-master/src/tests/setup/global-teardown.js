// This file runs once after all test suites complete
// Use this for global test teardown that needs to happen after all tests complete

module.exports = async () => {
  // Clean up any global test environment here
  
  // Example: Stop any running services
  // await stopTestDatabase();
  
  // Example: Clean up test data
  // await cleanupTestData(global.testData);
  
  console.log('Global test teardown complete');
};
