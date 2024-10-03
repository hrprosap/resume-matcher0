import { useState, useEffect } from 'react';
import { parseCookies } from 'nookies';
import ApplicationList from '../components/ApplicationList';
import ProcessedEmails from '../components/ProcessedEmails';
import JobList from '../components/JobList';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [processedEmails, setProcessedEmails] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeJobId, setActiveJobId] = useState(null);

  useEffect(() => {
    checkAuthStatus();
    fetchJobs();
  }, []);

  const checkAuthStatus = async () => {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    setIsAuthenticated(data.isAuthenticated);
  };

  const handleAuthenticate = () => {
    window.location.href = '/api/auth/google';
  };

  const handleProcessEmails = async () => {
    if (!isAuthenticated) {
      console.log("Not authenticated, showing alert");
      alert("Please authenticate with Google first.");
      return;
    }
    if (!activeJobId) {
      console.log("No active job selected, showing alert");
      alert("Please select an active job first.");
      return;
    }
    console.log("Starting email processing...");
    setIsProcessing(true);
    try {
      console.log("Sending request to /api/process-emails");
      const response = await fetch('/api/process-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activeJobId }),
      });
      console.log("Received response from /api/process-emails");
      const data = await response.json();
      console.log("Response data:", data);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process emails');
      }
      setProcessedEmails(data.processedEmails);
      if (data.processedEmails.length === 0) {
        console.log("No applicants found for this job posting");
        alert("No applicants found for this job posting.");
      } else {
        console.log(`${data.message} ${data.processedEmails.length} applicants found.`);
        alert(`${data.message} ${data.processedEmails.length} applicants found.`);
      }
    } catch (error) {
      console.error('Error processing emails:', error);
      alert(`An error occurred while processing emails: ${error.message}`);
      if (error.message.includes('authentication') || error.message.includes('token')) {
        console.log("Redirecting to Google auth due to authentication error");
        window.location.href = '/api/auth/google';
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data);
      const activeJob = data.find(job => job.active);
      setActiveJobId(activeJob ? activeJob._id : null);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/add-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: jobTitle, description: jobDescription, active: true }),
      });
      if (!response.ok) {
        throw new Error('Failed to add job description');
      }
      alert('Job description added successfully');
      setJobTitle('');
      setJobDescription('');
    } catch (error) {
      console.error('Error adding job description:', error);
      alert(`An error occurred while adding job description: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Resume Matcher Dashboard</h1>
      {!isAuthenticated ? (
        <button
          onClick={handleAuthenticate}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Authenticate with Google
        </button>
      ) : (
        <>
          <button
            onClick={handleProcessEmails}
            disabled={isProcessing || !activeJobId}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Process New Emails'}
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Job Postings</h2>
              <JobList jobs={jobs} onJobUpdate={fetchJobs} />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Add New Job</h2>
              <form onSubmit={handleAddJob} className="mb-8 bg-white shadow-md rounded px-8 pt-6 pb-8">
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Enter job title"
                  className="w-full p-2 border rounded mb-4"
                />
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Enter job description"
                  className="w-full p-2 border rounded mb-4"
                  rows="4"
                />
                <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full">
                  Add Job Description
                </button>
              </form>
            </div>
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Applications</h2>
            <ApplicationList activeJobId={activeJobId} />
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Processed Emails</h2>
            <ProcessedEmails emails={processedEmails} />
          </div>
        </>
      )}
    </div>
  );
}