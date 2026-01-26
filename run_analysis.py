#!/usr/bin/env python3
"""
Traffic-Revenue Statistical Analysis
Runs the full analysis and outputs results.
"""

import pandas as pd
import numpy as np
from scipy.stats import pearsonr, spearmanr
import warnings
warnings.filterwarnings('ignore')

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
print(f"   Revenue: {revenue_df.shape[0]} rows")
print(f"   Traffic: {traffic_df.shape[0]} rows")

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
print(f"   Revenue records: {len(revenue_long)}")

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
print(f"   Traffic records: {len(traffic_long)}")

# Filter to top 250
revenue_top250 = revenue_long[revenue_long['website'].isin(TOP_250_LOWER)].copy()
traffic_top250 = traffic_long[traffic_long['website'].isin(TOP_250_LOWER)].copy()

sites_with_revenue = set(revenue_top250['website'].unique())
sites_with_traffic = set(traffic_top250['website'].unique())
sites_with_both = sites_with_revenue & sites_with_traffic

print(f"\n   Sites with revenue data: {len(sites_with_revenue)}")
print(f"   Sites with traffic data: {len(sites_with_traffic)}")
print(f"   Sites with BOTH: {len(sites_with_both)}")

# Build combined dataset
print("\n⏳ Building combined dataset (aligning traffic snapshots with monthly revenue)...")
traffic_min_date = traffic_top250['date'].min()
revenue_filtered = revenue_top250[revenue_top250['month'] >= traffic_min_date.replace(day=1)].copy()

combined_records = []
total = len(revenue_filtered)
for i, (idx, row) in enumerate(revenue_filtered.iterrows()):
    if i % 500 == 0 and i > 0:
        print(f"   Processing {i}/{total}...")
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
print(f"   Combined records: {len(combined_df)}")

# Data completeness
print("\n📊 Data completeness:")
for col in ['traffic_latest', 'traffic_avg', 'traffic_lag30', 'traffic_lag60']:
    valid = combined_df[col].notna().sum()
    pct = 100 * valid / len(combined_df)
    print(f"   {col}: {valid} valid ({pct:.1f}%)")

# Correlation analysis
print("\n" + "="*70)
print("CORRELATION ANALYSIS: Traffic vs Revenue")
print("="*70)

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

# Print correlation table
print("\n📈 PEARSON CORRELATION (r) BY SEGMENT AND METHOD:")
print("-"*70)
pivot = results_df.pivot(index='Segment', columns='Method', values='Pearson r')
pivot = pivot[method_labels]
pivot = pivot.reindex(['Top 10', 'Top 50', 'Top 100', 'Top 250'])
print(pivot.round(4).to_string())

print("\n📈 SPEARMAN CORRELATION (ρ) BY SEGMENT AND METHOD:")
print("-"*70)
pivot_s = results_df.pivot(index='Segment', columns='Method', values='Spearman r')
pivot_s = pivot_s[method_labels]
pivot_s = pivot_s.reindex(['Top 10', 'Top 50', 'Top 100', 'Top 250'])
print(pivot_s.round(4).to_string())

# Best method per segment
print("\n" + "="*70)
print("BEST TRAFFIC METHOD BY SEGMENT")
print("="*70)
for seg in ['Top 10', 'Top 50', 'Top 100', 'Top 250']:
    seg_results = results_df[results_df['Segment'] == seg]
    best_idx = seg_results['Pearson r'].abs().idxmax()
    best = seg_results.loc[best_idx]
    print(f"\n{seg}:")
    print(f"   Best method: {best['Method']}")
    print(f"   Pearson r = {best['Pearson r']:.4f}")
    print(f"   Sample size: {best['N']:.0f}")

