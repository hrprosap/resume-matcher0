import { getGmailService, getEmailContent } from '../../lib/gmail';
import { extractResumeText } from '../../lib/emailParser';
import { parseCookies } from 'nookies';

export default async function handler(req, res) {
  const { emailId } = req.query;

  if (!emailId) {
    return res.status(400).json({ error: 'Email ID is required' });
  }

  try {
    const cookies = parseCookies({ req });
    const accessToken = cookies.access_token;

    if (!accessToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const gmail = await getGmailService(req);
    const emailContent = await getEmailContent(gmail, emailId);
    const resumeUrl = await extractResumeText(emailContent, gmail);

    if (!resumeUrl) {
      return res.status(404).json({ error: 'No resume attachment found' });
    }

    // Redirect to the resume URL with the access token
    const urlWithToken = `${resumeUrl}&access_token=${accessToken}`;
    res.redirect(urlWithToken);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ error: 'An error occurred while downloading the resume' });
  }
}
