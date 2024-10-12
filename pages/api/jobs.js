import { connectToDatabase } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const db = await connectToDatabase();

  if (req.method === 'GET') {
    try {
      const jobs = await db.collection('jobs').find({}).sort({ createdAt: -1 }).toArray();
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching jobs' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id, active, deactivateAll } = req.body;
      
      if (deactivateAll) {
        await db.collection('jobs').updateMany({}, { $set: { active: false } });
      }
      
      if (id) {
        await db.collection('jobs').updateOne(
          { _id: ObjectId(id) },
          { $set: { active, updatedAt: new Date() } }
        );
      }
      
      res.status(200).json({ message: 'Job status updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while updating job status' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      await db.collection('jobs').deleteOne({ _id: ObjectId(id) });
      res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while deleting the job' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}