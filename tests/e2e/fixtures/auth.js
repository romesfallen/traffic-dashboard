import { test as base } from '@playwright/test';
import crypto from 'crypto';

/**
 * Test secret for generating mock auth tokens
 * In real tests, this would need to match the server's SESSION_SECRET
 * For static file serving (python http.server), auth is bypassed anyway
 */
const TEST_SECRET = 'test-secret-for-e2e-testing';

/**
 * Create a mock JWT token for testing
 */
function createMockToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', TEST_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Default test user
 */
const TEST_USER = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/photo.jpg',
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
};

/**
 * Extended test fixture with authentication helpers
 */
export const test = base.extend({
  /**
   * Authenticated page - has auth cookie set
   */
  authenticatedPage: async ({ page }, use) => {
    // Create mock auth token
    const token = createMockToken(TEST_USER);
    
    // Set the auth cookie before navigating
    await page.context().addCookies([
      {
        name: 'auth_session',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false, // localhost doesn't use HTTPS
        sameSite: 'Lax',
      },
    ]);
    
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
