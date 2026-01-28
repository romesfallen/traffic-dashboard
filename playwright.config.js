import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Support testing against production via PLAYWRIGHT_BASE_URL environment variable
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3456';
const isProduction = baseURL.includes('vercel.app') || baseURL.includes('https://');

// Auth state file for production testing
const authFile = path.join(process.cwd(), '.auth', 'user.json');
const hasAuthFile = fs.existsSync(authFile);

/**
 * Playwright configuration for E2E testing
 * @see https://playwright.dev/docs/test-configuration
 * 
 * To test against production:
 *   PLAYWRIGHT_BASE_URL=https://traffic-dashboard-theta.vercel.app npx playwright test
 * Or use the npm script:
 *   npm run test:e2e:prod
 */
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only (or when testing production)
  retries: process.env.CI ? 2 : (isProduction ? 1 : 0),

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation (supports production override)
    baseURL,

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video recording (off by default, enable for debugging)
    video: 'off',
  },

  // Configure projects for major browsers
  projects: [
    // Auth check runs first for production tests
    ...(isProduction ? [{
      name: 'auth-check',
      testMatch: /auth-check\.spec\.js/,
      use: { 
        ...devices['Desktop Chrome'],
        ...(hasAuthFile ? { storageState: authFile } : {}),
      },
    }] : []),
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use saved auth state for production testing (if available)
        ...(isProduction && hasAuthFile ? { storageState: authFile } : {}),
      },
      // Depend on auth-check for production
      ...(isProduction ? { dependencies: ['auth-check'] } : {}),
    },
    // Uncomment to test on more browsers:
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run local dev server before starting the tests (skip for production testing)
  webServer: isProduction ? undefined : {
    command: 'python3 -m http.server 3456',
    url: 'http://localhost:3456',
    reuseExistingServer: true,
    timeout: 10000,
  },

  // Timeout for each test
  timeout: 30000,

  // Timeout for each expect() assertion
  expect: {
    timeout: 5000,
  },
});
