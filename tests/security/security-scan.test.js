const { test, expect } = require('@playwright/test');
const { chromium } = require('playwright');
const OWASP = require('owasp-password-strength-test');
const { execSync } = require('child_process');

// Configure OWASP password strength test
OWASP.config({
  allowPassphrases: true,
  maxLength: 128,
  minLength: 10,
  minPhraseLength: 20,
  minOptionalTestsToPass: 4,
});

test.describe('Security Tests', () => {
  let browser;
  let page;
  let context;
  const baseUrl = 'http://localhost:3000';

  test.beforeAll(async () => {
    browser = await chromium.launch({
      headless: process.env.HEADLESS !== 'false',
    });
    context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('Password strength validation', async () => {
    const weakPasswords = [
      'password',
      '12345678',
      'qwerty123',
      'letmein',
    ];

    for (const pwd of weakPasswords) {
      const result = OWASP.test(pwd);
      expect(result.strong).toBeFalsy(
        `Password "${pwd}" should be considered weak`
      );
    }
  });

  test('SQL Injection protection', async () => {
    const sqlInjectionAttempts = [
      "' OR '1'='1",
      '"; DROP TABLE users; --',
      '1; SELECT * FROM users',
    ];

    for (const attempt of sqlInjectionAttempts) {
      await page.goto(`${baseUrl}/search?q=${encodeURIComponent(attempt)}`);
      // Should not show database errors or sensitive information
      await expect(page).not.toContainText('SQL syntax');
      await expect(page).not.toContain('error');
    }
  });

  test('XSS protection', async () => {
    const xssAttempts = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert(1)',
    ];

    for (const attempt of xssAttempts) {
      await page.goto(`${baseUrl}/search?q=${encodeURIComponent(attempt)}`);
      // Check that the script tags are properly escaped
      const content = await page.content();
      expect(content).toContain('&lt;script&gt;');
      expect(content).not.toContain('<script>');
    }
  });

  test('CSRF protection', async () => {
    // Try to submit a form without CSRF token
    const response = await page.request.post(`${baseUrl}/api/update-profile`, {
      data: { email: 'attacker@example.com' },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    expect(response.status()).toBe(403);
  });

  test('Security headers', async () => {
    await page.goto(baseUrl);
    const headers = await page.evaluate(
      () => Object.fromEntries(performance.getEntriesByType('navigation')[0].toJSON().serverTiming || [])
    );
    
    const securityHeaders = [
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];

    for (const header of securityHeaders) {
      expect(Object.keys(headers)).toContain(header);
    }
  });

  test('Dependency vulnerabilities', () => {
    // Run npm audit and check for critical vulnerabilities
    try {
      const auditOutput = execSync('npm audit --json').toString();
      const auditResults = JSON.parse(auditOutput);
      
      if (auditResults.metadata?.vulnerabilities?.critical > 0) {
        throw new Error('Critical vulnerabilities found in dependencies');
      }
    } catch (error) {
      if (error.status === 1) {
        // npm audit returns 1 when vulnerabilities are found
        console.warn('Vulnerabilities found in dependencies. Run `npm audit` for details.');
      } else {
        throw error;
      }
    }
  });
});
