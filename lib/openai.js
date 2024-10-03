import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getResumeScore(resumeText, jobDescription, db, emailId) {
  try {
    const prompt = `As an expert HR professional, evaluate how well the following resume matches the given job description. Provide only a score from 1 to 10, where 1 indicates no match and 10 indicates a perfect match.

Job Description:
${jobDescription}

Resume:
${resumeText}

Score:`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert HR professional. Provide only a numeric score between 1 and 10." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content.trim();
    const score = parseInt(content);

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
