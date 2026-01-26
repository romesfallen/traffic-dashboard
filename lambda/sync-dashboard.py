"""
Dashboard Data Sync - AWS Lambda Function

Syncs data from Google Sheets to S3 for the traffic dashboard.
Runs every 30 minutes via EventBridge.

Sheets synced:
- Traffic Monthly -> traffic-data.csv
- Traffic Average -> internal-average-traffic.csv  
- DR -> DR History.csv
- RD -> RD History.csv
- Revenue -> revenue-history.csv
"""

import os
import json
import io
import base64
from datetime import datetime

import boto3
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration from environment variables
GOOGLE_SERVICE_ACCOUNT_KEY = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY', '')
S3_BUCKET_NAME = os.environ.get('S3_BUCKET_NAME', 'traffic-dashboard-theta')
# AWS_REGION is automatically set by Lambda - no need to configure
SLACK_WEBHOOK_URL = os.environ.get('SLACK_WEBHOOK_URL', '')

# Google Sheets configuration
TRAFFIC_DR_SHEET_ID = '1Vcyl9hrxdKUfKufHdM9csZjEQcS0rt3tLRyNR1f4uR8'
REVENUE_SHEET_ID = '1a4XNaxHJ7U7pJhfraGRDr9qEVsTGdCAUgx_QLJoLQXA'

# Tab names
TRAFFIC_MONTHLY_TAB = 'Traffic Monthly'
TRAFFIC_AVERAGE_TAB = 'Traffic Average'
DR_TAB = 'DR'
RD_TAB = 'RD'
REVENUE_TAB = 'Revenue'

# S3 file names
S3_FILES = {
    'traffic_monthly': 'traffic-data.csv',
    'traffic_average': 'internal-average-traffic.csv',
    'dr': 'DR History.csv',
    'rd': 'RD History.csv',
    'revenue': 'revenue-history.csv'
}

# Priority CSV file names (smaller files with top domains only)
S3_PRIORITY_FILES = {
    'traffic_monthly': 'traffic-data-priority.csv',
    'traffic_average': 'internal-average-traffic-priority.csv',
    'dr': 'DR History-priority.csv',
    'rd': 'RD History-priority.csv'
}


def get_google_sheets_service():
    """Initialize Google Sheets API service."""
    try:
        # Decode base64 service account key
        key_json = base64.b64decode(GOOGLE_SERVICE_ACCOUNT_KEY).decode('utf-8')
        key_dict = json.loads(key_json)
        
        credentials = service_account.Credentials.from_service_account_info(
            key_dict,
            scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
        )
        
        service = build('sheets', 'v4', credentials=credentials)
        return service
    except Exception as e:
        print(f"Error initializing Google Sheets service: {e}")
        raise


def get_s3_client():
    """Initialize S3 client."""
    return boto3.client('s3')


def read_sheet_data(service, spreadsheet_id, tab_name):
    """Read all data from a Google Sheets tab."""
    try:
        # Get all data from the sheet
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=f"'{tab_name}'"
        ).execute()
        
        values = result.get('values', [])
        print(f"Read {len(values)} rows from {tab_name}")
        return values
    except Exception as e:
        print(f"Error reading sheet {tab_name}: {e}")
        raise


def convert_to_csv(data):
    """Convert 2D array to CSV string."""
    if not data:
        return ""
    
    lines = []
    for row in data:
        # Escape commas and quotes in cells
        escaped_cells = []
        for cell in row:
            cell_str = str(cell) if cell is not None else ''
            # If cell contains comma, newline, or quote, wrap in quotes
            if ',' in cell_str or '\n' in cell_str or '"' in cell_str:
                cell_str = '"' + cell_str.replace('"', '""') + '"'
            escaped_cells.append(cell_str)
        lines.append(','.join(escaped_cells))
    
    return '\n'.join(lines)


def upload_to_s3(s3_client, file_name, content):
    """Upload content to S3 bucket."""
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=file_name,
            Body=content.encode('utf-8'),
            ContentType='text/csv'
        )
        print(f"Uploaded {file_name} to S3 ({len(content)} bytes)")
        return True
    except Exception as e:
        print(f"Error uploading {file_name} to S3: {e}")
        raise


