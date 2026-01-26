#!/usr/bin/env python3
"""
Traffic-Revenue Statistical Analysis with Visualizations
"""

import pandas as pd
import numpy as np
from scipy.stats import pearsonr, spearmanr
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
warnings.filterwarnings('ignore')

# Set up plotting
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams['figure.figsize'] = (12, 6)
plt.rcParams['font.size'] = 10

print("="*70)
print("TRAFFIC-REVENUE STATISTICAL ANALYSIS")
print("="*70)

# Top 250 sites in ranked order
TOP_250_SITES = [
    'decoratoradvice.com', 'lookwhatmomfound.com', 'famousparenting.com', 'betterthisworld.com',
    'thestripesblog.com', 'etruesports.com', 'thenervousbreakdown.com', 'GFXMaker.com',
    'activepropertycare.com', 'playmyworld.com', 'bizwebgenius.com', 'redandwhitemagz.com',
    'myfavouriteplaces.org', 'voicesofconservation.org', 'mygreenbucks.net', 'beaconsoft.net',
    'traveltweaks.com', 'conversationswithgreg.com', 'thegamearchives.com', 'goodnever.com',
    'factom.com', 'revolvertech.com', 'hikhanacademy.org', 'lyncconf.com', 'thinkofgames.com',
    'goldengatemax.shop', 'aliensync.com', 'arcyart.com', 'mustardseedyear.com', 'disquantified.org',
    'harmonicode.com', 'termanchor.com', 'embedtree.com', 'whatutalkingboutwillis.com', 'smartsatta.com',
    'thechannelrace.org', 'bookspersonally.com', 'oneframework.net', 'projectrethink.org', 'gatorgross.com',
    'livingpristine.com', 'conversationswithbrittany.com', 'geekgadget.net', 'hearthstats.net',
    'coventchallenge.com', 'crypticstreet.com', 'freelogopng.com', 'wealthybyte.com',
    'amairaskincare.com.au', 'letsbuildup.org', 'doanphuongkimlien.com', 'luxuryinteriors.org',
    'whtvbox.com', 'mygardenandpatio.com', 'digitalrgs.org', 'masterrealtysolutions.com',
    'banlarbhumi.com', 'feathershort.com', 'fameblogs.net', 'middleclasshomes.net', 'icaiorg.net',
    'filmyzillah.com', 'logicalshout.com', 'playmastersclub.net', 'alternativeway.net',
    'mucicallydown.com', 'apartamentoscholloapartamentos.com', 'nationalpainreport.com',
    'w88w88hanoi.com', 'twiliaorg.com', 'thehake.com', 'setupseeker.xyz', 'playdedeus.com',
    'av19org.net', 'majinoukari.com', 'themeshgame.com', 'essec-kpmg.net', 'dhilisatta.com',
    'netzgames.net', 'eurogamersonline.com', 'harmoniclast.com', 'thinksano.com', 'jerseyexpress.net',
    'greediegoddess.com', 'iboomatelugu.com', 'dm-gaming.com', 'tech-biztech.com', 'besttarahi.com',
    'mazinoukari.com', 'etherions.com', 'zerodevice.net', 'thehometrotters.com', 'onthisveryspot.com',
    'g15tools.com', 'quantumcontactsshop.com', 'toptenlast.com', 'designmode24.com', 'aegaming.tv',
    'myinteriorpalace.com', 'bytesize-games.com', 'protongamer.com', 'bitnation-blog.com', 'dwchr.com',
    'onoxservices.com', 'musikcalldown.com', 'gamerawr.com', 'insidetheelevator.com', 'sportsfanfare.com',
    'satkamataka.com', 'buydomainspremium.com', 'freewayget.com', 'plugboxlinux.org', 'evolvedgross.com',
    'metsuiteorg.com', 'avstarnews.com', 'towersget.com', 'igxocosmetics.com', 'misumiskincare.com',
    'pawerbet.com', 'beerandmagic.com', 'fb88eu.net', 'bouncemediagroup.com', 'seismicpostshop.com',
    'venky12.com', 'theportablegamer.com', 'wibexeorg.com', 'songoftruth.org', 'reactcheck.com',
    'pushyourdesign.com', 'fudbollibre.com', 'elisehurstphotography.com', 'skylightvoice.com',
    'sports-report.net', 'conversationswithbianca.com', 'drhomey.com', 'quantumflooingservices.com',
    'areatsunami.com', 'cowded.com', 'entretech.org', 'investirebiz.com', 'mywirelesscoupons.com',
    'healthsciencesforum.com', 'nothing2hide.net', 'theboringmagazine.com', 'wolfcontactsshop.com',
    'wizzydigital.org', 'turbogeek.org', 'passionate-culinary-enterprises.com', 'triumphgross.com',
    'tubitymusic.com', 'ck2generator.com', 'checkerpointorg.com', 'northshoretimingonline.com',
    'sportsblitzzone.com', 'annoncetravesti.com', 'cookiesforlove.com', 'robthecoins.com',
    'tuple-tech.com', 'abithelp.com', 'saharahausa.com', 'homerocketrealty.com', 'val9jamusic.com',
    'alignlast.net', 'analysistheme.com', 'stayloosemusic.com', 'lotterygamedevelopers.com',
    'artsusshop.com', 'theguardianhib.com', 'greenheal.net', 'propagatenetworks.com',
    'thelowdownunder.com', 'bizboostpro.com', 'uptempomag.com', '21strongfoundation.org',
    'sunnylast.com', 'zigaero.com', 'android-underground.org', 'conversationswithjessica.com',
    'coststatus.com', 'pizzlemusic.com', 'thunderonthegulf.com', 'botbrobiz.com', 'blackrocklast.com',
    'epicgamerhq.com', 'prositesite.com', 'sportssavvyspot.com', 'cryptopronetwork.com',
    'safetyproductsmfg.com', 'formulagross.com', 'grosseasy.com', 'reality-movement.org',
    'feedbuzzard.com', 'leaguechannellife.net', 'Formotorbikes.com', 'theblockchainbrief.com',
    'liveamoment.org', 'sweedishlove.com', 'fightingforfutures.org', 'tech-bliss.com',
    'norstratiamrestaurant.com', 'digitalnewsalerts.com', 'trendsetti.com', 'mpgproworkstation.com',
    'toolmilk.com', 'springhillmedgroup.com', 'messgodess.com', 'leopardtheme.com', 'readlists.com',
    'eselmomentocv.com', 'shippingbellabeat.com', 'gtchgth.com', 'mydecine.com', 'aggreg8.net',
    'jordantrent.com', 'importantcool.com', 'tierraarea.com', 'crystalcreekland.com', 'alwaysthis.com',
    'playbattlesquare.com', 'durostech.com', 'beargryllsgear.org', 'fintechasia.net',
    'sportscentrehub.com', 'costofwar.com', 'boujeefitshapewear.com', 'letwomenspeak.com',
    'anywherestory.net', 'indianmatkamobi.com', 'technolotal.org', 'kdarchitects.net', 'snapsource.net',
    'americanlivewire.com', 'greenflourishhome.com', 'filmjila.com', 'thecurrentonline.net',
    'crazeforgamez.com', 'verdantnaturehome.com', 'thewritetrackpodcast.com', 'clearingdelight.com',
    'kalyanmatkachart.com', 'lotrizlotriz.com', 'gadgetsguruz.com', 'festivefitnessphilly.com',
    'terabytelabs.net', 'queenslot800.com', 'deephacks.org', 'kidsturncentral.com', 'anglospeed.com',
    'techsolutionsbiz.com', 'residencerenew.com'
]

