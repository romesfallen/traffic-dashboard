import pandas as pd
import plotly.graph_objects as go
import re
import os

# --- PRE-FLIGHT CHECK ---
print("Script initiated...")

# 1. Setup Paths
filename = 'revenue-history.csv'
desktop_path = os.path.expanduser("~/Desktop/rank_chart.html")

if not os.path.exists(filename):
    print(f"CRITICAL ERROR: {filename} not found in {os.getcwd()}")
    exit()

# 2. Load Data
print("Step 1: Loading CSV...")
df = pd.read_csv(filename)

# 3. Identify Date Columns
date_pattern = re.compile(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$')
date_cols = [col for col in df.columns if date_pattern.match(col)]
print(f"Step 2: Found {len(date_cols)} months of data.")

# 4. Clean Revenue (Vectorized for speed)
print("Step 3: Cleaning revenue data...")
for col in date_cols:
    df[col] = pd.to_numeric(
        df[col].astype(str).str.replace('$', '').str.replace(',', '').str.replace('-', '0'), 
        errors='coerce'
    ).fillna(0.0)

# 5. Get Top 15 Sites
df['Total'] = df[date_cols].sum(axis=1)
top_15_df = df.nlargest(15, 'Total').copy()
top_sites = top_15_df['Website'].tolist()
print(f"Step 4: Top site identified: {top_sites[0]}")

# 6. Build the Bump Chart
print("Step 5: Generating Rank Evolution...")
fig = go.Figure()
month_map = {'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12}

for site in top_sites:
    x_vals = []
    y_vals = []
    
    for col in date_cols:
        # Calculate rank across the WHOLE portfolio for this month
        monthly_ranks = df[col].rank(method='min', ascending=False)
        site_idx = df[df['Website'] == site].index[0]
        
        parts = col.split()
        x_vals.append(pd.Timestamp(year=int(parts[1]), month=month_map[parts[0]], day=1))
        y_vals.append(monthly_ranks[site_idx])

    fig.add_trace(go.Scatter(
        x=x_vals, 
        y=y_vals, 
        mode='lines+markers', 
        name=site,
        line=dict(shape='spline', width=3),
        marker=dict(size=8)
    ))

# 7. Final Layout
fig.update_layout(
    title="Top 15 Sites: Portfolio Rank Evolution",
    xaxis_title="Timeline",
    yaxis=dict(title="Rank (Portfolio Wide)", autorange='reversed', gridcolor='lightgrey'),
    plot_bgcolor='white',
    height=800,
    hovermode='x unified'
)

# 8. Save and Confirmation
print(f"Step 6: Saving to {desktop_path}...")
fig.write_html(desktop_path)

print("\n" + "="*40)
print("SUCCESS: Chart generated!")
print(f"LOCATION: Go to your Desktop and open 'rank_chart.html'")
print("="*40)