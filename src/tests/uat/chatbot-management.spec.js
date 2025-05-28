/**
 * UAT Test Suite: Chatbot Management
 * 
 * This file contains User Acceptance Tests for chatbot management functionality,
 * including creating, editing, and deleting chatbots.
 */

const { test, expect } = require('@playwright/test');
const { UAT_URL } = require('./setup');

// Test suite for chatbot management
test.describe('Chatbot Management', () => {
  // Use authenticated admin context
  test.use({ storageState: './src/tests/uat/storage/adminState.json' });
  
  // Test case: Create a new chatbot
  test('should create a new chatbot', async ({ page }) => {
    // Navigate to chatbot management page
    await page.goto(`${UAT_URL}/chatbots`);
    
    // Click create button
    await page.click('.create-chatbot-button');
    
    // Fill in chatbot details
    await page.fill('#name', 'UAT Test Chatbot');
    await page.fill('#description', 'A chatbot created during UAT testing');
    await page.selectOption('#language', 'en');
    
    // Select a personality
    await page.click('.personality-selector');
    await page.click('text=Professional Personality');
    
    // Set max context length
    await page.fill('#maxContextLength', '15');
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify chatbot was created
    await expect(page.locator('.chatbot-name')).toContainText('UAT Test Chatbot');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Chatbot created successfully');
  });
  
  // Test case: Edit an existing chatbot
  test('should edit an existing chatbot', async ({ page }) => {
    // Navigate to chatbot management page
    await page.goto(`${UAT_URL}/chatbots`);
    
    // Find and click on the test chatbot
    await page.click('text=UAT Test Chatbot');
    
    // Click edit button
    await page.click('.edit-chatbot-button');
    
    // Update chatbot details
    await page.fill('#description', 'Updated description for UAT testing');
    await page.selectOption('#status', 'active');
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify chatbot was updated
    await expect(page.locator('.chatbot-description')).toContainText('Updated description for UAT testing');
    await expect(page.locator('.chatbot-status')).toContainText('Active');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Chatbot updated successfully');
  });
  
  // Test case: Configure chatbot settings
  test('should configure chatbot settings', async ({ page }) => {
    // Navigate to chatbot management page
    await page.goto(`${UAT_URL}/chatbots`);
    
    // Find and click on the test chatbot
    await page.click('text=UAT Test Chatbot');
    
    // Click settings tab
    await page.click('text=Settings');
    
    // Update settings
    await page.selectOption('#defaultPersonality', 'Friendly Personality');
    await page.fill('#maxContextLength', '20');
    await page.check('#enableLearning');
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify settings were updated
    await page.click('text=Settings');
    await expect(page.locator('#defaultPersonality')).toHaveValue(/Friendly/);
    await expect(page.locator('#maxContextLength')).toHaveValue('20');
    await expect(page.locator('#enableLearning')).toBeChecked();
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Settings updated successfully');
  });
  
  // Test case: Delete a chatbot
  test('should delete a chatbot', async ({ page }) => {
    // Navigate to chatbot management page
    await page.goto(`${UAT_URL}/chatbots`);
    
    // Find and click on the test chatbot
    await page.click('text=UAT Test Chatbot');
    
    // Click delete button
    await page.click('.delete-chatbot-button');
    
    // Confirm deletion
    await Promise.all([
      page.click('.confirm-delete-button'),
      page.waitForNavigation()
    ]);
    
    // Verify chatbot was deleted
    await expect(page.locator('text=UAT Test Chatbot')).not.toBeVisible();
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Chatbot deleted successfully');
  });
});

// Test suite for chatbot creator role
test.describe('Chatbot Management (Creator Role)', () => {
  // Use authenticated creator context
  test.use({ storageState: './src/tests/uat/storage/creatorState.json' });
  
  // Test case: Creator can create a chatbot
  test('creator should be able to create a chatbot', async ({ page }) => {
    // Navigate to chatbot management page
    await page.goto(`${UAT_URL}/chatbots`);
    
    // Click create button
    await page.click('.create-chatbot-button');
    
    // Fill in chatbot details
    await page.fill('#name', 'Creator Test Chatbot');
    await page.fill('#description', 'A chatbot created by a creator user');
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify chatbot was created
    await expect(page.locator('.chatbot-name')).toContainText('Creator Test Chatbot');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Chatbot created successfully');
  });
  
  // Test case: Creator can only see their own chatbots
  test('creator should only see their own chatbots', async ({ page }) => {
    // Navigate to chatbot management page
    await page.goto(`${UAT_URL}/chatbots`);
    
    // Verify creator can see their chatbot
    await expect(page.locator('text=Creator Test Chatbot')).toBeVisible();
    
    // Verify creator cannot see admin chatbots
    await expect(page.locator('text=Customer Support Bot')).not.toBeVisible();
  });
});

// Test suite for regular user role
test.describe('Chatbot Management (User Role)', () => {
  // Use authenticated user context
  test.use({ storageState: './src/tests/uat/storage/userState.json' });
  
  // Test case: Regular user cannot create chatbots
  test('regular user should not be able to create chatbots', async ({ page }) => {
    // Navigate to chatbot management page
    await page.goto(`${UAT_URL}/chatbots`);
    
    // Verify create button is not visible
    await expect(page.locator('.create-chatbot-button')).not.toBeVisible();
  });
  
  // Test case: Regular user can view public chatbots
  test('regular user should be able to view public chatbots', async ({ page }) => {
    // Navigate to chatbot management page
    await page.goto(`${UAT_URL}/chatbots`);
    
    // Verify user can see public chatbots
    await expect(page.locator('.public-chatbot')).toBeVisible();
  });
});
