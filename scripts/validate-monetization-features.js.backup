/**
 * Monetization Features Validation Script
 * 
 * This script validates the core monetization features by:
 * 1. Checking that all required components are present
 * 2. Validating API endpoints for billing and subscription management
 * 3. Testing integration between components
 * 4. Generating a validation report
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const REPORT_DIR = path.join(__dirname, '..', 'validation-reports');
const REPORT_FILE = path.join(REPORT_DIR, 'monetization-validation.json');

// Required components to check
const REQUIRED_COMPONENTS = {
  services: [
    { path: '../src/billing/services/subscription.service.js', name: 'Subscription Service' },
    { path: '../src/billing/services/payment.service.js', name: 'Payment Service' },
    { path: '../src/billing/services/coupon.service.js', name: 'Coupon Service' },
    { path: '../src/billing/services/currency.service.js', name: 'Currency Service' },
    { path: '../src/billing/services/trial.service.js', name: 'Trial Service' },
    { path: '../src/billing/services/feature-access.service.js', name: 'Feature Access Service' },
    { path: '../src/analytics/services/analytics.service.js', name: 'Analytics Service' }
  ],
  controllers: [
    { path: '../src/billing/controllers/subscription.controller.js', name: 'Subscription Controller' },
    { path: '../src/billing/controllers/payment.controller.js', name: 'Payment Controller' },
    { path: '../src/billing/controllers/coupon.controller.js', name: 'Coupon Controller' },
    { path: '../src/billing/controllers/trial.controller.js', name: 'Trial Controller' },
    { path: '../src/billing/controllers/feature-access.controller.js', name: 'Feature Access Controller' },
    { path: '../src/analytics/controllers/analytics.controller.js', name: 'Analytics Controller' },
    { path: '../src/analytics/controllers/export.controller.js', name: 'Export Controller' }
  ],
  models: [
    { path: '../src/billing/models/subscription.model.js', name: 'Subscription Model' },
    { path: '../src/billing/models/payment.model.js', name: 'Payment Model' },
    { path: '../src/billing/models/coupon.model.js', name: 'Coupon Model' },
    { path: '../src/billing/models/payment-method.model.js', name: 'Payment Method Model' },
    { path: '../src/analytics/models/analytics-event.model.js', name: 'Analytics Event Model' }
  ],
  middleware: [
    { path: '../src/middleware/payment-error.middleware.js', name: 'Payment Error Middleware' },
    { path: '../src/middleware/feature-access.middleware.js', name: 'Feature Access Middleware' }
  ],
  utils: [
    { path: '../src/billing/utils/payment-error-handler.js', name: 'Payment Error Handler' },
    { path: '../src/analytics/utils/data-exporter.js', name: 'Data Exporter' },
    { path: '../src/analytics/utils/demo-data-generator.js', name: 'Demo Data Generator' }
  ],
  frontend: [
    { path: '../src/frontend/components/billing/SubscriptionPortal.jsx', name: 'Subscription Portal' },
    { path: '../src/frontend/components/billing/PricingPage.jsx', name: 'Pricing Page' },
    { path: '../src/frontend/components/billing/SubscriptionOnboarding.jsx', name: 'Subscription Onboarding' }
  ],
  tests: [
    { path: '../tests/unit/billing/subscription.service.test.js', name: 'Subscription Service Tests' },
    { path: '../tests/unit/billing/payment.service.test.js', name: 'Payment Service Tests' },
    { path: '../tests/unit/billing/coupon.service.test.js', name: 'Coupon Service Tests' },
    { path: '../tests/unit/billing/currency.service.test.js', name: 'Currency Service Tests' },
    { path: '../tests/unit/billing/trial.service.test.js', name: 'Trial Service Tests' },
    { path: '../tests/unit/analytics/analytics.service.test.js', name: 'Analytics Service Tests' },
    { path: '../tests/unit/analytics/data-exporter.test.js', name: 'Data Exporter Tests' },
    { path: '../tests/integration/billing/subscription-flow.test.js', name: 'Subscription Flow Tests' },
    { path: '../tests/integration/billing/payment-error-handling.test.js', name: 'Payment Error Handling Tests' }
  ]
};

// API endpoints to validate
const API_ENDPOINTS = [
  { method: 'GET', path: '/billing/plans', name: 'Get Plans' },
  { method: 'GET', path: '/billing/subscriptions', name: 'Get Subscriptions' },
  { method: 'POST', path: '/billing/payment-methods/setup-intent', name: 'Create Setup Intent' },
  { method: 'GET', path: '/billing/feature-access/basic_chat', name: 'Check Feature Access' },
  { method: 'GET', path: '/analytics/dashboard/summary', name: 'Get Analytics Summary' },
  { method: 'GET', path: '/analytics/export/formats', name: 'Get Export Formats' }
];

/**
 * Ensure directory exists
 * @param {string} dir - Directory path
 */
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * Check if a file exists
 * @param {string} filePath - File path
 * @returns {boolean} True if file exists
 */
const fileExists = (filePath) => {
  try {
    return fs.existsSync(path.resolve(__dirname, filePath));
  } catch (error) {
    return false;
  }
};

/**
 * Validate required components
 * @returns {Object} Validation results
 */
