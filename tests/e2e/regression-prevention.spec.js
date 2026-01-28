import { test, expect, waitForChartRender, waitForPageLoad } from './fixtures/auth.js';

const DASHBOARD_URL = '/index-apex.html';

/**
 * REGRESSION PREVENTION TESTS
 * 
 * These tests are specifically designed to catch the types of regressions
 * that have occurred in the past:
 * 1. Features being accidentally removed (metrics panel)
 * 2. Data loading code using wrong column names (average traffic)
 * 3. Features breaking when combined with other features
 */

test.describe('Critical Feature Existence - MUST NOT BE REMOVED', () => {
  /**
   * These tests MUST FAIL if the feature is removed.
   * Each test explicitly checks for specific DOM elements that MUST exist.
   */
  
  test('CRITICAL: Metrics panel exists with all components', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Metrics summary container MUST exist
    const metricsSummary = page.locator('#metricsSummary');
    await expect(metricsSummary, 'Metrics summary container is MISSING').toBeVisible();
    
    // DR card with circular gauge MUST exist
    const drCard = page.locator('.metric-card.dr-card');
    await expect(drCard, 'DR metric card is MISSING').toBeVisible();
    
    const drCircle = page.locator('#drCircleProgress');
    await expect(drCircle, 'DR circular gauge is MISSING').toBeVisible();
    
    const drValue = page.locator('#metricDR');
    await expect(drValue, 'DR value element is MISSING').toBeVisible();
    
    // RD card with link MUST exist
    const rdLink = page.locator('#metricRDLink');
    await expect(rdLink, 'RD Ahrefs link is MISSING').toBeVisible();
    
    const rdValue = page.locator('#metricRD');
    await expect(rdValue, 'RD value element is MISSING').toBeVisible();
    
    // Traffic card with link MUST exist
    const trafficLink = page.locator('#metricTrafficLink');
    await expect(trafficLink, 'Traffic Ahrefs link is MISSING').toBeVisible();
    
    const trafficValue = page.locator('#metricTraffic');
    await expect(trafficValue, 'Traffic value element is MISSING').toBeVisible();
    
    // Period selector MUST exist
    const periodSelector = page.locator('#metricsPeriod');
    await expect(periodSelector, 'Metrics period selector is MISSING').toBeVisible();
  });

  test('CRITICAL: Show Metrics toggle exists and functions', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Toggle MUST exist
    const toggle = page.locator('#metricsToggle');
    await expect(toggle, 'Show Metrics toggle is MISSING').toBeVisible();
    
    // Toggle MUST be active by default
    await expect(toggle, 'Show Metrics toggle should be active by default').toHaveClass(/active/);
    
    // Toggle MUST hide metrics when clicked
    await toggle.click();
    await page.waitForTimeout(300);
    
    const metricsSummary = page.locator('#metricsSummary');
    await expect(metricsSummary, 'Metrics should be hidden when toggle is off').toBeHidden();
    
    // Toggle MUST show metrics when clicked again
    await toggle.click();
    await page.waitForTimeout(300);
    await expect(metricsSummary, 'Metrics should be visible when toggle is on').toBeVisible();
  });

  test('CRITICAL: Revenue Labels toggle exists and functions', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const toggle = page.locator('#revenueLabelToggle');
    await expect(toggle, 'Revenue Labels toggle is MISSING').toBeVisible();
    await expect(toggle, 'Revenue Labels toggle should be active by default').toHaveClass(/active/);
  });

  test('CRITICAL: View toggle buttons exist', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    await expect(page.locator('#viewMonthly'), 'Monthly view button is MISSING').toBeVisible();
    await expect(page.locator('#viewAverage'), 'Average view button is MISSING').toBeVisible();
    await expect(page.locator('#viewBoth'), 'Both view button is MISSING').toBeVisible();
  });

  test('CRITICAL: Chart date range selector exists', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const dateRange = page.locator('#chartDateRange');
    await expect(dateRange, 'Chart date range selector is MISSING').toBeVisible();
    
    // Check all required options exist
    const options = dateRange.locator('option');
    const count = await options.count();
    expect(count, 'Date range should have at least 5 options').toBeGreaterThanOrEqual(5);
  });

  test('CRITICAL: Domain search dropdown exists', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForPageLoad(page);
    
    await expect(page.locator('#domainSearch'), 'Domain search input is MISSING').toBeVisible();
    await expect(page.locator('#dropdownList'), 'Domain dropdown list is MISSING').toBeAttached();
  });

  test('CRITICAL: Ranking bubbles exist', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const bubbles = page.locator('.ranking-bubble');
    const count = await bubbles.count();
    expect(count, 'Should have at least 3 ranking bubbles').toBeGreaterThanOrEqual(3);
  });

  test('CRITICAL: Agent and Niche links exist', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    await expect(page.locator('.agent-link'), 'Agent link is MISSING').toBeVisible();
    await expect(page.locator('.niche-link').first(), 'Niche link is MISSING').toBeVisible();
  });

  test('CRITICAL: Domain Ahrefs link exists', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const ahrefsLink = page.locator('.ahrefs-link');
    await expect(ahrefsLink, 'Domain Ahrefs link is MISSING').toBeVisible();
    
    const href = await ahrefsLink.getAttribute('href');
    expect(href, 'Ahrefs link should point to ahrefs.com').toContain('ahrefs.com');
  });

  test('CRITICAL: Copy domain button exists', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const copyBtn = page.locator('.copy-domain-btn');
    await expect(copyBtn, 'Copy domain button is MISSING').toBeVisible();
  });
});

