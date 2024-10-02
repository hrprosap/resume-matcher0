import { google } from 'googleapis';
import fs from 'fs';

const TOKEN_PATH = './token.json';
const CREDENTIALS_PATH = './credentials.json';

function authorize() {
  const content = fs.readFileSync(CREDENTIALS_PATH);
  const credentials = JSON.parse(content);
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  const token = fs.readFileSync(TOKEN_PATH);
  oAuth2Client.setCredentials(JSON.parse(token));
  return oAuth2Client;
}

const auth = authorize();
const gmail = google.gmail({ version: 'v1', auth });

export async function getGmailService() {
  return gmail;
}

export async function getEmailContent(messageId) {
  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  let content = '';
  const parts = message.data.payload.parts;

  if (parts) {
    for (let part of parts) {
      if (part.mimeType === 'text/plain') {
        const body = part.body;
        if (body.data) {
          content += Buffer.from(body.data, 'base64').toString();
        }
      }
    }
  }

  return content;
}

export async function getEmailMetadata(messageId) {
  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'metadata',
    metadataHeaders: ['From', 'Subject'],
  });

  const fromHeader = message.data.payload.headers.find(header => header.name === 'From');
  const subjectHeader = message.data.payload.headers.find(header => header.name === 'Subject');

  return {
    from: fromHeader ? fromHeader.value : 'Unknown',
    subject: subjectHeader ? subjectHeader.value : 'No Subject',
  };
}
