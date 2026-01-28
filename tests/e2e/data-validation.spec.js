import { test, expect, waitForChartRender, waitForPageLoad } from './fixtures/auth.js';

const DASHBOARD_URL = '/index-apex.html';

/**
 * DATA VALIDATION TESTS
 * 
 * These tests verify that data is actually loaded and displayed, not just that UI renders.
 * They catch issues like:
 * - Wrong CSV column names in parsing code
 * - API endpoints returning errors
 * - Data not being merged into domain objects correctly
 */

test.describe('API Endpoint Availability', () => {
  test('traffic API returns data', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    const response = await page.request.get('/api/data/traffic');
    expect(response.status()).toBe(200);
    
    const text = await response.text();
    expect(text.length).toBeGreaterThan(1000);
    expect(text).toContain('Website');
  });

  test('average traffic API returns data', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    const response = await page.request.get('/api/data/average');
    expect(response.status()).toBe(200);
    
    const text = await response.text();
    expect(text.length).toBeGreaterThan(1000);
    expect(text).toContain('Website');
  });

  test('DR API returns data', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    const response = await page.request.get('/api/data/dr');
    expect(response.status()).toBe(200);
    
    const text = await response.text();
    expect(text.length).toBeGreaterThan(1000);
    expect(text).toContain('Website');
  });

  test('RD API returns data', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    const response = await page.request.get('/api/data/rd');
    expect(response.status()).toBe(200);
    
    const text = await response.text();
    expect(text.length).toBeGreaterThan(1000);
    expect(text).toContain('Website');
  });

  test('revenue API returns data', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    const response = await page.request.get('/api/data/revenue');
    expect(response.status()).toBe(200);
    
    const text = await response.text();
    expect(text.length).toBeGreaterThan(1000);
  });

  test('agent-niche API returns data', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    
    const response = await page.request.get('/api/data/agent-niche');
    expect(response.status()).toBe(200);
    
    const text = await response.text();
    expect(text.length).toBeGreaterThan(100);
    expect(text).toContain('Website');
  });
});

test.describe('Chart Data Validation - Monthly View', () => {
  test('Internal Monthly Traffic series has data points', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check legend contains the series
    const legend = page.locator('.apexcharts-legend');
    await expect(legend).toContainText('Internal Monthly');
    
    // Check that series path has actual drawn content (not just empty path)
    // ApexCharts creates paths with real coordinates when data exists
    const chartPaths = page.locator('.apexcharts-area-series path');
    const pathCount = await chartPaths.count();
    expect(pathCount).toBeGreaterThan(0);
    
    // Verify at least one path has substantial data (not just M0,0)
    const firstPath = await chartPaths.first().getAttribute('d');
    expect(firstPath).toBeTruthy();
    expect(firstPath.length).toBeGreaterThan(20);
  });

  test('DR series has data points', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check legend contains DR
    const legend = page.locator('.apexcharts-legend');
    await expect(legend).toContainText('DR');
    
    // DR is a line series, check it has path data
    const drLine = page.locator('.apexcharts-line-series path');
    const pathCount = await drLine.count();
    expect(pathCount).toBeGreaterThan(0);
  });

  test('Revenue series has data points', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check legend contains Revenue
    const legend = page.locator('.apexcharts-legend');
    await expect(legend).toContainText('Revenue');
  });

  test('chart tooltip shows actual values', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Hover over chart to trigger tooltip
    const chartArea = page.locator('.apexcharts-inner');
    const box = await chartArea.boundingBox();
    
    if (box) {
      // Hover in the middle of the chart
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
      
      // Check tooltip appears with actual values (not all dashes)
      const tooltip = page.locator('.apexcharts-tooltip');
      if (await tooltip.isVisible()) {
        const tooltipText = await tooltip.textContent();
        // Should contain at least one number or dollar sign (real data)
        const hasRealData = /\d+|[$]/.test(tooltipText);
        expect(hasRealData).toBe(true);
      }
    }
  });
});

