import { google } from 'googleapis';
import { setCookie } from 'nookies';

export default async function handler(req, res) {
  const redirectUri = process.env.GMAIL_REDIRECT_URI;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    redirectUri
  );

  if (req.method === 'GET') {
    const { code } = req.query;
    if (code) {
      try {
        const { tokens } = await oauth2Client.getToken(code);
        // Here, you should securely store these tokens (e.g., in a database)
        // For now, we'll just set them as cookies
        setCookie({ res }, 'access_token', tokens.access_token, {
          maxAge: tokens.expiry_date,
          httpOnly: true,
          path: '/',
        });
        setCookie({ res }, 'refresh_token', tokens.refresh_token, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          httpOnly: true,
          path: '/',
        });
        res.redirect('/'); // Redirect to your app's homepage
      } catch (error) {
        console.error('Error getting tokens:', error);
        res.redirect('/?auth=error');
      }
    } else {
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      });
      res.redirect(authUrl);
    }
  } else {
    res.status(405).end();
  }
}