TOP_250_LOWER = [s.lower() for s in TOP_250_SITES]

# Helper functions
def parse_revenue(val):
    if pd.isna(val) or val in ['-', 'x', '', ' ']:
        return np.nan
    try:
        if isinstance(val, str):
            val = val.strip().replace('$', '').replace(',', '')
            if val in ['-', 'x', '', ' ']:
                return np.nan
        return float(val)
    except (ValueError, TypeError):
        return np.nan

def parse_traffic_date(date_str):
    try:
        clean = str(date_str).replace(' - ', ' ')
        return pd.to_datetime(clean, format='%b %d %Y')
    except:
        return None

def get_month_end(month_date):
    return month_date + pd.offsets.MonthEnd(0)

def get_same_month_latest(traffic_df, website, month_date):
    month_start = month_date.replace(day=1)
    month_end = get_month_end(month_date)
    mask = (traffic_df['website'] == website) & (traffic_df['date'] >= month_start) & (traffic_df['date'] <= month_end)
    subset = traffic_df[mask]
    if len(subset) == 0:
        return np.nan
    return subset.loc[subset['date'].idxmax(), 'traffic']

def get_same_month_avg(traffic_df, website, month_date):
    month_start = month_date.replace(day=1)
    month_end = get_month_end(month_date)
    mask = (traffic_df['website'] == website) & (traffic_df['date'] >= month_start) & (traffic_df['date'] <= month_end)
    subset = traffic_df[mask]
    if len(subset) == 0:
        return np.nan
    return subset['traffic'].mean()

def get_lagged_traffic(traffic_df, website, month_date, lag_days):
    month_end = get_month_end(month_date)
    target_date = month_end - pd.Timedelta(days=lag_days)
    website_traffic = traffic_df[traffic_df['website'] == website]
    if len(website_traffic) == 0:
        return np.nan
    website_traffic = website_traffic.copy()
    website_traffic['date_diff'] = (website_traffic['date'] - target_date).abs()
    closest = website_traffic.loc[website_traffic['date_diff'].idxmin()]
    if closest['date_diff'].days > 30:
        return np.nan
    return closest['traffic']

def calc_correlation(df, traffic_col, revenue_col='revenue'):
    valid = df[[traffic_col, revenue_col]].dropna()
    if len(valid) < 3:
        return {'pearson_r': np.nan, 'pearson_p': np.nan, 'spearman_r': np.nan, 'spearman_p': np.nan, 'n': len(valid)}
    pearson_r, pearson_p = pearsonr(valid[traffic_col], valid[revenue_col])
    spearman_r, spearman_p = spearmanr(valid[traffic_col], valid[revenue_col])
    return {'pearson_r': pearson_r, 'pearson_p': pearson_p, 'spearman_r': spearman_r, 'spearman_p': spearman_p, 'n': len(valid)}

# Load data
print("\n📂 Loading data...")
revenue_df = pd.read_csv('revenue-history.csv')
traffic_df = pd.read_csv('traffic-data.csv')

# Process revenue
website_col = 'Website'
month_cols = [col for col in revenue_df.columns if any(year in str(col) for year in ['2022', '2023', '2024', '2025', '2026'])]
revenue_clean = revenue_df[revenue_df[website_col].notna() & (revenue_df[website_col] != '-')].copy()

revenue_records = []
for idx, row in revenue_clean.iterrows():
    website = str(row[website_col]).strip().lower()
    niche = row.get('Niche', 'Unknown')
    for month_col in month_cols:
        rev_val = parse_revenue(row[month_col])
        if not pd.isna(rev_val):
            try:
                month_date = pd.to_datetime(month_col, format='%b %Y')
                revenue_records.append({'website': website, 'niche': niche, 'month': month_date, 'revenue': rev_val})
            except:
                pass

revenue_long = pd.DataFrame(revenue_records)

# Process traffic
traffic_website_col = traffic_df.columns[1]
traffic_date_cols = [col for col in traffic_df.columns if '-' in str(col) and any(year in str(col) for year in ['2024', '2025', '2026'])]

traffic_records = []
for idx, row in traffic_df.iterrows():
    website = str(row[traffic_website_col]).strip().lower() if pd.notna(row[traffic_website_col]) else None
    if not website:
        continue
    for date_col in traffic_date_cols:
        traffic_val = row[date_col]
        parsed_date = parse_traffic_date(date_col)
        if parsed_date and pd.notna(traffic_val):
            try:
                traffic_num = float(traffic_val)
                if traffic_num > 0:
                    traffic_records.append({'website': website, 'date': parsed_date, 'traffic': traffic_num})
            except:
                pass

traffic_long = pd.DataFrame(traffic_records)

# Filter to top 250
revenue_top250 = revenue_long[revenue_long['website'].isin(TOP_250_LOWER)].copy()
traffic_top250 = traffic_long[traffic_long['website'].isin(TOP_250_LOWER)].copy()

print("   Data loaded successfully")

# Build combined dataset
print("\n⏳ Building combined dataset...")
traffic_min_date = traffic_top250['date'].min()
revenue_filtered = revenue_top250[revenue_top250['month'] >= traffic_min_date.replace(day=1)].copy()

