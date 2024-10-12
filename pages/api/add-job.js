import { connectToDatabase } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const { id, title, description, active } = req.body;

    // Check for empty fields
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    if (req.method === 'PUT' && id) {
      // Update existing job
      const result = await db.collection('jobs').updateOne(
        { _id: ObjectId(id) },
        { $set: { title, description, active, updatedAt: new Date() } } // Include active status
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.status(200).json({ message: 'Job description updated successfully', id });
    } else if (req.method === 'POST') {
      // Add new job
      const result = await db.collection('jobs').insertOne({
        title,
        description,
        active: active || false, // Set to false by default if not provided
        createdAt: new Date(),
        updatedAt: new Date()
      });
      res.status(201).json({ message: 'Job description added successfully', id: result.insertedId });
    } else {
      return res.status(400).json({ error: 'Invalid request' });
    }
  } catch (error) {
    console.error('Error adding/updating job description:', error);
    res.status(500).json({ error: error.message || 'An error occurred while adding/updating job description' });
  }
}
