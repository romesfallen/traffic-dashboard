// Redirect to Google OAuth
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get('redirect') || '/';
  
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${url.origin}/api/auth/callback`;
  
  if (!clientId) {
    return new Response('GOOGLE_CLIENT_ID not configured', { status: 500 });
  }
  
  // Build Google OAuth URL
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'email profile');
  googleAuthUrl.searchParams.set('access_type', 'online');
  googleAuthUrl.searchParams.set('state', redirect); // Store redirect path in state
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  
  return Response.redirect(googleAuthUrl.toString(), 302);
}
