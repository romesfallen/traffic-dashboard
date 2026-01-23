// Return current user info (for displaying in UI)
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const cookies = request.headers.get('cookie') || '';
  const sessionMatch = cookies.match(/auth_session=([^;]+)/);
  
  if (!sessionMatch) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  try {
    const session = await verifySession(sessionMatch[1]);
    
    if (!session) {
      return new Response(JSON.stringify({ authenticated: false }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({
      authenticated: true,
      email: session.email,
      name: session.name,
      picture: session.picture,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ authenticated: false }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Verify JWT session token
async function verifySession(token) {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET not configured');
    
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signatureValid = await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signatureB64),
      encoder.encode(`${headerB64}.${payloadB64}`)
    );
    
    if (!signatureValid) {
      throw new Error('Invalid signature');
    }
    
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

function base64UrlDecode(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
