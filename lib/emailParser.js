import { simpleParser } from 'mailparser';

export async function extractResumeText(emailContent) {
  try {
    let resumeText = '';

    if (typeof emailContent === 'string') {
      // If emailContent is already a string, use it directly
      resumeText = emailContent;
    } else if (emailContent && typeof emailContent === 'object') {
      // If emailContent is an object (Gmail API response), extract the body
      const body = emailContent.payload.body.data || '';
      const decodedBody = Buffer.from(body, 'base64').toString('utf-8');
      resumeText = decodedBody;

      // Check for attachments
      if (emailContent.payload.parts) {
        for (const part of emailContent.payload.parts) {
          if (part.filename) {
            resumeText += `\n[ATTACHMENT: ${part.filename}]\n`;
          }
        }
      }
    } else {
      throw new Error('Invalid email content format');
    }

    return resumeText.trim();
  } catch (error) {
    console.error('Error parsing email content:', error);
    return '';
  }
}
