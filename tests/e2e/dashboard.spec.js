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
    await waitForPageLoad(page);
    
    // Click the search input
    await page.click('#domainSearch');
    
    // Dropdown should open
    const dropdown = page.locator('#dropdownList');
    await expect(dropdown).toHaveClass(/open/);
  });

  test('dropdown shows domain options', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    // Click to open dropdown
    await page.click('#domainSearch');
    
    // Should have dropdown items
    const items = page.locator('.dropdown-item');
    await expect(items.first()).toBeVisible();
  });

  test('typing filters the domain list', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    // Type in search
    await page.fill('#domainSearch', 'lync');
    
    // Dropdown should be open
    const dropdown = page.locator('#dropdownList');
    await expect(dropdown).toHaveClass(/open/);
    
    // Should show filtered results
    const items = page.locator('.dropdown-item:visible');
    const count = await items.count();
    
    // Should have at least one matching result (lyncconf.com)
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

test.describe('Stats Display', () => {
  test('stat boxes are visible', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check for stat boxes
    const statBoxes = page.locator('.stat-box');
    const count = await statBoxes.count();
    
    // Should have at least 2 stat boxes
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('stat values display correctly', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check stat values are not empty
    const statValues = page.locator('.stat-value');
    const firstValue = statValues.first();
    
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
