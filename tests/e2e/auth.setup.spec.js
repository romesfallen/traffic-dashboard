/**
 * Authentication Setup Script
 * 
 * Run this once to save your logged-in session:
 *   npx playwright test tests/auth.setup.js --headed
 * 
 * This will:
 * 1. Open a browser to the login page
 * 2. Wait for you to log in manually with Google
 * 3. Save your session cookies to .auth/user.json
 * 4. Tests will then use these cookies automatically
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(process.cwd(), '.auth', 'user.json');

test('Save authentication session', async ({ page }) => {
  // Ensure .auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Go to the dashboard (will redirect to login if not authenticated)
  await page.goto('https://traffic-dashboard-theta.vercel.app/');
  
  console.log('\n========================================');
  console.log('Please log in with Google in the browser');
  console.log('The script will continue automatically');
  console.log('after you complete the login.');
  console.log('========================================\n');

  // Wait for successful login - look for something that only appears when logged in
  // Adjust this selector based on what appears after login
  await page.waitForSelector('#domainSearch, .domain-search, [id*="domain"]', { 
    timeout: 120000 // 2 minutes to complete login
  });

  console.log('\n✅ Login successful! Saving session...\n');

  // Save the authentication state
  await page.context().storageState({ path: authFile });

  console.log(`✅ Session saved to ${authFile}`);
  console.log('\nYou can now run tests with: npm run test:e2e:prod');
});
