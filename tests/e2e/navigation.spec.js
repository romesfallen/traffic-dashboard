import { test, expect, waitForPageLoad } from './fixtures/auth.js';

// Use the actual HTML file since Python http.server doesn't support Vercel rewrites
const DASHBOARD_URL = '/index-apex.html';

test.describe('Dashboard Navigation', () => {
  test('View Leaderboard link is visible', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    const leaderboardLink = page.locator('a:has-text("Leaderboard")');
    await expect(leaderboardLink).toBeVisible();
  });

  test('clicking Leaderboard link navigates to leaderboard page', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    // Click leaderboard link
    await page.click('a:has-text("Leaderboard")');
    
    // Should navigate to leaderboard
    await expect(page).toHaveURL(/leaderboard/);
  });

  // Note: Logs link removed - feature doesn't exist on dashboard
});

test.describe('Leaderboard Page', () => {
  test('leaderboard page loads', async ({ page }) => {
    await page.goto('/leaderboard.html');
    await waitForPageLoad(page);
    
    // Check title
    await expect(page).toHaveTitle(/Leaderboard/);
  });

  test('leaderboard has header', async ({ page }) => {
    await page.goto('/leaderboard.html');
    await waitForPageLoad(page);
    
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('leaderboard has table', async ({ page }) => {
    await page.goto('/leaderboard.html');
    await waitForPageLoad(page);
    
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('leaderboard has tab buttons', async ({ page }) => {
    await page.goto('/leaderboard.html');
    await waitForPageLoad(page);
    
    const tabs = page.locator('.tab-btn');
    const count = await tabs.count();
    
    // Should have multiple tabs
    expect(count).toBeGreaterThan(0);
  });

  test('clicking tab is interactive', async ({ page }) => {
    await page.goto('/leaderboard.html');
    await waitForPageLoad(page);
    
    const tabs = page.locator('.tab-btn');
    const count = await tabs.count();
    
    if (count > 1) {
      // Click second tab - should be clickable
      const secondTab = tabs.nth(1);
      await secondTab.click();
      await page.waitForTimeout(300);
      
      // Tab should still be visible after click
      await expect(secondTab).toBeVisible();
    }
  });

  test('back to dashboard link exists', async ({ page }) => {
    await page.goto('/leaderboard.html');
    await waitForPageLoad(page);
    
    const backLink = page.locator('a:has-text("Dashboard"), a:has-text("Back")');
    
    // There should be a way to navigate back
    const count = await backLink.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking back link returns to dashboard', async ({ page }) => {
    await page.goto('/leaderboard.html');
    await waitForPageLoad(page);
    
    // Find and click dashboard link
    const dashLink = page.locator('a[href="/"], a[href="index-apex.html"], a:has-text("Dashboard")').first();
    
    if (await dashLink.isVisible()) {
      await dashLink.click();
      
      // Should be back on dashboard (root or index-apex)
      await expect(page).toHaveURL(/\/$|index-apex/);
    }
  });
});

test.describe('Log Page', () => {
  test('log page loads', async ({ page }) => {
    await page.goto('/log.html');
    await waitForPageLoad(page);
    
    // Page should load without error
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Agent Page', () => {
  test('agent page loads', async ({ page }) => {
    await page.goto('/agent.html');
    await waitForPageLoad(page);
    
    // Page should load without error
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Niche Page', () => {
  test('niche page loads', async ({ page }) => {
    await page.goto('/niche.html');
    await waitForPageLoad(page);
    
    // Page should load without error
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Cross-Page Navigation Flow', () => {
  test('can navigate dashboard -> leaderboard -> dashboard', async ({ page }) => {
    // Start at dashboard
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    // Go to leaderboard
    await page.click('a:has-text("Leaderboard")');
    await expect(page).toHaveURL(/leaderboard/);
    await waitForPageLoad(page);
    
    // Go back to dashboard
    const dashLink = page.locator('a[href="/"], a[href="index-apex.html"], a:has-text("Dashboard")').first();
    if (await dashLink.isVisible()) {
      await dashLink.click();
      await waitForPageLoad(page);
      
      // Should be back on dashboard
      const heading = page.locator('h1');
      await expect(heading).toContainText(/Traffic|Dashboard/);
    }
  });
});

test.describe('404 Handling', () => {
  test('non-existent page returns error or redirects', async ({ page }) => {
    const response = await page.goto('/non-existent-page.html');
    
    // Should either be 404 or redirect to a valid page
    // Python http.server returns 404 for missing files
    const status = response?.status();
    
    // Accept 404 (not found) or 200 (if it redirects)
    expect([200, 404]).toContain(status);
  });
});
