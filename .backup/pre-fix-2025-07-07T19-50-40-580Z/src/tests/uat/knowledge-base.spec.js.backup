/**
 * UAT Test Suite: Knowledge Base Management
 * 
 * This file contains User Acceptance Tests for knowledge base management functionality,
 * including creating, editing, and using knowledge bases.
 */

const { test, expect } = require('@playwright/test');
require('@src/tests\uat\setup');

// Test suite for knowledge base management
test.describe('Knowledge Base Management', () => {
  // Use authenticated admin context
  test.use({ storageState: './src/tests/uat/storage/adminState.json' });
  
  // Test case: Create a new knowledge base
  test('should create a new knowledge base', async ({ page }) => {
    // Navigate to knowledge base management page
    await page.goto(`${UAT_URL}/knowledge-bases`);
    
    // Click create button
    await page.click('.create-kb-button');
    
    // Fill in knowledge base details
    await page.fill('#name', 'UAT Test Knowledge Base');
    await page.fill('#description', 'A knowledge base created during UAT testing');
    await page.selectOption('#type', 'faq');
    
    // Select a chatbot
    await page.click('.chatbot-selector');
    await page.click('text=Customer Support Bot');
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify knowledge base was created
    await expect(page.locator('.kb-name')).toContainText('UAT Test Knowledge Base');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Knowledge base created successfully');
  });
  
  // Test case: Add items to knowledge base
  test('should add items to knowledge base', async ({ page }) => {
    // Navigate to knowledge base management page
    await page.goto(`${UAT_URL}/knowledge-bases`);
    
    // Find and click on the test knowledge base
    await page.click('text=UAT Test Knowledge Base');
    
    // Click add item button
    await page.click('.add-kb-item-button');
    
    // Fill in item details
    await page.fill('#question', 'What is the return policy?');
    await page.fill('#answer', 'Our return policy allows returns within 30 days of purchase with a receipt.');
    await page.fill('#tags', 'returns, policy, purchase');
    await page.selectOption('#category', 'general');
    await page.fill('#priority', '5');
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify item was added
    await expect(page.locator('.kb-item-question')).toContainText('What is the return policy?');
    
    // Add another item
    await page.click('.add-kb-item-button');
    
    // Fill in item details
    await page.fill('#question', 'How do I track my order?');
    await page.fill('#answer', 'You can track your order by logging into your account and viewing your order history.');
    await page.fill('#tags', 'order, tracking, shipping');
    await page.selectOption('#category', 'orders');
    await page.fill('#priority', '4');
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify multiple items exist
    await expect(page.locator('.kb-item')).toHaveCount(2);
  });
  
  // Test case: Edit knowledge base item
  test('should edit a knowledge base item', async ({ page }) => {
    // Navigate to knowledge base management page
    await page.goto(`${UAT_URL}/knowledge-bases`);
    
    // Find and click on the test knowledge base
    await page.click('text=UAT Test Knowledge Base');
    
    // Find and click edit on the first item
    await page.click('.kb-item:first-child .edit-kb-item-button');
    
    // Update item details
    await page.fill('#answer', 'UPDATED: Our return policy allows returns within 45 days of purchase with a receipt.');
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify item was updated
    await expect(page.locator('.kb-item-answer')).toContainText('UPDATED: Our return policy allows returns within 45 days');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Knowledge item updated successfully');
  });
  
  // Test case: Import knowledge from file
  test('should import knowledge from file', async ({ page }) => {
    // Navigate to knowledge base management page
    await page.goto(`${UAT_URL}/knowledge-bases`);
    
    // Find and click on the test knowledge base
    await page.click('text=UAT Test Knowledge Base');
    
    // Click import button
    await page.click('.import-kb-button');
    
    // Upload file
    await page.setInputFiles('input[type="file"]', './src/tests/uat/fixtures/knowledge-import.csv');
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify items were imported
    await expect(page.locator('.kb-item')).toHaveCount.greaterThan(2);
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Knowledge items imported successfully');
  });
  
  // Test case: Search knowledge base
  test('should search knowledge base', async ({ page }) => {
    // Navigate to knowledge base management page
    await page.goto(`${UAT_URL}/knowledge-bases`);
    
    // Find and click on the test knowledge base
    await page.click('text=UAT Test Knowledge Base');
    
    // Search for a term
    await page.fill('.kb-search-input', 'return');
    await page.click('.kb-search-button');
    
    // Verify search results
    await expect(page.locator('.kb-item')).toHaveCount(1);
    await expect(page.locator('.kb-item-question')).toContainText('What is the return policy?');
    
    // Clear search
    await page.click('.kb-search-clear');
    
    // Verify all items are shown
    await expect(page.locator('.kb-item')).toHaveCount.greaterThan(1);
  });
  
  // Test case: Delete knowledge base item
  test('should delete a knowledge base item', async ({ page }) => {
    // Navigate to knowledge base management page
    await page.goto(`${UAT_URL}/knowledge-bases`);
    
    // Find and click on the test knowledge base
    await page.click('text=UAT Test Knowledge Base');
    
    // Count initial items
    const initialCount = await page.locator('.kb-item').count();
    
    // Find and click delete on the first item
    await page.click('.kb-item:first-child .delete-kb-item-button');
    
    // Confirm deletion
    await page.click('.confirm-delete-button');
    
    // Verify item was deleted
    await expect(page.locator('.kb-item')).toHaveCount(initialCount - 1);
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Knowledge item deleted successfully');
  });
  
  // Test case: Delete knowledge base
  test('should delete a knowledge base', async ({ page }) => {
    // Navigate to knowledge base management page
    await page.goto(`${UAT_URL}/knowledge-bases`);
    
    // Find and click on the test knowledge base
    await page.click('text=UAT Test Knowledge Base');
    
    // Click delete button
    await page.click('.delete-kb-button');
    
    // Confirm deletion
    await Promise.all([
      page.click('.confirm-delete-button'),
      page.waitForNavigation()
    ]);
    
    // Verify knowledge base was deleted
    await expect(page.locator('text=UAT Test Knowledge Base')).not.toBeVisible();
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Knowledge base deleted successfully');
  });
});

// Test suite for creator role
test.describe('Knowledge Base Management (Creator Role)', () => {
  // Use authenticated creator context
  test.use({ storageState: './src/tests/uat/storage/creatorState.json' });
  
  // Test case: Creator can create knowledge base for their chatbot
  test('creator should be able to create a knowledge base for their chatbot', async ({ page }) => {
    // Navigate to knowledge base management page
    await page.goto(`${UAT_URL}/knowledge-bases`);
    
    // Click create button
    await page.click('.create-kb-button');
    
    // Fill in knowledge base details
    await page.fill('#name', 'Creator Test Knowledge Base');
    await page.fill('#description', 'A knowledge base created by a creator user');
    await page.selectOption('#type', 'document');
    
    // Select a chatbot (creator should only see their own)
    await page.click('.chatbot-selector');
    await page.click('text=Creator Test Chatbot');
    
    // Submit form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation()
    ]);
    
    // Verify knowledge base was created
    await expect(page.locator('.kb-name')).toContainText('Creator Test Knowledge Base');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Knowledge base created successfully');
  });
});
