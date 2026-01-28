import { test, expect, waitForChartRender, waitForPageLoad } from './fixtures/auth.js';

const DASHBOARD_URL = '/index-apex.html';

/**
 * Comprehensive E2E tests for feature combinations
 * Ensures all features work independently and together without breaking each other
 */

test.describe('Feature Existence Checks', () => {
  test.describe('All UI controls are present', () => {
    test('all toggles exist on page load', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForPageLoad(page);
      
      // Revenue Labels toggle
      await expect(page.locator('#revenueLabelToggle')).toBeVisible();
      
      // Metrics toggle
      await expect(page.locator('#metricsToggle')).toBeVisible();
    });

    test('all view buttons exist', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForPageLoad(page);
      
      await expect(page.locator('#viewMonthly')).toBeVisible();
      await expect(page.locator('#viewAverage')).toBeVisible();
      await expect(page.locator('#viewBoth')).toBeVisible();
    });

    test('domain search exists', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForPageLoad(page);
      
      await expect(page.locator('#domainSearch')).toBeVisible();
      await expect(page.locator('#dropdownList')).toBeAttached();
    });

    test('chart date range selector exists', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const dateRangeSelect = page.locator('#chartDateRange');
      await expect(dateRangeSelect).toBeVisible();
      
      // Check it has expected options
      const options = dateRangeSelect.locator('option');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(5);
    });

    test('metrics period selector exists when metrics visible', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      await expect(page.locator('#metricsPeriod')).toBeVisible();
    });

    test('metrics panel has all three cards', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // DR card
      await expect(page.locator('.metric-card.dr-card')).toBeVisible();
      await expect(page.locator('#metricDR')).toBeVisible();
      
      // Ref domains card with link
      await expect(page.locator('#metricRD')).toBeVisible();
      await expect(page.locator('#metricRDLink')).toBeVisible();
      
      // Traffic card with link  
      await expect(page.locator('#metricTraffic')).toBeVisible();
      await expect(page.locator('#metricTrafficLink')).toBeVisible();
    });

    test('ranking bubbles exist', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const rankingBubbles = page.locator('.ranking-bubble');
      const count = await rankingBubbles.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });
});

