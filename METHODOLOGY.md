# Traffic & Revenue Analysis - Complete Documentation

**Prepared for:** Board of Directors  
**Date:** January 2026  
**Data Period:** July 2024 - January 2026

This document contains both the **Executive Summary** (plain-language findings) and the **Technical Methodology** (how we calculated everything).

---

# PART 1: EXECUTIVE SUMMARY

## What We Analyzed

We examined the relationship between **website traffic** (how many visitors our sites get) and **revenue** (how much money they generate) across our portfolio of 250 websites.

**Key Questions:**
1. Does more traffic = more revenue? How strong is that relationship?
2. Does traffic stability matter for revenue?
3. What traffic level is the "sweet spot" for revenue?

---

## Key Findings

### 1. Traffic and Revenue ARE Correlated (Moderately Strong)

**Correlation coefficient: 0.58** (on a scale of 0 to 1)

| Interpretation | Correlation Range |
|----------------|-------------------|
| No relationship | 0.0 - 0.2 |
| Weak | 0.2 - 0.4 |
| **Moderate** | **0.4 - 0.6** |
| **Strong** | **0.6 - 0.8** ← We're here |
| Very Strong | 0.8 - 1.0 |

**What this means:** Sites with more traffic generally earn more money. However, traffic alone doesn't explain everything — ~40% of revenue variation comes from other factors.

### 2. Stability Matters MORE Than You'd Think

**Finding:** Sites with stable, predictable traffic earn **358% more** than volatile sites.

| Category | Avg Monthly Revenue |
|----------|---------------------|
| **Stable traffic** (CV ≤ 1.02) | **$1,939** |
| Volatile traffic (CV > 1.02) | $423 |

**Plain English:** A site that gets 5,000 → 6,000 → 5,500 visitors (stable) earns way more than a site that jumps 1,000 → 20,000 → 3,000 (volatile), even if the volatile site has higher peaks.

### 3. The Four Site Categories

We classified sites by both **stability** and **trend direction**:

| Category | Sites | Avg Revenue | Interpretation |
|----------|-------|-------------|----------------|
| **Stable + Declining** | 78 | **$2,174** | Cash cows — reliable, well-monetized |
| Stable + Growing | 46 | $1,539 | Rising stars — predictable growth |
| Volatile + Growing | 22 | $471 | Wild cards — growing but erratic |
| **Volatile + Declining** | 101 | **$413** | Problem sites — unstable AND shrinking |

**Key Insight:** "Stable + Declining" sites earn the MOST. These are mature properties past their peak but still monetizing well.

### 4. Traffic Band Sweet Spot: 10K-25K

| Traffic Band | % of Total Revenue | $/Visitor |
|--------------|-------------------|-----------|
| 0-250 | 3.1% | $1.42 |
| 250-500 | 2.4% | $0.63 |
| 500-750 | 3.0% | $0.53 |
| 750-1K | 3.5% | $0.64 |
| 1K-1.5K | 3.0% | $0.47 |
| 1.5K-2.5K | 5.1% | $0.42 |
| 2.5K-5K | 11.9% | $0.33 |
| 5K-10K | 17.1% | $0.31 |
| **10K-25K** | **28.1%** | **$0.26** |
| 25K-50K | 14.3% | $0.17 |
| 50K-100K | 7.7% | $0.15 |
| 100K+ | 0.9% | $0.04 |

**Sweet Spot:** 10K-25K traffic contributes 28% of all revenue with decent efficiency.

**Diminishing Returns:** Sites with 100K+ traffic have terrible efficiency ($0.04/visitor) and contribute less than 1% of total revenue.

---

## Portfolio Health

### Revenue Concentration (Risk Assessment)

| Metric | Finding |
|--------|---------|
| Top 10 sites | Generate **30%** of total revenue |
| Top 50 sites | Generate **74%** of total revenue |
| Top 100 sites | Generate **94%** of total revenue |

**Interpretation:** Revenue is concentrated in top performers. The bottom 150 sites contribute only 6% of revenue.

---

## Recommendations

1. **Focus on stability, not just traffic growth**
   - Stable sites earn 4x more than volatile ones
   - Prioritize consistent traffic over viral spikes

2. **Target the 5K-25K traffic range**
   - This range contributes 45% of total revenue
   - Chasing 100K+ traffic has severe diminishing returns

3. **Investigate volatile + declining sites**
   - 101 sites in this category averaging only $413/month
   - These need intervention or may be candidates for sunsetting

