import { connectToDatabase } from '../../lib/mongodb';
import { ObjectId } from 'mongodb'; // Assuming this import is needed for ObjectId

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  const { minScore, sortBy, sortOrder, page = 1, limit = 10 } = req.query;

  try {
    const db = await connectToDatabase();
    const query = {
      ...(minScore ? { score: { $gte: parseInt(minScore) } } : {}),
      ...(req.query.jobId && req.query.jobId !== 'undefined' ? { jobId: ObjectId(req.query.jobId) } : {})
    };
    const sort = sortBy ? { [sortBy]: sortOrder === 'desc' ? -1 : 1 } : { timestamp: -1 };

    const totalCount = await db.collection('applications').countDocuments(query);
    const applications = await db.collection('applications')
      .find(query)
      .sort(sort)
      .project({
        emailId: 1,
        applicantEmail: 1,
        jobTitle: 1,
        score: 1,
        timestamp: 1
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .toArray();

    res.status(200).json({
      applications,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'An error occurred while fetching applications' });
  }
}