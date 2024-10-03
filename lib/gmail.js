import { google } from 'googleapis';
import { parseCookies, setCookie } from 'nookies';

export async function getGmailService(req, res) {
  let cookies = parseCookies({ req });
  
  if (!cookies.access_token || !cookies.refresh_token) {
    throw new Error('No access or refresh token available');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: cookies.access_token,
    refresh_token: cookies.refresh_token,
  });

  oauth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      setCookie({ res }, 'refresh_token', tokens.refresh_token, {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    }
    setCookie({ res }, 'access_token', tokens.access_token, {
      maxAge: tokens.expiry_date,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  });

  try {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    // Test the connection
    await gmail.users.getProfile({ userId: 'me' });
    return gmail;
  } catch (error) {
    console.error('Error initializing Gmail service:', error);
    throw new Error('Failed to initialize Gmail service');
  }
}

export async function getEmailContent(gmail, messageId) {
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  return response.data;
}

export async function getEmailMetadata(gmail, messageId) {
  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'metadata',
    metadataHeaders: ['From', 'Subject'],
  });
  const from = response.data.payload.headers.find(header => header.name === 'From').value;
  const subject = response.data.payload.headers.find(header => header.name === 'Subject').value;
  return { from, subject };
}