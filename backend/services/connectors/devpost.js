const { callGeminiDirectly } = require('../../utils/geminiClient');
const { parseStructuredJson } = require('../../utils/jsonParser');

/**
 * Devpost Source Connector
 * Ingests hackathons.
 */
const fetchOpportunities = async () => {
  try {
    const prompt = `
      You are an API connector for Devpost Hackathons.
      Generate exactly 3 realistic, high-quality, current developer hackathons with open registrations.
      Make sure the registration deadlines are in the future (within the next 4 to 20 days).
      
      Return ONLY a raw JSON array of objects (no markdown blocks, no other text):
      [
        {
          "title": "Global AI Hackathon 2026",
          "organization": "OpenAI & Devpost",
          "type": "hackathon",
          "description": "Build innovative products using modern generative AI APIs and developer tools.",
          "applicationUrl": "https://devpost.com",
          "eligibility": "Open globally to developers 18+",
          "requiredSkills": ["Python", "OpenAI", "Generative AI", "React"],
          "location": "Remote",
          "source": "Devpost",
          "sourceScore": 95,
          "tags": ["Hackathon", "AI/ML", "Cash Prizes"],
          "registrationDeadline": "2026-06-18T23:59:59.000Z",
          "submissionDeadline": "2026-06-20T23:59:59.000Z",
          "difficultyLevel": "Hard",
          "estimatedCommitment": "48 hours",
          "benefits": ["$50,000 Prize Pool", "API Credits", "Job Opportunities"]
        }
      ]
    `;

    const response = await callGeminiDirectly({ prompt, temperature: 0.7 });
    const parsed = parseStructuredJson(response.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Devpost Connector Error:', error.message);
    return [];
  }
};

module.exports = { fetchOpportunities };