def parse_currency(value):
    """Parse currency string like '$1,234.56' to float."""
    if not value or value == '-' or value == 'x' or str(value).strip() == '':
        return 0.0
    try:
        # Remove $ and commas, then convert to float
        cleaned = str(value).replace('$', '').replace(',', '').strip()
        return float(cleaned)
    except (ValueError, TypeError):
        return 0.0


def compute_priority_domains(revenue_data):
    """
    Compute priority domains from revenue data.
    Returns a set of domain names that are in the top 100 for:
    - Lifetime revenue
    - Last 3 months revenue
    - Current month revenue
    
    Args:
        revenue_data: 2D array with header row, containing revenue data
    
    Returns:
        Set of priority domain names (lowercase)
    """
    import re
    from datetime import datetime
    
    if not revenue_data or len(revenue_data) < 2:
        print("No revenue data for priority computation")
        return set()
    
    header = revenue_data[0]
    
    # Find Website column
    website_col = None
    for idx, cell in enumerate(header):
        if cell and str(cell).strip().lower() == 'website':
            website_col = idx
            break
    
    if website_col is None:
        print("Could not find Website column in revenue data")
        return set()
    
    # Find month columns and categorize them
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    month_to_num = {name: idx + 1 for idx, name in enumerate(month_names)}
    
    now = datetime.utcnow()
    current_year = now.year
    current_month = now.month
    
    # Calculate last 3 complete months
    last_3_months = []
    for i in range(1, 4):
        m = current_month - i
        y = current_year
        if m <= 0:
            m += 12
            y -= 1
        last_3_months.append((y, m))
    
    # Find column indices for different periods
    month_columns = {}  # (year, month) -> column_index
    current_month_col = None
    
    for idx, col_name in enumerate(header):
        if not col_name:
            continue
        col_str = str(col_name).strip()
        
        # Handle "Current" column as current month
        if col_str.lower() == 'current':
            current_month_col = idx
            continue
        
        # Match "Mon YYYY" format
        match = re.match(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$', col_str)
        if match:
            month_name, year_str = match.groups()
            month_num = month_to_num[month_name]
            year = int(year_str)
            month_columns[(year, month_num)] = idx
    
    # If we found a "Current" column, map it to current month
    if current_month_col is not None:
        month_columns[(current_year, current_month)] = current_month_col
    
    print(f"Found {len(month_columns)} month columns in revenue data")
    
    # Calculate revenue totals for each domain
    domain_lifetime = {}  # domain -> total lifetime revenue
    domain_last3 = {}     # domain -> last 3 months revenue
    domain_current = {}   # domain -> current month revenue
    
    for row in revenue_data[1:]:
        if len(row) <= website_col:
            continue
        
        domain = str(row[website_col]).strip().lower() if row[website_col] else ''
        if not domain or domain == 'website' or domain == 'unmatched payments':
            continue
        
        # Calculate lifetime (sum all months)
        lifetime_total = 0.0
        for (year, month), col_idx in month_columns.items():
            if col_idx < len(row):
                lifetime_total += parse_currency(row[col_idx])
        domain_lifetime[domain] = lifetime_total
        
        # Calculate last 3 months
        last3_total = 0.0
        for (y, m) in last_3_months:
            if (y, m) in month_columns:
                col_idx = month_columns[(y, m)]
                if col_idx < len(row):
                    last3_total += parse_currency(row[col_idx])
        domain_last3[domain] = last3_total
        
        # Calculate current month
        current_total = 0.0
        if (current_year, current_month) in month_columns:
            col_idx = month_columns[(current_year, current_month)]
            if col_idx < len(row):
                current_total = parse_currency(row[col_idx])
        domain_current[domain] = current_total
    
    # Get top 100 from each category
    top_lifetime = sorted(domain_lifetime.items(), key=lambda x: x[1], reverse=True)[:100]
    top_last3 = sorted(domain_last3.items(), key=lambda x: x[1], reverse=True)[:100]
    top_current = sorted(domain_current.items(), key=lambda x: x[1], reverse=True)[:100]
    
    # Union all top domains
    priority_set = set()
    priority_set.update(d for d, _ in top_lifetime)
    priority_set.update(d for d, _ in top_last3)
    priority_set.update(d for d, _ in top_current)
    
    print(f"Priority domains computed: {len(priority_set)} unique domains")
    print(f"  - Top 100 lifetime: {len(top_lifetime)} domains")
    print(f"  - Top 100 last 3 months: {len(top_last3)} domains")
    print(f"  - Top 100 current month: {len(top_current)} domains")
    
    return priority_set


def filter_csv_to_priority(csv_data, priority_domains, website_col_name='Website'):
    """
    Filter CSV data to only include rows for priority domains.
    
    Args:
        csv_data: 2D array with header row
        priority_domains: Set of domain names (lowercase)
        website_col_name: Name of the column containing domain names
    
    Returns:
        Filtered 2D array with header and priority domain rows only
    """
    if not csv_data or len(csv_data) < 2:
        return csv_data
    
    header = csv_data[0]
    
    # Find Website column
    website_col = None
    for idx, cell in enumerate(header):
        if cell and str(cell).strip().lower() == website_col_name.lower():
            website_col = idx
            break
    
    if website_col is None:
        print(f"Could not find {website_col_name} column, returning full data")
        return csv_data
    
    # Filter rows
    filtered = [header]
    for row in csv_data[1:]:
        if len(row) <= website_col:
            continue
        domain = str(row[website_col]).strip().lower() if row[website_col] else ''
        if domain in priority_domains:
            filtered.append(row)
    
    print(f"Filtered CSV: {len(csv_data)} rows -> {len(filtered)} rows (priority only)")
    return filtered


def read_existing_s3_csv(s3_client, file_name):
    """
    Read existing CSV from S3 and parse into 2D array.
    Returns None if file doesn't exist.
    """
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=file_name)
        content = response['Body'].read().decode('utf-8')
        
        # Parse CSV content into 2D array
        import csv
        reader = csv.reader(io.StringIO(content))
        data = list(reader)
        print(f"Read existing {file_name} from S3 ({len(data)} rows)")
        return data
    except s3_client.exceptions.NoSuchKey:
        print(f"No existing {file_name} in S3 (first sync)")
        return None
    except Exception as e:
        print(f"Error reading {file_name} from S3: {e}")
        return None


