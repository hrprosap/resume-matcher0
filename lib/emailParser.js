import { simpleParser } from 'mailparser';

export async function extractResumeText(emailContent) {
  try {
    const parsed = await simpleParser(emailContent);
    let resumeText = '';

    // Check the email body
    if (parsed.text) {
      resumeText += parsed.text;
    }

    // Check attachments
    if (parsed.attachments && parsed.attachments.length > 0) {
      for (const attachment of parsed.attachments) {
        if (attachment.contentType === 'application/pdf') {
          // For PDF attachments, you might want to use a PDF parsing library
          // For simplicity, we'll just add a placeholder here
          resumeText += `\n[PDF ATTACHMENT: ${attachment.filename}]\n`;
        } else if (attachment.contentType === 'text/plain') {
          resumeText += `\n${attachment.content.toString('utf8')}\n`;
        } else if (attachment.contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          // For Word documents, you might want to use a Word parsing library
          // For simplicity, we'll just add a placeholder here
          resumeText += `\n[WORD DOCUMENT ATTACHMENT: ${attachment.filename}]\n`;
        }
      }
    }

    return resumeText.trim();
  } catch (error) {
    console.error('Error parsing email content:', error);
    return '';
  }
}
