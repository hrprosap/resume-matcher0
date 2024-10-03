import { google } from 'googleapis';

export async function getGmailService() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: process.env.GMAIL_ACCESS_TOKEN,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}
