import { useState } from 'react';
import ApplicationList from '../components/ApplicationList';
import ProcessedEmails from '../components/ProcessedEmails';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState([]);
  const [processedEmails, setProcessedEmails] = useState([]);

  const handleProcessEmails = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/process-emails', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process emails');
      }
      setProcessedEmails(data.processedEmails);
      alert(`Emails processed successfully. Processed ${data.processedEmails.length} emails.`);
    } catch (error) {
      console.error('Error processing emails:', error);
      alert(`An error occurred while processing emails: ${error.message}`);
    } finally {
      setIsProcessing(false);
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
        body: JSON.stringify({ title: jobTitle, description: jobDescription }),
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Resume Matcher Dashboard</h1>
      
      <form onSubmit={handleAddJob} className="mb-4">
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="Enter job title"
          className="w-full p-2 border rounded mb-2"
        />
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Enter job description"
          className="w-full p-2 border rounded"
          rows="4"
        />
        <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2">
          Add Job Description
        </button>
      </form>

      <button
        onClick={handleProcessEmails}
        disabled={isProcessing}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {isProcessing ? 'Processing...' : 'Process New Emails'}
      </button>
      <ApplicationList />
      <ProcessedEmails emails={processedEmails} />
    </div>
  );
}