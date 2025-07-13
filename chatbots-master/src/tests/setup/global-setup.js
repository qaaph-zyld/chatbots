// This file runs once before all test suites
// Use this for global test setup that needs to happen once before any tests run

module.exports = async () => {
  // Set up any global test environment here
  process.env.NODE_ENV = 'test';
  
  // Example: Start any required services
  // await startTestDatabase();
  
  // Example: Set up global test data
  // global.testData = await loadTestData();
  
  console.log('Global test setup complete');
};