4. **Use "Same-Month Average" for forecasting**
   - This method provides the most reliable traffic-to-revenue predictions

---

## Visual Summary

| Chart | What It Shows |
|-------|---------------|
| `7_traffic_consistency.png` | Stability vs Revenue (CV scatter + bar comparison) |
| `8_traffic_dr_combined.png` | 4-quadrant analysis (Trend + Stability) |
| `9_traffic_bands.png` | Revenue by traffic tier (3 panels: revenue, efficiency, contribution %) |
| `10_summary_dashboard.png` | Combined overview |

Earlier charts (1-6) cover correlation methods, efficiency analysis, portfolio concentration, and seasonality.

---

## Glossary

| Term | Definition |
|------|------------|
| **Correlation (r)** | A number from -1 to +1 measuring how strongly two things move together |
| **CV (Coefficient of Variation)** | Standard deviation ÷ mean. Measures relative volatility. Lower = more stable |
| **RPTU** | Revenue Per Traffic Unit — total revenue ÷ average traffic. Higher = more efficient |
| **Same-Month Average** | Average of all traffic snapshots within a given month |
| **Traffic Band** | A range of traffic values (e.g., 5K-10K visitors) |

---
---

# PART 2: TECHNICAL METHODOLOGY

## 1. Data Sources

### 1.1 Revenue Data (`revenue-history.csv`)

**Structure:** Wide format with websites as rows and months as columns.

**Sample data:**
```
Website              | Niche              | Jan 2024    | Feb 2024    | Mar 2024    | ...
---------------------|--------------------| ------------|-------------|-------------|----
betterthisworld.com  | General, Health    | $13,720.50  | $13,692.00  | $17,146.00  | ...
lyncconf.com         | Gaming, Tech       | $4,060.50   | $5,078.00   | $6,219.50   | ...
famousparenting.com  | Family, Parenting  | $6,966.25   | $8,187.75   | $12,544.57  | ...
```

**Key characteristics:**
- Revenue values are strings with "$" and "," (e.g., "$13,720.50")
- Missing/invalid values shown as "-", "x", or empty
- Columns span from Jan 2022 to present
- Includes Purchase Price, Live Date, Niche metadata

---

### 1.2 Traffic Data (`traffic-data.csv`)

**Structure:** Wide format with websites as rows and date snapshots as columns.

**Sample data:**
```
Website              | Jul 1 - 2024 | Jul 7 - 2024 | Jul 15 - 2024 | Aug 5 - 2024 | ...
---------------------|--------------|--------------|---------------|--------------|----
decoratoradvice.com  | (empty)      | (empty)      | (empty)       | (empty)      | ...
traveltweaks.com     | 13506        | 3294         | 3082          | 10231        | ...
famousparenting.com  | 9940         | 13840        | 14128         | 37642        | ...
```

**Key characteristics:**
- Traffic values are integers (estimated monthly visitors at that snapshot)
- Date columns formatted as "Mon DD - YYYY" (e.g., "Jul 1 - 2024")
- Multiple snapshots per month (sometimes daily in recent months)
- Some values have commas as thousands separators (e.g., "54,316")
- Traffic data starts July 2024

---

### 1.3 Domain Rating History (`DR History.csv`)

**Structure:** Wide format with websites as rows and date snapshots as columns.

**Sample data:**
```
Website              | Jul 1 - 2024 | Jul 7 - 2024 | Aug 5 - 2024 | ...
---------------------|--------------|--------------|--------------|----
decoratoradvice.com  | 57           | 72           | 71           | ...
traveltweaks.com     | 56           | 73           | 73           | ...
famousparenting.com  | 60           | 71           | 70           | ...
```

**Key characteristics:**
- DR values are integers (0-100 scale, Ahrefs Domain Rating)
- Same date column format as traffic data
- **NOTE: DR data was NOT used in the current analysis** — potential for future work correlating DR with revenue

---

### 1.4 Data Summary

| File | Rows | Date Columns | Period |
|------|------|--------------|--------|
| revenue-history.csv | ~2,335 websites | ~49 months | Jan 2022 - Jan 2026 |
| traffic-data.csv | ~2,761 websites | ~300+ snapshots | Jul 2024 - Jan 2026 |
| DR History.csv | ~5,250 websites | ~300+ snapshots | Jul 2024 - Jan 2026 |

