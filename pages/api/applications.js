import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    const db = await connectToDatabase();
    const applications = await db.collection('applications')
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    res.status(200).json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'An error occurred while fetching applications' });
  }
}
