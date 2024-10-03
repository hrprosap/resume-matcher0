import { extractResumeText } from '../../lib/emailParser';
import { getGmailService, getEmailContent, getEmailMetadata } from '../../lib/gmail';
import { connectToDatabase } from '../../lib/mongodb';
import { getResumeScore } from '../../lib/openai';
import { simpleParser } from 'mailparser';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  console.log('Process emails handler called');
  console.log('Request method:', req.method);
  console.log('Request body:', req.body);

  if (req.method !== 'POST') {
    console.log('Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Connecting to database...');
    const db = await connectToDatabase();
    console.log('Connected to database. Searching for active job description...');

    const { activeJobId } = req.body;
    if (!activeJobId) {
      console.log('No active job ID provided');
      return res.status(400).json({ error: 'No active job ID provided' });
    }

    console.log('Fetching job description for ID:', activeJobId);
    const jobDescription = await db.collection('jobs').findOne({ _id: ObjectId(activeJobId) });

    if (!jobDescription) {
      console.log('No job description found for ID:', activeJobId);
      return res.status(404).json({ error: 'No job description found for the provided ID' });
    }

    console.log('Job description found:', jobDescription);

    console.log('Initializing Gmail service...');
    const gmail = await getGmailService(req);
    console.log('Gmail service initialized');

    let response;
    try {
      response = await gmail.users.messages.list({
        userId: 'me',
        q: `subject:${jobDescription.title} is:unread`,
        maxResults: 10 // Adjust this number as needed
      });
      console.log('Gmail API response:', JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Error fetching emails from Gmail:', error);
      return res.status(500).json({ error: 'Failed to fetch emails from Gmail' });
    }

    if (!response || !response.data || !Array.isArray(response.data.messages)) {
      console.error('Unexpected response structure from Gmail API:', response);
      return res.status(500).json({ error: 'Unexpected response from Gmail API' });
    }

    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} new emails matching the job title.`);

    const processedEmails = [];

    for (const message of messages) {
      try {
        const existingApplication = await db.collection('applications').findOne({ emailId: message.id });

        if (existingApplication && existingApplication.score !== undefined) {
          console.log(`Email ${message.id} has already been processed. Using stored score.`);
          processedEmails.push(existingApplication);
          continue;
        }

        const emailContent = await getEmailContent(gmail, message.id);
        const emailMetadata = await getEmailMetadata(gmail, message.id);
        const resumeText = await extractResumeText(emailContent);

        console.log('Resume Text:', resumeText.substring(0, 200) + '...');
        console.log('Job Description:', jobDescription.description.substring(0, 200) + '...');

        const score = await getResumeScore(resumeText, jobDescription.description, db, message.id);
        console.log(`Email ${message.id} received a score of ${score}`);

        const applicationData = {
          emailId: message.id,
          applicantEmail: emailMetadata.from,
          jobTitle: jobDescription.title,
          score: score,
          resumeText: resumeText,
          timestamp: new Date(),
          jobId: jobDescription._id // Add this line to associate the application with the job
        };

        await db.collection('applications').updateOne(
          { emailId: message.id },
          { $set: applicationData },
          { upsert: true }
        );
        processedEmails.push(applicationData);

        if (score >= 7) {
          console.log(`Forwarding email ${message.id} to HR (score: ${score})`);
          // Implement email forwarding logic here
        }

        // Mark the email as read after processing
        await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
      } catch (emailError) {
        console.error(`Error processing email ${message.id}:`, emailError);
        // Consider adding this email to a list of failed processes
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