/**
 * Authentication Check - Runs first to verify auth state
 * 
 * This test fails early with a clear message if:
 * - Auth file is missing
 * - Auth session has expired
 * - User is not logged in
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.join(process.cwd(), '.auth', 'user.json');

test.describe('Authentication Status', () => {
  
  test('SETUP: Check authentication is configured', async ({ page }) => {
    // Check if auth file exists
    const hasAuthFile = fs.existsSync(authFile);
    
    if (!hasAuthFile) {
      console.error('\n');
      console.error('╔═══════════════════════════════════════════════════════════════════╗');
      console.error('║  ❌ AUTHENTICATION NOT SET UP                                      ║');
      console.error('║                                                                   ║');
      console.error('║  No saved login session found at .auth/user.json                 ║');
      console.error('║                                                                   ║');
      console.error('║  To fix this, run:                                               ║');
      console.error('║    npm run test:e2e:auth                                         ║');
      console.error('║                                                                   ║');
      console.error('║  This will open a browser for you to log in with Google.         ║');
      console.error('║  Your session will be saved for future test runs.                ║');
      console.error('╚═══════════════════════════════════════════════════════════════════╝');
      console.error('\n');
      
      throw new Error('Authentication not configured. Run: npm run test:e2e:auth');
    }
    
    // Check if session might be expired (file older than 24 hours)
    const stats = fs.statSync(authFile);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    
    if (ageHours > 24) {
      console.warn('\n');
      console.warn('╔═══════════════════════════════════════════════════════════════════╗');
      console.warn('║  ⚠️  SESSION MAY BE EXPIRED                                        ║');
      console.warn('║                                                                   ║');
      console.warn(`║  Auth file is ${Math.round(ageHours)} hours old (expires after 24 hours)        ║`);
      console.warn('║                                                                   ║');
      console.warn('║  If tests fail with auth errors, refresh your session:           ║');
      console.warn('║    npm run test:e2e:auth                                         ║');
      console.warn('╚═══════════════════════════════════════════════════════════════════╝');
      console.warn('\n');
    }
    
    // Verify we can actually access the page (not redirected to login)
    await page.goto('/');
    
    // Wait a moment for any redirects
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    
    // Check if we're on the login page or access denied page
    if (currentUrl.includes('/api/auth/login') || currentUrl.includes('accounts.google.com')) {
      console.error('\n');
      console.error('╔═══════════════════════════════════════════════════════════════════╗');
      console.error('║  ❌ SESSION EXPIRED                                               ║');
      console.error('║                                                                   ║');
      console.error('║  Your saved login session has expired.                           ║');
      console.error('║                                                                   ║');
      console.error('║  To fix this, run:                                               ║');
      console.error('║    npm run test:e2e:auth                                         ║');
      console.error('║                                                                   ║');
      console.error('║  Log in again and your session will be refreshed.                ║');
      console.error('╚═══════════════════════════════════════════════════════════════════╝');
      console.error('\n');
      
      throw new Error('Session expired. Run: npm run test:e2e:auth');
    }
    
    if (currentUrl.includes('access-denied')) {
      throw new Error('Access denied - your email may not be in the allowed list');
    }
    
    // Verify we can see the dashboard content
    const hasContent = await page.locator('#domainSearch, .apexcharts-canvas, #chart').first().isVisible({ timeout: 10000 }).catch(() => false);
    
    if (!hasContent) {
      console.error('\n');
      console.error('╔═══════════════════════════════════════════════════════════════════╗');
      console.error('║  ❌ AUTHENTICATION FAILED                                         ║');
      console.error('║                                                                   ║');
      console.error('║  Could not verify dashboard access.                              ║');
      console.error('║  Current URL: ' + currentUrl.substring(0, 50).padEnd(50) + '  ║');
      console.error('║                                                                   ║');
      console.error('║  Try refreshing your session:                                    ║');
      console.error('║    npm run test:e2e:auth                                         ║');
      console.error('╚═══════════════════════════════════════════════════════════════════╝');
      console.error('\n');
      
      throw new Error('Authentication failed - dashboard not accessible');
    }
    
    console.log('\n✅ Authentication verified - dashboard is accessible\n');
  });
});