# Check lagged hypothesis
print("\n" + "="*70)
print("HYPOTHESIS TEST: Do lagged traffic estimates correlate better?")
print("="*70)
lag30_avg = results_df[results_df['Method'] == '30-Day Lagged']['Pearson r'].abs().mean()
lag60_avg = results_df[results_df['Method'] == '60-Day Lagged']['Pearson r'].abs().mean()
same_latest_avg = results_df[results_df['Method'] == 'Same-Month Latest']['Pearson r'].abs().mean()
same_avg_avg = results_df[results_df['Method'] == 'Same-Month Avg']['Pearson r'].abs().mean()

print(f"\nAverage |Pearson r| across all segments:")
print(f"   Same-Month Latest: {same_latest_avg:.4f}")
print(f"   Same-Month Avg:    {same_avg_avg:.4f}")
print(f"   30-Day Lagged:     {lag30_avg:.4f}")
print(f"   60-Day Lagged:     {lag60_avg:.4f}")

best_method = max([
    ('Same-Month Latest', same_latest_avg),
    ('Same-Month Avg', same_avg_avg),
    ('30-Day Lagged', lag30_avg),
    ('60-Day Lagged', lag60_avg)
], key=lambda x: x[1])

print(f"\n🏆 WINNER: {best_method[0]} (avg |r| = {best_method[1]:.4f})")

if lag30_avg > same_latest_avg or lag60_avg > same_latest_avg:
    print("\n✅ CONFIRMED: Lagged traffic shows stronger correlation than same-month!")
    print("   This supports the hypothesis that customers don't update metrics frequently.")
else:
    print("\n❌ NOT CONFIRMED: Same-month traffic shows similar or stronger correlation.")

# Revenue efficiency analysis
print("\n" + "="*70)
print("REVENUE EFFICIENCY ANALYSIS")
print("="*70)

site_summary = combined_df.groupby('website').agg({
    'revenue': 'sum',
    'traffic_avg': 'mean',
    'niche': 'first'
}).reset_index()

site_summary['rptu'] = site_summary['revenue'] / site_summary['traffic_avg']
site_summary['rptu'] = site_summary['rptu'].replace([np.inf, -np.inf], np.nan)
site_summary['rank'] = site_summary['website'].apply(lambda x: TOP_250_LOWER.index(x) + 1 if x in TOP_250_LOWER else 999)
site_summary = site_summary.sort_values('rank')

print("\n💰 TOP 10 MOST EFFICIENT SITES (Highest Revenue per Traffic Unit):")
print("-"*70)
top_eff = site_summary.nlargest(10, 'rptu')[['rank', 'website', 'revenue', 'traffic_avg', 'rptu']].copy()
top_eff['revenue'] = top_eff['revenue'].apply(lambda x: f"${x:,.0f}")
top_eff['traffic_avg'] = top_eff['traffic_avg'].round(0)
top_eff['rptu'] = top_eff['rptu'].round(2)
print(top_eff.to_string(index=False))

print("\n⚠️  BOTTOM 10 LEAST EFFICIENT (Monetization Opportunities):")
print("-"*70)
bottom_eff = site_summary[site_summary['rptu'].notna()].nsmallest(10, 'rptu')[['rank', 'website', 'revenue', 'traffic_avg', 'rptu']].copy()
bottom_eff['revenue'] = bottom_eff['revenue'].apply(lambda x: f"${x:,.0f}")
bottom_eff['traffic_avg'] = bottom_eff['traffic_avg'].round(0)
bottom_eff['rptu'] = bottom_eff['rptu'].round(2)
print(bottom_eff.to_string(index=False))

# Portfolio concentration
print("\n" + "="*70)
print("PORTFOLIO CONCENTRATION")
print("="*70)
total_revenue = site_summary['revenue'].sum()
site_summary_sorted = site_summary.sort_values('revenue', ascending=False)

for n in [10, 25, 50, 100]:
    top_n_revenue = site_summary_sorted.head(n)['revenue'].sum()
    pct = 100 * top_n_revenue / total_revenue
    print(f"   Top {n:3d} sites: ${top_n_revenue:>12,.0f} ({pct:5.1f}% of total)")

print("\n" + "="*70)
print("ANALYSIS COMPLETE")
print("="*70)
