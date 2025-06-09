/**
 * Dependency Installation Script
 * 
 * This script installs all necessary dependencies for the reorganized project structure.
 * It ensures that all required packages for development, testing, and production are installed.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PROXY = '104.129.196.38:10563'; // From dependency-install.md memory
const USE_PROXY = true;
const INSTALL_DEV_DEPENDENCIES = true;

// Dependencies to install
const dependencies = [
  // Core dependencies
  'express',
  'mongoose',
  'dotenv',
  'winston',
  'cors',
  'helmet',
  'compression',
  'body-parser',
  'module-alias',
  
  // Webpack and build dependencies
  'webpack',
  'webpack-cli',
  'webpack-dev-server',
  'html-webpack-plugin',
  'clean-webpack-plugin',
  'mini-css-extract-plugin',
  'css-loader',
  'style-loader',
  'file-loader',
  'babel-loader',
  '@babel/core',
  '@babel/preset-env',
  'terser-webpack-plugin',
  'css-minimizer-webpack-plugin',
  
  // Testing dependencies
  'jest',
  'supertest',
  'mongodb-memory-server',
  'playwright',
  
  // ESLint and code quality
  'eslint',
  'eslint-plugin-jest',
  'prettier',
  'husky',
  'lint-staged'
];

// Function to install dependencies
function installDependencies() {
  console.log('Installing dependencies...');
  
  try {
    // Build the npm install command
    let command = 'npm install';
    
    // Add proxy if needed
    if (USE_PROXY) {
      command += ` --proxy http://${PROXY}`;
    }
    
    // Add dev dependencies flag if needed
    if (INSTALL_DEV_DEPENDENCIES) {
      command += ' --save-dev';
    }
    
    // Add dependencies
    command += ' ' + dependencies.join(' ');
    
    // Execute the command
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
    
    console.log('Dependencies installed successfully!');
    
    // Install module-alias as a production dependency
    console.log('Installing module-alias as a production dependency...');
    let moduleAliasCommand = 'npm install module-alias --save';
    
    // Add proxy if needed
    if (USE_PROXY) {
      moduleAliasCommand += ` --proxy http://${PROXY}`;
    }
    
    execSync(moduleAliasCommand, { stdio: 'inherit' });
    
    console.log('All dependencies installed successfully!');
    
  } catch (error) {
    console.error('Error installing dependencies:', error.message);
    process.exit(1);
  }
}

// Function to update package.json scripts
function updatePackageJsonScripts() {
  console.log('Updating package.json scripts...');
  
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = require(packageJsonPath);
    
    // Update scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      "build": "webpack --config webpack.config.js",
      "build:dev": "webpack --config webpack.config.js --mode development",
      "build:prod": "webpack --config webpack.config.js --mode production",
      "lint": "eslint .",
      "lint:fix": "eslint . --fix",
      "format": "prettier --write 'src/**/*.{js,jsx}'",
      "test:memory": "NODE_ENV=test USE_MEMORY_SERVER=true jest --config configs/jest/jest.memory.config.js",
      "test:integration": "jest --config configs/jest/jest.integration.config.js",
      "test:e2e": "jest --config configs/jest/jest.e2e.config.js"
    };
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Package.json scripts updated successfully!');
    
  } catch (error) {
    console.error('Error updating package.json scripts:', error.message);
    process.exit(1);
  }
}

// Main function
function main() {
  console.log('Starting dependency installation process...');
  
  // Install dependencies
  installDependencies();
  
  // Update package.json scripts
  updatePackageJsonScripts();
  
  console.log('Dependency installation process completed successfully!');
}

// Run the script
main();
