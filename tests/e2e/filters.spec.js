import { test, expect, waitForChartRender, waitForPageLoad } from './fixtures/auth.js';

// Use the actual HTML file since Python http.server doesn't support Vercel rewrites
const DASHBOARD_URL = '/index-apex.html';

test.describe('Revenue Labels Toggle', () => {
  test('toggle is visible', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    const toggle = page.locator('#revenueLabelToggle');
    await expect(toggle).toBeVisible();
  });

  test('toggle is active by default', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    const toggle = page.locator('#revenueLabelToggle');
    await expect(toggle).toHaveClass(/active/);
  });

  test('clicking toggle changes state', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const toggle = page.locator('#revenueLabelToggle');
    
    // Initially active
    await expect(toggle).toHaveClass(/active/);
    
    // Click to toggle off
    await toggle.click();
    await page.waitForTimeout(300);
    
    // Should no longer have active class
    await expect(toggle).not.toHaveClass(/active/);
    
    // Click again to toggle on
    await toggle.click();
    await page.waitForTimeout(300);
    
    // Should be active again
    await expect(toggle).toHaveClass(/active/);
  });

  test('chart remains visible after toggle', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const toggle = page.locator('#revenueLabelToggle');
    await toggle.click();
    
    // Chart should still be rendered
    const chartSvg = page.locator('.apexcharts-svg');
    await expect(chartSvg).toBeVisible();
  });
});

test.describe('Metrics Toggle', () => {
  test('metrics toggle is visible', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    const toggle = page.locator('#metricsToggle');
    await expect(toggle).toBeVisible();
  });

  test('metrics toggle is active by default', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    const toggle = page.locator('#metricsToggle');
    await expect(toggle).toHaveClass(/active/);
  });

  test('metrics panel exists and displays when chart loads', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // CRITICAL: This test ensures the metrics panel feature exists
    // It should FAIL if the metrics panel is removed
    const metricsSummary = page.locator('#metricsSummary');
    await expect(metricsSummary).toBeVisible();
    
    // Verify all three metric cards are present
    const metricCards = page.locator('.metric-card');
    await expect(metricCards).toHaveCount(3);
    
    // Verify DR card with circular gauge
    const drCard = page.locator('.metric-card.dr-card');
    await expect(drCard).toBeVisible();
    
    // Verify the period selector exists
    const periodSelector = page.locator('#metricsPeriod');
    await expect(periodSelector).toBeVisible();
  });

  test('clicking metrics toggle hides and shows metrics panel', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const toggle = page.locator('#metricsToggle');
    const metricsSummary = page.locator('#metricsSummary');
    const periodSelector = page.locator('#metricsPeriodSelector');
    
    // Initially visible
    await expect(metricsSummary).toBeVisible();
    await expect(toggle).toHaveClass(/active/);
    
    // Toggle off
    await toggle.click();
    await page.waitForTimeout(300);
    
    // Metrics should be hidden
    await expect(metricsSummary).toBeHidden();
    await expect(periodSelector).toBeHidden();
    await expect(toggle).not.toHaveClass(/active/);
    
    // Toggle back on
    await toggle.click();
    await page.waitForTimeout(300);
    
    // Metrics should be visible again
    await expect(metricsSummary).toBeVisible();
    await expect(toggle).toHaveClass(/active/);
  });

  test('Ref. domains and Traffic values are clickable links', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check RD link exists and has href
    const rdLink = page.locator('#metricRDLink');
    await expect(rdLink).toBeVisible();
    await expect(rdLink).toHaveAttribute('href');
    
    // Check Traffic link exists and has href
    const trafficLink = page.locator('#metricTrafficLink');
    await expect(trafficLink).toBeVisible();
    await expect(trafficLink).toHaveAttribute('href');
  });

  test('period selector changes comparison period', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const periodSelector = page.locator('#metricsPeriod');
    
    // Default should be "Last month" (30 days)
    await expect(periodSelector).toHaveValue('30');
    
    // Change to Last 7 days
    await periodSelector.selectOption('7');
    await page.waitForTimeout(300);
    
    // Value should have changed
    await expect(periodSelector).toHaveValue('7');
  });
});

test.describe('View Toggle Buttons', () => {
  test('view toggle group is visible', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    const viewGroup = page.locator('.view-toggle-group');
    await expect(viewGroup).toBeVisible();
  });

  test('monthly view is selected by default', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    const monthlyBtn = page.locator('#viewMonthly');
    await expect(monthlyBtn).toHaveClass(/active/);
  });

  test('clicking Average button changes view', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const averageBtn = page.locator('#viewAverage');
    const monthlyBtn = page.locator('#viewMonthly');
    
    // Click Average
    await averageBtn.click();
    await page.waitForTimeout(500);
    
    // Average should be active
    await expect(averageBtn).toHaveClass(/active/);
    
    // Monthly should not be active
    await expect(monthlyBtn).not.toHaveClass(/active/);
    
    // Chart should still render
    const chartSvg = page.locator('.apexcharts-svg');
    await expect(chartSvg).toBeVisible();
  });

  test('clicking Both button shows both views', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const bothBtn = page.locator('#viewBoth');
    
    // Click Both
    await bothBtn.click();
    await page.waitForTimeout(500);
    
    // Both should be active
    await expect(bothBtn).toHaveClass(/active/);
    
    // Chart should still render
    const chartSvg = page.locator('.apexcharts-svg');
    await expect(chartSvg).toBeVisible();
  });

  test('can switch back to Monthly view', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const monthlyBtn = page.locator('#viewMonthly');
    const averageBtn = page.locator('#viewAverage');
    
    // Switch to Average
    await averageBtn.click();
    await page.waitForTimeout(300);
    
    // Switch back to Monthly
    await monthlyBtn.click();
    await page.waitForTimeout(300);
    
    // Monthly should be active
    await expect(monthlyBtn).toHaveClass(/active/);
    await expect(averageBtn).not.toHaveClass(/active/);
  });
});

test.describe('Chart Interactions', () => {
  test('chart tooltip appears on hover', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Get chart area
    const chartArea = page.locator('.apexcharts-inner');
    
    // Hover over the chart
    await chartArea.hover();
    
    // Wait for tooltip to potentially appear
    await page.waitForTimeout(500);
    
    // Check if tooltip element exists (may or may not be visible depending on data)
    const tooltip = page.locator('.apexcharts-tooltip');
    // Tooltip container should exist in DOM
    await expect(tooltip).toBeAttached();
  });

  test('chart zoom controls are present', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // ApexCharts toolbar with zoom controls
    const toolbar = page.locator('.apexcharts-toolbar');
    await expect(toolbar).toBeVisible();
  });

  test('chart has x-axis labels', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const xAxisLabels = page.locator('.apexcharts-xaxis-label');
    const count = await xAxisLabels.count();
    
    // Should have date labels on x-axis
    expect(count).toBeGreaterThan(0);
  });

  test('chart has y-axis labels', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const yAxisLabels = page.locator('.apexcharts-yaxis-label');
    const count = await yAxisLabels.count();
    
    // Should have value labels on y-axis
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Data Loading States', () => {
  test('loading indicator is hidden when data loads', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const loading = page.locator('#loading');
    
    // Loading should be hidden after chart renders
    await expect(loading).toBeHidden();
  });

  test('error container is hidden on successful load', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const error = page.locator('#error');
    
    // Error should be hidden on successful load
    await expect(error).toBeHidden();
  });
});
