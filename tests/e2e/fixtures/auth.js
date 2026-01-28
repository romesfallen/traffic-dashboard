import { test as base } from '@playwright/test';

/**
 * E2E Test Token for bypassing authentication
 * Set via environment variable: E2E_TEST_TOKEN
 */
const E2E_TEST_TOKEN = process.env.E2E_TEST_TOKEN || '';

/**
 * Default test user
 */
const TEST_USER = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/photo.jpg',
};

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend({
  /**
   * Override the default page fixture to intercept API requests
   * and add the X-Test-Token header for authentication bypass
   */
  page: async ({ page }, use) => {
    // Intercept all API requests and add the test token header
    if (E2E_TEST_TOKEN) {
      await page.route('**/api/**', async (route) => {
        const headers = {
          ...route.request().headers(),
          'X-Test-Token': E2E_TEST_TOKEN,
        };
        await route.continue({ headers });
      });
    }
    
    await use(page);
  },

  /**
   * Test user info
   */
  testUser: async ({}, use) => {
    await use(TEST_USER);
  },
});

export { expect } from '@playwright/test';

/**
 * Helper to wait for chart to be fully rendered
 */
export async function waitForChartRender(page) {
  // Wait for ApexCharts SVG to appear
  await page.waitForSelector('.apexcharts-svg', { timeout: 10000 });
  
  // Wait a bit for animations to complete
  await page.waitForTimeout(500);
}

/**
 * Helper to wait for page to be fully loaded (body visible)
 */
export async function waitForPageLoad(page) {
  await page.waitForFunction(() => {
    const body = document.body;
    return body && getComputedStyle(body).visibility !== 'hidden';
  }, { timeout: 10000 });
}
