import { google } from 'googleapis';
import { parseCookies } from 'nookies';

export async function getGmailService(req) {
  const cookies = parseCookies({ req });
  const accessToken = cookies.access_token;

  if (!accessToken) {
    console.error('No access token available');
    throw new Error('No access token available');
  }

  console.log('Access token retrieved from cookies');

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  console.log('OAuth2Client created with access token');

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