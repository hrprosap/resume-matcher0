import React from 'react';

const ProcessedEmails = ({ emails }) => {
  return (
    <div>
      <h2>Processed Emails</h2>
      {emails.map((email, index) => (
        <div key={index} className="border p-4 mb-4 rounded">
          <p><strong>Applicant Email:</strong> {email.applicantEmail}</p>
          <p><strong>Job Title:</strong> {email.jobTitle}</p>
          <p><strong>Score:</strong> {email.score}</p>
          <p><strong>Resume Text:</strong> {email.resumeText.substring(0, 100)}...</p>
          <a 
            href={`/api/download-resume?emailId=${email.emailId}`} 
            className="text-blue-500 hover:underline"
            target="_blank" 
            rel="noopener noreferrer"
          >
            Download Resume
          </a>
          <hr />
        </div>
      ))}
    </div>
  );
};

export default ProcessedEmails;