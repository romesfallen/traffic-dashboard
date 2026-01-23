import crypto from 'crypto';

// Handle Google OAuth callback
export default async function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `${protocol}://${host}`;
  
  const { code, state, error } = req.query;
  const redirectPath = state || '/';
  
  if (error) {
    return res.status(400).send(renderError('Google login was cancelled or failed.'));
  }
  
  if (!code) {
    return res.status(400).send(renderError('No authorization code received.'));
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${origin}/api/auth/callback`,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code');
    }
    
    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }
    
    const user = await userResponse.json();
    const email = user.email?.toLowerCase();
    
    if (!email) {
      throw new Error('No email received from Google');
    }
    
    // Check if email is in allowed list
    const allowedEmails = (process.env.ALLOWED_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    
    if (!allowedEmails.includes(email)) {
      return res.status(403).send(renderAccessDenied(email));
    }
    
    // Create session token (JWT)
    const sessionToken = createSessionToken({
      email: email,
      name: user.name,
      picture: user.picture,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    });
    
    // Set cookie and redirect
    res.setHeader('Set-Cookie', `auth_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${24 * 60 * 60}`);
    res.redirect(302, redirectPath);
  } catch (error) {
    console.error('Auth callback error:', error);
    return res.status(500).send(renderError(error.message));
  }
}

// Create JWT using Node.js crypto
function createSessionToken(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET not configured');
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

function renderError(message) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authentication Error</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: white; padding: 48px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    h1 { color: #ef4444; margin-bottom: 16px; font-size: 24px; }
    p { color: #666; margin-bottom: 24px; }
    a { display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
    a:hover { background: #ea580c; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Authentication Error</h1>
    <p>${message}</p>
    <a href="/api/auth/login">Try Again</a>
  </div>
</body>
</html>`;
}

function renderAccessDenied(email) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Denied</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: white; padding: 48px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; max-width: 450px; }
    h1 { color: #ef4444; margin-bottom: 16px; font-size: 24px; }
    p { color: #666; margin-bottom: 12px; }
    .email { font-weight: 600; color: #333; background: #f3f4f6; padding: 8px 16px; border-radius: 8px; display: inline-block; margin: 8px 0 24px; }
    a { display: inline-block; background: #6b7280; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
    a:hover { background: #4b5563; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Access Denied</h1>
    <p>Sorry, your email is not authorized to access this dashboard.</p>
    <div class="email">${email}</div>
    <p>Contact an administrator to request access.</p>
    <a href="/api/auth/logout">Sign Out</a>
  </div>
</body>
</html>`;
}
