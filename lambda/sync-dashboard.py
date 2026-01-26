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
                     find_date_header=False, preserve_history=False):
    """
    Sync a single sheet tab to S3.
    
    Args:
        preserve_history: If True, merge with existing S3 data to preserve 
                         historical columns that may have been archived from Sheets.
    """
    print(f"\n--- Syncing {tab_name} -> {s3_file_name} ---")
    
    # Read data from Google Sheets
    new_data = read_sheet_data(service, spreadsheet_id, tab_name)
    
    if not new_data:
        print(f"Warning: No data found in {tab_name}")
        return False
    
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
            csv_content = convert_to_csv(merged_data)
        else:
            csv_content = convert_to_csv(new_data)
    else:
        csv_content = convert_to_csv(new_data)
    
    # Upload to S3
    upload_to_s3(s3_client, s3_file_name, csv_content)
    
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
        'revenue': False
    }
    errors = []
    
    try:
        # Initialize services
        sheets_service = get_google_sheets_service()
        s3_client = get_s3_client()
        
        # Sync Traffic Monthly (preserve historical data)
        try:
            results['traffic_monthly'] = sync_sheet_to_s3(
                sheets_service, s3_client,
                TRAFFIC_DR_SHEET_ID, TRAFFIC_MONTHLY_TAB,
                S3_FILES['traffic_monthly'],
                preserve_history=True
            )
        except Exception as e:
            errors.append(f"Traffic Monthly: {str(e)}")
        
        # Sync Traffic Average (find header row, preserve historical data)
        try:
            results['traffic_average'] = sync_sheet_to_s3(
                sheets_service, s3_client,
                TRAFFIC_DR_SHEET_ID, TRAFFIC_AVERAGE_TAB,
                S3_FILES['traffic_average'],
                find_date_header=True,
                preserve_history=True
            )
        except Exception as e:
            errors.append(f"Traffic Average: {str(e)}")
        
        # Sync DR (preserve historical data)
        try:
            results['dr'] = sync_sheet_to_s3(
                sheets_service, s3_client,
                TRAFFIC_DR_SHEET_ID, DR_TAB,
                S3_FILES['dr'],
                preserve_history=True
            )
        except Exception as e:
            errors.append(f"DR: {str(e)}")
        
        # Sync RD (no archived data, fresh sync each time)
        try:
            results['rd'] = sync_sheet_to_s3(
                sheets_service, s3_client,
                TRAFFIC_DR_SHEET_ID, RD_TAB,
                S3_FILES['rd'],
                preserve_history=False
            )
        except Exception as e:
            errors.append(f"RD: {str(e)}")
        
        # Sync Revenue
        try:
            results['revenue'] = sync_sheet_to_s3(
                sheets_service, s3_client,
                REVENUE_SHEET_ID, REVENUE_TAB,
                S3_FILES['revenue']
            )
        except Exception as e:
            errors.append(f"Revenue: {str(e)}")
        
        # Calculate duration
        duration = (datetime.utcnow() - start_time).total_seconds()
        
        # Prepare summary
        success_count = sum(1 for v in results.values() if v)
        total_count = len(results)
        
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