def merge_wide_format_data(existing_data, new_data):
    """
    Merge two wide-format CSVs (dates as columns).
    
    - Combines all columns from both sources
    - For overlapping date columns, prefers new_data values
    - For domains in both, merges their data
    - Preserves historical columns that are only in existing_data
    
    Assumes:
    - First row is header
    - Column containing 'Website' is the domain identifier
    - Date columns follow pattern like 'Mon D - YYYY' or 'Mon YYYY'
    """
    if not existing_data or len(existing_data) < 2:
        print("No existing data to merge, using new data only")
        return new_data
    
    if not new_data or len(new_data) < 2:
        print("No new data to merge, keeping existing data")
        return existing_data
    
    # Find Website column index in each dataset
    def find_website_col(header):
        for idx, cell in enumerate(header):
            if cell and str(cell).strip().lower() == 'website':
                return idx
        return 1  # Default to column 1 if not found
    
    existing_header = existing_data[0]
    new_header = new_data[0]
    
    existing_website_col = find_website_col(existing_header)
    new_website_col = find_website_col(new_header)
    
    print(f"Existing: {len(existing_header)} columns, Website at col {existing_website_col}")
    print(f"New: {len(new_header)} columns, Website at col {new_website_col}")
    
    # Build merged header: all columns from existing + any new columns from new_data
    # For non-date columns, keep structure from new_data
    # For date columns, combine all unique dates
    
    import re
    date_pattern = re.compile(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)\s*-?\s*(\d{4})?$|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$')
    
    def is_date_column(col_name):
        if not col_name:
            return False
        return bool(date_pattern.match(str(col_name).strip()))
    
    def normalize_date(col_name):
        """Normalize date column name for comparison."""
        return str(col_name).strip().lower().replace('  ', ' ')
    
    # Collect all date columns from both sources
    existing_dates = {}
    for idx, col in enumerate(existing_header):
        if is_date_column(col):
            existing_dates[normalize_date(col)] = (idx, col)
    
    new_dates = {}
    for idx, col in enumerate(new_header):
        if is_date_column(col):
            new_dates[normalize_date(col)] = (idx, col)
    
    print(f"Existing has {len(existing_dates)} date columns")
    print(f"New has {len(new_dates)} date columns")
    
    # Find date columns only in existing (historical data to preserve)
    historical_dates = set(existing_dates.keys()) - set(new_dates.keys())
    print(f"Historical date columns to preserve: {len(historical_dates)}")
    
    # Build merged header:
    # 1. Non-date columns from new_data (takes precedence for structure)
    # 2. All date columns (historical from existing + current from new)
    
    merged_header = []
    non_date_cols_new = []  # (orig_idx, col_name)
    
    for idx, col in enumerate(new_header):
        if not is_date_column(col):
            non_date_cols_new.append((idx, col))
            merged_header.append(col)
    
    # Add all date columns sorted by date
    def parse_date_for_sorting(col_name):
        """Parse date column name for sorting."""
        col = str(col_name).strip()
        months = {'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
                  'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12}
        
        # Try "Mon D - YYYY" format
        match = re.match(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)\s*-\s*(\d{4})$', col, re.IGNORECASE)
        if match:
            month = months[match.group(1).lower()]
            day = int(match.group(2))
            year = int(match.group(3))
            return (year, month, day)
        
        # Try "Mon YYYY" format
        match = re.match(r'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$', col, re.IGNORECASE)
        if match:
            month = months[match.group(1).lower()]
            year = int(match.group(2))
            return (year, month, 1)
        
        return (9999, 12, 31)  # Unknown dates at end
    
    # Combine all date columns
    all_date_cols = {}
    for norm_date, (idx, col) in existing_dates.items():
        all_date_cols[norm_date] = col
    for norm_date, (idx, col) in new_dates.items():
        all_date_cols[norm_date] = col  # Prefer new_data column name format
    
    # Sort date columns by date
    sorted_date_cols = sorted(all_date_cols.values(), key=parse_date_for_sorting)
    merged_header.extend(sorted_date_cols)
    
    print(f"Merged header has {len(merged_header)} columns ({len(non_date_cols_new)} non-date + {len(sorted_date_cols)} date)")
    
    # Build lookup for column positions
    merged_col_index = {normalize_date(col) if is_date_column(col) else str(col).strip().lower(): idx 
                        for idx, col in enumerate(merged_header)}
    
    # Build domain data from existing (historical base)
    domain_data = {}  # domain -> {col_idx: value}
    
    for row in existing_data[1:]:
        if len(row) <= existing_website_col:
            continue
        domain = str(row[existing_website_col]).strip().lower() if row[existing_website_col] else ''
        if not domain or domain == 'website':
            continue
        
        domain_data[domain] = {}
        for idx, val in enumerate(row):
            if idx < len(existing_header):
                col_name = existing_header[idx]
                if is_date_column(col_name):
                    norm_col = normalize_date(col_name)
                    if norm_col in merged_col_index:
                        domain_data[domain][merged_col_index[norm_col]] = val
                elif str(col_name).strip().lower() in merged_col_index:
                    # Non-date column
                    pass  # Will be overwritten by new_data
    
    # Overlay new data (takes precedence for overlapping dates and non-date columns)
    for row in new_data[1:]:
        if len(row) <= new_website_col:
            continue
        domain = str(row[new_website_col]).strip().lower() if row[new_website_col] else ''
        if not domain or domain == 'website':
            continue
        
        if domain not in domain_data:
            domain_data[domain] = {}
        
        for idx, val in enumerate(row):
            if idx < len(new_header):
                col_name = new_header[idx]
                if is_date_column(col_name):
                    norm_col = normalize_date(col_name)
                    if norm_col in merged_col_index:
                        domain_data[domain][merged_col_index[norm_col]] = val
                else:
                    # Non-date columns from new data (structure columns)
                    col_key = str(col_name).strip().lower()
                    if col_key in merged_col_index:
                        domain_data[domain][merged_col_index[col_key]] = val
    
    # Build merged rows
    merged_data = [merged_header]
    
    # Sort domains for consistent output
    for domain in sorted(domain_data.keys()):
        row = [''] * len(merged_header)
        for col_idx, val in domain_data[domain].items():
            if col_idx < len(row):
                row[col_idx] = val
        merged_data.append(row)
    
    print(f"Merged data: {len(merged_data)} rows (including header)")
    return merged_data


def read_sync_log(s3_client):
    """Read existing sync log from S3."""
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key='sync-log.json')
        content = response['Body'].read().decode('utf-8')
        return json.loads(content)
    except s3_client.exceptions.NoSuchKey:
        print("No existing sync-log.json (first run)")
        return None
    except Exception as e:
        print(f"Error reading sync-log.json: {e}")
        return None


