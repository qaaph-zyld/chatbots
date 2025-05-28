/**
 * Playwright configuration for User Acceptance Testing
 */

const { devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = {
  testDir: './src/tests/uat',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'uat-test-results/html' }],
    ['json', { outputFile: 'uat-test-results/results.json' }]
  ],
  use: {
    actionTimeout: 0,
    baseURL: process.env.UAT_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox']
      }
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari']
      }
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5']
      }
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12']
      }
    }
  ],
  globalSetup: require.resolve('./src/tests/uat/setup.js'),
  outputDir: 'uat-test-results/'
};
