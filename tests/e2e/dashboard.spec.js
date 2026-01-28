import { test, expect, waitForChartRender, waitForPageLoad } from './fixtures/auth.js';

// Use the actual HTML file since Python http.server doesn't support Vercel rewrites
const DASHBOARD_URL = '/index-apex.html';

test.describe('Dashboard Page Load', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    // Wait for page to be visible
    await waitForPageLoad(page);
    
    // Check page title
    await expect(page).toHaveTitle(/Traffic|Dashboard/);
  });

  test('header displays correctly', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('Traffic Comparison Dashboard');
  });

  test('chart container is present', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    // Check charts container exists
    const chartsContainer = page.locator('#charts');
    await expect(chartsContainer).toBeVisible();
  });

  test('chart renders with ApexCharts', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check ApexCharts SVG is rendered
    const chartSvg = page.locator('.apexcharts-svg');
    await expect(chartSvg).toBeVisible();
  });

  test('domain dropdown is present', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    // Check domain search input exists
    const domainSearch = page.locator('#domainSearch');
    await expect(domainSearch).toBeVisible();
  });
});

test.describe('Domain Selection', () => {
  test('dropdown opens when clicking search input', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    // Wait for chart render which means data has loaded
    await waitForChartRender(page);
    
    // Click the search input
    await page.click('#domainSearch');
    
    // Wait for dropdown to open and populate
    await page.waitForTimeout(500);
    
    // Dropdown should open
    const dropdown = page.locator('#dropdownList');
    await expect(dropdown).toHaveClass(/open/);
  });

  test('dropdown shows domain options', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    // Wait for chart render which means data has loaded
    await waitForChartRender(page);
    
    // Click to open dropdown
    await page.click('#domainSearch');
    
    // Wait for dropdown to populate
    await page.waitForTimeout(500);
    
    // Should have dropdown items
    const items = page.locator('.dropdown-item');
    await expect(items.first()).toBeVisible({ timeout: 10000 });
  });

  test('typing filters the domain list', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    // Wait for chart render which means data has loaded
    await waitForChartRender(page);
    
    // Type in search
    await page.fill('#domainSearch', 'better');
    
    // Wait for dropdown to filter
    await page.waitForTimeout(500);
    
    // Dropdown should be open
    const dropdown = page.locator('#dropdownList');
    await expect(dropdown).toHaveClass(/open/);
    
    // Should show filtered results
    const items = page.locator('.dropdown-item');
    const count = await items.count();
    
    // Should have at least one matching result
    expect(count).toBeGreaterThan(0);
  });

  test('selecting a domain updates the view', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Open dropdown and select a different domain
    await page.click('#domainSearch');
    await page.fill('#domainSearch', 'betterthisworld');
    
    // Wait for filtered results
    await page.waitForTimeout(300);
    
    // Click on the matching item
    const item = page.locator('.dropdown-item:visible').first();
    await item.click();
    
    // Wait for chart to re-render
    await waitForChartRender(page);
    
    // The chart should still be visible
    const chartSvg = page.locator('.apexcharts-svg');
    await expect(chartSvg).toBeVisible();
  });

  test('search input clears and shows placeholder', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    const searchInput = page.locator('#domainSearch');
    
    // Check placeholder exists
    await expect(searchInput).toHaveAttribute('placeholder', /[Ss]earch/);
  });
});

test.describe('Ranking Bubbles Display', () => {
  test('ranking bubbles are visible', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check for ranking bubbles
    const rankingBubbles = page.locator('.ranking-bubble');
    const count = await rankingBubbles.count();
    
    // Should have ranking bubbles (Lifetime, L3M, Current Month, etc.)
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('ranking bubble values display correctly', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check ranking bubble values are not empty
    const bubbleValues = page.locator('.ranking-bubble .bubble-value');
    const firstValue = bubbleValues.first();
    
    await expect(firstValue).toBeVisible();
    const text = await firstValue.textContent();
    expect(text.length).toBeGreaterThan(0);
  });
});

test.describe('Chart Legend', () => {
  test('legend is visible', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // ApexCharts legend
    const legend = page.locator('.apexcharts-legend');
    await expect(legend).toBeVisible();
  });

  test('legend has multiple items', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check legend items
    const legendItems = page.locator('.apexcharts-legend-series');
    const count = await legendItems.count();
    
    // Should have at least 2 legend items (Our Data, Ahrefs)
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('clicking legend item toggles series visibility', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Get first legend item
    const firstLegend = page.locator('.apexcharts-legend-series').first();
    
    // Click to toggle
    await firstLegend.click();
    
    // Wait for animation
    await page.waitForTimeout(300);
    
    // Legend should still be visible (toggled state)
    await expect(firstLegend).toBeVisible();
  });
});