def write_sync_log(s3_client, log_data):
    """Write sync log to S3."""
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key='sync-log.json',
            Body=json.dumps(log_data, indent=2).encode('utf-8'),
            ContentType='application/json'
        )
        print("Wrote sync-log.json to S3")
        return True
    except Exception as e:
        print(f"Error writing sync-log.json: {e}")
        return False


def get_s3_file_size(s3_client, file_name):
    """Get the size of a file in S3."""
    try:
        response = s3_client.head_object(Bucket=S3_BUCKET_NAME, Key=file_name)
        return response['ContentLength']
    except Exception:
        return 0


def extract_csv_metadata(s3_client):
    """
    Extract metadata from CSVs including:
    - 'Last update' timestamp from header (when Google Sheets was updated)
    - Row count
    - Column count
    - Newest date column
    
    Returns dict: {file_name: {sheet_updated, rows, columns, newest_date_col}}
    """
    import re
    import csv
    
    metadata = {}
    
    files_to_check = [
        ('revenue-history.csv', 'Revenue'),
        ('traffic-data.csv', 'Traffic Monthly'),
        ('internal-average-traffic.csv', 'Traffic Average'),
        ('DR History.csv', 'DR'),
        ('RD History.csv', 'RD'),
    ]
    
    for file_name, label in files_to_check:
        try:
            response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=file_name)
            content = response['Body'].read().decode('utf-8')
            
            # Parse CSV
            reader = csv.reader(io.StringIO(content))
            rows = list(reader)
            
            if not rows:
                metadata[file_name] = None
                continue
            
            header = rows[0]
            row_count = len(rows) - 1  # Exclude header
            col_count = len(header)
            
            # Extract "Last update" timestamp from first cell
            sheet_updated = None
            first_cell = header[0] if header else ''
            match = re.search(r'Last update\s+(\d{1,2}/\d{1,2}/\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M\s+\w+)', first_cell)
            if match:
                sheet_updated = match.group(1)
            
            # Find newest date column
            date_cols = []
            for col in header:
                if any(m in col for m in ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']):
                    date_cols.append(col)
            newest_date_col = date_cols[-1] if date_cols else None
            
            metadata[file_name] = {
                'sheet_updated': sheet_updated,
                'rows': row_count,
                'columns': col_count,
                'newest_date_col': newest_date_col
            }
            
            print(f"  {label}: {row_count} rows, {col_count} cols, newest: {newest_date_col}")
            if sheet_updated:
                print(f"    Sheet updated: {sheet_updated}")
                
        except Exception as e:
            print(f"  Error reading {file_name}: {e}")
            metadata[file_name] = None
    
    return metadata


def send_slack_notification(message, is_error=False):
    """Send notification to Slack."""
    if not SLACK_WEBHOOK_URL:
        print("Slack webhook not configured, skipping notification")
        return
    
    try:
        color = "#ff0000" if is_error else "#36a64f"
        icon = ":x:" if is_error else ":white_check_mark:"
        
        payload = {
            "attachments": [{
                "color": color,
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"{icon} *Dashboard Sync*\n{message}"
                        }
                    },
                    {
                        "type": "context",
                        "elements": [{
                            "type": "mrkdwn",
                            "text": f"_Timestamp: {datetime.utcnow().isoformat()}Z_"
                        }]
                    }
                ]
            }]
        }
        
        response = requests.post(SLACK_WEBHOOK_URL, json=payload, timeout=10)
        response.raise_for_status()
        print("Slack notification sent")
    except Exception as e:
        print(f"Error sending Slack notification: {e}")