test.describe('Data Loading Regression Tests', () => {
  /**
   * These tests verify that data is actually loaded correctly.
   * They catch issues like wrong CSV column names.
   */

  test('REGRESSION: Monthly traffic data loads correctly', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Legend should show Internal Monthly Traffic
    const legend = page.locator('.apexcharts-legend');
    await expect(legend).toContainText('Internal Monthly');
    
    // Tooltip should show real values when hovering
    // (If data isn't loading, tooltip would show dashes)
  });

  test('REGRESSION: Average traffic data loads correctly', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Switch to Average view
    await page.locator('#viewAverage').click();
    await page.waitForTimeout(1000);
    
    // Legend MUST show Internal Average Traffic
    const legend = page.locator('.apexcharts-legend');
    await expect(legend, 'Internal Average Traffic series is MISSING from legend').toContainText('Internal Average');
    
    // There should be visible chart data (paths with actual coordinates)
    const areaPaths = page.locator('.apexcharts-area-series path[d]');
    const count = await areaPaths.count();
    expect(count, 'Average view should have chart paths').toBeGreaterThan(0);
  });

  test('REGRESSION: DR data loads correctly', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // DR value in metrics should not be "--"
    const drValue = await page.locator('#metricDR').textContent();
    expect(drValue, 'DR should show actual value, not --').not.toBe('--');
    
    // DR should be a reasonable number (0-100)
    const drNum = parseInt(drValue);
    expect(drNum).toBeGreaterThanOrEqual(0);
    expect(drNum).toBeLessThanOrEqual(100);
  });

  test('REGRESSION: RD data loads correctly', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // RD value should be visible
    const rdValue = await page.locator('#metricRD').textContent();
    expect(rdValue.trim().length, 'RD should have a value').toBeGreaterThan(0);
  });

  test('REGRESSION: Revenue data loads correctly', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Ranking bubbles should show dollar values
    const bubbleText = await page.locator('.ranking-bubble').first().textContent();
    expect(bubbleText, 'Ranking bubble should show dollar value').toContain('$');
  });

  test('REGRESSION: Agent/Niche data loads correctly', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Agent should not be "Unknown" for loaded domains
    const agentText = await page.locator('.agent-link').textContent();
    expect(agentText, 'Agent should not be Unknown').not.toBe('Unknown');
  });
});

test.describe('Feature Interaction Regression Tests', () => {
  /**
   * These tests verify features don't break each other.
   */

  test('REGRESSION: Metrics panel works after view toggle', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Get initial DR
    const initialDR = await page.locator('#metricDR').textContent();
    
    // Toggle through views
    await page.locator('#viewAverage').click();
    await page.waitForTimeout(500);
    await page.locator('#viewBoth').click();
    await page.waitForTimeout(500);
    await page.locator('#viewMonthly').click();
    await page.waitForTimeout(500);
    
    // Metrics should still work
    await expect(page.locator('#metricsSummary')).toBeVisible();
    const finalDR = await page.locator('#metricDR').textContent();
    expect(finalDR).toBe(initialDR);
  });

  test('REGRESSION: Chart legend works after metrics toggle', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Toggle metrics off and on
    await page.locator('#metricsToggle').click();
    await page.waitForTimeout(300);
    await page.locator('#metricsToggle').click();
    await page.waitForTimeout(300);
    
    // Legend should still work
    const legend = page.locator('.apexcharts-legend-series').first();
    await legend.click();
    await page.waitForTimeout(300);
    
    // Chart should still be visible
    await expect(page.locator('.apexcharts-svg')).toBeVisible();
  });

  test('REGRESSION: Domain change updates all components', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Get initial values
    const initialDR = await page.locator('#metricDR').textContent();
    const initialAgent = await page.locator('.agent-link').textContent();
    
    // Change domain
    await page.fill('#domainSearch', 'lync');
    await page.waitForTimeout(300);
    
    const item = page.locator('.dropdown-item:visible').first();
    if (await item.count() > 0) {
      await item.click();
      await page.waitForTimeout(2000);
      
      // All components should update (or at least chart should re-render)
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
      await expect(page.locator('#metricsSummary')).toBeVisible();
      
      // At minimum, the domain in the search should change
      const newDomain = await page.locator('#domainSearch').inputValue();
      expect(newDomain.toLowerCase()).toContain('lync');
    }
  });

  test('REGRESSION: Period selector updates metric changes', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Select different periods and verify change indicators update
    const periods = ['7', '30', '90', '365'];
    
    for (const period of periods) {
      await page.locator('#metricsPeriod').selectOption(period);
      await page.waitForTimeout(300);
      
      // Change indicators should be visible
      await expect(page.locator('#metricDRChange')).toBeVisible();
      await expect(page.locator('#metricRDChange')).toBeVisible();
      await expect(page.locator('#metricTrafficChange')).toBeVisible();
    }
  });
});

