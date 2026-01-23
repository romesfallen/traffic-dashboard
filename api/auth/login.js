// Redirect to Google OAuth
export default function handler(req, res) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `${protocol}://${host}`;
  
  const redirect = req.query.redirect || '/';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${origin}/api/auth/callback`;
  
  if (!clientId) {
    return res.status(500).send('GOOGLE_CLIENT_ID not configured');
  }
  
  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
    access_type: 'online',
    state: redirect,
    prompt: 'select_account'
  });
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  res.redirect(302, googleAuthUrl);
}