def find_header_row(data):
    """Find the row index that contains 'Website' as a column header."""
    import re
    
    for row_idx, row in enumerate(data):
        # Look for a row that has 'Website' as one of the first few cells
        # This is more reliable than looking for date patterns
        for cell_idx, cell in enumerate(row[:5]):  # Check first 5 cells
            cell_str = str(cell).strip().lower() if cell else ''
            if cell_str == 'website':
                print(f"Found header row at index {row_idx} ('Website' at column {cell_idx})")
                return row_idx
    
    # Fallback: look for row where first cell is empty or a number, 
    # and second cell looks like a domain name
    domain_pattern = re.compile(r'^[a-z0-9][-a-z0-9]*\.[a-z]{2,}$', re.IGNORECASE)
    for row_idx, row in enumerate(data):
        if len(row) >= 2:
            first_cell = str(row[0]).strip() if row[0] else ''
            second_cell = str(row[1]).strip() if row[1] else ''
            # If first cell is a number and second looks like a domain, 
            # the header is likely the previous row
            if first_cell.isdigit() and domain_pattern.match(second_cell):
                header_idx = max(0, row_idx - 1)
                print(f"Found data row at index {row_idx}, header likely at {header_idx}")
                return header_idx
    
    print("No header row found, using row 0")
    return 0


