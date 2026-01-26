# Traffic Dashboard PRD
## Product Requirements Document

**Version:** 1.1  
**Created:** January 14, 2026  
**Last Updated:** January 21, 2026  
**Status:** Live (Production)  
**Live URL:** https://traffic-dashboard-theta.vercel.app/  
**Repository:** https://github.com/romesfallen/traffic-dashboard

---

## 1. Overview

### 1.1 Purpose
The Traffic Dashboard is a data visualization tool that compares internal traffic data against Ahrefs organic traffic estimates, alongside revenue and Domain Rating (DR) metrics. It provides stakeholders with a unified view of website performance across a portfolio of 100 domains.

### 1.2 Target Users
- SEO Managers
- Content Strategists
- Portfolio Managers
- Executive Leadership

### 1.3 Key Value Proposition
- Single dashboard view comparing internal vs. third-party traffic data
- Historical trend analysis with flexible date range filtering
- Revenue correlation with traffic performance
- Domain Rating tracking over time
- Zoomable charts for deep-dive analysis

---

## 2. Features

### 2.1 Multi-Domain Support
| Requirement | Description |
|-------------|-------------|
| Domain Count | 100 domains supported |
| Domain Selector | Searchable dropdown with keyboard navigation |
| Ranking | Domains ranked by priority (1-100) |
| Search | Real-time filtering as user types |
| Selection UX | Click selects all text for easy replacement |

**Supported Domains (Top 10):**
1. decoratoradvice.com
2. traveltweaks.com
3. famousparenting.com
4. etruesports.com
5. betterthisworld.com
6. lookwhatmomfound.com
7. activepropertycare.com
8. redandwhitemagz.com
9. lyncconf.com
10. playmyworld.com

*(Full list of 100 domains in source code)*

### 2.2 Data Visualization (ApexCharts)

#### 2.2.1 Chart Series
| Series | Type | Color | Y-Axis | Description |
|--------|------|-------|--------|-------------|
| Our Data | Area (smooth) | Orange `#f97316` | Left (Traffic) | Internal traffic tracking |
| Ahrefs | Area (smooth) | Blue `#3b82f6` | Left (Traffic) | Third-party organic traffic estimate |
| Revenue | Stepped Area | Green `#10b981` | Right (Revenue) | Monthly revenue bars |
| DR | Dotted Line | Purple `#a855f7` | Right (0-100) | Domain Rating from Ahrefs |

#### 2.2.2 Chart Interactions
| Interaction | Description |
|-------------|-------------|
| Zoom In | Click-drag to select date range, or use 🔍+ button |
| Zoom Out | Use 🔍- button to expand view beyond filter range |
| Pan | Click and drag when in pan mode |
| Reset | Home button (🏠) returns to initial filter view |
| Hover | Tooltip shows all 4 metrics for selected date |
| Legend Click | Toggle individual series visibility |

#### 2.2.3 Tooltip Behavior
- Custom tooltip showing all 4 data series
- Follows cursor position on both X and Y axes
- Date-matched display (finds closest data point within tolerance)
- Revenue tolerance: 20 days (monthly data)
- Other series tolerance: 1 day

### 2.3 Date Range Filtering
| Option | Value | Description |
|--------|-------|-------------|
| Last 7 days | `7` | Most recent week |
| Last month | `30` | Most recent 30 days |
| Last 3 months | `90` | Most recent 90 days |
| Last 6 months | `180` | Most recent 180 days |
| Last year | `365` | Most recent 365 days |
| From Dec 2024 | `dec2024` | December 1, 2024 onwards (default) |
| All time | `all` | Full historical data |

**Zoom Behavior:** Date filters set the **initial visible range** only. Users can zoom out beyond the filtered range to see additional historical data. The Reset button returns to the filtered view.

### 2.4 Revenue Labels Toggle
| Feature | Description |
|---------|-------------|
| Toggle Switch | Green slider in header area |
| Default State | ON (labels visible) |
| Label Position | Centered on monthly revenue bars |
| Label Format | `$X,XXX` with green color |
| Update Method | Dynamic (no chart re-render) |

