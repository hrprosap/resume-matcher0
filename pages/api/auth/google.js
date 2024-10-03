import { google } from 'googleapis';

export default async function handler(req, res) {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  if (req.method === 'GET') {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    });
    res.redirect(authUrl);
  } else if (req.method === 'POST') {
    const { code } = req.body;
    try {
      const { tokens } = await oauth2Client.getToken(code);
      // Here, you would typically store these tokens securely (e.g., in a database)
      // For this example, we'll just send them back to the client
      res.status(200).json(tokens);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve tokens' });
    }
  } else {
    res.status(405).end();
  }
}
