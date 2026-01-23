// Handle logout - clear session cookie
export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Signed Out</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
    .card { background: white; padding: 48px; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
    h1 { color: #333; margin-bottom: 16px; font-size: 24px; }
    p { color: #666; margin-bottom: 24px; }
    a { display: inline-block; background: #f97316; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
    a:hover { background: #ea580c; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Signed Out</h1>
    <p>You have been signed out successfully.</p>
    <a href="/api/auth/login">Sign In Again</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Set-Cookie': 'auth_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}
