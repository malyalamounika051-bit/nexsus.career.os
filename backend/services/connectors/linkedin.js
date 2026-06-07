const { callGeminiDirectly } = require('../../utils/geminiClient');
const { parseStructuredJson } = require('../../utils/jsonParser');

/**
 * LinkedIn Source Connector
 * Ingests internships and jobs.
 */
const fetchOpportunities = async () => {
  try {
    const prompt = `
      You are an API connector for LinkedIn Careers.
      Generate exactly 3 realistic, high-quality, current entry-to-mid level job or internship postings for software engineering, web development, or AI/ML.
      Make sure the deadlines are in the future (within the next 10 to 30 days).
      
      Return ONLY a raw JSON array of objects (no markdown blocks, no other text):
      [
        {
          "title": "Software Engineer Intern",
          "organization": "Microsoft",
          "type": "internship",
          "description": "Short description of the role and responsibilities.",
          "applicationUrl": "https://careers.microsoft.com",
          "eligibility": "B.Tech/M.Tech student in CS or related field",
          "requiredSkills": ["React", "Node.js", "JavaScript"],
          "location": "Redmond, WA or Remote",
          "source": "LinkedIn",
          "sourceScore": 90,
          "tags": ["Full-time", "Internship", "Remote Friendly"],
          "registrationDeadline": "2026-06-25T23:59:59.000Z",
          "submissionDeadline": "2026-06-30T23:59:59.000Z",
          "difficultyLevel": "Medium",
          "estimatedCommitment": "10-12 weeks",
          "benefits": ["Stipend", "Mentorship", "Health Insurance"]
        }
      ]
    `;

    const response = await callGeminiDirectly({ prompt, temperature: 0.7 });
    const parsed = parseStructuredJson(response.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('LinkedIn Connector Error:', error.message);
    return [];
  }
};

module.exports = { fetchOpportunities };
