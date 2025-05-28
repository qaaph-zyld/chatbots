/**
 * Run Performance Tests
 * 
 * This script runs performance tests using Artillery
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { setupTestEnvironment, cleanupTestEnvironment } = require('./setup');

// Configuration
const RESULTS_DIR = path.join(__dirname, 'results');
const REPORT_FILE = path.join(RESULTS_DIR, `report-${new Date().toISOString().replace(/:/g, '-')}.html`);
const TEST_FILE = path.join(__dirname, 'load', 'load-test.yml');

/**
 * Run Artillery performance tests
 * @param {Object} testData - Test data from setup
 * @returns {Promise<void>}
 */
const runArtilleryTests = (testData) => {
  return new Promise((resolve, reject) => {
    console.log('Running Artillery performance tests...');
    
    // Ensure results directory exists
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
    
    // Set environment variables for the test
    const env = {
      ...process.env,
      TEST_USER_EMAIL: testData.user.email,
      TEST_USER_PASSWORD: 'password123', // Use the plain password, not the hashed one
      NODE_ENV: 'test'
    };
    
    // Run Artillery with the test configuration
    const artillery = spawn('npx', [
      'artillery',
      'run',
      '--output', path.join(RESULTS_DIR, 'raw-results.json'),
      TEST_FILE
    ], { env });
    
    // Handle artillery output
    artillery.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    artillery.stderr.on('data', (data) => {
      console.error(data.toString());
    });
    
    // Handle artillery completion
    artillery.on('close', (code) => {
      if (code !== 0) {
        console.error(`Artillery process exited with code ${code}`);
        reject(new Error(`Artillery process exited with code ${code}`));
        return;
      }
      
      console.log('Performance tests completed successfully');
      
      // Generate HTML report
      const report = spawn('npx', [
        'artillery',
        'report',
        '--output', REPORT_FILE,
        path.join(RESULTS_DIR, 'raw-results.json')
      ]);
      
      report.on('close', (reportCode) => {
        if (reportCode !== 0) {
          console.error(`Report generation process exited with code ${reportCode}`);
          reject(new Error(`Report generation process exited with code ${reportCode}`));
          return;
        }
        
        console.log(`Performance test report generated at: ${REPORT_FILE}`);
        resolve();
      });
    });
  });
};

/**
 * Main function to run performance tests
 */
const runPerformanceTests = async () => {
  let testData;
  
  try {
    // Setup test environment
    testData = await setupTestEnvironment();
    
    // Run performance tests
    await runArtilleryTests(testData);
    
    console.log('Performance tests completed successfully');
  } catch (error) {
    console.error('Error running performance tests:', error);
    process.exit(1);
  } finally {
    // Clean up test environment
    if (testData) {
      await cleanupTestEnvironment();
    }
  }
};

// Run performance tests if this script is executed directly
if (require.main === module) {
  runPerformanceTests();
}

module.exports = {
  runPerformanceTests
};
