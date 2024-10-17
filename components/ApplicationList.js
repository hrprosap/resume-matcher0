import { useState, useEffect } from 'react';
import SkeletonLoader from './SkeletonLoader';

export default function ApplicationList({ activeJobId }) {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (activeJobId) fetchApplications();
  }, [minScore, sortBy, sortOrder, page, activeJobId]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/applications?minScore=${minScore}&sortBy=${sortBy}&sortOrder=${sortOrder}&page=${page}&jobId=${activeJobId}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data.applications);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert(`Failed to fetch applications: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-white">Applications</h2>
      <div className="flex flex-wrap items-center mb-4 space-x-4">
        <div>
          <label className="mr-2 text-gray-600">Minimum Score:</label>
          <input type="number" value={minScore} onChange={(e) => setMinScore(e.target.value)} className="border border-gray-300 rounded p-1 w-20" />
        </div>
        <div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-300 rounded p-1">
            <option value="timestamp">Date</option>
            <option value="score">Score</option>
          </select>
        </div>
        <div>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="border border-gray-300 rounded p-1">
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <ul className="space-y-4">
          {applications.map((application) => (
            <li key={application._id} className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
              <div className="grid grid-cols-2 gap-4">
                <p><strong className="text-gray-700 dark:text-gray-300">Applicant Email:</strong> <span className="dark:text-white">{application.applicantEmail}</span></p>
                <p><strong className="text-gray-700 dark:text-gray-300">Job Title:</strong> <span className="dark:text-white">{application.jobTitle}</span></p>
                <p><strong className="text-gray-700 dark:text-gray-300">Score:</strong> <span className="text-lg font-semibold dark:text-white">{application.score}</span></p>
                <p><strong className="text-gray-700 dark:text-gray-300">Date:</strong> <span className="dark:text-white">{new Date(application.timestamp).toLocaleString()}</span></p>
                <p><strong className="text-gray-700 dark:text-gray-300">Subject Line:</strong> <span className="dark:text-white">{application.subjectLine}</span></p>
              </div>
              <div className="mt-4">
                <p><strong className="text-gray-700 dark:text-gray-300">Summary:</strong> <span className="dark:text-white">{application.summary || 'No summary available'}</span></p>
                <p><strong className="text-gray-700 dark:text-gray-300">Missing Skills:</strong></p>
                <ul className="list-disc list-inside dark:text-white">
                  {application.missingSkills && application.missingSkills.length > 0 ? (
                    application.missingSkills.map((skill, index) => (
                      <li key={index}>{skill}</li>
                    ))
                  ) : (
                    <li>No missing skills identified</li>
                  )}
                </ul>
                <a href={`/api/download-resume?emailId=${application.emailId}`} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium mt-2 inline-block" target="_blank" rel="noopener noreferrer">
                  Download Resume
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8 flex justify-center items-center space-x-4">
        <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100">Previous</button>
        <span className="text-gray-600">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-100">Next</button>
      </div>
    </div>
  );
}
