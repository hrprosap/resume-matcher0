import OpenAI from 'openai';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get the resume score based on job description and resume text
export async function getResumeScore(resumeText, jobDescription, db, emailId) {
  try {
    const prompt = `You are a recruiter assessing the attached resume against the provided job description. Analyze the resume objectively, highlighting matches and achievements, as well as missing aspects.

1. Key Skills: Exact match with the job description (JD) should get the highest weight. Penalize for skills not listed from the JD or irrelevant skills.
2. Academic Qualifications: Compare the required qualifications with actual qualifications. Lower the score for qualifications that are not relevant to the field.
3. Achievements: Focus only on achievements directly related to the JD. 
4. Responsibilities: Match the responsibilities listed in the JD with those in the resume. lower the score if the responsibities mention in the JD are not present in the resume.
5. Years of Experience: Exact experience in the required field and technologies is critical. Penalize if the experience is in a different field or irrelevant technology.
6. Industry: Relevance of the candidate's industry experience to the job opening is the most crucial factor ,lower the scores for irrevalent candidates or from different indusry . 



Provide the following in your response:
1. A single numeric overall score from 1 to 10, where 1 is no match and 10 is a perfect match.
2. A 2-3 line summary of the resume against the job description, including education and experience relevance.
3. A bullet-point list of key skills or qualifications missing from the candidate's resume that are listed in the job description.

Job Description:
${jobDescription}

Resume:
${resumeText}

Response Format:
Score: [numeric score]
Summary: [2-3 line summary]
Missing Skills:
- [skill 1]
- [skill 2]
- [skill 3]`;

    // Make the request to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert HR professional. Provide a concise analysis based on the given instructions." },
        { role: "user", content: prompt }
      ],
      max_tokens: 350, // Increased to accommodate the summary and missing skills
      temperature: 0.3,
    });

    // Extract and parse the score from the response
    const content = response.choices[0].message.content.trim();
    const [scorePart, summaryPart, missingSkillsPart] = content.split('\n\n');

    const score = parseInt(scorePart.split(':')[1].trim());
    const summary = summaryPart.split(':')[1].trim();
    const missingSkills = missingSkillsPart.split('\n').slice(1).map(skill => skill.trim().replace(/^- /, ''));

    if (!isNaN(score) && score >= 1 && score <= 10) {
      await db.collection('applications').updateOne(
        { emailId: emailId },
        { $set: { 
          score: score, 
          summary: summary || "No summary available", 
          missingSkills: missingSkills.length > 0 ? missingSkills : ["No missing skills identified"] 
        } },
        { upsert: true }
      );
      return { score, summary: summary || "No summary available", missingSkills: missingSkills.length > 0 ? missingSkills : ["No missing skills identified"] };
    } else {
      console.log('Invalid score received:', content);
      return { score: 1, summary: "Unable to generate summary", missingSkills: ["No missing skills identified"] };
    }
  } catch (error) {
    console.error('Error in getResumeScore:', error);
    throw new Error(`Failed to get resume score: ${error.message}`);
  }
}