**Analysis Period:** July 2024 - January 2026 (overlap of traffic + revenue data)  
**Sites Analyzed:** Top 250 sites (predefined ranked list provided in code)

---

## 2. Core Challenge: Aligning Traffic to Revenue

### The Problem
- **Revenue** is recorded **monthly** (e.g., "October 2024 revenue = $500")
- **Traffic** is recorded as **snapshots** at irregular dates (e.g., "Oct 3, 2024 = 5,000 visitors", "Oct 15, 2024 = 5,200 visitors")

We needed to decide: **Which traffic value should we use for each month's revenue?**

### Methods Tested

| Method | Description | How It Works |
|--------|-------------|--------------|
| **Same-Month Latest** | Last traffic snapshot within that revenue month | For Oct revenue, use the Oct 28th snapshot (latest in Oct) |
| **Same-Month Average** | Average of ALL traffic snapshots within that month | For Oct revenue, average Oct 3, Oct 15, Oct 28 snapshots |
| **30-Day Lagged** | Traffic snapshot from ~30 days before month end | For Oct revenue, use late-September snapshot |
| **60-Day Lagged** | Traffic snapshot from ~60 days before month end | For Oct revenue, use late-August snapshot |

### Result: Same-Month Average Won

| Method | Average Correlation |
|--------|---------------------|
| Same-Month Latest | 0.48 |
| **Same-Month Average** | **0.58** ← Best |
| 30-Day Lagged | 0.50 |
| 60-Day Lagged | 0.47 |

**Why it works:** Averaging smooths out daily fluctuations and gives a more stable representation of the month's traffic.

---

## 3. Correlation Analysis

