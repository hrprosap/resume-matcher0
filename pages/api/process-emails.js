import { extractResumeText } from '../../lib/emailParser';
import { getGmailService, getEmailContent, getEmailMetadata } from '../../lib/gmail';
import { connectToDatabase } from '../../lib/mongodb';
import { getResumeScore } from '../../lib/openai';
import { simpleParser } from 'mailparser';
import { ObjectId } from 'mongodb';
import { parseCookies, setCookie } from 'nookies';
import { google } from 'googleapis';
import { refreshAccessToken } from './auth/google';

export default async function handler(req, res) {
  console.log('Process emails handler called');
  console.log('Request method:', req.method);
  console.log('Request body:', req.body);

  if (req.method !== 'POST') {
    console.log('Method not allowed');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Initializing Gmail service...');
    const cookies = parseCookies({ req });
    const accessToken = cookies.access_token;
    const refreshToken = cookies.refresh_token;

    if (!accessToken || !refreshToken) {
      return res.status(401).json({ error: 'No access token or refresh token found' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    // Always try to refresh the token before making API calls
    try {
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Update the cookies with the new tokens
      setCookie({ res }, 'access_token', credentials.access_token, {
        maxAge: credentials.expiry_date,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      if (credentials.refresh_token) {
        setCookie({ res }, 'refresh_token', credentials.refresh_token, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
      }
    } catch (refreshError) {
      console.error('Error refreshing access token:', refreshError);
      // Redirect to reauthentication page
      return res.redirect('/api/auth/google');
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    console.log('Gmail service initialized');

    // Fetch the job description using activeJobId
    const db = await connectToDatabase();
    const { activeJobId } = req.body;
    const jobDescription = await db.collection('jobs').findOne({ _id: ObjectId(activeJobId) });

    if (!jobDescription) {
      return res.status(404).json({ error: 'Job description not found' });
    }

    let response;
    try {
      response = await gmail.users.messages.list({
        userId: 'me',
        q: `subject:(${jobDescription.title}) OR subject:(${jobDescription.title.toUpperCase()}) OR subject:(${jobDescription.title.toLowerCase()}) is:unread`, // Updated query for flexible matching
        maxResults: 100// Adjust this number as needed
      });
      console.log('Gmail API response:', JSON.stringify(response, null, 2));
    } catch (error) {
      console.error('Error fetching emails from Gmail:', error);
      return res.status(500).json({ error: 'Failed to fetch emails from Gmail' });
    }

    if (!response || !response.data) {
      console.error('Unexpected response structure from Gmail API:', response);
      return res.status(500).json({ error: 'Unexpected response from Gmail API' });
    }

    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} new emails matching the job title.`);

    let processedEmails = [];

    if (messages.length === 0) {
      console.log('No new emails found. Fetching previous applicants from database.');
      processedEmails = await db.collection('applications')
        .find({ jobId: jobDescription._id })
        .sort({ timestamp: -1 })
        .toArray();

      return res.status(200).json({
        message: 'No new emails found. Showing previous applicants.',
        applications: processedEmails
      });
    } else {
      // Process new emails
      for (const message of messages) {
        try {
          // Always fetch the email content and metadata
          const emailContent = await getEmailContent(gmail, message.id);
          const emailMetadata = await getEmailMetadata(gmail, message.id);
          const resumeText = await extractResumeText(emailContent);

          console.log('Resume Text:', resumeText.substring(0, 200) + '...');
          console.log('Job Description:', jobDescription.description.substring(0, 200) + '...');

          // Get the score for the resume
          const score = await getResumeScore(resumeText, jobDescription.description, db, message.id);
          console.log(`Email ${message.id} received a score of ${score}`);

          const applicationData = {
            emailId: message.id,
            applicantEmail: emailMetadata.from,
            jobTitle: jobDescription.title,
            subjectLine: emailMetadata.subject,
            score: score,
            resumeText: resumeText,
            timestamp: new Date(),
            jobId: jobDescription._id, // Associate the application with the job
            applicationId: new ObjectId() // Generate a unique ID for each application
          };

          // Insert the application into the database
          await db.collection('applications').insertOne(applicationData);

          processedEmails.push(applicationData);

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

      return res.status(200).json({
        message: `${processedEmails.length} new emails processed successfully.`,
        applications: processedEmails
      });
    }

    console.log('All emails processed successfully.');

    // After processing emails, fetch the updated applications
    const applications = await db.collection('applications')
      .find({ jobId: ObjectId(activeJobId) })
      .sort({ timestamp: -1 })
      .toArray();

    if (applications.length === 0) {
      console.log('No applications found for this job.');
      return res.status(200).json({ message: 'No new emails found. Fetching previous applicants.', applications });
    }

    res.status(200).json({ message: `${processedEmails.length}  emails processed successfully`, applications });
  } catch (error) {
    console.error('Error processing emails:', error);
    res.status(500).json({ error: error.message || 'An error occurred while processing emails' });
  }
}