combined_records = []
for i, (idx, row) in enumerate(revenue_filtered.iterrows()):
    website = row['website']
    month = row['month']
    record = {
        'website': website,
        'month': month,
        'niche': row['niche'],
        'revenue': row['revenue'],
        'traffic_latest': get_same_month_latest(traffic_top250, website, month),
        'traffic_avg': get_same_month_avg(traffic_top250, website, month),
        'traffic_lag30': get_lagged_traffic(traffic_top250, website, month, 30),
        'traffic_lag60': get_lagged_traffic(traffic_top250, website, month, 60)
    }
    combined_records.append(record)

combined_df = pd.DataFrame(combined_records)
print(f"   {len(combined_df)} records created")

# Correlation analysis
segments = [10, 50, 100, 250]
traffic_methods = ['traffic_latest', 'traffic_avg', 'traffic_lag30', 'traffic_lag60']
method_labels = ['Same-Month Latest', 'Same-Month Avg', '30-Day Lagged', '60-Day Lagged']

results = []
for seg_size in segments:
    seg_sites = [s.lower() for s in TOP_250_SITES[:seg_size]]
    seg_data = combined_df[combined_df['website'].isin(seg_sites)]
    for method, label in zip(traffic_methods, method_labels):
        corr = calc_correlation(seg_data, method)
        results.append({
            'Segment': f'Top {seg_size}',
            'Method': label,
            'Pearson r': corr['pearson_r'],
            'Spearman r': corr['spearman_r'],
            'N': corr['n']
        })

results_df = pd.DataFrame(results)

# Site summary for efficiency analysis
site_summary = combined_df.groupby('website').agg({
    'revenue': 'sum',
    'traffic_avg': 'mean',
    'niche': 'first'
}).reset_index()
site_summary['rptu'] = site_summary['revenue'] / site_summary['traffic_avg']
site_summary['rptu'] = site_summary['rptu'].replace([np.inf, -np.inf], np.nan)
site_summary['rank'] = site_summary['website'].apply(lambda x: TOP_250_LOWER.index(x) + 1 if x in TOP_250_LOWER else 999)

# ============================================================
# VISUALIZATIONS
# ============================================================
print("\n🎨 Generating visualizations...")

# 1. CORRELATION HEATMAP
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Pearson heatmap
pivot_pearson = results_df.pivot(index='Segment', columns='Method', values='Pearson r')
pivot_pearson = pivot_pearson[method_labels]
pivot_pearson = pivot_pearson.reindex(['Top 10', 'Top 50', 'Top 100', 'Top 250'])

sns.heatmap(pivot_pearson, annot=True, fmt='.3f', cmap='RdYlGn', center=0, 
            ax=axes[0], vmin=0, vmax=0.8, cbar_kws={'label': 'Correlation'})
axes[0].set_title('Pearson Correlation (r)\nTraffic vs Revenue', fontsize=14, fontweight='bold')
axes[0].set_xlabel('')
axes[0].set_ylabel('')

# Spearman heatmap
pivot_spearman = results_df.pivot(index='Segment', columns='Method', values='Spearman r')
pivot_spearman = pivot_spearman[method_labels]
pivot_spearman = pivot_spearman.reindex(['Top 10', 'Top 50', 'Top 100', 'Top 250'])

sns.heatmap(pivot_spearman, annot=True, fmt='.3f', cmap='RdYlGn', center=0,
            ax=axes[1], vmin=0, vmax=0.9, cbar_kws={'label': 'Correlation'})
axes[1].set_title('Spearman Correlation (ρ)\nTraffic vs Revenue', fontsize=14, fontweight='bold')
axes[1].set_xlabel('')
axes[1].set_ylabel('')

plt.tight_layout()
plt.savefig('1_correlation_heatmap.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("   ✓ Saved: 1_correlation_heatmap.png")

# 2. TRAFFIC VS REVENUE SCATTER PLOT
fig, ax = plt.subplots(figsize=(12, 8))

valid_sites = site_summary[site_summary['traffic_avg'].notna() & site_summary['revenue'].notna() & (site_summary['traffic_avg'] > 0)]

# Calculate efficiency quartiles
q1 = valid_sites['rptu'].quantile(0.25)
q3 = valid_sites['rptu'].quantile(0.75)

# Color by efficiency
colors = []
for _, row in valid_sites.iterrows():
    if pd.isna(row['rptu']):
        colors.append('gray')
    elif row['rptu'] >= q3:
        colors.append('#2ecc71')  # Green - High efficiency
    elif row['rptu'] <= q1:
        colors.append('#e74c3c')  # Red - Low efficiency
    else:
        colors.append('#3498db')  # Blue - Average

scatter = ax.scatter(valid_sites['traffic_avg'], valid_sites['revenue'], 
                     c=colors, alpha=0.6, s=80, edgecolors='white', linewidth=0.5)

ax.set_xlabel('Average Monthly Traffic Estimate', fontsize=12)
ax.set_ylabel('Total Revenue ($)', fontsize=12)
ax.set_title('Traffic vs Revenue by Site\n🟢 High Efficiency  🔵 Average  🔴 Low Efficiency (Monetization Opportunities)', 
             fontsize=14, fontweight='bold')

# Add trend line
z = np.polyfit(valid_sites['traffic_avg'], valid_sites['revenue'], 1)
p = np.poly1d(z)
x_line = np.linspace(valid_sites['traffic_avg'].min(), valid_sites['traffic_avg'].max(), 100)
ax.plot(x_line, p(x_line), "k--", alpha=0.5, linewidth=2, label=f'Trend line')

# Label top outliers
for _, row in valid_sites.nlargest(5, 'revenue').iterrows():
    ax.annotate(row['website'].replace('.com','').replace('.net','').replace('.org',''), 
                (row['traffic_avg'], row['revenue']), fontsize=8, alpha=0.8)

# Format y-axis as currency
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))