### 2.5 Data Interpolation
- Missing data points are linearly interpolated
- Interpolation fills gaps between known values
- Prevents chart discontinuities
- Visual continuity maintained for trend analysis

### 2.6 Revenue "Bottom Third" Display
Revenue bars are scaled to occupy the bottom third of the chart:
- `revenueAxisMax = maxRevenue × 3`
- Prevents revenue from obscuring traffic data
- Visual separation between revenue and traffic metrics

---

## 3. Data Sources

### 3.1 CSV Files
| File | Size | Content | Format |
|------|------|---------|--------|
| `traffic-data.csv` | ~14MB | Daily traffic by domain | Website + date columns |
| `ahrefs_organic_traffic_results.csv` | ~342KB | Ahrefs organic traffic | ISO date, domain, organic_traffic |
| `revenue-history.csv` | ~455KB | Monthly revenue by domain | Website + month columns |
| `DR History.csv` | ~7.5MB | Domain Rating history | Website + date columns |
| `ahrefs-data.csv` | ~30KB | Legacy Ahrefs data | Deprecated |

### 3.2 Data Processing Pipeline
1. **Load:** CSVs fetched via fetch API
2. **Parse:** PapaParse processes CSV text
3. **Normalize:** Dates converted to consistent `MMM D YYYY` format
4. **Merge:** All data sources merged by domain and date
5. **Dedupe:** Duplicate dates resolved (first occurrence wins)
6. **Sort:** Dates sorted chronologically
7. **Interpolate:** Missing values filled via linear interpolation

### 3.3 Date Format Handling
| Source Format | Normalized Format |
|---------------|-------------------|
| `Jun 4 - 2025` | `Jun 4 2025` |
| `Jun 4 - 2025_1` | `Jun 4 2025` (suffix removed) |
| `2025-06-04` (ISO) | `Jun 4 2025` |
| `Jan 2025` (month) | `Jan 1 2025` |

### 3.4 Fallback Behavior
| Condition | Action |
|-----------|--------|
| CSV load fails | Use hardcoded sample data |
| File protocol (`file://`) | Use hardcoded sample data |
| Load timeout (5 seconds) | Use hardcoded sample data |
| Missing domain data | Show empty chart |

---

## 4. Technical Specifications

### 4.1 Technology Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Vanilla HTML/CSS/JavaScript | ES6+ |
| Charts | ApexCharts | Latest (CDN) |
| CSV Parsing | PapaParse | 5.4.1 |
| Fonts | Inter | Google Fonts |
| Hosting | Vercel | Automatic |
| Version Control | Git/GitHub | - |

### 4.2 File Structure
```
traffic-dashboard/
├── index-apex.html          # Main dashboard (production)
├── index-apex-annotations.html  # Annotations example (dev)
├── index.html               # Legacy Plotly version (deprecated)
├── traffic-data.csv         # Our traffic data
├── ahrefs_organic_traffic_results.csv  # Ahrefs data
├── revenue-history.csv      # Monthly revenue
├── DR History.csv           # Domain Rating history
├── ahrefs-data.csv          # Legacy Ahrefs (deprecated)
├── vercel.json              # Vercel routing config
├── README.md                # Setup instructions
├── PRD.md                   # This document
└── .gitignore               # Git ignore rules
```

### 4.3 Vercel Configuration
```json
{
  "rewrites": [
    { "source": "/", "destination": "/index-apex.html" },
    { "source": "/index-apex.html", "destination": "/index-apex.html" }
  ]
}
```

### 4.4 Browser Support
- Chrome (latest) ✅
- Firefox (latest) ✅
- Safari (latest) ✅
- Edge (latest) ✅

### 4.5 Performance Metrics
| Metric | Value |
|--------|-------|
| Main HTML file | ~70KB |
| Total CSV data | ~22MB |
| Initial load | 2-3 seconds |
| Chart render | 800ms (animated) |
| Domain switch | <500ms |

---

## 5. UI/UX Specifications

### 5.1 Design Evolution
| Version | Theme | Chart Library |
|---------|-------|---------------|
| v0.1 | Dark (`#1a1a2e`) | Plotly |
| v1.0+ | Light (`#ffffff`) | ApexCharts |