def sync_sheet_to_s3(service, s3_client, spreadsheet_id, tab_name, s3_file_name, 
                     find_date_header=False, preserve_history=False, return_data=False):
    """
    Sync a single sheet tab to S3.
    
    Args:
        preserve_history: If True, merge with existing S3 data to preserve 
                         historical columns that may have been archived from Sheets.
        return_data: If True, return the merged data (for priority domain computation)
    
    Returns:
        If return_data is False: True on success, False on failure
        If return_data is True: (success: bool, data: list) tuple
    """
    print(f"\n--- Syncing {tab_name} -> {s3_file_name} ---")
    
    # Read data from Google Sheets
    new_data = read_sheet_data(service, spreadsheet_id, tab_name)
    
    if not new_data:
        print(f"Warning: No data found in {tab_name}")
        return (False, None) if return_data else False
    
    # Find header row by looking for date columns (for sheets with metadata rows at top)
    if find_date_header:
        header_row_idx = find_header_row(new_data)
        if header_row_idx > 0:
            print(f"Skipping first {header_row_idx} rows (metadata)")
            new_data = new_data[header_row_idx:]
    
    # If preserving history, merge with existing S3 data
    if preserve_history:
        existing_data = read_existing_s3_csv(s3_client, s3_file_name)
        if existing_data:
            merged_data = merge_wide_format_data(existing_data, new_data)
        else:
            merged_data = new_data
    else:
        merged_data = new_data
    
    csv_content = convert_to_csv(merged_data)
    
    # Upload to S3
    upload_to_s3(s3_client, s3_file_name, csv_content)
    
    if return_data:
        return (True, merged_data)
    return True


def sync_sheet_to_s3_with_priority(service, s3_client, spreadsheet_id, tab_name, 
                                    s3_file_name, s3_priority_file_name, priority_domains,
                                    find_date_header=False, preserve_history=False):
    """
    Sync a sheet to S3 and also generate a priority-filtered version.
    
    Args:
        priority_domains: Set of domain names to include in priority CSV
    
    Returns:
        True on success, False on failure
    """
    # First sync the full data
    success, merged_data = sync_sheet_to_s3(
        service, s3_client, spreadsheet_id, tab_name, s3_file_name,
        find_date_header=find_date_header, preserve_history=preserve_history,
        return_data=True
    )
    
    if not success or not merged_data:
        return False
    
    # Generate and upload priority CSV
    print(f"\n--- Generating priority CSV: {s3_priority_file_name} ---")
    priority_data = filter_csv_to_priority(merged_data, priority_domains)
    priority_csv_content = convert_to_csv(priority_data)
    upload_to_s3(s3_client, s3_priority_file_name, priority_csv_content)
    
    return True


