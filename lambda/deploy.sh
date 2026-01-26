#!/bin/bash

# Dashboard Sync Lambda Deployment Script
# 
# Prerequisites:
# 1. AWS CLI installed and configured
# 2. Lambda role created (dashboard-sync-lambda-role)
# 3. Python 3.11 installed

set -e

FUNCTION_NAME="dashboard-sync"
REGION="ap-southeast-2"
ROLE_NAME="dashboard-sync-lambda-role"
RUNTIME="python3.11"
HANDLER="sync-dashboard.lambda_handler"
TIMEOUT=120
MEMORY=256

echo "=== Dashboard Sync Lambda Deployment ==="

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

echo "Account ID: $ACCOUNT_ID"
echo "Role ARN: $ROLE_ARN"

# Create deployment package directory
echo ""
echo "Creating deployment package..."
rm -rf package
mkdir -p package

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt -t package/ --quiet

# Copy Lambda function
cp sync-dashboard.py package/

# Create zip file
echo "Creating zip file..."
cd package
zip -r ../deployment.zip . -q
cd ..

# Check if function exists
FUNCTION_EXISTS=$(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>&1 || true)

if echo "$FUNCTION_EXISTS" | grep -q "ResourceNotFoundException"; then
    echo ""
    echo "Creating new Lambda function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --timeout $TIMEOUT \
        --memory-size $MEMORY \
        --zip-file fileb://deployment.zip \
        --region $REGION
    
    echo "Function created successfully!"
else
    echo ""
    echo "Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://deployment.zip \
        --region $REGION
    
    echo "Function updated successfully!"
fi

# Clean up
echo ""
echo "Cleaning up..."
rm -rf package
rm -f deployment.zip

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Next steps:"
echo "1. Set environment variables in AWS Lambda Console:"
echo "   - GOOGLE_SERVICE_ACCOUNT_KEY (base64 encoded JSON)"
echo "   - S3_BUCKET_NAME"
echo "   - SLACK_WEBHOOK_URL (optional)"
echo ""
echo "2. Create EventBridge rule for scheduling:"
echo "   aws events put-rule --name dashboard-sync-schedule --schedule-expression 'rate(30 minutes)' --region $REGION"
echo "   aws lambda add-permission --function-name $FUNCTION_NAME --statement-id eventbridge-invoke --action lambda:InvokeFunction --principal events.amazonaws.com --region $REGION"
echo "   aws events put-targets --rule dashboard-sync-schedule --targets 'Id=1,Arn=arn:aws:lambda:$REGION:$ACCOUNT_ID:function:$FUNCTION_NAME' --region $REGION"
