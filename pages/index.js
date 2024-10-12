import { useState, useEffect } from 'react';
import { parseCookies } from 'nookies';
import ApplicationList from '../components/ApplicationList';
import JobList from '../components/JobList';
import Navbar from '../components/Navbar';
import FloatingActionButton from '../components/FloatingActionButton';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import ApplicationChart from '../components/ApplicationChart';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobs, setJobs] = useState([]);
  const [activeJobId, setActiveJobId] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    checkAuthStatus();
    fetchJobs();
  }, []);

  const checkAuthStatus = async () => {
    const response = await fetch('/api/auth/check');
    const data = await response.json();
    setIsAuthenticated(data.isAuthenticated);
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data);
      const activeJob = data.find(job => job.active);
      setActiveJobId(activeJob ? activeJob._id : null);
      if (activeJob) {
        fetchApplications(activeJob._id);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async (jobId) => {
    try {
      const response = await fetch(`/api/applications?jobId=${jobId}`);
      const data = await response.json();
      setApplications(data.applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleAuthenticate = () => {
    window.location.href = '/api/auth/google';
  };

  const handleProcessEmails = async () => {
    if (!isAuthenticated) {
      toast.error("Please authenticate with Google first.");
      return;
    }
    if (!activeJobId) {
      toast.error("Please select an active job first.");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch('/api/process-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activeJobId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process emails');
      }
      toast.success(`${data.message} Applicants processed successfully.`);

      const { applications } = data; // Get the updated applications
      setApplications(applications); // Update the applications state
    } catch (error) {
      console.error('Error processing emails:', error);
      toast.error(`An error occurred while processing emails: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/add-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add job description');
      }
      toast.success('Job description added successfully');
      reset();
      fetchJobs();
    } catch (error) {
      console.error('Error adding job description:', error);
      toast.error(`An error occurred while adding job description: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar isAuthenticated={isAuthenticated} />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 dark:text-white">PROSAPIENS AI RESUME MATCHER</h1>
        {!isAuthenticated ? (
          <div className="text-center bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <p className="mb-4 text-gray-700 dark:text-gray-300">Welcome to PROSAPIENS AI RESUME MATCHER. Please login to get started.</p>
            <button
              onClick={handleAuthenticate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
            >
              Login with Google
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <section id="jobs" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-white">Job Postings</h2>
                <JobList jobs={jobs} onJobUpdate={fetchJobs} />
              </section>
              <section id="applications" className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-white">Applications</h2>
                <ApplicationList activeJobId={activeJobId} />
              </section>
            </div>
            <div>
              <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Add New Job</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="add-job-form">
                  <input
                    {...register('title', { required: 'Job title is required' })}
                    placeholder="Enter job title"
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                  />
                  {errors.title && <p className="text-red-500">{errors.title.message}</p>}
                  <textarea
                    {...register('description', { required: 'Job description is required' })}
                    placeholder="Enter job description"
                    className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                    rows="4"
                  />
                  {errors.description && <p className="text-red-500">{errors.description.message}</p>}
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full transition duration-300 ease-in-out">
                    Add Job Description
                  </button>
                </form>
              </section>
              <button
                onClick={handleProcessEmails}
                disabled={isProcessing || !activeJobId}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out disabled:opacity-50 w-full"
              >
                {isProcessing ? 'Processing...' : 'Process New Emails'}
              </button>
              <div className="mt-6"> {/* Add margin-top for spacing */}
                <ApplicationChart applications={applications} />
              </div>
            </div>
          </div>
        )}
      </div>
      <FloatingActionButton onClick={() => {
        document.querySelector('#add-job-form').scrollIntoView({ behavior: 'smooth' });
      }} />
    </div>
  );
}