test.describe('Individual Feature Tests', () => {
  test.describe('Revenue Labels Toggle', () => {
    test('toggle starts active', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForPageLoad(page);
      
      const toggle = page.locator('#revenueLabelToggle');
      await expect(toggle).toHaveClass(/active/);
    });

    test('clicking toggle changes state', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const toggle = page.locator('#revenueLabelToggle');
      
      // Click to turn off
      await toggle.click();
      await page.waitForTimeout(300);
      await expect(toggle).not.toHaveClass(/active/);
      
      // Click to turn back on
      await toggle.click();
      await page.waitForTimeout(300);
      await expect(toggle).toHaveClass(/active/);
    });

    test('chart remains functional after toggle', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const toggle = page.locator('#revenueLabelToggle');
      await toggle.click();
      await page.waitForTimeout(300);
      
      // Chart should still be visible
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
      
      // Legend should still work
      const legend = page.locator('.apexcharts-legend');
      await expect(legend).toBeVisible();
    });
  });

  test.describe('Metrics Toggle', () => {
    test('toggle starts active', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForPageLoad(page);
      
      const toggle = page.locator('#metricsToggle');
      await expect(toggle).toHaveClass(/active/);
    });

    test('clicking toggle hides metrics panel', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const toggle = page.locator('#metricsToggle');
      const metricsPanel = page.locator('#metricsSummary');
      const periodSelector = page.locator('#metricsPeriodSelector');
      
      // Initially visible
      await expect(metricsPanel).toBeVisible();
      
      // Click to hide
      await toggle.click();
      await page.waitForTimeout(300);
      
      await expect(toggle).not.toHaveClass(/active/);
      await expect(metricsPanel).toBeHidden();
      await expect(periodSelector).toBeHidden();
    });

    test('clicking toggle shows metrics panel again', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const toggle = page.locator('#metricsToggle');
      const metricsPanel = page.locator('#metricsSummary');
      
      // Hide
      await toggle.click();
      await page.waitForTimeout(300);
      await expect(metricsPanel).toBeHidden();
      
      // Show again
      await toggle.click();
      await page.waitForTimeout(300);
      await expect(metricsPanel).toBeVisible();
      await expect(toggle).toHaveClass(/active/);
    });
  });

  test.describe('View Toggle Buttons', () => {
    test('Monthly is active by default', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForPageLoad(page);
      
      await expect(page.locator('#viewMonthly')).toHaveClass(/active/);
      await expect(page.locator('#viewAverage')).not.toHaveClass(/active/);
      await expect(page.locator('#viewBoth')).not.toHaveClass(/active/);
    });

    test('clicking Average switches view', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      await page.locator('#viewAverage').click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('#viewAverage')).toHaveClass(/active/);
      await expect(page.locator('#viewMonthly')).not.toHaveClass(/active/);
      
      // Chart should still render
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('clicking Both switches view', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      await page.locator('#viewBoth').click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('#viewBoth')).toHaveClass(/active/);
      
      // Chart should still render
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('can switch back to Monthly from Average', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Switch to Average
      await page.locator('#viewAverage').click();
      await page.waitForTimeout(500);
      
      // Switch back to Monthly
      await page.locator('#viewMonthly').click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('#viewMonthly')).toHaveClass(/active/);
    });
  });

  test.describe('Chart Date Range Selector', () => {
    test('can change date range', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const select = page.locator('#chartDateRange');
      
      // Change to Last 7 days
      await select.selectOption('7');
      await page.waitForTimeout(500);
      await expect(select).toHaveValue('7');
      
      // Chart should still be visible
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('all date range options work', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const select = page.locator('#chartDateRange');
      const options = ['7', '30', '90', '180', 'all'];
      
      for (const option of options) {
        await select.selectOption(option);
        await page.waitForTimeout(300);
        await expect(select).toHaveValue(option);
        await expect(page.locator('.apexcharts-svg')).toBeVisible();
      }
    });
  });

  test.describe('Metrics Period Selector', () => {
    test('default value is 30 (Last month)', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const select = page.locator('#metricsPeriod');
      await expect(select).toHaveValue('30');
    });

    test('can change metrics period', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const select = page.locator('#metricsPeriod');
      
      // Change to Last 7 days
      await select.selectOption('7');
      await page.waitForTimeout(300);
      await expect(select).toHaveValue('7');
    });

    test('all period options work', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const select = page.locator('#metricsPeriod');
      const options = ['1', '7', '30', '90', '180', '365'];
      
      for (const option of options) {
        await select.selectOption(option);
        await page.waitForTimeout(200);
        await expect(select).toHaveValue(option);
      }
    });
  });

  test.describe('Chart Legend Interactions', () => {
    test('legend is visible', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const legend = page.locator('.apexcharts-legend');
      await expect(legend).toBeVisible();
    });

    test('clicking legend item toggles series visibility', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const legendItems = page.locator('.apexcharts-legend-series');
      const firstLegend = legendItems.first();
      
      // Click to toggle off
      await firstLegend.click();
      await page.waitForTimeout(300);
      
      // Chart should still be visible
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
      
      // Click again to toggle on
      await firstLegend.click();
      await page.waitForTimeout(300);
      
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('can toggle multiple legend items', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      const legendItems = page.locator('.apexcharts-legend-series');
      const count = await legendItems.count();
      
      // Toggle first two items if available
      if (count >= 2) {
        await legendItems.nth(0).click();
        await page.waitForTimeout(200);
        await legendItems.nth(1).click();
        await page.waitForTimeout(200);
        
        // Chart should still be visible
        await expect(page.locator('.apexcharts-svg')).toBeVisible();
        
        // Toggle them back
        await legendItems.nth(0).click();
        await page.waitForTimeout(200);
        await legendItems.nth(1).click();
        await page.waitForTimeout(200);
      }
    });
  });

  test.describe('Domain Selection', () => {
    test('can search and select a domain', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Open dropdown
      await page.click('#domainSearch');
      
      // Type to filter
      await page.fill('#domainSearch', 'better');
      await page.waitForTimeout(300);
      
      // Dropdown should be open
      await expect(page.locator('#dropdownList')).toHaveClass(/open/);
      
      // Click first result
      const firstItem = page.locator('.dropdown-item:visible').first();
      if (await firstItem.count() > 0) {
        await firstItem.click();
        await page.waitForTimeout(1000);
        
        // Chart should re-render
        await expect(page.locator('.apexcharts-svg')).toBeVisible();
      }
    });
  });
});

