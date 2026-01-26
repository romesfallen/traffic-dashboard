# Dashboard Data Sync - Setup Guide

This document explains how to set up and deploy the automated sync between Google Sheets and the traffic dashboard.

## Architecture Overview

```
Google Sheets → AWS Lambda (every 30 min) → S3 → Vercel API → Dashboard
```

**Data Flow:**
1. EventBridge triggers Lambda every 30 minutes
2. Lambda reads data from Google Sheets
3. Lambda uploads CSV files to S3
4. Dashboard fetches data via Vercel API endpoints
5. Vercel API reads from S3 (authenticated access only)

## Configuration

### Google Sheets

| Tab Name | Sheet ID | Output File |
|----------|----------|-------------|
| Traffic Monthly | `1Vcyl9hrxdKUfKufHdM9csZjEQcS0rt3tLRyNR1f4uR8` | traffic-data.csv |
| Traffic Average | `1Vcyl9hrxdKUfKufHdM9csZjEQcS0rt3tLRyNR1f4uR8` | internal-average-traffic.csv |
| DR | `1Vcyl9hrxdKUfKufHdM9csZjEQcS0rt3tLRyNR1f4uR8` | DR History.csv |
| Revenue | `1a4XNaxHJ7U7pJhfraGRDr9qEVsTGdCAUgx_QLJoLQXA` | revenue-history.csv |

### AWS Resources

| Resource | Name/ID | Region |
|----------|---------|--------|
| S3 Bucket | `traffic-dashboard-theta` | ap-southeast-2 |
| Lambda Function | `dashboard-sync` | ap-southeast-2 |
| IAM Role | `dashboard-sync-lambda-role` | - |
| IAM User (Vercel) | `dashboard-vercel-reader` | - |

### Google Cloud

| Resource | Value |
|----------|-------|
| Service Account | `sheets-reader@traffic-dashboard-485207.iam.gserviceaccount.com` |

---

## Deployment Instructions

### Step 1: Prepare Service Account Key

1. Open your Google service account JSON key file
2. Encode it to base64:
   ```bash
   base64 -i your-service-account-key.json | tr -d '\n'
   ```
3. Copy the output (you'll need this for Lambda environment variables)

### Step 2: Deploy Lambda Function

Option A: Using AWS CLI (recommended)
```bash
cd lambda
chmod +x deploy.sh
./deploy.sh
```

Option B: Manual upload via AWS Console
1. Go to AWS Lambda → Create function
2. Function name: `dashboard-sync`
3. Runtime: Python 3.11
4. Use existing role: `dashboard-sync-lambda-role`
5. Upload `deployment.zip` (created by `deploy.sh`)

### Step 3: Configure Lambda Environment Variables

In AWS Lambda Console → Configuration → Environment variables:

| Variable | Value |
|----------|-------|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | (base64 encoded JSON from Step 1) |
| `S3_BUCKET_NAME` | `traffic-dashboard-theta` |
| `AWS_REGION` | `ap-southeast-2` |
| `SLACK_WEBHOOK_URL` | (your Slack webhook URL, optional) |

### Step 4: Set Lambda Timeout

In AWS Lambda Console → Configuration → General configuration:
- Timeout: 2 minutes (120 seconds)
- Memory: 256 MB

### Step 5: Create EventBridge Schedule

```bash
# Create the rule
aws events put-rule \
  --name dashboard-sync-schedule \
  --schedule-expression "rate(30 minutes)" \
  --region ap-southeast-2

# Add permission for EventBridge to invoke Lambda
aws lambda add-permission \
  --function-name dashboard-sync \
  --statement-id eventbridge-invoke \
  --action lambda:InvokeFunction \
  --principal events.amazonaws.com \
  --region ap-southeast-2

# Add Lambda as target
aws events put-targets \
  --rule dashboard-sync-schedule \
  --targets "Id=1,Arn=arn:aws:lambda:ap-southeast-2:YOUR_ACCOUNT_ID:function:dashboard-sync" \
  --region ap-southeast-2
```

### Step 6: Configure Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `AWS_ACCESS_KEY_ID` | (from IAM user `dashboard-vercel-reader`) |
| `AWS_SECRET_ACCESS_KEY` | (from IAM user `dashboard-vercel-reader`) |
| `S3_BUCKET_NAME` | `traffic-dashboard-theta` |
| `AWS_REGION` | `ap-southeast-2` |

### Step 7: Deploy to Vercel

```bash
cd traffic-dashboard
vercel --prod
```

---

## Testing

### Test Lambda Manually

1. Go to AWS Lambda Console
2. Select `dashboard-sync` function
3. Click "Test" → Create test event (use `{}` as payload)
4. Click "Test" to run
5. Check CloudWatch Logs for output

### Test API Endpoints

```bash
# These require authentication cookie
curl -v https://your-dashboard.vercel.app/api/data/traffic
curl -v https://your-dashboard.vercel.app/api/data/dr
curl -v https://your-dashboard.vercel.app/api/data/revenue
curl -v https://your-dashboard.vercel.app/api/data/average
```

### Verify S3 Files

```bash
aws s3 ls s3://traffic-dashboard-theta/ --region ap-southeast-2
```

---

## Troubleshooting

### Lambda Errors

**"Permission denied" reading Google Sheets**
- Verify the service account email has Viewer access to both sheets
- Check that the base64 encoding of the JSON key is correct

**"No such bucket" or S3 errors**
- Verify bucket name matches exactly
- Check that Lambda role has S3 write permissions

**Timeout errors**
- Increase Lambda timeout to 3+ minutes
- Check network connectivity

### Vercel API Errors

**401 Unauthorized**
- User needs to be logged in (OAuth)
- Check auth_token cookie is present

**500 Internal Server Error**
- Check Vercel logs for details
- Verify AWS credentials in Vercel environment variables
- Ensure S3 files exist (run Lambda first)

### Data Not Updating

1. Check Lambda execution in CloudWatch Logs
2. Verify EventBridge rule is enabled
3. Check S3 file timestamps
4. Clear browser cache and reload dashboard

---

## Slack Notifications (Optional)

To receive error notifications:

1. Create Slack app at https://api.slack.com/apps
2. Add "Incoming Webhooks" feature
3. Create webhook for your channel
4. Add webhook URL to Lambda environment variable `SLACK_WEBHOOK_URL`

Notifications are sent when:
- Sync fails for any sheet
- Critical errors occur

Success notifications are disabled by default to reduce noise.

---

## Maintenance

### Updating the Lambda Function

```bash
cd lambda
./deploy.sh
```

### Adding New Sheets

1. Add sheet configuration to `lambda/sync-dashboard.py`
2. Create new Vercel API endpoint in `api/data/`
3. Update dashboard fetch URLs
4. Redeploy both Lambda and Vercel

### Monitoring

- **Lambda**: AWS CloudWatch Logs
- **Vercel**: Vercel Dashboard → Logs
- **Slack**: Error notifications (if configured)

---

## Costs (Estimated Monthly)

| Service | Usage | Cost |
|---------|-------|------|
| AWS Lambda | ~1,440 invocations | ~$0.10 |
| AWS S3 | ~50 MB storage | ~$0.01 |
| Google Sheets API | ~3,000 requests | Free |
| **Total** | | **~$0.11/month** |