### 5.2 Color Palette
| Element | Color | Hex |
|---------|-------|-----|
| Background | White | `#ffffff` |
| Text Primary | Dark Gray | `#333333` |
| Text Secondary | Medium Gray | `#666666` |
| Text Muted | Light Gray | `#999999` |
| Accent/Brand | Orange | `#f97316` |
| Success/Revenue | Green | `#10b981` |
| Info/Ahrefs | Blue | `#3b82f6` |
| DR | Purple | `#a855f7` |
| Positive Change | Green | `#4ade80` |
| Negative Change | Red | `#f87171` |
| Neutral Change | Yellow | `#fbbf24` |
| Border | Light Gray | `#e5e5e5` |
| Border Hover | Medium Gray | `#cccccc` |

### 5.3 Typography
| Element | Font | Weight | Size |
|---------|------|--------|------|
| Page Title | Inter | 700 | 28px |
| Chart Title | Inter | 600 | 18px |
| Stat Labels | Inter | 500 | 11px (uppercase) |
| Stat Values | Inter | 600 | 20px |
| Body Text | Inter | 400 | 14px |
| Chart Labels | Inter | 500 | 11-13px |

### 5.4 Component Styling
| Component | Border Radius | Shadow |
|-----------|---------------|--------|
| Cards | 16px | `0 2px 12px rgba(0,0,0,0.08)` |
| Inputs | 12px | None (border focus glow) |
| Buttons | 8px | None |
| Dropdown List | 0 0 12px 12px | `0 4px 12px rgba(0,0,0,0.1)` |

### 5.5 Transitions
- Standard: `200ms ease`
- Chart animations: `800ms easeinout`
- Toggle switch: `200ms ease`

---

## 6. Chart Configuration Details

### 6.1 X-Axis (DateTime)
```javascript
xaxis: {
    type: 'datetime',
    min: xAxisBounds.min,  // Initial zoom start
    max: xAxisBounds.max,  // Initial zoom end
    labels: {
        format: 'MMM yyyy',
        hideOverlappingLabels: true,
        datetimeUTC: false
    }
}
```

### 6.2 Y-Axes Configuration
| Index | Series | Position | Scale | Notes |
|-------|--------|----------|-------|-------|
| 0 | Our Data | Left | Auto (min: 0) | Primary traffic axis |
| 1 | Ahrefs | Left (hidden) | Shared with [0] | Hidden, shares scale |
| 2 | Revenue | Right | Max = maxRevenue × 3 | Bottom-third display |
| 3 | DR | Right | Fixed 0-100 | Offset from Revenue axis |

### 6.3 Stroke Configuration
```javascript
stroke: {
    curve: ['smooth', 'smooth', 'stepline', 'straight'],
    width: [2, 2, 0, 3],
    dashArray: [0, 0, 0, 6]  // DR is dotted
}
```

### 6.4 Fill Configuration
```javascript
fill: {
    type: ['solid', 'solid', 'solid', 'solid'],
    opacity: [0, 0, 0.25, 0]  // Only Revenue has fill
}
```

---

## 7. Local Development

### 7.1 Prerequisites
- Python 3.x (for local server)
- Modern web browser
- Git

### 7.2 Setup
```bash
# Clone repository
git clone https://github.com/romesfallen/traffic-dashboard.git
cd traffic-dashboard

# Start local server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000/index-apex.html
```

### 7.3 File Protocol Limitation
Opening `index-apex.html` directly via `file://` protocol will use fallback data because browsers block CSV fetching from local filesystem for security reasons.

---

## 8. Deployment

### 8.1 Production URL
- **Primary:** https://traffic-dashboard-theta.vercel.app/
- **Direct:** https://traffic-dashboard-theta.vercel.app/index-apex.html

### 8.2 Deploy Process
1. Make changes to `index-apex.html`
2. Commit: `git add . && git commit -m "Description"`
3. Push: `git push origin master`
4. Vercel auto-deploys within ~60 seconds
5. Verify at production URL

### 8.3 Environment
- No environment variables required
- No backend/database dependencies
- All data from static CSV files
- Serverless/static hosting