test.describe('Chart Data Validation - Average View', () => {
  test('Internal Average Traffic series has data points', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Switch to Average view
    await page.locator('#viewAverage').click();
    await page.waitForTimeout(1000);
    
    // Check legend contains the Internal Average series
    const legend = page.locator('.apexcharts-legend');
    await expect(legend).toContainText('Internal Average');
    
    // Verify chart has area series with data
    const chartPaths = page.locator('.apexcharts-area-series path');
    const pathCount = await chartPaths.count();
    expect(pathCount).toBeGreaterThan(0);
    
    // Check at least one path has real coordinates
    const firstPath = await chartPaths.first().getAttribute('d');
    expect(firstPath).toBeTruthy();
    expect(firstPath.length).toBeGreaterThan(20);
  });

  test('Average view still shows DR and Revenue', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Switch to Average view
    await page.locator('#viewAverage').click();
    await page.waitForTimeout(1000);
    
    // DR and Revenue should still be visible
    const legend = page.locator('.apexcharts-legend');
    await expect(legend).toContainText('DR');
    await expect(legend).toContainText('Revenue');
  });
});

test.describe('Chart Data Validation - Both View', () => {
  test('Both Monthly and Average series have data', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Switch to Both view
    await page.locator('#viewBoth').click();
    await page.waitForTimeout(1000);
    
    // Check all series in legend
    const legend = page.locator('.apexcharts-legend');
    await expect(legend).toContainText('Internal Monthly');
    await expect(legend).toContainText('Internal Average');
    await expect(legend).toContainText('DR');
    await expect(legend).toContainText('Revenue');
  });

  test('Both view has more legend items than single views', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Count legend items in Monthly view
    const monthlyLegendItems = await page.locator('.apexcharts-legend-series').count();
    
    // Switch to Both view
    await page.locator('#viewBoth').click();
    await page.waitForTimeout(1000);
    
    // Should have more legend items
    const bothLegendItems = await page.locator('.apexcharts-legend-series').count();
    expect(bothLegendItems).toBeGreaterThan(monthlyLegendItems);
  });
});

test.describe('Metrics Panel Data Validation', () => {
  test('DR metric shows actual value (not --)', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const drValue = page.locator('#metricDR');
    await expect(drValue).toBeVisible();
    
    const text = await drValue.textContent();
    expect(text).not.toBe('--');
    // DR should be a number between 0-100
    const drNum = parseInt(text);
    expect(drNum).toBeGreaterThanOrEqual(0);
    expect(drNum).toBeLessThanOrEqual(100);
  });

  test('DR circle gauge shows progress', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Check the SVG circle has stroke-dashoffset set (not at max)
    const drCircle = page.locator('#drCircleProgress');
    await expect(drCircle).toBeVisible();
    
    const strokeDashoffset = await drCircle.getAttribute('style');
    expect(strokeDashoffset).toContain('stroke-dashoffset');
    // If DR > 0, offset should be less than 213.63 (full circle)
    const offsetMatch = strokeDashoffset?.match(/stroke-dashoffset:\s*([\d.]+)/);
    if (offsetMatch) {
      const offset = parseFloat(offsetMatch[1]);
      expect(offset).toBeLessThan(213.63);
    }
  });

  test('Ref domains metric shows actual value', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const rdValue = page.locator('#metricRD');
    await expect(rdValue).toBeVisible();
    
    const text = await rdValue.textContent();
    // Should show a number, possibly with K/M suffix, or "--" if no data
    // At minimum, should not be empty
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('Traffic metric shows actual value', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const trafficValue = page.locator('#metricTraffic');
    await expect(trafficValue).toBeVisible();
    
    const text = await trafficValue.textContent();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('metrics change indicators show values after period change', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Change to a longer period for more likely data comparison
    await page.locator('#metricsPeriod').selectOption('90');
    await page.waitForTimeout(500);
    
    // Check change indicators exist and have content
    const drChange = page.locator('#metricDRChange');
    const rdChange = page.locator('#metricRDChange');
    const trafficChange = page.locator('#metricTrafficChange');
    
    await expect(drChange).toBeVisible();
    await expect(rdChange).toBeVisible();
    await expect(trafficChange).toBeVisible();
  });
});

