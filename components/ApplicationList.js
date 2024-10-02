import { useState, useEffect } from 'react';

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const response = await fetch('/api/applications');
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        const data = await response.json();
        setApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplications();
  }, []);

  if (isLoading) {
    return <div>Loading applications...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Recent Applications</h2>
      {applications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <ul className="space-y-2">
          {applications.map((app) => (
            <li key={app._id} className="border p-2 rounded">
              <p>Email ID: {app.emailId}</p>
              <p>Score: {app.score}</p>
              <p>Timestamp: {new Date(app.timestamp).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
