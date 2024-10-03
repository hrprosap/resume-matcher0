import { getGmailService, getEmailContent } from '../../lib/gmail';
import { extractResumeText } from '../../lib/emailParser';

export default async function handler(req, res) {
  const { emailId } = req.query;

  if (!emailId) {
    return res.status(400).json({ error: 'Email ID is required' });
  }

  try {
    const gmail = await getGmailService(req);
    const emailContent = await getEmailContent(gmail, emailId);
    const resumeText = await extractResumeText(emailContent);

    if (!resumeText) {
      return res.status(404).json({ error: 'No resume content found' });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="resume_${emailId}.txt"`);
    res.status(200).send(resumeText);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ error: 'An error occurred while downloading the resume' });
  }
}