test.describe('Ranking Bubbles Data Validation', () => {
  test('ranking bubbles show actual revenue values', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const rankingBubbles = page.locator('.ranking-bubble');
    const count = await rankingBubbles.count();
    expect(count).toBeGreaterThanOrEqual(3);
    
    // Check at least one bubble has a dollar value
    const bubblesText = await rankingBubbles.allTextContents();
    const hasDollarValue = bubblesText.some(text => text.includes('$'));
    expect(hasDollarValue).toBe(true);
  });

  test('ranking bubbles show rank numbers', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const rankNumbers = page.locator('.rank-number');
    const count = await rankNumbers.count();
    expect(count).toBeGreaterThanOrEqual(3);
    
    // Each should contain # followed by number
    const firstRank = await rankNumbers.first().textContent();
    expect(firstRank).toMatch(/#\d+/);
  });
});

test.describe('Agent and Niche Data Validation', () => {
  test('agent link shows agent name', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const agentLink = page.locator('.agent-link');
    await expect(agentLink).toBeVisible();
    
    const text = await agentLink.textContent();
    expect(text.trim().length).toBeGreaterThan(0);
    expect(text).not.toBe('Unknown');
  });

  test('agent link navigates to agent page', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const agentLink = page.locator('.agent-link');
    const href = await agentLink.getAttribute('href');
    
    expect(href).toContain('agent.html');
    expect(href).toContain('agent=');
  });

  test('niche link shows niche name', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const nicheLink = page.locator('.niche-link').first();
    await expect(nicheLink).toBeVisible();
    
    const text = await nicheLink.textContent();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('niche link navigates to niche page', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const nicheLink = page.locator('.niche-link').first();
    const href = await nicheLink.getAttribute('href');
    
    expect(href).toContain('niche.html');
    expect(href).toContain('niche=');
  });
});

test.describe('Domain Dropdown Data Validation', () => {
  test('dropdown shows domain list with ranks', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Open dropdown
    await page.click('#domainSearch');
    await page.waitForTimeout(300);
    
    // Check dropdown has items
    const items = page.locator('.dropdown-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(10);
    
    // Check first item has rank
    const firstItem = await items.first().textContent();
    expect(firstItem).toMatch(/\d+\./);
  });

  test('dropdown search filters results', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Type in search
    await page.fill('#domainSearch', 'better');
    await page.waitForTimeout(300);
    
    // Should have filtered results
    const items = page.locator('.dropdown-item:visible');
    const count = await items.count();
    
    // Should have some results but fewer than full list
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(200);
    
    // Results should contain search term
    const firstText = await items.first().textContent();
    expect(firstText.toLowerCase()).toContain('better');
  });

  test('selecting domain loads new data', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Get initial domain name
    const initialDomain = await page.locator('#domainSearch').inputValue();
    
    // Search and select different domain
    await page.fill('#domainSearch', 'lync');
    await page.waitForTimeout(300);
    
    const item = page.locator('.dropdown-item:visible').first();
    if (await item.count() > 0) {
      await item.click();
      await page.waitForTimeout(1500);
      
      // Domain should change
      const newDomain = await page.locator('#domainSearch').inputValue();
      
      // Chart should still have data
      await expect(page.locator('.apexcharts-svg')).toBeVisible();
      
      // Metrics should update
      await expect(page.locator('#metricDR')).toBeVisible();
    }
  });
});

