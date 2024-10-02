import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getResumeScore(resumeText, jobDescription) {
  const prompt = `As an expert HR professional, your task is to evaluate how well a candidate's resume matches a given job description. Please analyze the following job description and resume, then provide a score from 1 to 10, where 1 indicates no match and 10 indicates a perfect match. Consider factors such as relevant skills, experience, and qualifications.

Job Description:
${jobDescription}

Resume:
${resumeText}

Please provide your evaluation in the following format:
Score: [Your score from 1-10]
Reasoning: [Brief explanation for the score]

Remember, even if there are only a few matches, the score should reflect that. A score of 0 should only be given if there is absolutely no relevance between the resume and the job description.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert HR professional skilled in evaluating resumes against job descriptions." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    console.log('OpenAI API Response:', response.choices[0].message.content);

    const content = response.choices[0].message.content;
    const scoreMatch = content.match(/Score:\s*(\d+)/i);
    
    if (scoreMatch && scoreMatch[1]) {
      const score = parseInt(scoreMatch[1]);
      return isNaN(score) ? 1 : Math.max(1, Math.min(10, score)); // Ensure score is between 1 and 10
    } else {
      console.log('Could not parse score from response:', content);
      return 1; // Default to 1 if we can't parse a score
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}
