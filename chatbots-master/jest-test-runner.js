// Test script to verify Jest can be required and run programmatically
const { runCLI } = require('jest');
const path = require('path');

async function testJest() {
  console.log('Starting Jest programmatically...');
  
  const projectRootDir = __dirname;
  const config = {
    rootDir: projectRootDir,
    testMatch: ['**/minimal-test.js'],
    verbose: true,
    runInBand: true,
    silent: false,
    testEnvironment: 'node',
  };

  try {
    const { results } = await runCLI(config, [projectRootDir]);
    console.log('Jest results:', results);
  } catch (error) {
    console.error('Error running Jest:', error);
  }
}

testJest();
