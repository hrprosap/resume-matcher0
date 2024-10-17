# PROSAPIENS AI RESUME MATCHER

PROSAPIENS AI RESUME MATCHER is a Next.js application that automates the process of matching resumes to job descriptions using Gmail integration and OpenAI's GPT model.

## Key Features

- Fetch emails with resumes from Gmail
- Extract resume text from attachments
- Score resumes against job descriptions using OpenAI's GPT model
- Display and manage job postings
- View and filter applications

## How It Works

### 1. Gmail Integration

The application uses the Gmail API to fetch emails containing resumes. The main logic for this process is in the `pages/api/process-emails.js` file:

Key steps:
- Initialize Gmail service with OAuth2 authentication
- Fetch emails matching the job title
- Extract resume text from email attachments
- Process each email and its attachments

### 2. Resume Text Extraction

The `lib/emailParser.js` file contains functions to extract resume text from email attachments


This module handles different file types (PDF, DOCX) and extracts text content from them.

### 3. OpenAI Integration

The extracted resume text is sent to OpenAI's GPT model for scoring against the job description. This process is handled in the `lib/openai.js` file:

The getResumeScore function:
- Constructs a prompt comparing the resume to the job description
- Sends the prompt to OpenAI's API
- Receives and processes the score

### 4. Storing Results

The application stores the processed applications in a MongoDB database, allowing for easy retrieval and display in the user interface.

## Setup and Configuration

1. Clone the repository
2. Install dependencies
    ```
    npm install
    ```
3. Set up environment variables in .env.local file in the root directory:
   - Gmail API credentials
   - OpenAI API key
   - MongoDB connection string
4. Run the development server
    ```
    npm run dev
    ```

## Usage

1. Log in with the Google account
2. Create new Job Postings
3. Select a previously created job Posting by checking the Active Checkbox and then click on **Process New Emails** to fetch and analyze new applications.
4. View and manage applications in the dashboard

## Technologies Used

- Next.js
- React
- Gmail API
- OpenAI API
- MongoDB
- Tailwind CSS