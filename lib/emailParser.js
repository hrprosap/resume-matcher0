import { simpleParser } from 'mailparser';
import pdf from 'pdf-parse';
import { Document } from 'docx';

export async function extractResumeText(emailContent, gmail) {
  try {
    let resumeUrl = '';

    if (emailContent && typeof emailContent === 'object') {
      // Check for attachments
      if (emailContent.payload.parts) {
        for (const part of emailContent.payload.parts) {
          if (part.filename && part.body.attachmentId) {
            // Instead of parsing the content, we'll return the attachment URL
            resumeUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${emailContent.id}/attachments/${part.body.attachmentId}`;
            break; // Assuming we only need the first attachment
          }
        }
      }
    }

    return resumeUrl;
  } catch (error) {
    console.error('Error parsing email content:', error);
    return '';
  }
}

async function getAttachmentData(gmail, messageId, attachmentId) {
  try {
    const response = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId,
    });

    if (response.data.data) {
      return Buffer.from(response.data.data, 'base64');
    }
  } catch (error) {
    console.error('Error fetching attachment:', error);
  }
  return null;
}

async function parseAttachment(filename, data) {
  const fileExtension = filename.split('.').pop().toLowerCase();

  switch (fileExtension) {
    case 'pdf':
      return await parsePDF(data);
    case 'docx':
      return await parseDocx(data);
    default:
      return data.toString('utf-8');
  }
}

async function parsePDF(data) {
  try {
    const pdfData = await pdf(data);
    return pdfData.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return '';
  }
}

async function parseDocx(data) {
  try {
    const doc = new Document(data);
    const text = await doc.getText();
    return text;
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    return '';
  }
}