### What We Measured
- **Pearson correlation (r):** Measures linear relationship between traffic and revenue
- **Spearman correlation (ρ):** Measures rank-based relationship (doesn't assume linearity)

### Correlation Interpretation
| r Value | Interpretation |
|---------|----------------|
| 0.0 - 0.2 | No relationship |
| 0.2 - 0.4 | Weak |
| 0.4 - 0.6 | Moderate |
| **0.6 - 0.8** | **Strong** ← Our results |
| 0.8 - 1.0 | Very strong |

### Segments Tested
We calculated correlations for: Top 10, Top 50, Top 100, Top 250 sites.

---

## 4. Traffic Stability Analysis

### Initial Approach (Changed)
Originally calculated **Coefficient of Variation (CV)** using all raw traffic snapshots:
```
CV = standard_deviation(all_snapshots) / mean(all_snapshots)
```

### Revised Approach (Final)
Changed to use **same-month averages** for consistency with the correlation analysis:

```python
# Step 1: Calculate same-month average for each site-month
monthly_traffic = traffic_data.groupby(['website', 'month'])['traffic'].mean()

# Step 2: For each site, calculate CV across months
site_cv = monthly_traffic.groupby('website').agg(['std', 'mean'])
site_cv['cv'] = site_cv['std'] / site_cv['mean']
```

**Why this matters:** Using monthly averages measures **month-to-month stability**, not snapshot-to-snapshot noise. This aligns with how revenue is recorded (monthly).

### CV Interpretation
| CV Value | Interpretation |
|----------|----------------|
| 0.0 | Perfectly stable (no variation) |
| 0.5 | Moderate volatility |
| 1.0+ | High volatility (std ≥ mean) |

### Stability Classification
Sites split at median CV:
- **Stable:** CV ≤ median (1.024)
- **Volatile:** CV > median

---

## 5. Trend Analysis

In addition to stability (CV), we added **trend direction** using linear regression:

```python
from scipy.stats import linregress

# For each site's monthly traffic values
slope, intercept, r_value, p_value, std_err = linregress(x, traffic_values)

# Normalize slope as % change per month
slope_pct = 100 * slope / mean_traffic
```

### Why We Added Trend
CV alone treats all volatility equally. A site going 1K→100K (growth) has the same CV as one going 100K→1K (decline). Trend slope distinguishes these.

### Four Quadrants
| Quadrant | Meaning |
|----------|---------|
| **Stable + Growing** | Low CV, positive slope |
| **Stable + Declining** | Low CV, negative slope |
| **Volatile + Growing** | High CV, positive slope |
| **Volatile + Declining** | High CV, negative slope |

---

## 6. Traffic Band Analysis

### Initial Approach (Changed)
Originally put each **site** into a band based on their **overall average traffic**.

### Revised Approach (Final)
Changed to **month-level analysis** — each **site-month** is a separate data point:
- Site A in October: 5,000 traffic, $400 revenue → "5K-10K" band
- Site A in November: 2,000 traffic, $200 revenue → "1K-5K" band

**Why this matters:** This shows "when a site has X traffic in a given month, how much revenue does it typically make that month?" — directly answering the traffic→revenue question.

### Traffic Bands Used (Granular)
```python
bands = [0, 250, 500, 750, 1000, 1500, 2500, 5000, 10000, 25000, 50000, 100000, np.inf]
labels = ['0-250', '250-500', '500-750', '750-1K', '1K-1.5K', '1.5K-2.5K', 
          '2.5K-5K', '5K-10K', '10K-25K', '25K-50K', '50K-100K', '100K+']
```

### Metrics Calculated Per Band
| Metric | Formula | Purpose |
|--------|---------|---------|
| Avg Revenue | `mean(revenue)` | Typical revenue at this traffic level |
| Total Revenue | `sum(revenue)` | Total money from this band |
| % of Total Revenue | `band_total / all_total * 100` | How much of the pie |
| Revenue per Visitor | `avg_revenue / avg_traffic` | Monetization efficiency |

---

## 7. Key Methodological Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Use Same-Month Average Traffic | Produces strongest correlation; smooths out noise |
| Calculate Stability Using Monthly Averages | Aligns with monthly revenue; captures month-to-month volatility |
| Month-Level Traffic Bands (Not Site-Level) | Each site-month is independent; shows direct traffic→revenue relationship |
| Add Trend Analysis Alongside Stability | CV alone doesn't distinguish growth from decline |

---

## 8. Outputs Generated

| File | Description |
|------|-------------|
| `1_correlation_heatmap.png` | Correlation by segment & method |
| `2_traffic_revenue_scatter.png` | Sites plotted with efficiency coloring |
| `3_method_comparison.png` | Bar chart comparing snapshot methods |
| `4_efficiency_analysis.png` | RPTU distribution & top/bottom sites |
| `5_portfolio_concentration.png` | Pareto chart of revenue concentration |
| `6_seasonality.png` | Monthly patterns |
| `7_traffic_consistency.png` | Stability (CV) vs revenue analysis |
| `8_traffic_dr_combined.png` | Trend + Stability quadrant analysis |
| `9_traffic_bands.png` | Revenue by traffic tier (3 panels) |
| `10_summary_dashboard.png` | Combined summary dashboard |

---

## 9. Data NOT Used (Future Analysis Opportunities)

### Domain Rating (DR) History
We have DR data but did **not** use it in this analysis. Potential uses:
- Correlate DR with revenue (does higher authority = more money?)
- Correlate DR with traffic (validation check)
- DR stability vs revenue (similar to traffic stability analysis)
- DR trend analysis (growing authority vs declining)

### Niche Data
Revenue data includes niche categories but we did not segment analysis by niche. Could reveal:
- Which niches have strongest traffic→revenue correlation?
- Which niches monetize most efficiently?
- Are some niches more volatile than others?

### Purchase Price / Live Date
Revenue data includes acquisition cost and launch dates. Could calculate:
- ROI by site
- Time to profitability
- Performance vs acquisition cost

---

## 10. Potential Improvements / Questions for Review

1. **Should we weight by site importance?** Currently all site-months are equal. Should top-ranked sites count more?

2. **Seasonality adjustment?** We showed seasonality exists but didn't adjust for it. Should we deseasonalize before calculating CV?

3. **Outlier handling?** Some sites have extreme values. Should we winsorize or remove outliers?

4. **Minimum data threshold?** Currently require 3+ months of data. Should this be higher for reliability?

5. **Lagged revenue analysis?** We tested lagged traffic → current revenue. What about current traffic → future revenue (predictive)?

6. **Niche segmentation?** Do these patterns hold across all niches, or do some niches behave differently?

7. **Add DR analysis?** We have the data — should we correlate Domain Rating with revenue/traffic?

8. **Multi-variate model?** Currently we look at traffic alone. A regression with traffic + DR + niche + age might explain more variance.

---

## 11. Code Location

All analysis code is in:
- `run_analysis_with_visuals.py` — Main script that generates all outputs
- `analysis.ipynb` — Jupyter notebook version (may be outdated)

To regenerate all outputs:
```bash
cd traffic-dashboard
python3 run_analysis_with_visuals.py
```
