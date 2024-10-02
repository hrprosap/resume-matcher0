import { getGmailService, getEmailContent } from '../../lib/gmail';
import { extractResumeText } from '../../lib/emailParser';

export default async function handler(req, res) {
  const { emailId } = req.query;

  if (!emailId) {
    return res.status(400).json({ error: 'Email ID is required' });
  }

  try {
    const emailContent = await getEmailContent(emailId);
    const resumeText = await extractResumeText(emailContent);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="resume_${emailId}.txt"`);
    res.status(200).send(resumeText);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ error: 'An error occurred while downloading the resume' });
  }
}
