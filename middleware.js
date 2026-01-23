// Vercel Edge Middleware - Protects all routes with Google OAuth
import { NextResponse } from 'next/server';

// Routes that don't require authentication
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/callback',
  '/api/auth/logout',
  '/robots.txt',
  '/favicon.ico',
];

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};

export default async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const sessionCookie = request.cookies.get('auth_session');
  
  if (!sessionCookie?.value) {
    // No session - redirect to login
    const loginUrl = new URL('/api/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Verify the session token
  try {
    const session = await verifySession(sessionCookie.value);
    
    if (!session || !session.email) {
      throw new Error('Invalid session');
    }
    
    // Session is valid - allow request
    return NextResponse.next();
  } catch (error) {
    // Invalid session - clear cookie and redirect to login
    const loginUrl = new URL('/api/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('auth_session');
    return response;
  }
}

// Verify JWT session token using Web Crypto API (Edge compatible)
async function verifySession(token) {
  try {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error('SESSION_SECRET not configured');
    
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }
    
    // Verify signature
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
    
    // Decode payload
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    console.error('Session verification failed:', error.message);
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
