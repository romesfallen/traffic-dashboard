import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// Mock handlers (we import them dynamically to allow env var mocking)
const TEST_SECRET = 'test-secret-key-for-testing-123';

/**
 * Create a valid JWT token for testing
 */
function createTestToken(payload, secret = TEST_SECRET) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');
  
  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Create a mock request object
 */
function createMockRequest(options = {}) {
  return {
    headers: {
      cookie: options.cookie || '',
      ...options.headers,
    },
    query: options.query || {},
  };
}

/**
 * Create a mock response object that captures the response
 */
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    redirectUrl: null,
    
    status(code) {
      this.statusCode = code;
      return this;
    },
    
    json(data) {
      this.body = data;
      return this;
    },
    
    send(data) {
      this.body = data;
      return this;
    },
    
    setHeader(key, value) {
      this.headers[key] = value;
      return this;
    },
    
    redirect(code, url) {
      this.statusCode = code;
      this.redirectUrl = url;
      return this;
    },
  };
  return res;
}

describe('Auth Check Endpoint', () => {
  let originalEnv;
  
  beforeEach(() => {
    originalEnv = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = TEST_SECRET;
  });
  
  afterEach(() => {
    process.env.SESSION_SECRET = originalEnv;
    vi.resetModules();
  });

  it('returns authenticated: false when no cookie present', async () => {
    const { default: handler } = await import('../../api/auth/check.js');
    
    const req = createMockRequest();
    const res = createMockResponse();
    
    handler(req, res);
    
    expect(res.body).toEqual({ authenticated: false });
  });

  it('returns authenticated: false for invalid token format', async () => {
    const { default: handler } = await import('../../api/auth/check.js');
    
    const req = createMockRequest({ cookie: 'auth_session=invalid-token' });
    const res = createMockResponse();
    
    handler(req, res);
    
    expect(res.body).toEqual({ authenticated: false });
  });

  it('returns authenticated: false for token with wrong signature', async () => {
    const { default: handler } = await import('../../api/auth/check.js');
    
    // Create token with different secret
    const token = createTestToken(
      { email: 'test@example.com', exp: Math.floor(Date.now() / 1000) + 3600 },
      'wrong-secret'
    );
    
    const req = createMockRequest({ cookie: `auth_session=${token}` });
    const res = createMockResponse();
    
    handler(req, res);
    
    expect(res.body).toEqual({ authenticated: false });
  });

  it('returns authenticated: false for expired token', async () => {
    const { default: handler } = await import('../../api/auth/check.js');
    
    // Create expired token (expired 1 hour ago)
    const token = createTestToken({
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) - 3600,
    });
    
    const req = createMockRequest({ cookie: `auth_session=${token}` });
    const res = createMockResponse();
    
    handler(req, res);
    
    expect(res.body).toEqual({ authenticated: false });
  });

  it('returns authenticated: true for valid token', async () => {
    const { default: handler } = await import('../../api/auth/check.js');
    
    // Create valid token (expires in 1 hour)
    const token = createTestToken({
      email: 'test@example.com',
      name: 'Test User',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    
    const req = createMockRequest({ cookie: `auth_session=${token}` });
    const res = createMockResponse();
    
    handler(req, res);
    
    expect(res.body).toEqual({ authenticated: true });
  });
});

describe('Auth Me Endpoint', () => {
  let originalEnv;
  
  beforeEach(() => {
    originalEnv = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = TEST_SECRET;
  });
  
  afterEach(() => {
    process.env.SESSION_SECRET = originalEnv;
    vi.resetModules();
  });

  it('returns authenticated: false when no cookie present', async () => {
    const { default: handler } = await import('../../api/auth/me.js');
    
    const req = createMockRequest();
    const res = createMockResponse();
    
    handler(req, res);
    
    expect(res.body).toEqual({ authenticated: false });
  });

  it('returns user info for valid token', async () => {
    const { default: handler } = await import('../../api/auth/me.js');
    
    const userPayload = {
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    
    const token = createTestToken(userPayload);
    
    const req = createMockRequest({ cookie: `auth_session=${token}` });
    const res = createMockResponse();
    
    handler(req, res);
    
    expect(res.body).toEqual({
      authenticated: true,
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/photo.jpg',
    });
  });
});

describe('Auth Login Endpoint', () => {
  let originalClientId;
  
  beforeEach(() => {
    originalClientId = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
  });
  
  afterEach(() => {
    process.env.GOOGLE_CLIENT_ID = originalClientId;
    vi.resetModules();
  });

  it('redirects to Google OAuth', async () => {
    const { default: handler } = await import('../../api/auth/login.js');
    
    const req = createMockRequest({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'example.com',
      },
    });
    const res = createMockResponse();
    
    handler(req, res);
    
    expect(res.statusCode).toBe(302);
    expect(res.redirectUrl).toContain('accounts.google.com/o/oauth2');
    expect(res.redirectUrl).toContain('client_id=test-client-id');
  });

  it('includes redirect state parameter', async () => {
    const { default: handler } = await import('../../api/auth/login.js');
    
    const req = createMockRequest({
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'example.com',
      },
      query: { redirect: '/dashboard' },
    });
    const res = createMockResponse();
    
    handler(req, res);
    
    expect(res.redirectUrl).toContain('state=%2Fdashboard');
  });

  it('returns 500 if GOOGLE_CLIENT_ID not configured', async () => {
    process.env.GOOGLE_CLIENT_ID = '';
    vi.resetModules();
    
    const { default: handler } = await import('../../api/auth/login.js');
    
    const req = createMockRequest({
      headers: {
        'x-forwarded-proto': 'https',
        host: 'example.com',
      },
    });
    const res = createMockResponse();
    
    handler(req, res);
    
    expect(res.statusCode).toBe(500);
  });
});

describe('JWT Token Utilities', () => {
  it('creates valid JWT structure', () => {
    const payload = { email: 'test@example.com' };
    const token = createTestToken(payload);
    
    const parts = token.split('.');
    expect(parts).toHaveLength(3);
    
    // Verify header
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    expect(header).toEqual({ alg: 'HS256', typ: 'JWT' });
    
    // Verify payload
    const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    expect(decoded.email).toBe('test@example.com');
  });

  it('signature changes with different secrets', () => {
    const payload = { email: 'test@example.com' };
    
    const token1 = createTestToken(payload, 'secret-1');
    const token2 = createTestToken(payload, 'secret-2');
    
    const sig1 = token1.split('.')[2];
    const sig2 = token2.split('.')[2];
    
    expect(sig1).not.toBe(sig2);
  });
});
