import { google } from 'googleapis';
import { parseCookies } from 'nookies';

export async function getGmailService(req) {
  console.log('getGmailService called');
  const cookies = parseCookies({ req });
  
  console.log('Cookies:', cookies);
  
  if (!cookies.access_token || !cookies.refresh_token) {
    console.log('No access or refresh token available');
    throw new Error('No access or refresh token available');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  console.log('OAuth2Client created');

  oauth2Client.setCredentials({
    access_token: cookies.access_token,
    refresh_token: cookies.refresh_token,
  });

  console.log('Credentials set');

  return google.gmail({ version: 'v1', auth: oauth2Client });
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