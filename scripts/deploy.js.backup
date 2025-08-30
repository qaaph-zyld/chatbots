#!/usr/bin/env node

/**
 * Deployment Script
 * 
 * Automates the deployment process for different environments
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get environment from command line arguments
const args = process.argv.slice(2);
const env = args[0] || 'development';
const validEnvs = ['development', 'staging', 'production'];

if (!validEnvs.includes(env)) {
  console.error(`Error: Invalid environment "${env}". Valid options are: ${validEnvs.join(', ')}`);
  process.exit(1);
}

console.log(`Starting deployment for ${env} environment...`);

// Set environment variables
process.env.NODE_ENV = env;

// Define deployment steps
const deploymentSteps = {
  development: [
    { name: 'Install dependencies', command: 'npm install' },
    { name: 'Run tests', command: 'npm test' },
    { name: 'Start development server', command: 'npm run dev' }
  ],
  staging: [
    { name: 'Install dependencies', command: 'npm ci' },
    { name: 'Run tests', command: 'npm test' },
    { name: 'Build application', command: 'npm run build' },
    { name: 'Build Docker image', command: 'docker-compose -f docker-compose.staging.yml build' },
    { name: 'Deploy containers', command: 'docker-compose -f docker-compose.staging.yml up -d' }
  ],
  production: [
    { name: 'Install dependencies', command: 'npm ci --only=production' },
    { name: 'Build application', command: 'npm run build' },
    { name: 'Run security audit', command: 'npm audit --production' },
    { name: 'Build Docker image', command: 'docker-compose -f docker-compose.production.yml build' },
    { name: 'Deploy containers', command: 'docker-compose -f docker-compose.production.yml up -d' }
  ]
};

// Execute deployment steps
const steps = deploymentSteps[env];
let currentStep = 1;

for (const step of steps) {
  console.log(`\n[${currentStep}/${steps.length}] ${step.name}`);
  
  try {
    execSync(step.command, { stdio: 'inherit' });
    console.log(`✅ ${step.name} completed successfully`);
  } catch (error) {
    console.error(`❌ ${step.name} failed: ${error.message}`);
    process.exit(1);
  }
  
  currentStep++;
}

console.log(`\n🚀 Deployment to ${env} environment completed successfully!`);

// Additional environment-specific messages
if (env === 'production') {
  console.log('\n⚠️ IMPORTANT PRODUCTION DEPLOYMENT NOTES:');
  console.log('1. Verify that all environment variables are properly set');
  console.log('2. Check that SSL certificates are valid and properly configured');
  console.log('3. Ensure database backups are enabled and working correctly');
  console.log('4. Verify that monitoring and alerting systems are active');
  console.log('5. Test the application thoroughly before making it available to users');
} else if (env === 'staging') {
  console.log('\n📝 STAGING DEPLOYMENT NOTES:');
  console.log('1. The application is now available for testing at https://staging.chatbots-app.com');
  console.log('2. Please report any issues or bugs found during testing');
}

process.exit(0);