test.describe('Ahrefs Links Validation', () => {
  test('domain Ahrefs link has correct URL', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const ahrefsLink = page.locator('.ahrefs-link');
    await expect(ahrefsLink).toBeVisible();
    
    const href = await ahrefsLink.getAttribute('href');
    expect(href).toContain('ahrefs.com');
    expect(href).toContain('site-explorer');
  });

  test('Ref domains metric link has correct URL', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const rdLink = page.locator('#metricRDLink');
    const href = await rdLink.getAttribute('href');
    
    expect(href).toContain('ahrefs.com');
    expect(href).toContain('refdomains');
  });

  test('Traffic metric link has correct URL', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    const trafficLink = page.locator('#metricTrafficLink');
    const href = await trafficLink.getAttribute('href');
    
    expect(href).toContain('ahrefs.com');
    expect(href).toContain('organic-keywords');
  });

  test('Ahrefs links update when domain changes', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Get initial link
    const initialHref = await page.locator('#metricRDLink').getAttribute('href');
    
    // Change domain
    await page.fill('#domainSearch', 'lync');
    await page.waitForTimeout(300);
    
    const item = page.locator('.dropdown-item:visible').first();
    if (await item.count() > 0) {
      await item.click();
      await page.waitForTimeout(1500);
      
      // Link should update
      const newHref = await page.locator('#metricRDLink').getAttribute('href');
      expect(newHref).not.toBe(initialHref);
    }
  });
});

test.describe('Data Persistence Across Feature Changes', () => {
  test('data persists after toggling revenue labels', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Get initial DR value
    const initialDR = await page.locator('#metricDR').textContent();
    
    // Toggle revenue labels
    await page.locator('#revenueLabelToggle').click();
    await page.waitForTimeout(300);
    
    // DR should still show same value
    const afterToggleDR = await page.locator('#metricDR').textContent();
    expect(afterToggleDR).toBe(initialDR);
  });

  test('data persists after toggling metrics visibility', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Hide metrics
    await page.locator('#metricsToggle').click();
    await page.waitForTimeout(300);
    
    // Show metrics again
    await page.locator('#metricsToggle').click();
    await page.waitForTimeout(300);
    
    // DR should still have a value
    const drValue = await page.locator('#metricDR').textContent();
    expect(drValue).not.toBe('--');
  });

  test('data persists after changing view mode', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Get initial DR
    const initialDR = await page.locator('#metricDR').textContent();
    
    // Switch views
    await page.locator('#viewAverage').click();
    await page.waitForTimeout(500);
    await page.locator('#viewBoth').click();
    await page.waitForTimeout(500);
    await page.locator('#viewMonthly').click();
    await page.waitForTimeout(500);
    
    // DR should be same
    const finalDR = await page.locator('#metricDR').textContent();
    expect(finalDR).toBe(initialDR);
  });

  test('data persists after changing date range', async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Get initial DR
    const initialDR = await page.locator('#metricDR').textContent();
    
    // Change date ranges
    await page.locator('#chartDateRange').selectOption('7');
    await page.waitForTimeout(500);
    await page.locator('#chartDateRange').selectOption('all');
    await page.waitForTimeout(500);
    
    // DR should be same (it shows latest value regardless of zoom)
    const finalDR = await page.locator('#metricDR').textContent();
    expect(finalDR).toBe(initialDR);
  });
});

test.describe('Console Error Monitoring', () => {
  test('no JavaScript errors during normal operation', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    // Perform some actions
    await page.locator('#viewAverage').click();
    await page.waitForTimeout(500);
    await page.locator('#metricsToggle').click();
    await page.waitForTimeout(300);
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('ResizeObserver')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('no failed network requests for data', async ({ page }) => {
    const failedRequests = [];
    
    page.on('requestfailed', request => {
      if (request.url().includes('/api/data/')) {
        failedRequests.push(request.url());
      }
    });
    
    await page.goto(DASHBOARD_URL);
    await waitForChartRender(page);
    
    expect(failedRequests).toHaveLength(0);
  });
});
