import OpenAI from 'openai';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get the resume score based on job description and resume text
export async function getResumeScore(resumeText, jobDescription, db, emailId) {
  try {
    // Updated prompt for evaluating the resume against the job description
    const prompt = `You are a recruiter assessing the attached resume against the provided job description. Analyze the resume objectively, highlighting matches and achievements, as well as missing aspects.
Consider the following parameters, with **more weight given to critical parameters like industry relevance, key skills, and years of experience**:

1. **Key Skills**: Exact match with the job description (JD) should get the highest weight. Penalize for skills not listed in the JD or irrelevant skills.
2. **Academic Qualifications**: Compare the required qualifications with actual qualifications. Lower the score for qualifications that are not relevant to the field.
3. **Achievements**: Focus only on achievements directly related to the JD. Non-relevant achievements should significantly lower the score.
4. **Responsibilities**: Match the responsibilities listed in the JD with those in the resume. Responsibilities unrelated to the JD should penalize the score.
5. **Years of Experience**: Exact experience in the required field and technologies is critical. Penalize if the experience is in a different field or irrelevant technology.
6. **Industry**: Relevance of the candidate's industry experience to the job opening is crucial. If the candidate has no relevant industry experience, the score should be low


Provide a single numeric overall score from 1 to 10 as response, where 1 is no match and 10 is a perfect match. Give more weight to critical parameters in your scoring. Your analysis should be crisp and based on current experience and capabilities, not future possibilities.

Job Description:
${jobDescription}

Resume:
${resumeText}

Score:`;

    // Make the request to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert HR professional. Provide only a single numeric score between 1 and 10, based on the analysis." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1, // Adjust based on expected output length
      temperature: 0.3,
    });

    // Extract and parse the score from the response
    const content = response.choices[0].message.content.trim();
    const score = parseInt(content);

    // Validate the score and update the database
    if (!isNaN(score) && score >= 1 && score <= 10) {
      await db.collection('applications').updateOne(
        { emailId: emailId },
        { $set: { score: score } },
        { upsert: true }
      );
      return score;
    } else {
      console.log('Invalid score received:', content);
      return 1; // Default to 1 if we can't parse a valid score
    }
  } catch (error) {
    console.error('Error in getResumeScore:', error);
    throw new Error(`Failed to get resume score: ${error.message}`);
  }
}