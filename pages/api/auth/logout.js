import { destroyCookie } from 'nookies';

export default function handler(req, res) {
  // Destroy the access_token and refresh_token cookies
  destroyCookie({ res }, 'access_token', {
    path: '/',
  });
  destroyCookie({ res }, 'refresh_token', {
    path: '/',
  });

  // Redirect to the Google login page
  res.writeHead(302, { Location: '/api/auth/google' });
  res.end();
}