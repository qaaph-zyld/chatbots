const { test, expect } = require('@playwright/test');
const { chromium } = require('playwright');

// Test suite for critical user flows
test.describe('Critical User Flows', () => {
  let browser;
  let page;
  let context;

  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      slowMo: 100
    });
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Complete user registration flow', async () => {
    await page.goto('http://localhost:3000/register');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
    await expect(page).toHaveText('.welcome-message', /Welcome/);
  });

  test('Complete chatbot conversation flow', async () => {
    await page.goto('http://localhost:3000/chat');
    await page.fill('#chat-input', 'Hello, can you help me?');
    await page.click('#send-button');
    await expect(page.locator('.chat-message:last-child')).toContainText('How can I assist you today?');
  });

  test('Complete payment flow', async () => {
    await page.goto('http://localhost:3000/upgrade');
    await page.click('.plan-premium');
    await page.fill('#card-number', '4242 4242 4242 4242');
    await page.fill('#expiry', '12/25');
    await page.fill('#cvc', '123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/success/);
    await expect(page).toHaveText('.success-message', /upgraded successfully/);
  });

  test('Test error handling for failed payment', async () => {
    await page.goto('http://localhost:3000/upgrade');
    await page.click('.plan-premium');
    await page.fill('#card-number', '4000 0000 0000 0002'); // Test card that will be declined
    await page.fill('#expiry', '12/25');
    await page.fill('#cvc', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toBeVisible();
  });
});