test.describe('Feature Combination Tests', () => {
  test.describe('Revenue Labels OFF + Other Features', () => {
    test('revenue off, metrics on - chart works', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off revenue labels
      await page.locator('#revenueLabelToggle').click();
      await page.waitForTimeout(300);
      
      // Metrics should still be visible
      await expect(page.locator('#metricsSummary')).toBeVisible();
      
      // Chart should still work
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
      
      // Legend should still work
      const firstLegend = page.locator('.apexcharts-legend-series').first();
      await firstLegend.click();
      await page.waitForTimeout(300);
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('revenue off - view toggle still works', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off revenue labels
      await page.locator('#revenueLabelToggle').click();
      await page.waitForTimeout(300);
      
      // Switch to Average view
      await page.locator('#viewAverage').click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('#viewAverage')).toHaveClass(/active/);
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
      
      // Switch to Both
      await page.locator('#viewBoth').click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('#viewBoth')).toHaveClass(/active/);
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('revenue off - date range still works', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off revenue labels
      await page.locator('#revenueLabelToggle').click();
      await page.waitForTimeout(300);
      
      // Change date range
      await page.locator('#chartDateRange').selectOption('7');
      await page.waitForTimeout(500);
      
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });
  });

  test.describe('Metrics OFF + Other Features', () => {
    test('metrics off, revenue on - chart works', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off metrics
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Metrics should be hidden
      await expect(page.locator('#metricsSummary')).toBeHidden();
      
      // Revenue toggle should still be active
      await expect(page.locator('#revenueLabelToggle')).toHaveClass(/active/);
      
      // Chart should still work
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
      
      // Legend should still work
      const firstLegend = page.locator('.apexcharts-legend-series').first();
      await firstLegend.click();
      await page.waitForTimeout(300);
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('metrics off - view toggle still works', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off metrics
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Switch views
      await page.locator('#viewAverage').click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('#viewAverage')).toHaveClass(/active/);
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('metrics off - date range still works', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off metrics
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Change date range
      await page.locator('#chartDateRange').selectOption('90');
      await page.waitForTimeout(500);
      
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });
  });

  test.describe('Both Toggles OFF', () => {
    test('both off - chart still works', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off both
      await page.locator('#revenueLabelToggle').click();
      await page.waitForTimeout(200);
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Both should be off
      await expect(page.locator('#revenueLabelToggle')).not.toHaveClass(/active/);
      await expect(page.locator('#metricsToggle')).not.toHaveClass(/active/);
      
      // Chart should still work
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('both off - view toggle still works', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off both
      await page.locator('#revenueLabelToggle').click();
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Switch to Both view
      await page.locator('#viewBoth').click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('#viewBoth')).toHaveClass(/active/);
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('both off - legend still works', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off both
      await page.locator('#revenueLabelToggle').click();
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Toggle legend items
      const legendItems = page.locator('.apexcharts-legend-series');
      const count = await legendItems.count();
      
      if (count > 0) {
        await legendItems.first().click();
        await page.waitForTimeout(300);
        await expect(page.locator('.apexcharts-svg')).toBeVisible();
        
        // Toggle back
        await legendItems.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('both off - can turn both back on', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off both
      await page.locator('#revenueLabelToggle').click();
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Turn both back on
      await page.locator('#revenueLabelToggle').click();
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Both should be active
      await expect(page.locator('#revenueLabelToggle')).toHaveClass(/active/);
      await expect(page.locator('#metricsToggle')).toHaveClass(/active/);
      await expect(page.locator('#metricsSummary')).toBeVisible();
    });
  });

  test.describe('View Toggle + Other Features', () => {
    test('Average view + revenue off', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Switch to Average
      await page.locator('#viewAverage').click();
      await page.waitForTimeout(500);
      
      // Turn off revenue
      await page.locator('#revenueLabelToggle').click();
      await page.waitForTimeout(300);
      
      // Chart should still work
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
      
      // Legend should still be toggleable
      const firstLegend = page.locator('.apexcharts-legend-series').first();
      await firstLegend.click();
      await page.waitForTimeout(300);
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('Both view + metrics off', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Switch to Both
      await page.locator('#viewBoth').click();
      await page.waitForTimeout(500);
      
      // Turn off metrics
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Chart should still work
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
      await expect(page.locator('#metricsSummary')).toBeHidden();
    });

    test('switch views multiple times with toggles off', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off both toggles
      await page.locator('#revenueLabelToggle').click();
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Cycle through all views
      const views = ['#viewAverage', '#viewBoth', '#viewMonthly', '#viewAverage'];
      
      for (const viewSelector of views) {
        await page.locator(viewSelector).click();
        await page.waitForTimeout(500);
        await expect(page.locator('.apexcharts-svg')).toBeVisible();
      }
    });
  });

  test.describe('Date Range + Other Features', () => {
    test('change date range with metrics off', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off metrics
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(300);
      
      // Change date ranges
      const ranges = ['7', '30', '90', 'all'];
      for (const range of ranges) {
        await page.locator('#chartDateRange').selectOption(range);
        await page.waitForTimeout(400);
        await expect(page.locator('.apexcharts-svg')).toBeVisible();
      }
    });

    test('change date range with Average view', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Switch to Average
      await page.locator('#viewAverage').click();
      await page.waitForTimeout(500);
      
      // Change date ranges
      await page.locator('#chartDateRange').selectOption('90');
      await page.waitForTimeout(500);
      
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });
  });

  test.describe('Domain Change + Feature States', () => {
    test('change domain preserves toggle states', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Turn off revenue labels
      await page.locator('#revenueLabelToggle').click();
      await page.waitForTimeout(300);
      
      // Change domain
      await page.click('#domainSearch');
      await page.fill('#domainSearch', 'better');
      await page.waitForTimeout(300);
      
      const firstItem = page.locator('.dropdown-item:visible').first();
      if (await firstItem.count() > 0) {
        await firstItem.click();
        await page.waitForTimeout(1500);
        
        // Chart should render
        await expect(page.locator('.apexcharts-svg')).toBeVisible();
        
        // Metrics should still be visible (was on)
        await expect(page.locator('#metricsToggle')).toHaveClass(/active/);
      }
    });
  });

  test.describe('Complex Multi-Feature Scenarios', () => {
    test('toggle all features in sequence', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // 1. Turn off revenue
      await page.locator('#revenueLabelToggle').click();
      await page.waitForTimeout(200);
      
      // 2. Switch to Average view
      await page.locator('#viewAverage').click();
      await page.waitForTimeout(500);
      
      // 3. Turn off metrics
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(200);
      
      // 4. Change date range
      await page.locator('#chartDateRange').selectOption('7');
      await page.waitForTimeout(500);
      
      // 5. Toggle a legend item
      const firstLegend = page.locator('.apexcharts-legend-series').first();
      await firstLegend.click();
      await page.waitForTimeout(300);
      
      // Chart should still be functional
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
      
      // 6. Now reverse everything
      await firstLegend.click();
      await page.waitForTimeout(200);
      
      await page.locator('#chartDateRange').selectOption('all');
      await page.waitForTimeout(500);
      
      await page.locator('#metricsToggle').click();
      await page.waitForTimeout(200);
      
      await page.locator('#viewMonthly').click();
      await page.waitForTimeout(500);
      
      await page.locator('#revenueLabelToggle').click();
      await page.waitForTimeout(200);
      
      // Everything should be back to normal
      await expect(page.locator('#revenueLabelToggle')).toHaveClass(/active/);
      await expect(page.locator('#metricsToggle')).toHaveClass(/active/);
      await expect(page.locator('#viewMonthly')).toHaveClass(/active/);
      await expect(page.locator('#metricsSummary')).toBeVisible();
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('rapid toggle switching does not break chart', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Rapidly toggle features
      for (let i = 0; i < 3; i++) {
        await page.locator('#revenueLabelToggle').click();
        await page.waitForTimeout(100);
        await page.locator('#metricsToggle').click();
        await page.waitForTimeout(100);
      }
      
      await page.waitForTimeout(500);
      
      // Chart should still be visible
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
    });

    test('change metrics period with different views', async ({ page }) => {
      await page.goto(DASHBOARD_URL);
      await waitForChartRender(page);
      
      // Test metrics period with each view
      const views = ['#viewMonthly', '#viewAverage', '#viewBoth'];
      const periods = ['7', '90', '365'];
      
      for (const view of views) {
        await page.locator(view).click();
        await page.waitForTimeout(500);
        
        for (const period of periods) {
          await page.locator('#metricsPeriod').selectOption(period);
          await page.waitForTimeout(200);
          
          // Metrics should still display
          await expect(page.locator('#metricsSummary')).toBeVisible();
        }
      }
    });
  });
});

test.describe('Ahrefs Links', () => {
  test('Ref domains link has correct format', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const rdLink = page.locator('#metricRDLink');
    const href = await rdLink.getAttribute('href');
    
    // Should contain ahrefs refdomains URL
    expect(href).toContain('ahrefs.com');
    expect(href).toContain('refdomains');
  });

  test('Traffic link has correct format', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const trafficLink = page.locator('#metricTrafficLink');
    const href = await trafficLink.getAttribute('href');
    
    // Should contain ahrefs organic-keywords URL
    expect(href).toContain('ahrefs.com');
    expect(href).toContain('organic-keywords');
  });

  test('links open in new tab', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check target="_blank" attribute
    const rdLink = page.locator('#metricRDLink');
    await expect(rdLink).toHaveAttribute('target', '_blank');
    
    const trafficLink = page.locator('#metricTrafficLink');
    await expect(trafficLink).toHaveAttribute('target', '_blank');
  });
});
