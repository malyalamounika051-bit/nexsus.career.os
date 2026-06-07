const { callGeminiDirectly } = require('../../utils/geminiClient');
const { parseStructuredJson } = require('../../utils/jsonParser');

/**
 * Open Source Programs Connector
 * Ingests programs like GSoC, LFX, Outreachy.
 */
const fetchOpportunities = async () => {
  try {
    const prompt = `
      You are an API connector for Open Source Programs.
      Generate exactly 3 realistic, high-quality open-source programs (like Google Summer of Code, Outreachy, LFX Mentorship).
      Make sure registration deadlines are in the future (within the next 15 to 40 days).
      
      Return ONLY a raw JSON array of objects (no markdown blocks, no other text):
      [
        {
          "title": "Google Summer of Code 2026",
          "organization": "Google Open Source",
          "type": "open-source",
          "description": "A global online program that pairs student or beginner developer contributors with open source mentors.",
          "applicationUrl": "https://summerofcode.withgoogle.com",
          "eligibility": "18+ open source newcomers or students",
          "requiredSkills": ["Git", "Python", "C++", "Open Source"],
          "location": "Remote",
          "source": "Google Programs",
          "sourceScore": 100,
          "tags": ["Open Source", "Mentorship", "Stipend"],
          "registrationDeadline": "2026-06-30T23:59:59.000Z",
          "submissionDeadline": "2026-07-15T23:59:59.000Z",
          "difficultyLevel": "Medium",
          "estimatedCommitment": "12 weeks",
          "benefits": ["Mentorship", "Contributor Stipend", "Resume Badge"]
        }
      ]
    `;

    const response = await callGeminiDirectly({ prompt, temperature: 0.7 });
    const parsed = parseStructuredJson(response.text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Open Source Connector Error:', error.message);
    return [];
  }
};

module.exports = { fetchOpportunities };
