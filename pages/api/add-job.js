import { connectToDatabase } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const { id, title, description, active } = req.body;

    if (id) {
      // Update existing job
      const result = await db.collection('jobs').updateOne(
        { _id: ObjectId(id) },
        { $set: { title, description, active, updatedAt: new Date() } }
      );
      res.status(200).json({ message: 'Job description updated successfully', id });
    } else {
      // Add new job
      const result = await db.collection('jobs').insertOne({
        title,
        description,
        active: active || false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      res.status(200).json({ message: 'Job description added successfully', id: result.insertedId });
    }
  } catch (error) {
    console.error('Error adding/updating job description:', error);
    res.status(500).json({ error: error.message || 'An error occurred while adding/updating job description' });
  }
}