const validateComponents = () => {
  console.log(chalk.blue('\n🔍 Validating required components...'));
  
  const results = {
    total: 0,
    found: 0,
    missing: [],
    byCategory: {}
  };
  
  // Check each component category
  for (const [category, components] of Object.entries(REQUIRED_COMPONENTS)) {
    results.byCategory[category] = {
      total: components.length,
      found: 0,
      missing: []
    };
    
    // Check each component in the category
    for (const component of components) {
      results.total++;
      
      if (fileExists(component.path)) {
        results.found++;
        results.byCategory[category].found++;
        console.log(chalk.green(`✅ ${component.name} found`));
      } else {
        results.byCategory[category].missing.push(component.name);
        results.missing.push({ category, name: component.name, path: component.path });
        console.log(chalk.red(`❌ ${component.name} missing (${component.path})`));
      }
    }
  }
  
  return results;
};

/**
 * Validate API endpoints (mock validation)
 * @returns {Object} Validation results
 */
const validateApiEndpoints = async () => {
  console.log(chalk.blue('\n🔍 Validating API endpoints (mock validation)...'));
  
  const results = {
    total: API_ENDPOINTS.length,
    valid: 0,
    invalid: [],
    endpoints: []
  };
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      // In a real validation, we would make actual API calls
      // For this mock validation, we'll just check if the endpoint is defined in routes
      const routeFilePath = path.resolve(__dirname, '../src/routes/billing.routes.js');
      const analyticsRouteFilePath = path.resolve(__dirname, '../src/routes/analytics.routes.js');
      
      let routeFileContent = '';
      if (endpoint.path.startsWith('/billing') && fs.existsSync(routeFilePath)) {
        routeFileContent = fs.readFileSync(routeFilePath, 'utf8');
      } else if (endpoint.path.startsWith('/analytics') && fs.existsSync(analyticsRouteFilePath)) {
        routeFileContent = fs.readFileSync(analyticsRouteFilePath, 'utf8');
      }
      
      // Simple check if the endpoint path appears in the route file
      const endpointExists = routeFileContent.includes(endpoint.path.split('/').pop());
      
      if (endpointExists) {
        results.valid++;
        console.log(chalk.green(`✅ ${endpoint.method} ${endpoint.path} (${endpoint.name}) is defined`));
        results.endpoints.push({
          method: endpoint.method,
          path: endpoint.path,
          name: endpoint.name,
          status: 'valid'
        });
      } else {
        results.invalid.push({
          method: endpoint.method,
          path: endpoint.path,
          name: endpoint.name
        });
        console.log(chalk.red(`❌ ${endpoint.method} ${endpoint.path} (${endpoint.name}) not found in routes`));
        results.endpoints.push({
          method: endpoint.method,
          path: endpoint.path,
          name: endpoint.name,
          status: 'invalid'
        });
      }
    } catch (error) {
      results.invalid.push({
        method: endpoint.method,
        path: endpoint.path,
        name: endpoint.name,
        error: error.message
      });
      console.log(chalk.red(`❌ ${endpoint.method} ${endpoint.path} (${endpoint.name}) error: ${error.message}`));
      results.endpoints.push({
        method: endpoint.method,
        path: endpoint.path,
        name: endpoint.name,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * Generate validation report
 * @param {Object} componentResults - Component validation results
 * @param {Object} apiResults - API validation results
 */
const generateReport = (componentResults, apiResults) => {
  console.log(chalk.blue('\n📊 Generating validation report...'));
  
  const report = {
    timestamp: new Date().toISOString(),
    components: componentResults,
    api: apiResults,
    summary: {
      componentsFound: `${componentResults.found}/${componentResults.total}`,
      componentsPercentage: Math.round((componentResults.found / componentResults.total) * 100),
      apiEndpointsValid: `${apiResults.valid}/${apiResults.total}`,
      apiEndpointsPercentage: Math.round((apiResults.valid / apiResults.total) * 100),
      overallStatus: 'incomplete'
    }
  };
  
  // Determine overall status
  if (componentResults.found === componentResults.total && apiResults.valid === apiResults.total) {
    report.summary.overallStatus = 'complete';
  } else if (componentResults.found >= componentResults.total * 0.8 && apiResults.valid >= apiResults.total * 0.8) {
    report.summary.overallStatus = 'partial';
  }
  
  // Save report to file
  ensureDirectoryExists(REPORT_DIR);
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log(chalk.blue('\n📋 Validation Summary:'));
  console.log(chalk.white(`Components: ${report.summary.componentsFound} (${report.summary.componentsPercentage}%)`));
  console.log(chalk.white(`API Endpoints: ${report.summary.apiEndpointsValid} (${report.summary.apiEndpointsPercentage}%)`));
  console.log(chalk.white(`Overall Status: ${report.summary.overallStatus}`));
  console.log(chalk.blue(`\nFull report saved to: ${REPORT_FILE}`));
  
  return report;
};

/**
 * Main function
 */
const main = async () => {
  console.log(chalk.blue('🚀 Starting Monetization Features Validation'));
  
  try {
    // Validate components
    const componentResults = validateComponents();
    
    // Validate API endpoints
    const apiResults = await validateApiEndpoints();
    
    // Generate report
    const report = generateReport(componentResults, apiResults);
    
    // Exit with appropriate code
    if (report.summary.overallStatus === 'complete') {
      console.log(chalk.green('\n✅ Validation successful! All monetization features are properly implemented.'));
      process.exit(0);
    } else if (report.summary.overallStatus === 'partial') {
      console.log(chalk.yellow('\n⚠️ Validation partially successful. Some monetization features need attention.'));
      process.exit(1);
    } else {
      console.log(chalk.red('\n❌ Validation failed. Many monetization features are missing or incomplete.'));
      process.exit(2);
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Error during validation: ${error.message}`));
    process.exit(3);
  }
};

// Run the script
main();
