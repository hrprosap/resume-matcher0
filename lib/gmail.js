import { google } from 'googleapis';
import { parseCookies } from 'nookies';

export async function getGmailService(req) {
  const cookies = parseCookies({ req });
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: cookies.access_token,
    refresh_token: cookies.refresh_token,
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}
