/**
 * Playwright Configuration
 * @see https://playwright.dev/docs/test-configuration
 */

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // Test directory
  testDir: './src/tests/e2e',
  
  // Maximum time one test can run for
  timeout: 60000,
  
  // Expect timeout
  expect: {
    timeout: 5000
  },
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/playwright-results.xml' }],
    ['list']
  ],
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        // Browser options
        browserName: 'chromium',
        
        // Context options
        viewport: { width: 1280, height: 720 },
        
        // Artifacts
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        trace: 'on-first-retry',
        
        // Base URL to use in actions like `await page.goto('/')`
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
      },
    },
    
    // Add other browsers as needed
    // {
    //   name: 'firefox',
    //   use: { browserName: 'firefox' },
    // },
    // {
    //   name: 'webkit',
    //   use: { browserName: 'webkit' },
    // },
  ],
  
  // Web server to start before the tests
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