---

## 9. Known Limitations

| Limitation | Impact | Workaround |
|------------|--------|------------|
| Data lag | Ahrefs 24-48hr behind | Accept delay |
| Revenue granularity | Monthly only | N/A (business constraint) |
| DR gaps | Some missing historical dates | Interpolation fills gaps |
| Mobile optimization | Functional but cramped | Use desktop for best experience |
| Large CSV files | 22MB total data | Async loading with timeout |
| File protocol | CSV fetch blocked | Use local server |

---

## 10. Development History

### 10.1 Timeline
| Date | Milestone |
|------|-----------|
| Jan 14, 2026 | Initial commit with Plotly (dark theme) |
| Jan 20, 2026 | CSV integration, ApexCharts migration |
| Jan 20, 2026 | Tooltip fixes, revenue axis scaling |
| Jan 20, 2026 | X-axis label improvements |
| Jan 20, 2026 | Revenue normalization refactor |
| Jan 20, 2026 | DR series added as 4th axis |
| Jan 20, 2026 | DR moved to separate right axis |
| Jan 20, 2026 | Revenue labels toggle added |
| Jan 20, 2026 | Default view set to Dec 2024 |
| Jan 20, 2026 | Searchable dropdown, 100 domains |
| Jan 21, 2026 | Dropdown UX improvements |
| Jan 21, 2026 | **Zoom-out bug fix** |

### 10.2 Major Commits (Chronological)
```
9aa9836 Initial commit: Traffic comparison dashboard
0ae46e2 Add CSV integration to traffic dashboard
a70991e Fix: Ahrefs data display, revenue axis auto-scaling
a7c1964 Refactor: Strict revenue normalization with timestamp-based stepped blocks
19307ed Add DR (Domain Rating) as 4th data series
5ef3d15 Move DR to stat card with sparkline, add bottom-third Revenue axis
a7eb4eb Add DR back to chart as purple dotted line with separate right axis
4be0ec8 Add toggle to show/hide revenue labels
fede775 Default view from Dec 2024
3024df7 Add top 100 domains, searchable dropdown
6feb16c Improve dropdown UX: select all on focus
31c7406 Fix: Allow zooming out beyond date filter range
```

### 10.3 Bug Fixes Summary
| Issue | Commit | Solution |
|-------|--------|----------|
| Tooltip missing series | f3d696d | Custom tooltip with all 4 series |
| X-axis label overlap | 42597aa | Hide overlapping labels |
| Revenue gaps | 1ab2fb2 | Include $0 months |
| Ahrefs data display | a70991e | Fix CSV column parsing |
| Zoom-out blocked | 31c7406 | Use xaxis min/max instead of data filtering |

---

## 11. Future Enhancements

### 11.1 Planned
- [ ] Export chart as PNG/PDF
- [ ] Custom date range picker
- [ ] Multi-domain comparison view
- [ ] Data table view toggle
- [ ] URL parameters for deep linking

### 11.2 Under Consideration
- [ ] Email/Slack alerts for traffic drops
- [ ] Algorithm update annotations
- [ ] Goal tracking overlays
- [ ] Real-time API integration
- [ ] Dark mode toggle
- [ ] Mobile-optimized layout

---

## 12. Changelog

| Date | Version | Changes |
|------|---------|---------|
| Jan 21, 2026 | 1.1.0 | Fixed zoom-out bug for date filters; added zoom controls |
| Jan 21, 2026 | 1.0.3 | Improved dropdown UX (select all on focus) |
| Jan 20, 2026 | 1.0.2 | Added 100 domains, searchable dropdown |
| Jan 20, 2026 | 1.0.1 | Added revenue labels toggle, Dec 2024 default |
| Jan 20, 2026 | 1.0.0 | ApexCharts version with 4 data series |
| Jan 14, 2026 | 0.1.0 | Initial Plotly version (dark theme) |

---

## 13. Support & Contact

**Repository:** https://github.com/romesfallen/traffic-dashboard  
**Live Dashboard:** https://traffic-dashboard-theta.vercel.app/  
**Issues:** GitHub Issues

---

*Document generated from git history and source code analysis.*
