import { useState } from 'react';
import { motion } from 'framer-motion';

export default function JobList({ jobs, onJobUpdate }) {
  const [editingJob, setEditingJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleStatusChange = async (id, active) => {
    try {
      if (active) {
        // Deactivate all other jobs
        await fetch('/api/jobs', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deactivateAll: true }),
        });
      }
      
      // Update the status of the current job
      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active }),
      });
      onJobUpdate();
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this job?')) {
      try {
        const response = await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' });
        if (!response.ok) {
          throw new Error('Failed to delete job');
        }
        onJobUpdate();
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingJob.title || !editingJob.description) {
      alert('Title and description are required');
      return;
    }

    // Ensure the editingJob has an id
    if (!editingJob._id) {
      alert('Invalid job ID');
      return;
    }

    // Log the editingJob to check its contents
    console.log('Updating job with data:', editingJob);

    try {
      const response = await fetch('/api/add-job', {
        method: 'PUT', // Use PUT method for updating
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingJob._id, // Ensure the ID is included
          title: editingJob.title,
          description: editingJob.description,
          active: editingJob.active // Include active status if needed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update job description');
      }

      setEditingJob(null); // Clear the editing state
      onJobUpdate(); // Refresh the job list
    } catch (error) {
      console.error('Error updating job:', error);
      alert(`Failed to update job: ${error.message}`);
    }
  };


  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search jobs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
      />
      {filteredJobs.map((job) => (
        <motion.div
          key={job._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6"
        >
          {editingJob && editingJob._id === job._id ? (
            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text"
                value={editingJob.title}
                onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
              <textarea
                value={editingJob.description}
                onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows="4"
                required
              />
              <div className="flex justify-end space-x-2">
                <button type="submit" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Save</button>
                <button onClick={() => setEditingJob(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
              <p className="text-gray-600 mb-4">{job.description.substring(0, 100)}...</p>
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={job.active}
                    onChange={(e) => handleStatusChange(job._id, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <div className="space-x-2">
                  <button onClick={() => handleEdit(job)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">Edit</button>
                  <button onClick={() => handleDelete(job._id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">Delete</button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}
