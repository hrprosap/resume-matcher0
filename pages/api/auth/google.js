import { google } from 'googleapis';
import { setCookie } from 'nookies';

export default async function handler(req, res) {
  console.log('Google Auth handler called');
  const redirectUri = process.env.GMAIL_REDIRECT_URI;
  console.log('Redirect URI:', redirectUri);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    redirectUri
  );

  async function refreshAccessToken(oauth2Client) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      
      // Update the stored tokens
      setCookie({ res }, 'access_token', credentials.access_token, {
        maxAge: credentials.expiry_date,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      if (credentials.refresh_token) {
        setCookie({ res }, 'refresh_token', credentials.refresh_token, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
      }
      
      return credentials.access_token;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  if (req.method === 'GET') {
    const { code } = req.query;
    if (code) {
      console.log('Received code from Google');
      try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('Received tokens from Google');
        
        setCookie({ res }, 'access_token', tokens.access_token, {
          maxAge: tokens.expiry_date,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
        setCookie({ res }, 'refresh_token', tokens.refresh_token, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
        console.log('Cookies set, redirecting to homepage');
        res.redirect('/');
      } catch (error) {
        console.error('Error getting tokens:', error);
        res.redirect('/?auth=error');
      }
    } else {
      console.log('Generating auth URL');
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/gmail.send' // Optional, if sending emails
        ],
      });
      console.log('Auth URL:', authUrl);
      res.redirect(authUrl);
    }
  } else {
    console.log('Method not allowed');
    res.status(405).end();
  }
}