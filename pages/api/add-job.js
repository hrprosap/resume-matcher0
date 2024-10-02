import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    
    // Deactivate all existing job descriptions
    await db.collection('jobs').updateMany({}, { $set: { active: false } });

    // Add new job description
    const result = await db.collection('jobs').insertOne({
      title: req.body.title,
      description: req.body.description,
      active: true,
      createdAt: new Date()
    });

    res.status(200).json({ message: 'Job description added successfully', id: result.insertedId });
  } catch (error) {
    console.error('Error adding job description:', error);
    res.status(500).json({ error: error.message || 'An error occurred while adding job description' });
  }
}