def lambda_handler(event, context):
    """Main Lambda handler function."""
    print("Starting dashboard sync...")
    start_time = datetime.utcnow()
    
    results = {
        'traffic_monthly': False,
        'traffic_average': False,
        'dr': False,
        'rd': False,
        'revenue': False,
        'priority_csvs': False
    }
    errors = []
    priority_domains = set()
    
    # Track file statistics for sync log
    file_stats = {}
    
    try:
        # Initialize services
        sheets_service = get_google_sheets_service()
        s3_client = get_s3_client()
        
        # STEP 1: Sync Revenue FIRST to compute priority domains
        print("\n=== STEP 1: Sync Revenue and Compute Priority Domains ===")
        revenue_data = None
        try:
            success, revenue_data = sync_sheet_to_s3(
                sheets_service, s3_client,
                REVENUE_SHEET_ID, REVENUE_TAB,
                S3_FILES['revenue'],
                return_data=True
            )
            results['revenue'] = success
            
            if success and revenue_data:
                # Compute priority domains from revenue data
                priority_domains = compute_priority_domains(revenue_data)
                print(f"✅ Computed {len(priority_domains)} priority domains")
            else:
                print("⚠️ Could not compute priority domains - revenue sync failed")
        except Exception as e:
            errors.append(f"Revenue: {str(e)}")
        
        # STEP 2: Sync other sheets with priority CSV generation
        print("\n=== STEP 2: Sync Data Sheets with Priority CSVs ===")
        
        # Sync Traffic Monthly (preserve historical data) + priority CSV
        try:
            if priority_domains:
                results['traffic_monthly'] = sync_sheet_to_s3_with_priority(
                    sheets_service, s3_client,
                    TRAFFIC_DR_SHEET_ID, TRAFFIC_MONTHLY_TAB,
                    S3_FILES['traffic_monthly'],
                    S3_PRIORITY_FILES['traffic_monthly'],
                    priority_domains,
                    preserve_history=True
                )
            else:
                # Fallback: sync without priority if we couldn't compute domains
                results['traffic_monthly'] = sync_sheet_to_s3(
                    sheets_service, s3_client,
                    TRAFFIC_DR_SHEET_ID, TRAFFIC_MONTHLY_TAB,
                    S3_FILES['traffic_monthly'],
                    preserve_history=True
                )
        except Exception as e:
            errors.append(f"Traffic Monthly: {str(e)}")
        
        # Sync Traffic Average (find header row, preserve historical data) + priority CSV
        try:
            if priority_domains:
                results['traffic_average'] = sync_sheet_to_s3_with_priority(
                    sheets_service, s3_client,
                    TRAFFIC_DR_SHEET_ID, TRAFFIC_AVERAGE_TAB,
                    S3_FILES['traffic_average'],
                    S3_PRIORITY_FILES['traffic_average'],
                    priority_domains,
                    find_date_header=True,
                    preserve_history=True
                )
            else:
                results['traffic_average'] = sync_sheet_to_s3(
                    sheets_service, s3_client,
                    TRAFFIC_DR_SHEET_ID, TRAFFIC_AVERAGE_TAB,
                    S3_FILES['traffic_average'],
                    find_date_header=True,
                    preserve_history=True
                )
        except Exception as e:
            errors.append(f"Traffic Average: {str(e)}")
        
        # Sync DR (preserve historical data) + priority CSV
        try:
            if priority_domains:
                results['dr'] = sync_sheet_to_s3_with_priority(
                    sheets_service, s3_client,
                    TRAFFIC_DR_SHEET_ID, DR_TAB,
                    S3_FILES['dr'],
                    S3_PRIORITY_FILES['dr'],
                    priority_domains,
                    preserve_history=True
                )
            else:
                results['dr'] = sync_sheet_to_s3(
                    sheets_service, s3_client,
                    TRAFFIC_DR_SHEET_ID, DR_TAB,
                    S3_FILES['dr'],
                    preserve_history=True
                )
        except Exception as e:
            errors.append(f"DR: {str(e)}")
        
        # Sync RD (no archived data, fresh sync each time) + priority CSV
        try:
            if priority_domains:
                results['rd'] = sync_sheet_to_s3_with_priority(
                    sheets_service, s3_client,
                    TRAFFIC_DR_SHEET_ID, RD_TAB,
                    S3_FILES['rd'],
                    S3_PRIORITY_FILES['rd'],
                    priority_domains,
                    preserve_history=False
                )
            else:
                results['rd'] = sync_sheet_to_s3(
                    sheets_service, s3_client,
                    TRAFFIC_DR_SHEET_ID, RD_TAB,
                    S3_FILES['rd'],
                    preserve_history=False
                )
        except Exception as e:
            errors.append(f"RD: {str(e)}")
        
        # Mark priority CSVs as successful if we generated them
        results['priority_csvs'] = len(priority_domains) > 0
        
        # Calculate duration
        duration = (datetime.utcnow() - start_time).total_seconds()
        
        # Gather file statistics for sync log
        print("\n=== STEP 3: Gathering File Statistics ===")
        all_files = list(S3_FILES.values()) + list(S3_PRIORITY_FILES.values())
        for file_name in all_files:
            size = get_s3_file_size(s3_client, file_name)
            file_stats[file_name] = {
                'status': 'success' if size > 0 else 'missing',
                'size_bytes': size
            }
        
        # Extract CSV metadata (rows, columns, timestamps)
        print("\n=== STEP 4: Extracting CSV Metadata ===")
        csv_metadata = extract_csv_metadata(s3_client)
        
        # Prepare summary
        success_count = sum(1 for v in results.values() if v)
        total_count = len(results)
        
        # Write sync log
        print("\n=== STEP 5: Writing Sync Log ===")
        existing_log = read_sync_log(s3_client)
        
        # Detect data changes by comparing with previous metadata
        data_changes = []
        if existing_log and 'csv_metadata' in existing_log:
            prev_metadata = existing_log['csv_metadata']
            for file_name, curr in csv_metadata.items():
                if curr and file_name in prev_metadata and prev_metadata[file_name]:
                    prev = prev_metadata[file_name]
                    row_diff = curr['rows'] - prev.get('rows', 0)
                    col_diff = curr['columns'] - prev.get('columns', 0)
                    
                    if row_diff != 0 or col_diff != 0:
                        change = {
                            'file': file_name,
                            'rows_added': row_diff,
                            'columns_added': col_diff,
                            'new_rows': curr['rows'],
                            'new_columns': curr['columns'],
                            'newest_date_col': curr.get('newest_date_col')
                        }
                        data_changes.append(change)
                        print(f"  DATA CHANGE: {file_name} - {row_diff:+d} rows, {col_diff:+d} cols")
        
        # Build history (keep last 20 entries)
        history = []
        if existing_log and 'history' in existing_log:
            history = existing_log['history'][:19]  # Keep last 19 to make room for new entry
        
        # Add current run to history (including data changes if any)
        history_entry = {
            'timestamp': start_time.isoformat() + 'Z',
            'status': 'error' if errors else 'success',
            'duration_seconds': round(duration, 1),
            'priority_domains_count': len(priority_domains),
            'data_changed': len(data_changes) > 0
        }
        if data_changes:
            history_entry['changes'] = data_changes
        history.insert(0, history_entry)
        
        # Build sync log
        sync_log = {
            'last_sync': start_time.isoformat() + 'Z',
            'duration_seconds': round(duration, 1),
            'status': 'error' if errors else 'success',
            'priority_domains_count': len(priority_domains),
            'files': file_stats,
            'csv_metadata': csv_metadata,
            'data_changes': data_changes,
            'errors': errors,
            'history': history
        }
        
        write_sync_log(s3_client, sync_log)
        
        if errors:
            error_msg = f"Sync completed with errors ({success_count}/{total_count} succeeded)\n"
            error_msg += "Errors:\n" + "\n".join(f"• {e}" for e in errors)
            print(error_msg)
            send_slack_notification(error_msg, is_error=True)
            
            return {
                'statusCode': 207,  # Multi-Status
                'body': json.dumps({
                    'message': 'Sync completed with errors',
                    'results': results,
                    'errors': errors,
                    'duration_seconds': duration
                })
            }
        else:
            success_msg = f"All {total_count} sheets synced successfully in {duration:.1f}s"
            print(success_msg)
            # Only send Slack on errors to avoid noise (optional: uncomment for success notifications)
            # send_slack_notification(success_msg, is_error=False)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Sync completed successfully',
                    'results': results,
                    'duration_seconds': duration
                })
            }
            
    except Exception as e:
        error_msg = f"Sync failed with critical error: {str(e)}"
        print(error_msg)
        send_slack_notification(error_msg, is_error=True)
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Sync failed',
                'error': str(e)
            })
        }


# For local testing
if __name__ == "__main__":
    # Test locally by setting environment variables
    result = lambda_handler({}, None)
    print(json.dumps(result, indent=2))
