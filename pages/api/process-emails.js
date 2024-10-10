import { extractResumeText } from '../../lib/emailParser';
import { getGmailService, getEmailContent, getEmailMetadata } from '../../lib/gmail';
import { connectToDatabase } from '../../lib/mongodb';
import { getResumeScore } from '../../lib/openai';
import { simpleParser } from 'mailparser';
import { ObjectId } from 'mongodb';
import { parseCookies, setCookie } from 'nookies';
import { google } from 'googleapis';
import { refreshAccessToken } from './auth/google'; // Make sure to export the refreshAccessToken function

const nodemailer = require('nodemailer'); // Import nodemailer at the top

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use Gmail service
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_PASS, // Your Gmail password or app password
  },
});

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
      return res.status(401).json({ error: 'Failed to refresh access token. Please re-authenticate.' });
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

          // Inside the email processing loop
          if (score >= 7) {
            const mailOptions = {
              from: process.env.GMAIL_USER,
              to: hrEmail,
              subject: `New Application for ${jobDescription.title}`,
              text: `A new application has been received:\n\n` +
                    `Applicant Email: ${emailMetadata.from}\n` +
                    `Job Title: ${jobDescription.title}\n` +
                    `Score: ${score}\n` +
                    `Subject Line: ${emailMetadata.subject}\n\n` +
                    `Resume Attachment: [Download Here](https://yourdomain.com/api/download-resume?emailId=${message.id})`,
            };

            try {
              await transporter.sendMail(mailOptions);
              console.log(`Email forwarded to HR: ${hrEmail}`);
            } catch (error) {
              console.error('Error forwarding email to HR:', error);
            }
          }
        } catch (emailError) {
          console.error(`Error processing email ${message.id}:`, emailError);
          // Consider adding this email to a list of failed processes
        }
      }
    }

    console.log('All emails processed successfully.');
    res.status(200).json({
      message: messages.length === 0 ? 'No new emails found. Showing previous applicants.' : 'Emails processed successfully',
      processedEmails: processedEmails
    });
  } catch (error) {
    console.error('Error processing emails:', error);
    res.status(500).json({ error: error.message || 'An error occurred while processing emails' });
  }
}