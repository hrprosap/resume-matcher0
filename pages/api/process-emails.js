import { extractResumeText } from '../../lib/emailParser';
import { getGmailService, getEmailContent, getEmailMetadata } from '../../lib/gmail';
import { connectToDatabase } from '../../lib/mongodb';
import { getResumeScore } from '../../lib/openai';
import { simpleParser } from 'mailparser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Connecting to database...');
    const db = await connectToDatabase();
    console.log('Connected to database. Searching for active job description...');

    const jobDescription = await db.collection('jobs').findOne({ active: true });

    if (!jobDescription) {
      console.log('No active job description found in the database.');
      return res.status(404).json({ error: 'No active job description found' });
    }

    console.log('Active job description found:', jobDescription);

    const gmail = await getGmailService();
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `subject:${jobDescription.title}`,
    });

    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} emails matching the job title.`);

    const processedEmails = [];

    for (const message of messages) {
      // Check if the email has already been processed
      const existingApplication = await db.collection('applications').findOne({ emailId: message.id });

      if (existingApplication) {
        console.log(`Email ${message.id} has already been processed. Skipping.`);
        processedEmails.push(existingApplication);
        continue;
      }

      const emailContent = await getEmailContent(message.id);
      const emailMetadata = await getEmailMetadata(message.id);
      const resumeText = await extractResumeText(emailContent);

      console.log('Resume Text:', resumeText.substring(0, 200) + '...');
      console.log('Job Description:', jobDescription.description.substring(0, 200) + '...');

      const score = await getResumeScore(resumeText, jobDescription.description);
      console.log(`Email ${message.id} received a score of ${score}`);

      const applicationData = {
        emailId: message.id,
        applicantEmail: emailMetadata.from,
        jobTitle: jobDescription.title,
        score: score,
        resumeText: resumeText,
        timestamp: new Date(),
      };

      await db.collection('applications').insertOne(applicationData);
      processedEmails.push(applicationData);

      if (score >= 7) {
        console.log(`Forwarding email ${message.id} to HR (score: ${score})`);
        // Implement email forwarding logic here
      }
    }

    console.log('All emails processed successfully.');
    res.status(200).json({ 
      message: 'Emails processed successfully', 
      processedEmails: processedEmails 
    });
  } catch (error) {
    console.error('Error processing emails:', error);
    res.status(500).json({ error: error.message || 'An error occurred while processing emails' });
  }
}