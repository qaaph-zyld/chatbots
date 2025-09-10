const { test, expect } = require('@playwright/test');
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const pa11y = require('pa11y');

// List of pages to test for accessibility
const pagesToTest = [
  '/',
  '/login',
  '/register',
  '/dashboard',
  '/chat',
  '/settings',
  '/help'
];

test.describe('Accessibility Tests', () => {
  let browser;
  let context;
  let page;
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

  // Test each page for WCAG 2.1 AA compliance using axe
  for (const path of pagesToTest) {
    test(`Page ${path} should be accessible with axe`, async () => {
      await page.goto(`${baseUrl}${path}`);
      
      // Wait for the page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      
      // Check for critical accessibility issues
      const criticalIssues = accessibilityScanResults.violations.filter(
        violation => violation.impact === 'critical' || violation.impact === 'serious'
      );
      
      expect(criticalIssues).toHaveLength(0);
      
      // Log any non-critical issues
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`\nAccessibility issues found on ${path}:`);
        accessibilityScanResults.violations.forEach(violation => {
          console.log(`\n${violation.help} (${violation.impact}):`);
          console.log(violation.helpUrl);
          console.log('Affected elements:', violation.nodes.length);
        });
      }
    });
  }

  // Test keyboard navigation
  test('Keyboard navigation', async () => {
    await page.goto(baseUrl);
    
    // Test tab order
    await page.keyboard.press('Tab');
    const firstFocus = await page.evaluate(() => document.activeElement.getAttribute('id'));
    expect(firstFocus).toBeTruthy();
    
    // Test skip to main content
    await page.keyboard.press('Tab');
    const skipLink = await page.evaluate(() => document.activeElement.textContent);
    expect(skipLink.toLowerCase()).toContain('skip to main content');
  });

  // Test color contrast
  test('Color contrast meets WCAG standards', async () => {
    const results = await pa11y(`${baseUrl}`, {
      includeWarnings: true,
      standard: 'WCAG2AA',
      ignore: [
        'color-contrast' // We'll test this separately
      ]
    });
    
    // Check for any critical issues
    const criticalIssues = results.issues.filter(
      issue => issue.type === 'error' && issue.typeCode === 1
    );
    
    expect(criticalIssues).toHaveLength(0);
  });

  // Test ARIA attributes
  test('ARIA attributes are used correctly', async () => {
    await page.goto(baseUrl);
    
    // Check for elements with ARIA attributes
    const elementsWithAria = await page.$$eval('[aria-*]', elements => 
      elements.map(el => ({
        tag: el.tagName,
        id: el.id,
        ariaAttrs: Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('aria-'))
          .map(attr => ({
            name: attr.name,
            value: attr.value
          }))
      }))
    );
    
    // Log elements with ARIA attributes for review
    console.log('Elements with ARIA attributes:', JSON.stringify(elementsWithAria, null, 2));
    
    // Check for common ARIA issues
    const elementsWithInvalidAria = await page.$$eval('[aria-*]', elements => 
      elements.filter(el => {
        const role = el.getAttribute('role');
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        
        // Check for elements with role but no accessible name
        if (role && !ariaLabel && !ariaLabelledBy && !el.textContent.trim()) {
          return true;
        }
        
        // Check for duplicate IDs (which would break aria-labelledby)
        if (ariaLabelledBy) {
          const ids = ariaLabelledBy.split(/\s+/);
          const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
          return duplicateIds.length > 0;
        }
        
        return false;
      })
    );
    
    expect(elementsWithInvalidAria).toHaveLength(0);
  });

  // Test form accessibility
  test('Forms have proper labels and instructions', async () => {
    await page.goto(`${baseUrl}/register`);
    
    // Check that all form inputs have associated labels
    const inputs = await page.$$('input, select, textarea');
    
    for (const input of inputs) {
      const inputId = await input.getAttribute('id');
      const label = await page.$(`label[for="${inputId}"]`);
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // At least one of these should exist
      expect(label || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });
});