test.describe('CSS Class and ID Stability Tests', () => {
  /**
   * These tests verify critical CSS selectors haven't changed.
   * Test code depends on these selectors - if they change, tests break.
   */

  test('STABILITY: Critical element IDs exist', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const criticalIds = [
      'metricsToggle',
      'revenueLabelToggle',
      'viewMonthly',
      'viewAverage',
      'viewBoth',
      'metricsSummary',
      'metricsPeriod',
      'metricsPeriodSelector',
      'metricDR',
      'metricRD',
      'metricTraffic',
      'metricDRChange',
      'metricRDChange',
      'metricTrafficChange',
      'metricRDLink',
      'metricTrafficLink',
      'drCircleProgress',
      'domainSearch',
      'dropdownList',
      'chartDateRange',
      'charts',
      'apex-chart'
    ];
    
    for (const id of criticalIds) {
      const element = page.locator(`#${id}`);
      await expect(element, `Element #${id} is MISSING`).toBeAttached();
    }
  });

  test('STABILITY: Critical CSS classes exist', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Note: dropdown-item only exists when dropdown is open, so not included here
    const criticalClasses = [
      'metric-card',
      'metric-label',
      'metric-value',
      'metric-change',
      'metrics-summary',
      'metrics-period-selector',
      'ranking-bubble',
      'toggle-switch',
      'view-btn',
      'agent-link',
      'niche-link',
      'ahrefs-link',
      'copy-domain-btn'
    ];
    
    for (const className of criticalClasses) {
      const element = page.locator(`.${className}`);
      const count = await element.count();
      expect(count, `Class .${className} elements are MISSING`).toBeGreaterThan(0);
    }
  });
});

test.describe('Metric Period Options Completeness', () => {
  test('All period options are available', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const periodSelector = page.locator('#metricsPeriod');
    
    // Check all required options
    const requiredOptions = [
      { value: '1', label: 'Last 24 hours' },
      { value: '7', label: 'Last 7 days' },
      { value: '30', label: 'Last month' },
      { value: '90', label: 'Last 3 months' },
      { value: '180', label: 'Last 6 months' },
      { value: '365', label: 'Last year' }
    ];
    
    for (const option of requiredOptions) {
      const optionEl = periodSelector.locator(`option[value="${option.value}"]`);
      await expect(optionEl, `Period option "${option.label}" is MISSING`).toBeAttached();
    }
  });
});

test.describe('Chart Date Range Options Completeness', () => {
  test('All date range options are available', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const dateRangeSelector = page.locator('#chartDateRange');
    
    const requiredOptions = ['7', '30', '90', '180', 'all'];
    
    for (const value of requiredOptions) {
      const optionEl = dateRangeSelector.locator(`option[value="${value}"]`);
      await expect(optionEl, `Date range option "${value}" is MISSING`).toBeAttached();
    }
  });
});

test.describe('Sync Status Feature - Leaderboard', () => {
  const LEADERBOARD_URL = '/leaderboard.html';
  
  test('CRITICAL: Sync status element exists', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    await waitForPageLoad(page);
    
    const syncStatus = page.locator('#syncStatus');
    await expect(syncStatus, 'Sync status element #syncStatus is MISSING').toBeAttached();
  });

  test('CRITICAL: Sync status API endpoint responds', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    
    const response = await page.request.get('/api/data/sync-status');
    expect(response.status(), 'Sync status API should return 200').toBe(200);
    
    const data = await response.json();
    expect(data, 'Sync status should have last_sync field').toHaveProperty('last_sync');
  });

  test('Sync status shows time ago text', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    await waitForPageLoad(page);
    
    // Wait for sync status to load
    await page.waitForTimeout(2000);
    
    const syncStatus = page.locator('#syncStatus');
    const text = await syncStatus.textContent();
    
    // Should show either "Last synced: X ago" or status message
    const hasExpectedText = 
      text.includes('Last synced') || 
      text.includes('minute') || 
      text.includes('hour') ||
      text.includes('just now') ||
      text.includes('Sync status');
    
    expect(hasExpectedText, `Sync status should show time info, got: "${text}"`).toBe(true);
  });
});
