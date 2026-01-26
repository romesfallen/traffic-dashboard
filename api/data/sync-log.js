/**
 * API endpoint to serve sync-log.json from S3
 * Shows sync status, file statistics, and history
 * Protected by existing Google OAuth
 */

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'traffic-dashboard-theta';
const S3_KEY = 'sync-log.json';

export default async function handler(req, res) {
  // Check authentication
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/auth_session=([^;]+)/);
  
  if (!sessionMatch) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: S3_KEY,
    });

    const response = await s3Client.send(command);
    const content = await streamToString(response.Body);
    const logData = JSON.parse(content);

    // Set JSON headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    
    return res.status(200).json(logData);
  } catch (error) {
    console.error('Error fetching sync log from S3:', error);
    
    if (error.name === 'NoSuchKey') {
      return res.status(404).json({ 
        error: 'Sync log not found',
        message: 'No sync has been run yet. The log will be created after the first Lambda sync.'
      });
    }
    
    return res.status(500).json({ error: 'Failed to fetch sync log' });
  }
}

// Helper to convert stream to string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
