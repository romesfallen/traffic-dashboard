// Handle Google OAuth callback
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '/';
  const error = url.searchParams.get('error');
  
  if (error) {
    return new Response(renderError('Google login was cancelled or failed.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }
  
  if (!code) {
    return new Response(renderError('No authorization code received.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
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
        redirect_uri: `${url.origin}/api/auth/callback`,
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
      return new Response(renderAccessDenied(email), {
        status: 403,
        headers: { 'Content-Type': 'text/html' },
      });
    }
    
    // Create session token (JWT)
    const sessionToken = await createSessionToken({
      email: email,
      name: user.name,
      picture: user.picture,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    });
    
    // Redirect to original destination with session cookie
    const response = new Response(null, {
      status: 302,
      headers: {
        Location: state,
        'Set-Cookie': `auth_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${24 * 60 * 60}`,
      },
    });
    
    return response;
  } catch (error) {
    console.error('Auth callback error:', error);
    return new Response(renderError(error.message), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// Create JWT using Web Crypto API
async function createSessionToken(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET not configured');
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${headerB64}.${payloadB64}`)
  );
  
  const signatureB64 = base64UrlEncode(signature);
  
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

function base64UrlEncode(input) {
  let bytes;
  if (typeof input === 'string') {
    bytes = new TextEncoder().encode(input);
  } else {
    bytes = new Uint8Array(input);
  }
  
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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
