// scripts/setup-test-env.js
const fs = require('fs');
const path = require('path');

// Ensure required directories exist
const requiredDirs = [
  'logs',
  'tests/setup',
  'src/utils'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create environment file for tests
const envContent = `# Test Environment Variables
NODE_ENV=test
MONGO_TEST_URI=mongodb://localhost:27017/shopbot-test
JWT_SECRET=test-secret-key
LOG_LEVEL=error
`;

const envPath = path.join(__dirname, '..', '.env.test');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('Created .env.test file');
}

console.log('Test environment setup complete');
