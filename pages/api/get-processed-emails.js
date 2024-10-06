import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const processedEmails = await db.collection('applications')
      .find({ jobId: jobDescription._id }) // Fetch all applications for the specific job
      .sort({ timestamp: -1 })
      .project({
        emailId: 1,
        applicantEmail: 1,
        jobTitle: 1,
        score: 1,
        timestamp: 1
      })
      .toArray();

    console.log('Processed emails from database:', processedEmails);

    res.status(200).json({ processedEmails });
  } catch (error) {
    console.error('Error fetching processed emails:', error);
    res.status(500).json({ error: 'An error occurred while fetching processed emails' });
  }
}
