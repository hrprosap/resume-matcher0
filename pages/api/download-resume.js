import { getGmailService, getEmailContent } from '../../lib/gmail';
import { extractResumeAttachment } from '../../lib/emailParser';

export default async function handler(req, res) {
  const { emailId } = req.query;

  if (!emailId) {
    return res.status(400).json({ error: 'Email ID is required' });
  }

  try {
    const gmail = await getGmailService(req);
    const emailContent = await getEmailContent(gmail, emailId);
    const attachment = await extractResumeAttachment(emailContent, gmail);

    if (!attachment) {
      return res.status(404).json({ error: 'No resume attachment found' });
    }

    // Convert base64url to base64
    const base64Data = attachment.data.replace(/-/g, '+').replace(/_/g, '/');

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.filename}"`);
    res.send(Buffer.from(base64Data, 'base64'));
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ error: 'An error occurred while downloading the resume' });
  }
}