ax.legend()
ax.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('2_traffic_revenue_scatter.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("   ✓ Saved: 2_traffic_revenue_scatter.png")

# 3. METHOD COMPARISON BAR CHART
fig, ax = plt.subplots(figsize=(12, 6))

x = np.arange(len(segments))
width = 0.2
colors_bar = ['#3498db', '#2ecc71', '#f39c12', '#9b59b6']

for i, (method, label) in enumerate(zip(traffic_methods, method_labels)):
    method_data = results_df[results_df['Method'] == label]
    method_data = method_data.set_index('Segment').reindex(['Top 10', 'Top 50', 'Top 100', 'Top 250'])
    bars = ax.bar(x + i*width, method_data['Pearson r'], width, label=label, color=colors_bar[i], alpha=0.8)

ax.set_xlabel('Segment', fontsize=12)
ax.set_ylabel('Pearson Correlation (r)', fontsize=12)
ax.set_title('Traffic Method Comparison by Segment\nWhich snapshot timing correlates best with revenue?', 
             fontsize=14, fontweight='bold')
ax.set_xticks(x + width * 1.5)
ax.set_xticklabels(['Top 10', 'Top 50', 'Top 100', 'Top 250'])
ax.legend(loc='upper left')
ax.set_ylim(0, 0.8)
ax.axhline(y=0.5, color='gray', linestyle='--', alpha=0.5, label='r=0.5 (moderate)')
ax.grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('3_method_comparison.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("   ✓ Saved: 3_method_comparison.png")

# 4. EFFICIENCY DISTRIBUTION
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Histogram of RPTU
valid_rptu = site_summary[site_summary['rptu'].notna() & (site_summary['rptu'] < 50)]  # Filter extreme outliers
axes[0].hist(valid_rptu['rptu'], bins=30, color='#3498db', alpha=0.7, edgecolor='white')
axes[0].axvline(valid_rptu['rptu'].median(), color='red', linestyle='--', linewidth=2, label=f'Median: {valid_rptu["rptu"].median():.2f}')
axes[0].set_xlabel('Revenue Per Traffic Unit (RPTU)', fontsize=12)
axes[0].set_ylabel('Number of Sites', fontsize=12)
axes[0].set_title('Distribution of Monetization Efficiency', fontsize=14, fontweight='bold')
axes[0].legend()

# Top/Bottom efficiency comparison
top_10_eff = site_summary.nlargest(10, 'rptu')[['website', 'rptu']].copy()
bottom_10_eff = site_summary[site_summary['rptu'].notna()].nsmallest(10, 'rptu')[['website', 'rptu']].copy()

combined_eff = pd.concat([
    top_10_eff.assign(category='Top 10 (Efficient)'),
    bottom_10_eff.assign(category='Bottom 10 (Opportunities)')
])
combined_eff['website_short'] = combined_eff['website'].str.replace('.com','').str.replace('.net','').str.replace('.org','')

colors_eff = ['#2ecc71' if 'Top' in cat else '#e74c3c' for cat in combined_eff['category']]
bars = axes[1].barh(range(len(combined_eff)), combined_eff['rptu'], color=colors_eff, alpha=0.8)
axes[1].set_yticks(range(len(combined_eff)))
axes[1].set_yticklabels(combined_eff['website_short'], fontsize=9)
axes[1].set_xlabel('Revenue Per Traffic Unit (RPTU)', fontsize=12)
axes[1].set_title('Top 10 vs Bottom 10 Efficiency\n🟢 Most Efficient  🔴 Monetization Opportunities', fontsize=14, fontweight='bold')
axes[1].axvline(x=1, color='gray', linestyle='--', alpha=0.5)

plt.tight_layout()
plt.savefig('4_efficiency_analysis.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("   ✓ Saved: 4_efficiency_analysis.png")

# 5. PORTFOLIO CONCENTRATION (Pareto Chart)
fig, ax = plt.subplots(figsize=(12, 6))

site_summary_sorted = site_summary.sort_values('revenue', ascending=False).reset_index(drop=True)
site_summary_sorted['cumulative_revenue'] = site_summary_sorted['revenue'].cumsum()
site_summary_sorted['cumulative_pct'] = 100 * site_summary_sorted['cumulative_revenue'] / site_summary_sorted['revenue'].sum()
site_summary_sorted['site_pct'] = 100 * (site_summary_sorted.index + 1) / len(site_summary_sorted)

ax.fill_between(site_summary_sorted['site_pct'], site_summary_sorted['cumulative_pct'], 
                alpha=0.3, color='#3498db')
ax.plot(site_summary_sorted['site_pct'], site_summary_sorted['cumulative_pct'], 
        color='#3498db', linewidth=2)

# Add reference lines
ax.axhline(y=80, color='red', linestyle='--', alpha=0.7, label='80% of revenue')
ax.axvline(x=20, color='gray', linestyle='--', alpha=0.5)

# Find where 80% revenue is reached
idx_80 = (site_summary_sorted['cumulative_pct'] >= 80).idxmax()
pct_sites_for_80 = site_summary_sorted.loc[idx_80, 'site_pct']
ax.plot(pct_sites_for_80, 80, 'ro', markersize=10)
ax.annotate(f'{pct_sites_for_80:.0f}% of sites\ngenerate 80% revenue', 
            (pct_sites_for_80, 80), xytext=(pct_sites_for_80+10, 70),
            fontsize=10, arrowprops=dict(arrowstyle='->', color='red'))

ax.set_xlabel('% of Sites (ranked by revenue)', fontsize=12)
ax.set_ylabel('% of Total Revenue (cumulative)', fontsize=12)
ax.set_title('Portfolio Concentration (Pareto Analysis)\nHow much revenue comes from top sites?', 
             fontsize=14, fontweight='bold')
ax.set_xlim(0, 100)
ax.set_ylim(0, 105)
ax.legend()
ax.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('5_portfolio_concentration.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("   ✓ Saved: 5_portfolio_concentration.png")

# 6. SEASONALITY
combined_df['month_num'] = combined_df['month'].dt.month
monthly_avg = combined_df.groupby('month_num').agg({
    'revenue': 'mean',
    'traffic_avg': 'mean'
}).round(2)
month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
monthly_avg.index = [month_names[i-1] for i in monthly_avg.index]

fig, ax1 = plt.subplots(figsize=(12, 5))

x = range(len(monthly_avg))
bars = ax1.bar(x, monthly_avg['revenue'], alpha=0.7, color='#2ecc71', label='Avg Revenue')
ax1.set_xlabel('Month', fontsize=12)
ax1.set_ylabel('Average Revenue ($)', color='#2ecc71', fontsize=12)
ax1.tick_params(axis='y', labelcolor='#2ecc71')
ax1.set_xticks(x)
ax1.set_xticklabels(monthly_avg.index)

ax2 = ax1.twinx()
ax2.plot(x, monthly_avg['traffic_avg'], color='#e67e22', marker='o', linewidth=2, markersize=8, label='Avg Traffic')
ax2.set_ylabel('Average Traffic', color='#e67e22', fontsize=12)
ax2.tick_params(axis='y', labelcolor='#e67e22')

plt.title('Seasonality: Average Revenue & Traffic by Month', fontsize=14, fontweight='bold')
fig.legend(loc='upper right', bbox_to_anchor=(0.9, 0.9))
plt.tight_layout()
plt.savefig('6_seasonality.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("   ✓ Saved: 6_seasonality.png")

print("\n" + "="*70)
print("🎨 Generating stability & trend analysis...")
print("="*70)

# ============================================================
# 7. TRAFFIC STABILITY ANALYSIS (CV + Trend)
# Using SAME-MONTH AVERAGE traffic (consistent with correlation analysis)
# ============================================================
from scipy.stats import linregress

print("\n[0%] Calculating same-month average traffic per site...")

# First, calculate same-month average for each site-month combination
# This aligns with how we calculated traffic for the correlation analysis
traffic_top250_copy = traffic_top250.copy()
traffic_top250_copy['month'] = traffic_top250_copy['date'].dt.to_period('M')

# Group by website and month, take mean of traffic within each month
monthly_traffic = traffic_top250_copy.groupby(['website', 'month'])['traffic'].mean().reset_index()
monthly_traffic.columns = ['website', 'month', 'monthly_avg_traffic']
monthly_traffic = monthly_traffic.sort_values(['website', 'month'])

print(f"   [25%] Calculated {len(monthly_traffic)} site-month records")

# Now calculate stability metrics using monthly averages
print("\n[25%] Calculating stability metrics for each site...")

stability_records = []
unique_sites = monthly_traffic['website'].unique()
total_sites = len(unique_sites)

for i, website in enumerate(unique_sites):
    if i % 50 == 0:
        pct = 25 + (50 * i / total_sites)
        print(f"   [{pct:.0f}%] Processing site {i}/{total_sites}...")
    
    site_monthly = monthly_traffic[monthly_traffic['website'] == website].sort_values('month')
    
    if len(site_monthly) < 3:  # Need at least 3 months for meaningful analysis
        continue
    
    traffic_values = site_monthly['monthly_avg_traffic'].values
    
    # Simple CV (std / mean) - now using monthly averages
    mean_traffic = np.mean(traffic_values)
    std_traffic = np.std(traffic_values)
    cv = std_traffic / mean_traffic if mean_traffic > 0 else np.nan
    
    # Trend analysis (linear regression) - across months
    x = np.arange(len(traffic_values))
    try:
        slope, intercept, r_value, p_value, std_err = linregress(x, traffic_values)
        
        # Trend-adjusted CV (residuals around trend line)
        predicted = slope * x + intercept
        residuals = traffic_values - predicted
        residual_std = np.std(residuals)
        trend_adjusted_cv = residual_std / mean_traffic if mean_traffic > 0 else np.nan
        
        # Normalize slope as % change per month
        slope_pct = 100 * slope / mean_traffic if mean_traffic > 0 else 0
        
    except:
        slope, slope_pct, trend_adjusted_cv, r_value = np.nan, np.nan, np.nan, np.nan
    
    stability_records.append({
        'website': website,
        'mean_traffic': mean_traffic,
        'std_traffic': std_traffic,
        'cv': cv,
        'trend_slope': slope,
        'slope_pct_per_period': slope_pct,
        'trend_adjusted_cv': trend_adjusted_cv,
        'trend_r_squared': r_value ** 2 if not np.isnan(r_value) else np.nan,
        'n_traffic_months': len(traffic_values)  # Now counting months, not snapshots
    })

print(f"   [75%] Completed {len(stability_records)} sites")

stability_df = pd.DataFrame(stability_records)

# Merge with revenue data
print("\n[0%] Merging stability metrics with revenue data...")
site_with_stability = site_summary.merge(stability_df, on='website', how='inner')
print(f"   [100%] Merged {len(site_with_stability)} sites with both stability and revenue data")

# Calculate average monthly revenue (not total)
months_in_data = combined_df.groupby('website')['month'].nunique().reset_index()
months_in_data.columns = ['website', 'n_months']
site_with_stability = site_with_stability.merge(months_in_data, on='website', how='left')
site_with_stability['avg_monthly_revenue'] = site_with_stability['revenue'] / site_with_stability['n_months']

# Classify sites into quadrants
print("\n[0%] Classifying sites into stability/trend quadrants...")
median_cv = site_with_stability['cv'].median()
median_slope = site_with_stability['slope_pct_per_period'].median()

def classify_site(row):
    if pd.isna(row['cv']) or pd.isna(row['slope_pct_per_period']):
        return 'Unknown'
    
    is_stable = row['cv'] <= median_cv
    is_growing = row['slope_pct_per_period'] > 0
    
    if is_stable and is_growing:
        return 'Stable + Growing'
    elif is_stable and not is_growing:
        return 'Stable + Declining'
    elif not is_stable and is_growing:
        return 'Volatile + Growing'
    else:
        return 'Volatile + Declining'

site_with_stability['quadrant'] = site_with_stability.apply(classify_site, axis=1)
print(f"   [100%] Classification complete")

# Print quadrant summary
print("\n" + "-"*50)
print("QUADRANT SUMMARY:")
print("-"*50)
quadrant_summary = site_with_stability.groupby('quadrant').agg({
    'website': 'count',
    'avg_monthly_revenue': 'mean',
    'mean_traffic': 'mean'
}).round(2)
quadrant_summary.columns = ['Sites', 'Avg Monthly Revenue', 'Avg Traffic']
print(quadrant_summary.to_string())

# ============================================================
# VISUALIZATION 7: Traffic Stability vs Revenue
# ============================================================
print("\n[0%] Generating stability visualizations...")

fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# Left plot: CV vs Revenue scatter
valid_stability = site_with_stability[
    site_with_stability['cv'].notna() & 
    site_with_stability['avg_monthly_revenue'].notna() &
    (site_with_stability['cv'] < 10)  # Filter extreme outliers
].copy()

# Color by average traffic
scatter = axes[0].scatter(
    valid_stability['cv'], 
    valid_stability['avg_monthly_revenue'],
    c=valid_stability['mean_traffic'],
    cmap='viridis',
    alpha=0.6,
    s=50
)
plt.colorbar(scatter, ax=axes[0], label='Avg Traffic')

# Add trend line
z = np.polyfit(valid_stability['cv'], valid_stability['avg_monthly_revenue'], 1)
p = np.poly1d(z)
x_line = np.linspace(valid_stability['cv'].min(), valid_stability['cv'].max(), 100)
axes[0].plot(x_line, p(x_line), 'r--', linewidth=2, label=f'Trend (r={np.corrcoef(valid_stability["cv"], valid_stability["avg_monthly_revenue"])[0,1]:.2f})')

axes[0].set_xlabel('Traffic Volatility (CV = std/mean)', fontsize=12)
axes[0].set_ylabel('Average Monthly Revenue ($)', fontsize=12)
axes[0].set_title('Traffic Stability vs Revenue\n(Lower CV = More Stable)', fontsize=14, fontweight='bold')
axes[0].legend()
axes[0].grid(True, alpha=0.3)

# Right plot: Stable vs Volatile comparison
stable_sites = site_with_stability[site_with_stability['cv'] <= median_cv]['avg_monthly_revenue']
volatile_sites = site_with_stability[site_with_stability['cv'] > median_cv]['avg_monthly_revenue']

stable_mean = stable_sites.mean()
volatile_mean = volatile_sites.mean()
pct_diff = 100 * (stable_mean - volatile_mean) / volatile_mean if volatile_mean > 0 else 0

bars = axes[1].bar(['Stable Traffic\n(CV ≤ median)', 'Volatile Traffic\n(CV > median)'], 
                   [stable_mean, volatile_mean],
                   color=['#2ecc71', '#e74c3c'],
                   alpha=0.8)

axes[1].set_ylabel('Average Monthly Revenue ($)', fontsize=12)
axes[1].set_title('Stable vs Volatile Sites\n(Revenue Comparison)', fontsize=14, fontweight='bold')

# Add value labels
for bar, val in zip(bars, [stable_mean, volatile_mean]):
    axes[1].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 10, 
                f'${val:,.0f}', ha='center', va='bottom', fontsize=14, fontweight='bold')

# Add percentage difference annotation
axes[1].annotate(f'+{pct_diff:.0f}%', xy=(0.5, stable_mean/2), fontsize=20, 
                color='#2ecc71', fontweight='bold', ha='center')

axes[1].grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('7_traffic_consistency.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("   [25%] Saved: 7_traffic_consistency.png")

# ============================================================
# VISUALIZATION 8: Trend + Stability Combined (2x2 Matrix)
# ============================================================
fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# Left: Scatter plot with quadrant coloring
quadrant_colors = {
    'Stable + Growing': '#2ecc71',      # Green
    'Stable + Declining': '#3498db',    # Blue
    'Volatile + Growing': '#f39c12',    # Orange
    'Volatile + Declining': '#e74c3c',  # Red
    'Unknown': 'gray'
}

for quadrant, color in quadrant_colors.items():
    mask = site_with_stability['quadrant'] == quadrant
    subset = site_with_stability[mask]
    if len(subset) > 0:
        axes[0].scatter(subset['slope_pct_per_period'], subset['cv'],
                       c=color, label=quadrant, alpha=0.6, s=50)

axes[0].axhline(y=median_cv, color='gray', linestyle='--', alpha=0.5)
axes[0].axvline(x=0, color='gray', linestyle='--', alpha=0.5)
axes[0].set_xlabel('Trend (% change per period)', fontsize=12)
axes[0].set_ylabel('Volatility (CV)', fontsize=12)
axes[0].set_title('Traffic Trend vs Stability\n(4 Quadrants)', fontsize=14, fontweight='bold')
axes[0].legend(loc='upper right')
axes[0].set_xlim(-50, 50)
axes[0].set_ylim(0, 3)
axes[0].grid(True, alpha=0.3)

# Right: Revenue by quadrant
quadrant_revenue = site_with_stability.groupby('quadrant')['avg_monthly_revenue'].mean()
quadrant_order = ['Stable + Growing', 'Volatile + Growing', 'Stable + Declining', 'Volatile + Declining']
quadrant_revenue = quadrant_revenue.reindex([q for q in quadrant_order if q in quadrant_revenue.index])

colors_quad = [quadrant_colors[q] for q in quadrant_revenue.index]
bars = axes[1].bar(range(len(quadrant_revenue)), quadrant_revenue.values, color=colors_quad, alpha=0.8)
axes[1].set_xticks(range(len(quadrant_revenue)))
axes[1].set_xticklabels([q.replace(' + ', '\n') for q in quadrant_revenue.index], fontsize=10)
axes[1].set_ylabel('Average Monthly Revenue ($)', fontsize=12)
axes[1].set_title('Revenue by Site Category\n(Trend + Stability)', fontsize=14, fontweight='bold')

# Add value labels
for bar, val in zip(bars, quadrant_revenue.values):
    axes[1].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 5,
                f'${val:,.0f}', ha='center', va='bottom', fontsize=11, fontweight='bold')

axes[1].grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('8_traffic_dr_combined.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("   [50%] Saved: 8_traffic_dr_combined.png")

# ============================================================
# VISUALIZATION 9: Traffic Bands Analysis
# Using MONTH-LEVEL data (same-month avg traffic vs that month's revenue)
# ============================================================
print("   [50%] Calculating traffic bands (month-level analysis)...")

# Use the combined_df which has same-month avg traffic aligned with monthly revenue
# This gives us each site-month as a separate data point
traffic_band_data = combined_df[['website', 'month', 'revenue', 'traffic_avg']].copy()
traffic_band_data = traffic_band_data.dropna(subset=['traffic_avg', 'revenue'])

print(f"   [55%] Analyzing {len(traffic_band_data)} site-month records...")

# Create traffic bands based on that month's traffic (more granular at low end)
bands = [0, 250, 500, 750, 1000, 1500, 2500, 5000, 10000, 25000, 50000, 100000, np.inf]
band_labels = ['0-250', '250-500', '500-750', '750-1K', '1K-1.5K', '1.5K-2.5K', '2.5K-5K', '5K-10K', '10K-25K', '25K-50K', '50K-100K', '100K+']

traffic_band_data['traffic_band'] = pd.cut(
    traffic_band_data['traffic_avg'], 
    bins=bands, 
    labels=band_labels,
    include_lowest=True
)

# Calculate metrics by band (each site-month is one observation)
band_stats = traffic_band_data.groupby('traffic_band', observed=True).agg({
    'website': 'count',  # Number of site-months in this band
    'revenue': ['mean', 'sum'],   # Average AND total revenue
    'traffic_avg': 'mean'  # Average traffic within band
}).reset_index()
band_stats.columns = ['Traffic Band', 'n_observations', 'Avg Revenue', 'Total Revenue', 'Avg Traffic']
band_stats['Revenue per Visitor'] = band_stats['Avg Revenue'] / band_stats['Avg Traffic']

# Calculate % of total revenue from each band
total_revenue_all = band_stats['Total Revenue'].sum()
band_stats['% of Total Revenue'] = 100 * band_stats['Total Revenue'] / total_revenue_all
band_stats['Cumulative %'] = band_stats['% of Total Revenue'].cumsum()

print(f"   [60%] Traffic band breakdown:")
print(f"      {'Band':<12} {'Months':>8} {'Avg Rev':>10} {'Total Rev':>12} {'% Total':>10} {'$/Visitor':>10}")
print(f"      {'-'*12} {'-'*8} {'-'*10} {'-'*12} {'-'*10} {'-'*10}")
for _, row in band_stats.iterrows():
    print(f"      {row['Traffic Band']:<12} {row['n_observations']:>8} ${row['Avg Revenue']:>9,.0f} ${row['Total Revenue']:>11,.0f} {row['% of Total Revenue']:>9.1f}% ${row['Revenue per Visitor']:>9.2f}")

print("   [75%] Generating traffic band charts...")

fig, axes = plt.subplots(1, 3, figsize=(20, 6))

# Left: Revenue by traffic band
colors_band = plt.cm.Blues(np.linspace(0.3, 0.9, len(band_stats)))
bars = axes[0].bar(range(len(band_stats)), band_stats['Avg Revenue'], color=colors_band, alpha=0.9)
axes[0].set_xticks(range(len(band_stats)))
axes[0].set_xticklabels(band_stats['Traffic Band'], fontsize=10)
axes[0].set_xlabel('Traffic Band (Same-Month Avg)', fontsize=12)
axes[0].set_ylabel('Average Revenue ($)', fontsize=12)
axes[0].set_title('Revenue by Traffic Band\n(Month-Level: Each month is one data point)', fontsize=14, fontweight='bold')

# Add labels with observation counts
for i, (bar, row) in enumerate(zip(bars, band_stats.itertuples())):
    axes[0].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 20,
                f'${row._3:,.0f}\n(n={row.n_observations})', ha='center', va='bottom', fontsize=9)

# Highlight the jump from 0-1K to 1K-5K
if len(band_stats) >= 2:
    rev_0_1k = band_stats.iloc[0]['Avg Revenue']
    rev_1_5k = band_stats.iloc[1]['Avg Revenue']
    pct_jump = 100 * (rev_1_5k - rev_0_1k) / rev_0_1k if rev_0_1k > 0 else 0
    axes[0].annotate(f'+{pct_jump:.0f}%', xy=(0.5, (rev_0_1k + rev_1_5k)/2),
                    fontsize=12, color='#e74c3c', fontweight='bold')

axes[0].grid(True, alpha=0.3, axis='y')

# Right: Monetization efficiency ($ per visitor)
# Find best and worst bands for coloring
best_band_idx = band_stats['Revenue per Visitor'].idxmax()
worst_band_idx = band_stats['Revenue per Visitor'].idxmin()

colors_eff = ['#3498db'] * len(band_stats)
colors_eff[best_band_idx] = '#2ecc71'  # Green for best
colors_eff[worst_band_idx] = '#e74c3c'  # Red for worst

bars = axes[1].bar(range(len(band_stats)), band_stats['Revenue per Visitor'], color=colors_eff, alpha=0.8)
axes[1].set_xticks(range(len(band_stats)))
axes[1].set_xticklabels(band_stats['Traffic Band'], fontsize=10)
axes[1].set_xlabel('Traffic Band', fontsize=12)
axes[1].set_ylabel('Revenue per Visitor ($)', fontsize=12)
axes[1].set_title('Monetization Efficiency\n($ per Visitor)', fontsize=14, fontweight='bold')

# Add value labels
for bar, val in zip(bars, band_stats['Revenue per Visitor']):
    axes[1].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.005,
                f'${val:.2f}', ha='center', va='bottom', fontsize=10, fontweight='bold')

# Add legend
from matplotlib.patches import Patch
legend_elements = [Patch(facecolor='#2ecc71', label='Most Efficient'),
                   Patch(facecolor='#e74c3c', label='Least Efficient')]
axes[1].legend(handles=legend_elements, loc='upper right')
axes[1].grid(True, alpha=0.3, axis='y')

# Third chart: % of Total Revenue (finding the sweet spot)
# Color bars by a "value score" = efficiency * revenue share
band_stats['Value Score'] = band_stats['Revenue per Visitor'] * band_stats['% of Total Revenue']
best_value_idx = band_stats['Value Score'].idxmax()

colors_share = ['#3498db'] * len(band_stats)
colors_share[best_value_idx] = '#2ecc71'  # Highlight sweet spot

bars = axes[2].bar(range(len(band_stats)), band_stats['% of Total Revenue'], color=colors_share, alpha=0.8)
axes[2].set_xticks(range(len(band_stats)))
axes[2].set_xticklabels(band_stats['Traffic Band'], fontsize=8, rotation=45, ha='right')
axes[2].set_xlabel('Traffic Band', fontsize=12)
axes[2].set_ylabel('% of Total Revenue', fontsize=12)
axes[2].set_title('Revenue Contribution by Band\n(Where does the money come from?)', fontsize=14, fontweight='bold')

# Add value labels
for bar, (pct, eff) in zip(bars, zip(band_stats['% of Total Revenue'], band_stats['Revenue per Visitor'])):
    axes[2].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.5,
                f'{pct:.1f}%', ha='center', va='bottom', fontsize=9, fontweight='bold')

# Highlight the sweet spot
sweet_spot_band = band_stats.iloc[best_value_idx]['Traffic Band']
sweet_spot_pct = band_stats.iloc[best_value_idx]['% of Total Revenue']
sweet_spot_eff = band_stats.iloc[best_value_idx]['Revenue per Visitor']
axes[2].annotate(f'SWEET SPOT\n${sweet_spot_eff:.2f}/visitor', 
                xy=(best_value_idx, sweet_spot_pct), 
                xytext=(best_value_idx + 1.5, sweet_spot_pct + 5),
                fontsize=10, color='#2ecc71', fontweight='bold',
                arrowprops=dict(arrowstyle='->', color='#2ecc71'))

axes[2].grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('9_traffic_bands.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("   [90%] Saved: 9_traffic_bands.png")

# ============================================================
# VISUALIZATION 10: Summary Dashboard
# ============================================================
print("   [90%] Generating summary dashboard...")

fig, axes = plt.subplots(2, 2, figsize=(16, 12))

# Top-left: Correlation by method (simplified)
best_method_data = results_df[results_df['Segment'] == 'Top 250'][['Method', 'Pearson r']]
colors_method = ['#3498db', '#2ecc71', '#f39c12', '#9b59b6']
bars = axes[0, 0].bar(range(len(best_method_data)), best_method_data['Pearson r'], color=colors_method, alpha=0.8)
axes[0, 0].set_xticks(range(len(best_method_data)))
axes[0, 0].set_xticklabels(best_method_data['Method'], fontsize=9, rotation=15)
axes[0, 0].set_ylabel('Pearson Correlation (r)', fontsize=11)
axes[0, 0].set_title('Traffic Method Comparison\n(Top 250 Sites)', fontsize=12, fontweight='bold')
axes[0, 0].set_ylim(0, 0.7)
for bar, val in zip(bars, best_method_data['Pearson r']):
    axes[0, 0].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                   f'{val:.3f}', ha='center', va='bottom', fontsize=10)
axes[0, 0].grid(True, alpha=0.3, axis='y')

# Top-right: Quadrant distribution
quadrant_counts = site_with_stability['quadrant'].value_counts()
quadrant_counts = quadrant_counts.reindex([q for q in quadrant_order if q in quadrant_counts.index])
colors_quad_pie = [quadrant_colors[q] for q in quadrant_counts.index]
axes[0, 1].pie(quadrant_counts.values, labels=[q.replace(' + ', '\n') for q in quadrant_counts.index],
              colors=colors_quad_pie, autopct='%1.0f%%', startangle=90)
axes[0, 1].set_title('Site Distribution by Category\n(Trend + Stability)', fontsize=12, fontweight='bold')

# Bottom-left: Key metrics summary
metrics_text = f"""
KEY FINDINGS
{'='*40}

Traffic-Revenue Correlation:
  • Best method: Same-Month Average
  • Correlation (r): {results_df[results_df['Method'] == 'Same-Month Avg']['Pearson r'].mean():.3f}

Stability Analysis:
  • Stable sites earn: ${stable_mean:,.0f}/month avg
  • Volatile sites earn: ${volatile_mean:,.0f}/month avg
  • Difference: +{pct_diff:.0f}% for stable sites

Portfolio:
  • Total sites analyzed: {len(site_with_stability)}
  • Best category: Stable + Growing
"""
axes[1, 0].text(0.1, 0.5, metrics_text, fontsize=11, family='monospace',
               verticalalignment='center', transform=axes[1, 0].transAxes)
axes[1, 0].axis('off')
axes[1, 0].set_title('Key Metrics Summary', fontsize=12, fontweight='bold')

# Bottom-right: Revenue distribution histogram
axes[1, 1].hist(site_with_stability['avg_monthly_revenue'].dropna(), bins=30, 
               color='#3498db', alpha=0.7, edgecolor='white')
axes[1, 1].axvline(site_with_stability['avg_monthly_revenue'].median(), color='red', 
                  linestyle='--', linewidth=2, label=f'Median: ${site_with_stability["avg_monthly_revenue"].median():,.0f}')
axes[1, 1].set_xlabel('Average Monthly Revenue ($)', fontsize=11)
axes[1, 1].set_ylabel('Number of Sites', fontsize=11)
axes[1, 1].set_title('Revenue Distribution', fontsize=12, fontweight='bold')
axes[1, 1].legend()
axes[1, 1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('10_summary_dashboard.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.close()
print("   [100%] Saved: 10_summary_dashboard.png")

# ============================================================
# FINAL OUTPUT
# ============================================================
print("\n" + "="*70)
print("✅ ALL VISUALIZATIONS COMPLETE")
print("="*70)
print("\nGenerated files:")
print("   1_correlation_heatmap.png     - Correlation by segment & method")
print("   2_traffic_revenue_scatter.png - Sites plotted with efficiency coloring")
print("   3_method_comparison.png       - Bar chart comparing snapshot methods")
print("   4_efficiency_analysis.png     - RPTU distribution & top/bottom sites")
print("   5_portfolio_concentration.png - Pareto chart of revenue concentration")
print("   6_seasonality.png             - Monthly patterns")
print("   7_traffic_consistency.png     - Stability (CV) vs revenue analysis")
print("   8_traffic_dr_combined.png     - Trend + Stability quadrant analysis")
print("   9_traffic_bands.png           - Revenue by traffic tier")
print("   10_summary_dashboard.png      - Combined summary dashboard")

print("\n" + "="*70)
print("STABILITY ANALYSIS SUMMARY")
print("="*70)
print(f"\nMedian CV (volatility threshold): {median_cv:.3f}")
print(f"Stable sites (CV ≤ {median_cv:.3f}): {len(stable_sites)} sites, ${stable_mean:,.0f}/month avg")
print(f"Volatile sites (CV > {median_cv:.3f}): {len(volatile_sites)} sites, ${volatile_mean:,.0f}/month avg")
print(f"Revenue premium for stability: +{pct_diff:.0f}%")

print("\nQuadrant breakdown:")
for quadrant in quadrant_order:
    if quadrant in site_with_stability['quadrant'].values:
        count = len(site_with_stability[site_with_stability['quadrant'] == quadrant])
        rev = site_with_stability[site_with_stability['quadrant'] == quadrant]['avg_monthly_revenue'].mean()
        print(f"   {quadrant}: {count} sites, ${rev:,.0f}/month avg")
