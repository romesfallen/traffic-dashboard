/**
 * API endpoint to serve RD History.csv from S3
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
const S3_KEY = 'RD History.csv';

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
    const csvContent = await streamToString(response.Body);

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error fetching from S3:', error);
    
    if (error.name === 'NoSuchKey') {
      return res.status(404).json({ error: 'Data not found' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch data' });
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
