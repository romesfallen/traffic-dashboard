# Traffic Dashboard

Traffic comparison dashboard for lyncconf.com showing Our Data vs Ahrefs data with revenue overlay.

## Setup

1. CSV files should be in the same directory:
   - `revenue-history.csv`
   - `traffic-data.csv`

2. Deploy to Vercel:
   - Connect GitHub repo to Vercel
   - Vercel will auto-deploy on push

## Local Development

Run a local server:
```bash
python3 -m http.server 8000
```

Then open: http://localhost:8000/index-apex.html
