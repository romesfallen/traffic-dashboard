/**
 * Shared authentication utility for API endpoints
 * 
 * Supports:
 * 1. Normal Google OAuth session (via auth_session cookie)
 * 2. Test bypass token (via X-Test-Token header) for E2E testing
 */

/**
 * Check if request is authenticated
 * @param {Object} req - HTTP request object
 * @returns {boolean} - True if authenticated
 */
export function isAuthenticated(req) {
  // Check normal OAuth session first
  const cookies = req.headers.cookie || '';
  const sessionMatch = cookies.match(/auth_session=([^;]+)/);
  if (sessionMatch) {
    return true;
  }
  
  // Check test bypass token (for E2E tests)
  // This allows Playwright tests to authenticate without Google OAuth
  const testToken = req.headers['x-test-token'];
  const validToken = process.env.E2E_TEST_TOKEN;
  
  // Only allow bypass if:
  // 1. Token is provided in request header
  // 2. Valid token is configured in environment
  // 3. Tokens match exactly
  if (testToken && validToken && testToken === validToken) {
    return true;
  }
  
  return false;
}

/**
 * Standard unauthorized response
 * @param {Object} res - HTTP response object
 */
export function sendUnauthorized(res) {
  return res.status(401).json({ error: 'Unauthorized' });
}
