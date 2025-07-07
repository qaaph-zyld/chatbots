/**
 * End-to-End Test for Chatbot Flow
 * 
 * Tests the complete user journey from creating a chatbot to having a conversation
 */

const { test, expect } = require('@playwright/test');
const { v4: uuidv4 } = require('uuid');

// Test data
const testUser = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'password123'
};

const testChatbot = {
  name: `E2E Test Bot ${uuidv4().substring(0, 8)}`,
  description: 'A chatbot for end-to-end testing'
};

// Test the complete chatbot flow
test.describe('Chatbot Flow', () => {
  let page;
  let chatbotId;
  let integrationId;
  let chatbotUrl;

  // Before all tests, log in to the admin panel
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in login form
    await page.fill('#email', testUser.email);
    await page.fill('#password', testUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('.dashboard-header');
  });

  // After all tests, clean up
  test.afterAll(async () => {
    // Delete the test chatbot if it was created
    if (chatbotId) {
      await page.goto('/dashboard/chatbots');
      await page.click(`[data-chatbot-id="${chatbotId}"] .delete-button`);
      await page.click('.confirm-delete-button');
    }
    
    await page.close();
  });

  // Test creating a new chatbot
  test('should create a new chatbot', async () => {
    // Navigate to chatbot creation page
    await page.goto('/dashboard/chatbots/new');
    
    // Fill in chatbot form
    await page.fill('#name', testChatbot.name);
    await page.fill('#description', testChatbot.description);
    await page.selectOption('#language', 'en');
    await page.selectOption('#personality', 'friendly');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('.success-message');
    
    // Get the chatbot ID from the URL
    const url = page.url();
    chatbotId = url.split('/').pop();
    
    // Verify chatbot was created
    expect(await page.textContent('.chatbot-name')).toBe(testChatbot.name);
  });

  // Test creating a web integration
  test('should create a web integration', async () => {
    // Navigate to integrations page
    await page.goto(`/dashboard/chatbots/${chatbotId}/integrations`);
    
    // Click create integration button
    await page.click('.create-integration-button');
    
    // Fill in integration form
    await page.fill('#name', 'Web Integration');
    await page.selectOption('#platform', 'web');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await page.waitForSelector('.success-message');
    
    // Get the integration ID
    const integrationElement = await page.waitForSelector('.integration-item');
    integrationId = await integrationElement.getAttribute('data-integration-id');
    
    // Verify integration was created
    expect(await page.textContent('.integration-name')).toBe('Web Integration');
    expect(await page.textContent('.integration-platform')).toBe('web');
    expect(await page.textContent('.integration-status')).toBe('inactive');
  });

  // Test activating the integration
  test('should activate the integration', async () => {
    // Navigate to integration details page
    await page.goto(`/dashboard/integrations/${integrationId}`);
    
    // Click activate button
    await page.click('.activate-button');
    
    // Wait for status to change
    await page.waitForSelector('.integration-status:has-text("active")');
    
    // Verify integration is active
    expect(await page.textContent('.integration-status')).toBe('active');
    
    // Get the chatbot URL
    chatbotUrl = await page.textContent('.integration-url');
  });

  // Test the chatbot widget
  test('should load the chatbot widget', async ({ browser }) => {
    // Open a new page for the chatbot widget
    const widgetPage = await browser.newPage();
    
    // Navigate to the test page with the chatbot widget
    await widgetPage.goto(chatbotUrl);
    
    // Wait for the chatbot widget to load
    await widgetPage.waitForSelector('.chatbot-widget');
    
    // Open the chatbot
    await widgetPage.click('.chatbot-widget-button');
    
    // Verify chatbot is open
    await widgetPage.waitForSelector('.chatbot-widget-container.open');
    
    // Verify chatbot name is displayed
    expect(await widgetPage.textContent('.chatbot-widget-header-name')).toBe(testChatbot.name);
    
    await widgetPage.close();
  });

  // Test having a conversation with the chatbot
  test('should have a conversation with the chatbot', async ({ browser }) => {
    // Open a new page for the chatbot widget
    const widgetPage = await browser.newPage();
    
    // Navigate to the test page with the chatbot widget
    await widgetPage.goto(chatbotUrl);
    
    // Wait for the chatbot widget to load
    await widgetPage.waitForSelector('.chatbot-widget');
    
    // Open the chatbot
    await widgetPage.click('.chatbot-widget-button');
    
    // Wait for the chatbot to open
    await widgetPage.waitForSelector('.chatbot-widget-container.open');
    
    // Send a message
    await widgetPage.fill('.chatbot-widget-input', 'Hello');
    await widgetPage.click('.chatbot-widget-send-button');
    
    // Wait for the response
    await widgetPage.waitForSelector('.chatbot-widget-message.bot');
    
    // Verify the message was sent and a response was received
    const userMessages = await widgetPage.$$('.chatbot-widget-message.user');
    const botMessages = await widgetPage.$$('.chatbot-widget-message.bot');
    
    expect(userMessages.length).toBe(1);
    expect(botMessages.length).toBeGreaterThanOrEqual(1);
    
    // Send another message
    await widgetPage.fill('.chatbot-widget-input', 'What can you help me with?');
    await widgetPage.click('.chatbot-widget-send-button');
    
    // Wait for the response
    await widgetPage.waitForSelector('.chatbot-widget-message.bot:nth-child(4)');
    
    // Verify the second message was sent and a response was received
    const updatedUserMessages = await widgetPage.$$('.chatbot-widget-message.user');
    const updatedBotMessages = await widgetPage.$$('.chatbot-widget-message.bot');
    
    expect(updatedUserMessages.length).toBe(2);
    expect(updatedBotMessages.length).toBeGreaterThanOrEqual(2);
    
    await widgetPage.close();
  });

  // Test viewing analytics
  test('should show analytics for the conversation', async () => {
    // Navigate to analytics page
    await page.goto(`/dashboard/chatbots/${chatbotId}/analytics`);
    
    // Wait for analytics to load
    await page.waitForSelector('.analytics-container');
    
    // Verify analytics are displayed
    expect(await page.textContent('.total-conversations')).not.toBe('0');
    expect(await page.textContent('.total-messages')).not.toBe('0');
    
    // Check for conversation in the list
    const conversationElements = await page.$$('.conversation-item');
    expect(conversationElements.length).toBeGreaterThanOrEqual(1);
  });
});
