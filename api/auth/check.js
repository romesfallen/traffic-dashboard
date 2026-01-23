import crypto from 'crypto';

// Check authentication and redirect if not authenticated
export default function handler(req, res) {
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/auth_session=([^;]+)/);
  
  if (!sessionMatch) {
    return res.json({ authenticated: false });
  }
  
  try {
    const session = verifySession(sessionMatch[1]);
    
    if (!session) {
      return res.json({ authenticated: false });
    }
    
    return res.json({ authenticated: true });
  } catch (error) {
    return res.json({ authenticated: false });
  }
}

// Verify JWT session token
function verifySession(token) {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET not configured');
    
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');
    
    if (signatureB64 !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}
